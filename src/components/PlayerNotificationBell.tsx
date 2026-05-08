import { AnimatePresence, motion } from "framer-motion";
import { Bell, Coins, Gift, PackageCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  fetchPlayerNotifications,
  markPlayerNotificationsRead,
  type PlayerNotification,
} from "../utils/playerNotifications";

export function PlayerNotificationBell({
  playerId,
  className,
}: {
  playerId: string;
  className?: string;
}) {
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    const nextNotifications = await fetchPlayerNotifications(playerId);
    setNotifications(nextNotifications);
    setIsLoading(false);
  }, [playerId]);

  useEffect(() => {
    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  const handleToggle = async () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (nextIsOpen && unreadCount > 0) {
      await markPlayerNotificationsRead(playerId);
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
    }
  };

  return (
    <div className={className ?? "absolute right-4 top-4 z-30"}>
      <motion.button
        type="button"
        onClick={handleToggle}
        whileTap={{ scale: 0.94 }}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/25 bg-stone-950/80 text-amber-300 shadow-[0_12px_34px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-amber-300/45 hover:bg-amber-500/10"
        title="Notificaciones del reino"
      >
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-stone-950 bg-rose-500 px-1 text-[10px] font-black text-white shadow-[0_0_16px_rgba(244,63,94,0.65)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
        {unreadCount > 0 ? (
          <span className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-md" />
        ) : null}
        <Bell className="relative h-5 w-5" />
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {isOpen ? (
            <>
              <motion.button
                type="button"
                aria-label="Cerrar notificaciones"
                className="fixed inset-0 z-[110] cursor-default bg-black/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                className="fixed right-4 top-20 z-[111] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(22,20,18,0.98),rgba(8,7,6,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="border-b border-amber-500/10 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400">
                    Avisos del reino
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Oro y objetos recibidos.
                  </p>
                </div>

                <div className="max-h-[24rem] overflow-y-auto p-3">
                  {isLoading && notifications.length === 0 ? (
                    <div className="rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-4 text-sm text-stone-400">
                      Consultando avisos...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-4 text-sm text-stone-400">
                      Sin avisos recientes.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function NotificationItem({
  notification,
}: {
  notification: PlayerNotification;
}) {
  const Icon = notification.kind === "gold" ? Coins : PackageCheck;
  const tone =
    notification.kind === "gold"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";

  return (
    <div
      className={`rounded-2xl border p-3 ${
        notification.isRead
          ? "border-stone-800 bg-stone-950/55"
          : "border-amber-500/25 bg-amber-500/[0.08]"
      }`}
    >
      <div className="flex gap-3">
        <div className={`mt-0.5 rounded-xl border p-2 ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-black text-stone-100">
              {notification.title}
            </p>
            {!notification.isRead ? (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.75)]" />
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-stone-300">
            {notification.message}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
            <span>{notification.senderName}</span>
            <span>-</span>
            <span>{formatNotificationTime(notification.createdAt)}</span>
            {notification.kind === "item" && notification.itemName ? (
              <>
                <span>-</span>
                <span className="inline-flex items-center gap-1 text-cyan-300">
                  <Gift className="h-3 w-3" />
                  {notification.itemName}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Ahora";
  }

  return date.toLocaleTimeString("es-PY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
