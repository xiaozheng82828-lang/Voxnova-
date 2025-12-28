
export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi',
  MARATHI = 'mr',
  NEPALI = 'ne',
  BHOJPURI = 'bho',
  URDU = 'ur',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  JAPANESE = 'ja',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  ARABIC = 'ar',
  CHINESE = 'zh',
  KOREAN = 'ko',
  RUSSIAN = 'ru',
  TURKISH = 'tr',
  DUTCH = 'nl',
  VIETNAMESE = 'vi',
  THAI = 'th',
  SWEDISH = 'sv',
  POLISH = 'pl'
}

export type UserTier = 'free' | 'starter' | 'elite' | 'pro';

export enum Emotion {
  NONE = 'neutral',
  CHEERFUL = 'cheerful',
  SAD = 'sad',
  ANGRY = 'angry',
  EXCITED = 'excited',
  WHISPER = 'whispering'
}

export interface VoiceOption {
  id: string;
  name: string;
  prebuiltVoice: string;
  description: string;
  language: Language;
  persona?: string;
  previewText?: string;
  isUnlimited?: boolean;
  tier: UserTier;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  pitch: number;
  speed: number;
  emotion?: Emotion;
}

export interface AudioHistoryItem {
  id: string;
  text: string;
  voiceName: string;
  timestamp: Date;
  audioBlobUrl: string;
}

export interface UserState {
  tier: UserTier;
  charactersRemaining: number;
  referralCount: number;
  referralCode: string;
}
