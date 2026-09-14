import type { ApiRequest, ApiResponse } from "./_serverAiProviders.js";
import { createSupabaseAdminClient } from "./_supabaseAdmin.js";

const AUTH_DOMAIN = "auth.kingdoom.app";

function authEmail(username: string) {
  return `${encodeURIComponent(username.trim().toLowerCase())}@${AUTH_DOMAIN}`;
}

function bearer(req: ApiRequest) {
  return String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
}

type StaffPasswordBody = {
  action?: "reset" | "recover";
  username?: string;
  password?: string;
  code?: string;
};

async function recoverAdminPassword(body: StaffPasswordBody, supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  const code = body.code?.trim() ?? "";
  if (username.length < 2 || password.length < 8 || !/^\d{6}$/.test(code)) {
    return { status: 400, payload: { message: "Usuario, contrasena y codigo WhatsApp validos son obligatorios." } };
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, username, auth_user_id, is_admin")
    .ilike("username", username)
    .maybeSingle();
  if (!player?.is_admin) {
    return { status: 403, payload: { message: "La recuperacion por codigo solo esta disponible para cuentas admin." } };
  }

  const { data: verified, error: verifyError } = await supabase.rpc(
    "verify_player_access_code",
    { p_username: player.username, p_code: code },
  );
  if (verifyError || verified !== player.id) {
    return { status: 401, payload: { message: "El codigo WhatsApp es invalido, ya fue usado o caduco." } };
  }

  let userId = player.auth_user_id as string | null;
  if (!userId) {
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return { status: 502, payload: { message: "No se pudo consultar Auth." } };
    const users = (usersData?.users ?? []) as Array<{ id: string; email?: string | null }>;
    userId = users.find((user) => user.email === authEmail(player.username))?.id ?? null;
  }
  if (!userId) return { status: 409, payload: { message: "La cuenta admin aun no tiene un acceso web creado." } };

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
  if (updateError) return { status: 502, payload: { message: `No se pudo actualizar la contrasena. ${updateError.message}` } };
  await supabase.auth.admin.signOut(userId, "global").catch(() => undefined);
  return { status: 200, payload: { ok: true, username: player.username } };
}

export async function handleStaffPasswordReset(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as StaffPasswordBody;
  const supabase = createSupabaseAdminClient();
  if (body.action === "recover") {
    const result = await recoverAdminPassword(body, supabase);
    return res.status(result.status).json(result.payload);
  }

  const token = bearer(req);
  if (!token) return res.status(401).json({ message: "Falta la sesion segura del staff." });

  const { data: actorData, error: actorError } = await supabase.auth.getUser(token);
  if (actorError || !actorData.user) return res.status(401).json({ message: "Sesion invalida." });

  const { data: actor } = await supabase
    .from("players")
    .select("id, is_admin")
    .eq("auth_user_id", actorData.user.id)
    .maybeSingle();
  if (!actor?.is_admin) return res.status(403).json({ message: "Solo un administrador puede restablecer contrasenas." });

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (body.action !== "reset" || username.length < 2 || password.length < 8) {
    return res.status(400).json({ message: "Usuario y contrasena valida son obligatorios." });
  }

  const { data: player } = await supabase
    .from("players")
    .select("id, username, auth_user_id")
    .ilike("username", username)
    .maybeSingle();
  if (!player) return res.status(404).json({ message: "Jugador no encontrado." });

  let userId = player.auth_user_id as string | null;
  if (!userId) {
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return res.status(502).json({ message: "No se pudo consultar Auth." });
    const users = (usersData?.users ?? []) as Array<{ id: string; email?: string | null }>;
    userId = users.find((user) => user.email === authEmail(player.username))?.id ?? null;
  }
  if (!userId) return res.status(409).json({ message: "La cuenta aun no fue activada por el jugador." });

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
  if (updateError) return res.status(502).json({ message: `No se pudo actualizar la contrasena. ${updateError.message}` });
  await supabase.auth.admin.signOut(userId, "global").catch(() => undefined);
  return res.status(200).json({ ok: true, username: player.username });
}
