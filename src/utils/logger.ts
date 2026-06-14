export function logError(message: string, error?: any) {
  if (import.meta.env.DEV) {
    if (error !== undefined) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
}
