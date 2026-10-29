// The forum frontage set (thread 0012): the buildings that face the bell, grander than the houses round them. One
// shell each from the relief module set, furnished for its use; no beds, no declared workstations (twins only).
//   guildhall  13 x 10, 2 storeys: an open arcade on the square (the guild's market), the guild's hall above
//   inn        13 x 10, 2 storeys: shop-front taproom (bar, casks, hearth, tables), a dining hall above
//   moot_hall  10 x 7, 2 storeys on arcades, the council chamber above, a lantern cupola on the ridge
import { compose, layoutOf } from "./compose.mjs";
import { Grid } from "../grid.mjs";

const lamps = (put, s, top, cells) => cells.forEach((c) => put(s, "lantern", c, top));
const longTable = (put, s, z, x0, x1) => { for (let x = x0; x <= x1; x++) { put(s, "table", [x, z]); if (x % 2 === 0) { put(s, "bench", [x, z - 1]); put(s, "bench", [x, z + 1], 1, 2); } } };

export const FRONTS = {
  guildhall: { W: 13, D: 10, storeys: 2, palette: "stone", arcade: true, note: "the guild's market in the arcade, its hall above: a long table, the guild's chests and ledgers",
    fit: ({ put, top }) => {
      longTable(put, 1, 5, 2, 7);
      for (let x = 1; x <= 7; x++) put(1, "shelf", [x, 1]);
      for (const x of [1, 2, 3]) put(1, "chest", [x, 8]);
      put(1, "desk", [8, 7]); put(1, "candles", [4, 5], 2); put(1, "pot", [7, 8]);
      lamps(put, 1, top, [[3, 3], [6, 3], [3, 7], [6, 7]]);
      lamps(put, 0, top, [[3, 4], [7, 4], [3, 7], [7, 7]]);
      lamps(put, 1, top, [[9, 7]]); lamps(put, 0, top, [[9, 7]]);                    // by the stair
    } },
  inn: { W: 13, D: 10, storeys: 2, palette: "brick", shop: true, show: ["bread", "honey"], note: "the taproom on the square, a long bar and casks, the dining hall above",
    fit: ({ put, top }) => {
      for (let x = 3; x <= 7; x++) put(0, "bar", [x, 3]);
      for (let x = 3; x <= 8; x++) put(0, "cask", [x, 1]);
      put(0, "cask", [1, 1]); put(0, "cask", [1, 2]); put(0, "hearth", [1, 5]);
      for (const x of [3, 6]) { put(0, "table", [x, 6]); put(0, "bench", [x, 5]); put(0, "bench", [x, 7], 1, 2); }
      put(0, "chest", [8, 8]); put(0, "pot", [1, 8]);
      lamps(put, 0, top, [[3, 2], [6, 2], [4, 6], [7, 6]]);
      longTable(put, 1, 4, 2, 7); longTable(put, 1, 7, 2, 6);
      put(1, "cask", [1, 1]); put(1, "shelf", [2, 1]); put(1, "shelf", [3, 1]); put(1, "candles", [4, 4], 2);
      lamps(put, 1, top, [[3, 2], [6, 2], [3, 6], [6, 6]]);
      lamps(put, 0, top, [[9, 3], [9, 7]]); lamps(put, 1, top, [[9, 7]]);           // by the stair
    } },
  moot_hall: { W: 10, D: 7, storeys: 2, palette: "stone", arcade: true, cupola: true, note: "the town's council on arcades over the market, a lantern cupola on the ridge",
    fit: ({ put, top }) => {
      longTable(put, 1, 3, 2, 5);
      put(1, "desk", [1, 3]); put(1, "shelf", [1, 1]); put(1, "shelf", [2, 1]); put(1, "chest", [5, 1]);
      lamps(put, 1, top, [[2, 2], [5, 4]]); lamps(put, 0, top, [[2, 3], [5, 3]]);
    } },
};

// a lantern cupola astride the ridge's middle: four posts, a pyramid cap of the roof's stairs, a lantern hung within
export function cupola(g0) {
  const g = new Grid([g0.size[0], g0.size[1] + 5, g0.size[2]]); g.paste(g0, 0, 0, 0);
  const cx = Math.floor(g.size[0] / 2), cz = Math.floor(g.size[2] / 2);
  let top = g.size[1] - 1; while (top > 0 && !g.get(cx, top, cz)) top--;
  const y0 = top + 1, roof = (f) => `granite_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (let y = y0 - 1; y <= y0 + 1; y++) g.set(cx + dx, y, cz + dz, "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) g.set(cx + dx, y0 + 2, cz + dz, roof(dz === -1 ? "south" : dz === 1 ? "north" : dx === -1 ? "east" : "west"));
  g.set(cx, y0 + 2, cz, "granite"); g.set(cx, y0 + 3, cz, "granite_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]");
  g.set(cx, y0 + 1, cz, "lantern[hanging=true,waterlogged=false]");
  g.set(cx, y0 - 1, cz, g.get(cx, y0 - 1, cz) || "granite");
  return g;
}

export function forumFront(kind) {
  const f = FRONTS[kind];
  const L = layoutOf({ W: f.W, D: f.D, storeys: f.storeys, roof: "gable_x", arcade: f.arcade, shop: f.shop, fitout: f.fit });
  if (f.show) for (const s of L.shell.filter((s) => s.module === "bay_shop_ground")) L.plan.push({ storey: 0, module: `goods_${f.show[0]}`, at: [s.i, f.D], dy: 2 }, { storey: 0, module: `goods_${f.show[1]}`, at: [s.i + 1, f.D], dy: 2 });
  let g = compose(L);
  if (f.cupola) g = cupola(g);
  return { layout: L, grid: g, spec: f };
}
