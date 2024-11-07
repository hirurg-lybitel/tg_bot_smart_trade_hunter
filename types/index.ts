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

export type UserConfig = {
    botConfig?: BotConfig;
    isSubscribed: boolean;
}


export enum RequestMethod {
    GET = 0,
    POST = 1,
    OPTIONS = 2,
    HEAD = 3,
    PUT = 4,
    DELETE = 5,
    TRACE = 6,
    CONNECT = 7,
    PATCH = 8
}