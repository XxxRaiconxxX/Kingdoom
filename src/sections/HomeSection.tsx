import { useEffect, useState } from "react";
import { Bell, Castle, Download } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { ACTIVE_EVENTS } from "../data/events";
import {
  COMMUNITY_APP_DOWNLOAD_FALLBACK_URL,
  HOME_STATS,
  JOIN_STEPS,
  KINGDOM_ANNOUNCEMENTS,
  KINGDOM_STATUS,
} from "../data/home";
import { fetchRealmEvents } from "../utils/events";
import { fetchCommunityAppDownloadUrl } from "../utils/siteSettings";

export function HomeSection() {
  const StatusIcon = KINGDOM_STATUS.icon;
  const [events, setEvents] = useState(ACTIVE_EVENTS);
  const [communityAppDownloadUrl, setCommunityAppDownloadUrl] = useState(
    COMMUNITY_APP_DOWNLOAD_FALLBACK_URL
  );

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      const result = await fetchRealmEvents();

      if (cancelled) {
        return;
      }

      setEvents(result.events);
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunityAppDownloadUrl() {
      const nextUrl = await fetchCommunityAppDownloadUrl(
        COMMUNITY_APP_DOWNLOAD_FALLBACK_URL
      );

      if (cancelled) {
        return;
      }

      setCommunityAppDownloadUrl(nextUrl);
    }

    void loadCommunityAppDownloadUrl();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-amber-500/15 bg-stone-900/75 p-6 shadow-2xl shadow-black/30 md:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
          <Castle className="h-4 w-4" />
          Reino vivo por WhatsApp
        </div>

        <h1 className="text-4xl font-black leading-none text-stone-100 md:text-5xl">
          Reino de las Sombras
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-300/90 md:text-base">
          Intrigas de corte, guerra entre facciones y reliquias prohibidas en un
          reino donde cada decision puede convertirte en leyenda o condenarte al
          olvido.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 md:max-w-xl">
          {HOME_STATS.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          {communityAppDownloadUrl ? (
            <a
              href={communityAppDownloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-4 text-sm font-extrabold text-stone-950 transition hover:bg-amber-400 md:w-fit md:min-w-72"
            >
              <Download className="h-4 w-4" />
              Descargar app de la comunidad
            </a>
          ) : (
            <div className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100 md:w-fit md:min-w-72">
              <p className="font-extrabold text-amber-300">App de la comunidad</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-amber-200/80">
                Configura el enlace de descarga cuando el APK este listo
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] [content-visibility:auto] [contain-intrinsic-size:300px]">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/75 p-5 md:p-6">
          <h2 className="text-lg font-bold text-stone-100">La noche se mueve</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Participa en asedios, pactos secretos, cacerias y duelos narrativos
            con estetica medieval oscura y progresion competitiva.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
                {KINGDOM_STATUS.eyebrow}
              </p>
              <p className="mt-2 text-2xl font-black text-stone-100">
                {KINGDOM_STATUS.title}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
              <StatusIcon className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-400">
            {KINGDOM_STATUS.description}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6 [content-visibility:auto] [contain-intrinsic-size:960px]">
        <SectionHeader
          eyebrow="Agenda del reino"
          title="Eventos activos"
          rightSlot={
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
              {events.length} eventos
            </span>
          }
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] [content-visibility:auto] [contain-intrinsic-size:760px]">
        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Tablon del reino" title="Anuncios del consejo" />
          <div className="mt-4 space-y-3">
            {KINGDOM_ANNOUNCEMENTS.map((announcement) => (
              <div
                key={announcement.title}
                className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">
                      {announcement.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-800 bg-stone-900/75 p-6">
          <SectionHeader eyebrow="Primeros pasos" title="Como unirse y empezar" />
          <div className="mt-4 space-y-3">
            {JOIN_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.4rem] border border-stone-800 bg-stone-950/45 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-sm font-black text-amber-300">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-100">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
