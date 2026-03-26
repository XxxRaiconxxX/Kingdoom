export function createOrderId() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KNG-${Date.now().toString(36).toUpperCase()}-${random}`;
}
