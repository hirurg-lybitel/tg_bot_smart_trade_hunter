export interface SessionData {
    userConfig: UserConfig;
    userStates: UserStates;
}
  
export const languages = ['by', 'ru'] as const;
export type Language = typeof languages[number];

export const flags = new Map<Language, string>([
  ['by', '🇧🇾'],
  ['ru', '🇷🇺']
]);

export enum UserState {
    AUTH = 'auth'
,}
export interface UserStates {
    [key: number]: UserState;
  }

export type BotConfig = {
    lang: Language;
}

export enum Exchange {
    Binance = 'binance',
}

export interface ExchangeConfig {
    type: Exchange;
    api_key: string;
    api_secret: string;
}

export type UserConfig = {
    botConfig?: BotConfig;
    isSubscribed: boolean;
    exchanges?: ExchangeConfig[];
}

export interface UserInfo {
    chatId: number;
    isActive: boolean;
}

export interface TVMessage {
    type: 'bot';
    ticker: string;
    order_direction: TV_OrderDirection;
    order_details: string;
    order_action: string;
    order_price: string;
}

export enum TV_OrderDirection   {   
    LONG = 'long',
    FLAT = 'flat',
    SHORT = 'short',
}

export enum TV_OrderDetailsType {
    NEW = 'new',
    CLOSE = 'close',
    PROFIT = 'profit',
    STOP = 'stop',
}

export interface TakeProfit {
    price: string;
    qty_perc: string;
}

export interface TVOrderDetails {
    type: TV_OrderDetailsType,
    takeProfits?: TakeProfit[],
    stop?: string;
    order?: string;

}