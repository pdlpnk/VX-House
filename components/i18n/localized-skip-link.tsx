"use client";

import { useI18n } from "@/components/i18n/i18n-provider";

export function LocalizedSkipLink() {
  const { t } = useI18n();
  return <a className="skip-link" href="#main-content">{t("common.skipToContent")}</a>;
}
