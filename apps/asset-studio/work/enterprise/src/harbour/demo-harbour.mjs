// The harbour district's two demo scenes as small worlds (for the path tracer): a sea harbour (the quay street with the
// customs house, warehouses and the fish market behind it, a jetty, the mole and its lighthouse, a cog and fishing
// boats) and a river wharf (a timber wharf, the river warehouse and customs booth, a jetty, a barge and a boat). Each
// part is laid as the placer would: its water line at the water's surface, its pilings run down to the bed.
//   node src/harbour/demo-harbour.mjs <out dir> [kingdom]      -> <out>/<kingdom>-sea/world, <out>/<kingdom>-river/world
import { Voxels } from "../../../../../irl-copy/src/voxels.mjs";
import { writeWorld } from "../../../../../irl-copy/src/anvil.mjs";
import { Grid, splitState } from "../grid.mjs";
import { harbourParts, harbourBuildings } from "./harbour.mjs";
import { paletteMap } from "../lordaeron/assemble.mjs";
import fs from "node:fs";

const OUT = process.argv[2], KING = process.argv[3] || "lordaeron", WY = 62, BED = 56;
const lord = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
const kp = KING === "stormwind" ? JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/stormwind/palettes.json", "utf8")) : null;
const palettes = kp ? { base: lord.base, palettes: { [lord.base]: lord.palettes[lord.base], ...Object.fromEntries(Object.entries(kp.palettes).map(([k, v]) => [`k:${k}`, v])) } } : lord;
const palOf = (n) => (kp ? `k:${kp.aliases[n] || n}` : n);
const P = Object.fromEntries(harbourParts(KING).map((t) => [t.id, t]));
const B = Object.fromEntries(harbourBuildings(KING).map((b) => { const m = b.pal ? paletteMap(palettes, palOf(b.pal)) : (s) => s, g = new Grid(b.grid.size); for (const [x, y, z, s] of b.grid.each()) g.set(x, y, z, m(s)); return [b.id.replace(/_13x(7|10)$/, (t) => (b.id.startsWith("customs") ? "" : t)), g]; }));

function scene(X, Z, Y = 100) {
  const v = new Voxels([X, Y, Z]);
  const set = (x, y, z, s) => { if (x < 0 || z < 0 || x >= X || z >= Z || y < 0 || y >= Y) return; if (s === "air") return v.set(x, y, z, "minecraft:air"); const { name, props } = splitState(s); v.set(x, y, z, name, Object.keys(props).length ? props : undefined); };
  /** paste a grid with its layer `base` at world y `y0`, turned q quarter turns; pilings (in the grid's frame) run down */
  const paste = (g, x0, y0, z0, { q = 0, pilings = [] } = {}) => {
    const t = new Grid(q % 2 ? [g.size[2], g.size[1], g.size[0]] : g.size); t.paste(g, 0, 0, 0, { q });
    for (const [x, y, z, s] of t.each()) set(x0 + x, y0 + y, z0 + z, s);
    const turn = ([x, z]) => (q === 0 ? [x, z] : q === 1 ? [g.size[2] - 1 - z, x] : q === 2 ? [g.size[0] - 1 - x, g.size[2] - 1 - z] : [z, g.size[0] - 1 - x]);
    for (const p of pilings) { const [px, pz] = turn(p.at); for (let y = y0 - 1; y > BED; y--) set(x0 + px, y, z0 + pz, p.block.replace(/^minecraft:/, "")); }
  };
  return { v, set, paste };
}

