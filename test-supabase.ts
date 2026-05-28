import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from("realm_missions")
    .select("id, title, realm_mission_claims(count)")
    .limit(2);

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
