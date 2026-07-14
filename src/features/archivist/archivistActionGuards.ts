export type ArchivistPlayerTarget = {
  id: string;
  username: string;
};

export function normalizeArchivistText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function resolveExactPlayerTargets<T extends ArchivistPlayerTarget>(
  players: T[],
  requestedTargets: unknown[]
) {
  const requested = Array.from(
    new Set(
      requestedTargets
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean)
    )
  );
  const matches = new Map<string, T>();
  const missing: string[] = [];
  const ambiguous: string[] = [];

  requested.forEach((requestedTarget) => {
    const target = normalizeArchivistText(requestedTarget);
    const exactMatches = players.filter(
      (player) =>
        normalizeArchivistText(player.id) === target ||
        normalizeArchivistText(player.username) === target
    );

    if (exactMatches.length === 0) {
      missing.push(requestedTarget);
      return;
    }

    if (exactMatches.length > 1) {
      ambiguous.push(requestedTarget);
      return;
    }

    matches.set(exactMatches[0].id, exactMatches[0]);
  });

  return {
    matches: Array.from(matches.values()),
    missing,
    ambiguous,
  };
}