// ---- the sea harbour: land to the north (z < 37), the quay along z 37-39, the sea south of it -------------------------
{
  const X = 112, Z = 84, { v, set, paste } = scene(X, Z);
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    for (let y = 0; y <= BED; y++) set(x, y, z, "stone");
    if (z < 37) { for (let y = BED + 1; y < WY + 2; y++) set(x, y, z, "dirt"); set(x, WY + 2, z, z >= 30 ? ((x + z) % 3 ? "stone_bricks" : "cobblestone") : "grass_block[snowy=false]"); }
    else for (let y = BED + 1; y <= WY; y++) set(x, y, z, "water");
  }
  // the quay: tiles along x, water to the south, a bollard every 3rd, a lamp every 5th, a ladder every 8th, cranes and steps
  const jetties = [72], cranes = [38, 60];
  for (let x = 0; x < X; x++) {
    const id = cranes.includes(x) ? "quay_stone_crane_1" : jetties.some((j) => x === j - 2 || x === j + 4) ? "quay_stone_steps_1" : x % 5 === 2 ? "quay_stone_lamp_1" : x % 8 === 5 ? "quay_stone_ladder_1" : x % 3 === 0 ? "quay_stone_bollard_1" : `quay_stone_1${"abc"[x % 3]}`;
    paste(P[id].grid, x, WY, 37, { pilings: P[id].meta.pilings });
  }
  // the buildings on the quay street's land side, fronts to the water (their ground layer 2 at the quay's deck)
  // each building's front row on the quay street's back edge (z 29), whatever its depth (Dalaran's eaves add 2 a side)
  const front = (g, x) => paste(g, x, WY, 30 - g.size[2]);
  front(B.customs_house, 4); front(B.warehouse_13x7, 26); front(B.warehouse_13x7, 49); front(B.fish_market_10x7, 78);
  // a jetty out from the quay: segments, then the head
  for (const j of jetties) { for (let k = 0; k < 4; k++) paste(P.jetty_timber_3x4.grid, j, WY, 40 + 4 * k, { pilings: P.jetty_timber_3x4.meta.pilings }); paste(P.jetty_head_timber_5x5.grid, j - 1, WY, 56, { pilings: P.jetty_head_timber_5x5.meta.pilings }); }
  // the mole out from the shore at the harbour's east side, the lighthouse at its head
  for (let k = 0; k < 7; k++) { const id = `mole_7x4${"ab"[k % 2]}`; paste(P[id].grid, 100, WY, 40 + 4 * k, { pilings: P[id].meta.pilings }); }
  paste(P.mole_head_lighthouse_9x9.grid, 99, WY, 68, { pilings: P.mole_head_lighthouse_9x9.meta.pilings });
  // boats: the cog alongside the quay by the customs house (turned to lie along x), fishing boats by the jetty
  paste(P.boat_trader_9x25.grid, 6, WY - 1, 41, { q: 1 });
  paste(P.boat_fishing_3x8.grid, 76, WY - 1, 45); paste(P.boat_fishing_3x8.grid, 68, WY - 1, 47);
  fs.mkdirSync(`${OUT}/${KING}-sea/world`, { recursive: true }); writeWorld(`${OUT}/${KING}-sea/world`, v, { name: "harbour-sea" });
}

// ---- the river wharf: land north (z < 29), the river z 29-46, the far bank south --------------------------------------
{
  const X = 72, Z = 60, { v, set, paste } = scene(X, Z, 90);
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    for (let y = 0; y <= BED; y++) set(x, y, z, "stone");
    const wet = z >= 29 && z <= 46, top = z < 29 ? WY + 2 : WY + 1;
    if (wet) for (let y = BED + 1; y <= WY; y++) set(x, y, z, "water");
    else { for (let y = BED + 1; y < top; y++) set(x, y, z, "dirt"); set(x, top, z, z >= 22 && z < 27 && x >= 16 && x <= 44 ? (x + z) % 4 ? "dirt_path" : "coarse_dirt" : "grass_block[snowy=false]"); }
  }
  // the bank: timber wharf x 18-35 (a crane at 27, lamps, a ladder), plain timber quay the rest of the town's frontage
  for (let x = 0; x < X; x++) {
    const id = x === 27 ? "quay_timber_crane_1" : x % 6 === 3 ? "quay_timber_lamp_1" : x === 33 ? "quay_timber_ladder_1" : `quay_timber_1${"ab"[x % 2]}`;
    if (x >= 14 && x <= 48) paste(P[id].grid, x, WY, 27, { pilings: P[id].meta.pilings });
  }
  paste(B.warehouse_10x7, 18, WY, 22 - B.warehouse_10x7.size[2]);
  paste(B.river_customs_7x5, 37, WY, 19, { q: 1 });          // turned: its counter and boom face the river (south)
  for (let k = 0; k < 2; k++) paste(P.jetty_timber_3x4.grid, 50, WY, 30 + 4 * k, { pilings: P.jetty_timber_3x4.meta.pilings });
  paste(P.jetty_head_timber_5x5.grid, 49, WY, 38, { pilings: P.jetty_head_timber_5x5.meta.pilings });
  paste(P.boat_barge_4x11.grid, 19, WY - 1, 31, { q: 1 });
  paste(P.boat_fishing_3x8.grid, 54, WY - 1, 31);
  fs.mkdirSync(`${OUT}/${KING}-river/world`, { recursive: true }); writeWorld(`${OUT}/${KING}-river/world`, v, { name: "harbour-river" });
}
console.log("sea and river scenes written");
