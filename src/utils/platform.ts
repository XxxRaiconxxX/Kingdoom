export function isNativeApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean((window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
}

export function getPlatformLabel() {
  if (typeof window === "undefined") {
    return "web";
  }

  const platform = (window as typeof window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.();
  return platform ?? "web";
}
