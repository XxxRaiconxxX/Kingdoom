import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sibisgiwmgdrpfkzmkkw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Y8Dk0GxPacMnHDDWmT3DcQ_fptqtC3h";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
