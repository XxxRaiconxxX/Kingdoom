import { ACTIVE_EVENTS } from "../data/events";
import type { EventStatus, RealmEvent } from "../types";
import { supabase } from "./supabaseClient";

// SQL sugerido para Supabase:
//
// create table if not exists realm_events (
//   id uuid primary key default gen_random_uuid(),
//   title text not null,
//   description text not null,
//   long_description text not null,
//   image_url text not null default '',
//   start_date text not null,
//   end_date text not null,
//   status text not null default 'in-production',
//   factions text[] not null default '{}',
//   rewards text not null,
//   requirements text not null,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now()
// );
//
// alter table realm_events enable row level security;
//
// create policy "Allow all realm events access" on realm_events
//   for all using (true) with check (true);

type RealmEventRow = {
  id: string;
  title: string;
  description: string;
  long_description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  status: EventStatus;
  factions: string[] | null;
  rewards: string;
  requirements: string;
};

export type RealmEventsState = {
  status: "ready" | "fallback";
  message: string;
  events: RealmEvent[];
};

export type AdminRealmEventInput = {
  id?: string;
  title: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  factions: string[];
  rewards: string;
  requirements: string;
};

function mapRealmEventRow(row: RealmEventRow): RealmEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    longDescription: row.long_description,
    imageUrl: row.image_url,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    factions: row.factions ?? [],
    rewards: row.rewards,
    requirements: row.requirements,
  };
}

function buildRealmEventPayload(input: AdminRealmEventInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    long_description: input.longDescription.trim(),
    image_url: input.imageUrl.trim(),
    start_date: input.startDate.trim(),
    end_date: input.endDate.trim(),
    status: input.status,
    factions: input.factions.map((entry) => entry.trim()).filter(Boolean),
    rewards: input.rewards.trim(),
    requirements: input.requirements.trim(),
  };
}

export async function fetchRealmEvents(): Promise<RealmEventsState> {
  const { data, error } = await supabase
    .from("realm_events")
    .select(
      "id, title, description, long_description, image_url, start_date, end_date, status, factions, rewards, requirements"
    )
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return {
      status: "fallback",
      message:
        "Todavia no hay eventos administrados desde Supabase. Se muestran los eventos locales del proyecto.",
      events: ACTIVE_EVENTS,
    };
  }

  return {
    status: "ready",
    message: "",
    events: (data as RealmEventRow[]).map(mapRealmEventRow),
  };
}

export async function upsertRealmEvent(input: AdminRealmEventInput) {
  const payload = buildRealmEventPayload(input);

  if (input.id) {
    const { error } = await supabase
      .from("realm_events")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      return {
        status: "error" as const,
        message: "No se pudo actualizar el evento en Supabase.",
      };
    }

    return {
      status: "saved" as const,
      message: "Evento actualizado correctamente.",
    };
  }

  const { error } = await supabase.from("realm_events").insert(payload);

  if (error) {
    return {
      status: "error" as const,
      message: "No se pudo crear el evento en Supabase.",
    };
  }

  return {
    status: "saved" as const,
    message: "Evento creado correctamente.",
  };
}
