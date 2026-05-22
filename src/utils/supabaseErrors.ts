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
    return `${fallback} Vincula este perfil admin con la sesion segura de Supabase para usar esta accion.`;
  }

  return rawMessage ? `${fallback} ${rawMessage}` : fallback;
}
