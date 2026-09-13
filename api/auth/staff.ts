import type { ApiRequest, ApiResponse } from "../../server/admin/_serverAiProviders.js";
import { createSupabaseAdminClient } from "../../server/admin/_supabaseAdmin.js";

const AUTH_DOMAIN = "auth.kingdoom.local";

function authEmail(username: string) {
  return `${encodeURIComponent(username.trim().toLowerCase())}@${AUTH_DOMAIN}`;
}

function bearer(req: ApiRequest) {
  return String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Metodo no permitido." });

  const token = bearer(req);
  if (!token) return res.status(401).json({ message: "Falta la sesion segura del staff." });

  const supabase = createSupabaseAdminClient();
  const { data: actorData, error: actorError } = await supabase.auth.getUser(token);
  if (actorError || !actorData.user) return res.status(401).json({ message: "Sesion invalida." });

  const { data: actor } = await supabase
    .from("players")
    .select("id, is_admin")
    .eq("auth_user_id", actorData.user.id)
    .maybeSingle();
  if (!actor?.is_admin) return res.status(403).json({ message: "Solo un administrador puede restablecer contraseñas." });

  const body = (req.body ?? {}) as { action?: string; username?: string; password?: string };
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (body.action !== "reset" || username.length < 2 || password.length < 8) {
    return res.status(400).json({ message: "Usuario y contraseña válida son obligatorios." });
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, username, auth_user_id")
    .ilike("username", username)
    .maybeSingle();
  if (!player) return res.status(404).json({ message: "Jugador no encontrado." });

  let userId = player.auth_user_id as string | null;
  if (!userId) {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return res.status(502).json({ message: "No se pudo consultar Auth." });
    userId = users.users.find((user) => user.email === authEmail(player.username))?.id ?? null;
  }
  if (!userId) return res.status(409).json({ message: "La cuenta aún no fue activada por el jugador." });

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
  if (updateError) return res.status(502).json({ message: `No se pudo actualizar la contraseña. ${updateError.message}` });
  await supabase.auth.admin.signOut(userId, "global").catch(() => undefined);
  return res.status(200).json({ ok: true, username: player.username });
}
