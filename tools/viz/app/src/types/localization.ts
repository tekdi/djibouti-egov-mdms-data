export interface LocalizationString {
  code: string;
  module: string;
  translations: Record<string, string>;
}

export interface RequestInfo {
  action?: string;
  apiId?: string;
  authToken: string;
  msgId: string;
  plainAccessRequest?: Record<string, unknown>;
  userInfo: Record<string, unknown>;
}

export interface LocalizationSearchRequest {
  RequestInfo: RequestInfo;
}

export interface LocalizationUpsertRequest {
  RequestInfo: RequestInfo;
  tenantId: string;
  messages: Array<{
    code: string;
    message: string;
    module: string;
    locale: string;
  }>;
}

export interface LocalizationSearchResponse {
  messages: Array<{
    code: string;
    message: string;
    module: string;
    locale: string;
  }>;
}

export type SupportedLanguage = "en" | "fr";
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "fr"];

export interface LocaleConfig {
  lang: SupportedLanguage;
  locale: string;
}
