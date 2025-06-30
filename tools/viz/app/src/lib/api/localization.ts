import { useCallback } from "react";
import { useAuth } from "@/lib/auth/auth";
import type {
  LocalizationSearchRequest,
  LocalizationUpsertRequest,
  LocalizationSearchResponse,
  SupportedLanguage,
} from "@/types/localization";

const API_BASE = "/api";
const SEARCH_URL = `${API_BASE}/localization/messages/v1/_search`;
const UPSERT_URL = `${API_BASE}/localization/messages/v1/_upsert`;
const TENANT_ID = "dj";

export async function searchLocalizationStrings(
  lang: SupportedLanguage,
  authToken: string,
  userInfo: Record<string, unknown>
): Promise<LocalizationSearchResponse> {
  const requestInfo: LocalizationSearchRequest = {
    RequestInfo: {
      apiId: "Rainmaker",
      authToken,
      msgId: `${Date.now()}|en_IN`,
      plainAccessRequest: {},
      userInfo,
    },
  };

  const modulesParam = "";
  const locale =
    lang === "en" ? "en_IN" : lang === "fr" ? "fr_FR_IN" : "ar_AR_IN";

  const response = await fetch(
    `${SEARCH_URL}?module=${encodeURIComponent(
      modulesParam
    )}&locale=${locale}&tenantId=${TENANT_ID}`,
    {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify(requestInfo),
    }
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch localization data");
  }

  return response.json();
}

export async function upsertLocalizationString(
  code: string,
  message: string,
  module: string,
  lang: SupportedLanguage,
  authToken: string,
  userInfo: Record<string, unknown>
): Promise<void> {
  const requestInfo: LocalizationUpsertRequest = {
    RequestInfo: {
      action: "POST",
      authToken,
      msgId: Date.now().toString(),
      userInfo,
    },
    tenantId: TENANT_ID,
    messages: [
      {
        code,
        message,
        module,
        locale:
          lang === "en" ? "en_IN" : lang === "fr" ? "fr_FR_IN" : "ar_AR_IN",
      },
    ],
  };

  const response = await fetch(UPSERT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestInfo),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to update localization string");
  }
}

export function useLocalizationApi() {
  const { token, user } = useAuth();

  if (!token || !user) {
    throw new Error("Authentication required");
  }

  const userInfo = user as unknown as Record<string, unknown>;

  const search = useCallback(
    (lang: SupportedLanguage) =>
      searchLocalizationStrings(lang, token, userInfo),
    [token, userInfo]
  );

  const upsert = useCallback(
    (code: string, message: string, module: string, lang: SupportedLanguage) =>
      upsertLocalizationString(code, message, module, lang, token, userInfo),
    [token, userInfo]
  );

  return {
    searchLocalizationStrings: search,
    upsertLocalizationString: upsert,
  };
}
