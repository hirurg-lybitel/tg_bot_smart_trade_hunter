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

export type TimeIntervalType = 'minutes' | 'hours' | 'days' | 'months';
export type TimeInterval = {
    type: TimeIntervalType,
    value: number;
}

export type BotConfig = {
    percent: number;
    lang: Language;
    interval: TimeInterval;
}

export type TrackedPrices = {
    [key: string]: {
        prevPrice?: number;
        lastPrice?: number;
    }
};

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