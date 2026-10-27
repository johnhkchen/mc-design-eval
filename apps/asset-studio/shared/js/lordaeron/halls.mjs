// Lordaeron halls on the relief module set: one shell each, a furnishing plan per hall's use. Halls hold no beds and no
// declared workstations; every job-site lookalike is the mod's twin. Bodies on the grid (7 or 10 wide), relief +2.
// Interior coordinates: x 1..W-2 west to east, z 1..D-2 north (back) to south (front); the street door at doorX on
// the front row, the spine from it kept clear.
import { compose, layoutOf } from "./compose.mjs";

const lanterns = (put, top, cells) => cells.forEach((c) => put(0, "lantern", c, top));
export const HALLS = {
  granary: { W: 7, D: 7, roof: "gable_x", palette: "daub", note: "bulk wheat as hay, stacked against the walls, an aisle down the middle",
    fitout: ({ put, top }) => {
      for (const z of [1, 2, 3, 4]) { put(0, "hay", [1, z]); put(0, "hay", [1, z], 2); put(0, "hay", [5, z]); if (z < 4) put(0, "hay", [5, z], 2); }
      for (const x of [2, 3, 4]) { put(0, "hay", [x, 1]); put(0, "hay", [x, 1], 2); }
      put(0, "cask", [5, 5]); put(0, "pot", [1, 5]); lanterns(put, top, [[3, 2], [3, 4]]);
    } },
  root_cellar: { W: 7, D: 7, roof: "gable_x", palette: "stone", note: "roots in store: casks along the walls, two high",
    fitout: ({ put, top }) => {
      for (const z of [1, 2, 3, 4]) { put(0, "cask", [1, z]); put(0, "cask", [1, z], 2); put(0, "cask", [5, z]); }
      for (const x of [2, 3, 4]) put(0, "cask", [x, 1]);
      put(0, "hay", [5, 4]); lanterns(put, top, [[3, 2], [3, 4]]);
    } },
  counting_house: { W: 7, D: 7, roof: "gable_z", palette: "brick", note: "the market's paperwork: clerks' desks, ledgers on shelves, a strongbox",
    fitout: ({ put, top }) => {
      put(0, "desk", [1, 2]); put(0, "bench", [2, 2], 1, 3); put(0, "desk", [1, 4]); put(0, "bench", [2, 4], 1, 3);
      for (const x of [1, 2, 3, 4]) put(0, "shelf", [x, 1]);
      put(0, "chest", [5, 1]); put(0, "table", [5, 3]); put(0, "candles", [5, 3], 3); put(0, "pot", [5, 5]);
      lanterns(put, top, [[2, 3], [4, 3]]);
    } },
  temple: { W: 7, D: 7, roof: "gable_z", palette: "stone", note: "an altar at the east end of an aisle, pews either side, candles",
    fitout: ({ put, top }) => {
      put(0, "altar", [3, 1]); put(0, "candles", [2, 1]); put(0, "candles", [4, 1]);
      for (const z of [3, 4]) for (const x of [1, 2, 4, 5]) put(0, "bench", [x, z], 1, 2);         // pews face the altar
      put(0, "pot", [1, 1]); put(0, "pot", [5, 1]); lanterns(put, top, [[3, 2], [3, 4]]);
    } },
  library: { W: 7, D: 7, roof: "gable_x", palette: "daub", note: "shelves round the walls, a reading desk and table",
    fitout: ({ put, top }) => {
      for (const z of [1, 2, 3, 4]) { put(0, "shelf", [1, z]); put(0, "shelf", [1, z], 2); put(0, "shelf", [5, z]); put(0, "shelf", [5, z], 2); }
      put(0, "shelf", [2, 1]); put(0, "shelf", [4, 1]); put(0, "desk", [3, 1]);
      put(0, "table", [3, 3]); put(0, "bench", [2, 3], 1, 3); put(0, "bench", [4, 3], 1, 1); put(0, "candles", [3, 3], 3);
      lanterns(put, top, [[3, 2], [3, 4]]);
    } },
  smithy: { W: 7, D: 7, roof: "gable_x", palette: "stone", note: "a forge under the chimney, anvil and quench by it, tools on a rack",
    fitout: ({ put, top }) => {
      put(0, "forge", [1, 3]); put(0, "anvil", [2, 2]); put(0, "quench", [2, 4]); put(0, "smith_table", [1, 1]);
      put(0, "rack", [5, 1]); put(0, "rack", [5, 2]); put(0, "chest", [5, 4]); put(0, "cask", [4, 1]); put(0, "hay", [5, 5]);
      lanterns(put, top, [[3, 2], [3, 4]]);
    } },
  caravanserai: { W: 10, D: 7, roof: "gable_x", palette: "daub", note: "a stable for the trains, stores, a table for the drovers",
    fitout: ({ put, top }) => {
      for (const z of [1, 2, 3, 4]) put(0, "hay", [8, z]);
      for (const z of [1, 2, 3]) put(0, "stall_rail", [7, z]);                                  // stall rails; no animals (the sim spawns them)
      for (const z of [1, 2, 3, 4]) put(0, "cask", [1, z]);
      put(0, "chest", [2, 1]); put(0, "chest", [3, 1]);
      put(0, "table", [3, 3]); put(0, "bench", [2, 3], 1, 3); put(0, "bench", [4, 3], 1, 1); put(0, "hearth", [1, 3]);
      lanterns(put, top, [[2, 3], [5, 3], [7, 4]]);
    } },
};
export function hall(kind) {
  const h = HALLS[kind];
  const L = layoutOf({ W: h.W, D: h.D, storeys: 1, roof: h.roof, noCore: true, fitout: h.fitout });
  return { layout: L, grid: compose(L), spec: h };
}
