import assert from "node:assert/strict";
import {
  buildAnimeFlvFallbackUrl,
  buildPrimaryProviderUrl,
  normalizePlaybackProvider,
} from "../api/anime/providerContract.ts";

assert.equal(normalizePlaybackProvider("anime-website"), null);
assert.equal(normalizePlaybackProvider("animeflv"), "animeflv");
assert.equal(normalizePlaybackProvider("jkanime"), null);

assert.equal(
  buildPrimaryProviderUrl({
    baseUrl: "https://anime.example.com",
    action: "search",
    provider: "tioanime",
    query: "one piece",
  }).toString(),
  "https://anime.example.com/api/search?q=one+piece&source=tioanime"
);

assert.equal(
  buildAnimeFlvFallbackUrl({
    baseUrl: "https://animeflv.example.com/api",
    action: "links",
    series: "one-piece-tv",
    episode: "1",
  })?.toString(),
  "https://animeflv.example.com/api/anime/one-piece-tv/episode/1"
);

console.log("Anime provider contract: OK");
