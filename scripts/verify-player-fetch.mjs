import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || "https://sibisgiwmgdrpfkzmkkw.supabase.co";
const anon = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmlzZ2l3bWdkcnBma3pta2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDM5OTgsImV4cCI6MjA5MDQ3OTk5OH0.YNBPqrcA__5C8hwz6gIQmAkR5DA6t65qfjWlaUi3d-o";
const supabase = createClient(url, anon);

async function testFetchPlayer() {
  console.log("-> Probando consulta directa de jugador 'Nothing'...");
  const t0 = Date.now();
  
  const { data, error } = await supabase
    .from("players")
    .select("id, username, gold, is_admin, auth_user_id, phone, avatar_gif_url, max_character_sheets")
    .ilike("username", "Nothing")
    .maybeSingle();

  const elapsed = Date.now() - t0;
  console.log(`-> Respuesta recibida en ${elapsed}ms`);

  assert.equal(error, null, "No debe haber error en la consulta");
  assert.ok(data, "El jugador 'Nothing' debe existir");
  assert.equal(data.username, "Nothing");
  assert.equal(typeof data.gold, "number");
  assert.ok(data.gold > 0, "El oro debe ser un número positivo");
  
  console.log("-> Probando consulta de jugador inexistente...");
  const { data: noData, error: noError } = await supabase
    .from("players")
    .select("id, username, gold")
    .ilike("username", "JugadorInexistente_123456789")
    .maybeSingle();

  assert.equal(noError, null);
  assert.equal(noData, null, "Jugador inexistente debe ser null");

  console.log("✅ Verificación exitosa: fetch directo de jugador funciona correctamente y de forma óptima.");
}

testFetchPlayer().catch((err) => {
  console.error("❌ Falló la verificación:", err);
  process.exit(1);
});
