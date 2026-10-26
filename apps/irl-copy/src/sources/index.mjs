// Every data source, in order of preference per layer: the first source that covers a place and offers a layer
// supplies it (a place can name its own choice per layer). Adding a city = adding a file here.
import datasf from "./datasf.mjs";
import seattle from "./seattle.mjs";
import nhd from "./usgs-nhd.mjs";
import osm from "./osm.mjs";
import canopy from "./meta-canopy.mjs";
import lidar from "./usgs-lidar.mjs";
import naip from "./naip.mjs";
import nyc from "./nyc.mjs";
import dc from "./dc.mjs";
import taipei from "./taipei.mjs";
import france from "./france.mjs";
import linz from "./linz.mjs";

export const SOURCES = [...lidar, ...naip, ...datasf, ...seattle, ...nyc, ...dc, ...taipei, ...france, ...linz, ...nhd, ...canopy, ...osm];
export const LAYERS = ["lidar", "aerial", "parcels", "landmarks", "ground", "buildings", "streets", "parks", "water", "paths", "trees", "playgrounds", "canopy", "rails", "furniture", "barriers", "platforms", "piers", "greens", "fields"];

/** layer -> the source that supplies it for this place (null if none does) */
export function plan(place) {
  const out = {};
  for (const layer of LAYERS) {
    const want = place.sources?.[layer];
    out[layer] = (want ? SOURCES.filter((s) => s.id === want) : SOURCES).find((s) => s.layers.includes(layer) && s.covers(place)) ?? null;
  }
  return out;
}
