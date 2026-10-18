// Every data source, in order of preference per layer: the first source that covers a place and offers a layer
// supplies it (a place can name its own choice per layer). Adding a city = adding a file here.
import datasf from "./datasf.mjs";
import nhd from "./usgs-nhd.mjs";
import osm from "./osm.mjs";
import canopy from "./meta-canopy.mjs";

export const SOURCES = [...datasf, ...nhd, ...canopy, ...osm];
export const LAYERS = ["ground", "buildings", "streets", "parks", "water", "paths", "trees", "playgrounds", "canopy"];

/** layer -> the source that supplies it for this place (null if none does) */
export function plan(place) {
  const out = {};
  for (const layer of LAYERS) {
    const want = place.sources?.[layer];
    out[layer] = (want ? SOURCES.filter((s) => s.id === want) : SOURCES).find((s) => s.layers.includes(layer) && s.covers(place)) ?? null;
  }
  return out;
}
