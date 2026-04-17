import { supabase } from "./supabaseClient";

const COMMUNITY_APP_DOWNLOAD_KEY = "community_app_download_url";

type SiteSettingRow = {
  key: string;
  value: string | null;
};

export async function fetchCommunityAppDownloadUrl(fallbackUrl = "") {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("key", COMMUNITY_APP_DOWNLOAD_KEY)
    .maybeSingle();

  if (error) {
    return fallbackUrl;
  }

  return String((data as SiteSettingRow | null)?.value ?? "").trim() || fallbackUrl;
}
