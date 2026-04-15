import { supabase } from "./supabaseClient";

export const CHARACTER_PORTRAITS_BUCKET = "character-portraits";

type UploadPortraitParams = {
  file: File;
  playerId: string;
  sheetId: string;
};

function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "jpg";
}

function buildPortraitPath({ file, playerId, sheetId }: UploadPortraitParams) {
  const extension = getFileExtension(file.name);
  return `${playerId}/${sheetId}.${extension}`;
}

function extractBucketPathFromPublicUrl(publicUrl: string) {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${CHARACTER_PORTRAITS_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function uploadCharacterPortrait(params: UploadPortraitParams) {
  const path = buildPortraitPath(params);

  const { error } = await supabase.storage
    .from(CHARACTER_PORTRAITS_BUCKET)
    .upload(path, params.file, {
      upsert: true,
      cacheControl: "3600",
      contentType: params.file.type || "image/jpeg",
    });

  if (error) {
    throw new Error(`No se pudo subir el retrato: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(CHARACTER_PORTRAITS_BUCKET)
    .getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error("No se pudo generar la URL publica del retrato.");
  }

  return data.publicUrl;
}

export async function deleteCharacterPortraitByUrl(publicUrl?: string) {
  if (!publicUrl) {
    return;
  }

  const bucketPath = extractBucketPathFromPublicUrl(publicUrl);

  if (!bucketPath) {
    return;
  }

  const { error } = await supabase.storage
    .from(CHARACTER_PORTRAITS_BUCKET)
    .remove([bucketPath]);

  if (error) {
    console.error("Supabase error deleting portrait:", error);
  }
}
