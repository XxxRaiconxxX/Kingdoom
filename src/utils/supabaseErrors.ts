export function formatAdminPermissionMessage(
  fallback: string,
  rawMessage?: string
) {
  const message = String(rawMessage ?? "").toLowerCase();

  const looksLikePermissionError =
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("42501") ||
    message.includes("not allowed");

  if (looksLikePermissionError) {
    return `${fallback} Inicia sesion con Cuenta segura beta y usa un jugador marcado con is_admin = true.`;
  }

  return rawMessage ? `${fallback} ${rawMessage}` : fallback;
}
