import { SessionData, TV_OrderDetailsType, TV_OrderDirection, TVMessage, TVOrderDetails, UserInfo, UserState } from "@/types";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import { freeStorage } from "@grammyjs/storage-free";
import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy";
import { kv } from '@vercel/kv';
import { NextResponse } from "next/server";
import { parseStringToMD } from "@/helpers";

type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;


const ACCESS_KEY = process.env.ACCESS_KEY;
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.');

const bot = new Bot<MyContext>(token);
const botStorage = freeStorage<SessionData>(bot.token);

function initial(): SessionData {
  return {
    userStates: {}, 
    userConfig: {
      isSubscribed: false
    }
  };
}

bot.use(hydrate());
bot.use(session({
  initial,
  storage: botStorage,
}));

bot.command('start', async (ctx) => {
  const userName = ctx.from?.first_name ?? (ctx.from?.language_code === 'en' ? 'User' : 'Пользователь');
  const chatId = ctx.chat.id;

  const { userStates } = ctx.session;
  userStates[chatId] = UserState.AUTH;

  const storage = await botStorage.read(chatId.toString());

  const { userConfig: { isSubscribed }} = storage;

  if (isSubscribed) {
    return ctx.reply('Вы уже подписаны на сигналы.');
  }

  await ctx.reply(
    `*Добро пожаловать, ${userName}*\\.\n\nВведите ваш личный ключ доступа, чтобы начать работу бота\\.`,
    {
      parse_mode: 'MarkdownV2'
    }
  );
});

bot.command('stop', async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  ctx.session = initial();

  const users = await kv.get<UserInfo[]>('users') ?? [];

  const index = users.findIndex(({ chatId: userChatId }) => userChatId === chatId );
  if (index >= 0) {
    users[index].isActive = false;
    
    kv.set('users', users);
  }

  await ctx.reply(
    `Больше я не буду присылать вам сигналы 😔`,
    {
      parse_mode: 'MarkdownV2'
    }
  );
});


bot.on(':text', async ctx => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  
  const { userStates, userConfig } = ctx.session;

  const state = userStates[chatId];
  if (!state) return;

  const userInput = ctx.msg?.text ?? '';

  switch (state) {
    case UserState.AUTH:

      if (userInput !== ACCESS_KEY) {
        return ctx.reply('Неверный ключ. Попробуйте ввести другой.');
      }

      const users = await kv.get<UserInfo[]>('users') ?? [];

      const index = users.findIndex(({ chatId: userChatId }) => userChatId === chatId );
      if (index < 0) {
        const newUser: UserInfo = {
          chatId,
          isActive: true
        };
        users.push(newUser);
      } else {
        users[index].isActive = true;
      }

      kv.set('users', users);

      Object.assign(userConfig, {
        ...userConfig,
        isSubscribed: true
      });
      
      await ctx.reply('Теперь вы подписаны на сигналы!');
    default:
      break;
  }

  delete userStates[chatId];
});

bot.catch((err) => console.error('[ Bot error ]', err));

// bot.start();

export async function POST(req: Request) {
  const clonedRequest = req.clone();
  const body = await clonedRequest.json();
  console.log('POST_body', { cond: 'type' in body, body });

  try {
    /** Если получили сообщение от tradingView */
    if ('type' in body) {
      console.log('we are at pont 1');
      if (body.type === 'bot') {
        console.log('we are at pont 2');
        const tv_message = body as TVMessage;
  
        const tv_message_details: TVOrderDetails = JSON.parse(tv_message.order_details ?? null);
  
        let signal = '';
        if (tv_message_details?.type === TV_OrderDetailsType.NEW) {
          const takeProfits = tv_message_details.takeProfits ?? [];

          const takeProfit_1 = takeProfits[0];
          const takeProfit_2 = takeProfits[1];
          const takeProfit_3 = takeProfits[2];  

          const stopLoss = tv_message_details.stop; 

          signal = parseStringToMD(`
            🚨 *Smart Trader Notification* 🚨\n
            *${tv_message.ticker}* - ${tv_message.order_action}\n
            *Entry price*: ${tv_message.order_price}\n
            🏆 *Take Profits*:
            \\#1: ${takeProfit_1.price}
            \\#2: ${takeProfit_2.price}
            \\#3: ${takeProfit_3.price}\n
            ❌ *Stop Loss*: ${stopLoss}\n
            📈 Удачи в торговле\\!`);          
        }

        if (tv_message_details?.type === TV_OrderDetailsType.CLOSE) {
          signal = parseStringToMD(`
            🚨 *Smart Trader Notification* 🚨\n
            *${tv_message.ticker}* - ${tv_message.order_action}\n
            ⚠️ *Exit price*: ${tv_message.order_price}`);  
        }

        if (tv_message_details?.type === TV_OrderDetailsType.PROFIT) {
          signal = parseStringToMD(`
            🚨 *Smart Trader Notification* 🚨\n
            *${tv_message.ticker}* - ${tv_message.order_action}\n
            ✅ Take Profit \\#${tv_message_details.order}
            *Price*: ${tv_message.order_price}`);  
        }

        if (tv_message_details?.type === TV_OrderDetailsType.STOP) {
          signal = parseStringToMD(`
            🚨 *Smart Trader Notification* 🚨\n
            *${tv_message.ticker}* - ${tv_message.order_action}\n
            ❌ *Stop price*: ${tv_message.order_price}`);  
        }

        if (signal === '') {
          console.log('POST', 'signal is empty');
          return NextResponse.json('OK');
        }
  
  
        const users = await kv.get<UserInfo[]>('users') ?? [];
        const activeUsers = users.filter(({ isActive }) => isActive);
  
        const promises = activeUsers.map(async ({ chatId}) => {
          await bot.api.sendMessage(chatId, signal, { parse_mode: 'MarkdownV2' });
        });
        await Promise.all(promises);


        console.log('POST signal sent', { activeUsers: activeUsers.length, signal });
  
        return NextResponse.json('OK');
      }
    }

    console.log('POST_redirect to tg', 'type' in body);

    /** Если получили сообщение от telegram */
    const handler = webhookCallback(bot, 'std/http');
    return await handler(req);
  } catch (error) {
    console.error(error);
  }
}

export const GET = async () => { 
  return Response.json('Hello from Bot API!');
};
