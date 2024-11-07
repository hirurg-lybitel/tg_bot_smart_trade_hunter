import { SessionData, UserState } from "@/types";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import { freeStorage } from "@grammyjs/storage-free";
import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy";

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

  const { userStates, userConfig } = ctx.session;
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
  ctx.session = initial();

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

// export const POST = webhookCallback(bot, 'std/http');

export const GET = async () => { 
  return Response.json('Hello from Bot API!');
};
