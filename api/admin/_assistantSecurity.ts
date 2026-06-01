import type { ApiRequest } from "./_serverAiProviders.js";
import type { SupabaseClient } from "@supabase/supabase-js";

declare const process: {
  env: Record<string, string | undefined>;
};

export type AssistantActorRole = "admin" | "staff";

function normalizePhone(phone: string) {
  let cleaned = String(phone || "")
    .replace(/\D/g, "")
    .trim();

  if (cleaned.startsWith("5959") && cleaned.length === 13) {
    cleaned = "595" + cleaned.substring(4);
  }

  if (cleaned.startsWith("52") && !cleaned.startsWith("521") && cleaned.length === 12) {
    cleaned = "521" + cleaned.substring(2);
  }

  if (cleaned.startsWith("54") && !cleaned.startsWith("549")) {
    let rest = cleaned.substring(2);
    if (rest.startsWith("15")) {
      rest = rest.substring(2);
    }
    cleaned = "549" + rest;
  }

  if (cleaned === "275162062668001") {
    cleaned = "595987273405";
  }

  return cleaned;
}

function parsePhoneAllowlist(value?: string) {
  return new Set(
    String(value || "")
      .split(",")
      .map((entry) => normalizePhone(entry))
      .filter(Boolean)
  );
}

export function requireAssistantSecret(req: ApiRequest) {
  const expectedSecret = process.env.WHATSAPP_ASSISTANT_SECRET?.trim();

  if (!expectedSecret) {
    throw new Error(
      "Falta WHATSAPP_ASSISTANT_SECRET en el backend para proteger el asistente de WhatsApp."
    );
  }

  const receivedSecret =
    String(req.headers["x-kingdoom-bot-secret"] || "").trim() ||
    String(req.headers.authorization || "")
      .replace(/^Bearer\s+/i, "")
      .trim();

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    const error = new Error("No autorizado para usar el asistente administrativo.");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
}

export async function verifyAssistantActor(input: {
  supabase: SupabaseClient;
  requestedByPhone: string;
  requestedByRole: AssistantActorRole;
}) {
  const phone = normalizePhone(input.requestedByPhone);

  if (!phone) {
    const error = new Error("Falta un telefono valido del actor.");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const adminAllowlist = parsePhoneAllowlist(
    process.env.WHATSAPP_ASSISTANT_ADMIN_NUMBERS || process.env.ADMIN_NUMBER
  );
  const staffAllowlist = parsePhoneAllowlist(process.env.WHATSAPP_ASSISTANT_STAFF_NUMBERS);

  const { data: players, error } = await input.supabase
    .from("players")
    .select("id, phone, is_admin, username")
    .ilike("phone", `%${phone}%`)
    .limit(10);

  if (error) {
    throw new Error(`No se pudo validar permisos del actor. ${error.message}`);
  }

  const exactPhonePlayers = (players ?? []).filter((player) =>
    String(player.phone || "")
      .split(",")
      .map((entry) => normalizePhone(entry))
      .includes(phone)
  );

  const dbAdmin = exactPhonePlayers.some((player) => player.is_admin === true);
  const isAdmin = dbAdmin || adminAllowlist.has(phone);
  const isStaff = isAdmin || staffAllowlist.has(phone);

  if (input.requestedByRole === "admin" && !isAdmin) {
    const error = new Error(
      "El actor no figura como admin en la lista segura ni en la base del reino."
    );
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  if (input.requestedByRole === "staff" && !isStaff) {
    const error = new Error(
      "El actor no figura en la whitelist de staff/admin del asistente."
    );
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  return {
    phone,
    role: input.requestedByRole,
    matchedPlayer:
      exactPhonePlayers.find((player) => player.is_admin === true) ??
      exactPhonePlayers[0] ??
      null,
  };
}
