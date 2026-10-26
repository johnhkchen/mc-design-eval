import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Early-20th-century Classical commercial block on 16th St NW.
// Stone-base shopfront with a central door, brick upper storeys with limestone
// belts and calcite pilasters on the street face, corbelled cornice and parapet.
// Roof is quantised to clean tiers; a single rooftop penthouse sits on one level.
// Vacant: some bays boarded, a few lit from behind the glass.
// Side walls are party walls (abutting neighbours) and carry no windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86599";
const W = 14, H = 27, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { x, z, gr: Math.max(0, Math.round(gr)), roof: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));

// ---- Roof tiers: quantise lidar roof heights around the median level ----
const roofs = [...map.values()].map((c) => c.roof).sort((a, b) => a - b);
const main = roofs[Math.floor(roofs.length / 2)];
const tops = new Map();
for (const c of map.values()) {
  const d = c.roof - main;
  const q = Math.max(-3, Math.min(1, 2 * Math.round(d / 2)));
  const t = Math.min(22, Math.max(main + q, c.gr + 9));
  tops.set(key(c.x, c.z), t);
}

// Rooftop penthouse block: central cells, all forced to one common roof level.
const PH = [];
for (let x = 4; x <= 9; x++) for (let z = 5; z <= 11; z++) if (has(x, z)) PH.push([x, z]);
if (PH.length) {
  const tp = Math.max(...PH.map(([x, z]) => tops.get(key(x, z))));
  for (const [x, z] of PH) tops.set(key(x, z), tp);
}

const winCol = (x) => x % 2 === 1 && x >= 1 && x <= 11;
const boardedGround = (x) => x === 9;
const boardedUpper = (x, s) => (x === 3 && (s === 0 || s === 2)) || (x === 9 && s === 1);

for (const cell of map.values()) {
  const { x, z, gr } = cell;
  const t = tops.get(key(x, z));

  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wf = !has(x - 1, z), E = !has(x + 1, z);
  const edge = N || S || Wf || E;
  const street = N || S;
  const face = N ? "N" : S ? "S" : null;

  // Foundation: solid from y0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < t; y++) {
    const rel = y - gr;

    // Interior: floor slabs at each storey line and a roof slab; air between.
    if (!edge) {
      if (rel === 0 || rel === 4 || (rel > 4 && (rel - 4) % 3 === 0) || y === t - 1) {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Parapet coping and corbelled cornice on every exposed cell.
    if (y === t - 1) { put(x, y, z, "calcite"); continue; }
    if (y === t - 2) { put(x, y, z, (x + z) % 2 ? "smooth_stone" : "stone_brick_slab", (x + z) % 2 ? null : { type: "bottom", waterlogged: "false" }); continue; }

    // Party walls and side faces: plain brick over a polished base.
    if (!street) {
      if (rel === 0) put(x, y, z, "polished_andesite");
      else put(x, y, z, "bricks");
      continue;
    }

    // Ground floor shopfront (rel 0-3).
    if (rel < 4) {
      if (rel === 0) { put(x, y, z, "polished_andesite"); continue; }
      if (rel === 3) { put(x, y, z, "stone_bricks"); continue; }
      // rel 1-2: entrance, surround, glazed bays, boarded bays, calcite piers.
      if (N && x === 6) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (N && (x === 5 || x === 7)) { put(x, y, z, "calcite"); continue; }
      if (winCol(x)) {
        if (N && boardedGround(x)) put(x, y, z, "oak_planks");
        else put(x, y, z, "glass_pane");
      } else {
        put(x, y, z, "calcite");
      }
      continue;
    }

    // Upper storeys: 3-row modules (limestone belt, then two rows of windows).
    const s = Math.floor((rel - 4) / 3);
    const r = (rel - 4) % 3;
    if (r === 0) { put(x, y, z, "calcite"); continue; }
    if (winCol(x)) {
      if (boardedUpper(x, s)) put(x, y, z, "oak_planks");
      else put(x, y, z, "glass_pane");
    } else {
      // Street face: calcite pilasters between bays; rear face: brick.
      put(x, y, z, N ? "calcite" : "bricks");
    }
  }
}

// Warm lights glowing from behind a few glazed bays (interior air cells).
const glows = [
  { x: 5, s: 1, r: 1, face: "N" },
  { x: 7, s: 2, r: 2, face: "N" },
  { x: 9, s: 0, r: 1, face: "S" },
];
for (const { x, s, r, face } of glows) {
  const zFront = face === "N" ? 0 : D - 1;
  const zIn = face === "N" ? 1 : D - 2;
  const c = map.get(key(x, zFront));
  if (!c || !has(x, zIn)) continue;
  const y = c.gr + 4 + 3 * s + r;
  put(x, y, zIn, "glowstone");
}

// Penthouse: brick box with glazed sides and a calcite cap, on the common roof level.
for (const [x, z] of PH) {
  const t = tops.get(key(x, z));
  const perim = x === 4 || x === 9 || z === 5 || z === 11;
  for (let rel = 0; rel < 3; rel++) {
    const y = t + rel;
    if (!perim) {
      if (rel === 2) put(x, y, z, "smooth_stone");
      continue;
    }
    if (rel === 2) { put(x, y, z, "calcite"); continue; }
    const glassSpot =
      rel === 1 &&
      (((x === 4 || x === 9) && z % 2 === 1) || ((z === 5 || z === 11) && x % 2 === 1));
    if (glassSpot) put(x, y, z, "glass_pane");
    else put(x, y, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
