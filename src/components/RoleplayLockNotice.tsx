import { AlertTriangle, ScrollText } from "lucide-react";

type RoleplayLockNoticeProps = {
  title?: string;
  compact?: boolean;
};

export function RoleplayLockNotice({
  title = "Acceso restringido por inactividad de rol",
  compact = false,
}: RoleplayLockNoticeProps) {
  return (
    <div className="rounded-[1.75rem] border border-rose-500/20 bg-[linear-gradient(135deg,rgba(68,18,18,0.82),rgba(24,10,10,0.92))] p-5 text-rose-50 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-rose-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-200/80">
            Regla de roleo
          </p>
          <h3 className="mt-1 text-lg font-black text-rose-50">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-rose-100/90">
            No roleaste en los ultimos 3 dias. Para recuperar acceso a minijuegos,
            economia y consultas recreativas, vuelve a rolear en el grupo principal
            del reino.
          </p>
          {!compact ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-black/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-100/90">
              <ScrollText className="h-3.5 w-3.5" />
              Grupo valido: 120363024420812768@g.us
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
