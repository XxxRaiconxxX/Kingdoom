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
    return `${fallback} Vincula tu perfil con una sesión segura de Supabase para usar esta acción (Inicia Sesión).`;
  }

  return rawMessage ? `${fallback} ${rawMessage}` : fallback;
}
