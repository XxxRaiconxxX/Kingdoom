import { useState } from "react";
import { Castle, ChevronDown, Users } from "lucide-react";
import type { EventStatus, RealmEvent, RealmEventParticipant } from "../types";

const eventStatusStyles: Record<
  EventStatus,
  { label: string; badge: string; dot: string }
> = {
  active: {
    label: "Activo",
    badge: "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/20",
    dot: "bg-emerald-400",
  },
  "in-production": {
    label: "En produccion",
    badge: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-400/20",
    dot: "bg-amber-400",
  },
  finished: {
    label: "Finalizado",
    badge: "bg-stone-700/45 text-stone-300 ring-1 ring-stone-600/35",
    dot: "bg-stone-400",
  },
};

const eventParticipationStatusLabels = {
  joined: "Postulado",
  rewarded: "Recompensado",
} as const;

type EventCardProps = {
  event: RealmEvent;
  participants?: RealmEventParticipant[];
  myParticipation?: RealmEventParticipant;
  canJoin?: boolean;
  canLeave?: boolean;
  isSubmitting?: boolean;
  feedback?: string;
  onJoin?: (event: RealmEvent) => Promise<void>;
  onLeave?: (event: RealmEvent) => Promise<void>;
};

export function EventCard({
  event,
  participants = [],
  myParticipation,
  canJoin = false,
  canLeave = false,
  isSubmitting = false,
  feedback,
  onJoin,
  onLeave,
}: EventCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const statusStyle = eventStatusStyles[event.status];
  const maxParticipants = Math.max(0, event.maxParticipants ?? 0);
  const isFull =
    maxParticipants > 0 &&
    participants.length >= maxParticipants &&
    !myParticipation;
  const capacityLabel =
    maxParticipants > 0
      ? `${participants.length}/${maxParticipants}`
      : `${participants.length} sin limite`;

  return (
    <article className="kd-glass kd-hover-lift overflow-hidden rounded-[1.75rem] border border-stone-800 bg-stone-900/80">
      <div className="relative aspect-[16/10] bg-stone-950 lg:aspect-[16/9]">
        {!imageFailed ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950">
            <Castle className="h-10 w-10 text-amber-400" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950 via-stone-950/65 to-transparent" />
        <div className="absolute left-4 top-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${statusStyle.badge}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <div>
          <h3 className="text-xl font-bold text-stone-100">{event.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            {event.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <EventMetaBox label="Inicio" value={event.startDate} />
          <EventMetaBox label="Cierre" value={event.endDate} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">
            <Users className="h-3.5 w-3.5" />
            {capacityLabel} participantes
          </span>
          {isFull ? (
            <span className="rounded-full border border-rose-500/35 bg-rose-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-200">
              Cupo completo
            </span>
          ) : null}
          {myParticipation ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
              {eventParticipationStatusLabels[myParticipation.status]}
            </span>
          ) : null}
        </div>

        {myParticipation ? (
          <button
            type="button"
            onClick={() => void onLeave?.(event)}
            disabled={isSubmitting || !canLeave}
            className="kd-touch inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/12 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Procesando..."
              : canLeave
                ? "Salir del evento"
                : "Participacion bloqueada"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onJoin?.(event)}
            disabled={isSubmitting || !canJoin}
            className="kd-touch inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Procesando..."
              : canJoin
                ? "Unirme al evento"
                : isFull
                  ? "Cupo completo"
                  : "No disponible"}
          </button>
        )}

        {feedback ? (
          <p className="rounded-xl border border-stone-800 bg-stone-950/55 px-3 py-2 text-xs leading-5 text-stone-300">
            {feedback}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="kd-touch flex w-full items-center justify-between rounded-2xl border border-stone-800 bg-stone-950/45 px-4 py-3 text-left text-sm font-semibold text-stone-200 transition hover:border-stone-700"
        >
          <span>Ver detalles del evento</span>
          <span
            className={`transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4 text-stone-400" />
          </span>
        </button>

        {expanded ? (
          <div className="grid gap-3 rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4 lg:grid-cols-2">
            <DetailRow label="Cronica" value={event.longDescription} />
            <DetailRow label="Facciones" value={event.factions.join(" - ")} />
            <DetailRow label="Requisitos" value={event.requirements} />
            <DetailRow
              label="Recompensas"
              value={
                event.participationRewardGold && event.participationRewardGold > 0
                  ? `${event.rewards} | +${event.participationRewardGold} oro por participacion`
                  : event.rewards
              }
            />
            <DetailRow
              label="Cupo"
              value={
                maxParticipants > 0
                  ? `${participants.length}/${maxParticipants} participantes`
                  : `${participants.length} participantes (sin limite)`
              }
            />
            <DetailRow
              label="Participantes"
              value={
                participants.length > 0
                  ? participants.map((entry) => entry.playerName).join(" | ")
                  : "Sin participantes todavia."
              }
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function EventMetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/55 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-200">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-stone-300">{value}</p>
    </div>
  );
}
