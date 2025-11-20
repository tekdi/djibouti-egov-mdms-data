import { useCallback } from "react";
import { useApiClient } from "./useApiClient";
import type {
  LocalizationSearchResponse,
  SupportedLanguage,
} from "@/types/localization";

const TENANT_ID = "dj";

export function useLocalizationApi() {
  const apiClient = useApiClient();

  const searchLocalizationStrings = useCallback(
    async (lang: SupportedLanguage): Promise<LocalizationSearchResponse> => {
      const modulesParam = "";
      const locale =
        lang === "en" ? "en_IN" : lang === "fr" ? "fr_FR_IN" : "ar_AR_IN";

      // Use the authenticated API call for localization search
      return apiClient.callApi<LocalizationSearchResponse>(
        `/localization/messages/v1/_search?module=${encodeURIComponent(
          modulesParam
        )}&locale=${locale}&tenantId=${TENANT_ID}`
      );
    },
    [apiClient]
  );

  const upsertLocalizationString = useCallback(
    async (
      code: string,
      message: string,
      module: string,
      lang: SupportedLanguage
    ): Promise<void> => {
      const requestPayload = {
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

      await apiClient.callApi(
        `/localization/messages/v1/_upsert`,
        requestPayload
      );
    },
    [apiClient]
  );

  return {
    searchLocalizationStrings,
    upsertLocalizationString,
  };
}
