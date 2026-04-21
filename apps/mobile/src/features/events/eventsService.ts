import type { EventStatus, RealmEvent } from "@/src/features/shared/types";
import { supabase, supabaseConfigError } from "@/src/services/supabase";

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

export async function fetchRealmEventsNative() {
  if (!supabase) {
    return { events: [] as RealmEvent[], errorMessage: supabaseConfigError };
  }

  const { data, error } = await supabase
    .from("realm_events")
    .select(
      "id, title, description, long_description, image_url, start_date, end_date, status, factions, rewards, requirements"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      events: [] as RealmEvent[],
      errorMessage: "No se pudieron cargar los eventos desde Supabase.",
    };
  }

  return {
    events: (data as RealmEventRow[]).map(mapRealmEventRow),
    errorMessage: "",
  };
}
