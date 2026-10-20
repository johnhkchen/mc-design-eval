// Part "101 Stewart tower" (plot 1): brick and beige ribbon tower with shops at street level and a stepped terrace top.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ringOf, groundAt, groundColumn, shopfront, ribbonStorey, pilaster, terrace, deckAndParapet, doorPair } from "../vocab.mjs";

const site = JSON.parse(readFileSync(fileURLToPath(new URL("../site.json", import.meta.url)), "utf8"));
const P = site.plots.stewart;
const plot = { footprint: P.footprint, ground: P.ground.map((r) => r.map((v) => (v === "." || v == null ? null : Number(v)))) };
const OX = 65;                                                  // plot 1 offset along x (module space = local + 65)
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const KEY = (x, z) => `${x},${z}`;

// The helpers take plot-local x, the grid is module space: every read and write is shifted by the plot offset.
function local(g) {
  return {
    set: (x, y, z, ...rest) => g.set(x + OX, y, z, ...rest),
    blockAt: (x, y, z) => g.blockAt(x + OX, y, z),
    isAir: (x, y, z) => g.isAir(x + OX, y, z),
    inBounds: (x, y, z) => g.inBounds(x + OX, y, z),
    get: (x, y, z) => g.get(x + OX, y, z),
  };
}

// Straight runs of ring-1 wall cells sharing an outward face, split where the run breaks. Short runs are the risers.
function treadsOf(rings) {
  const ring1 = [...rings].filter(([, v]) => v.ring === 1).map(([k, v]) => ({ x: Number(k.split(",")[0]), z: Number(k.split(",")[1]), face: v.faceDir }));
  const out = [];
  for (const face of ["north", "south", "east", "west"]) {
    const alongZ = face === "north" || face === "south";           // cells of a north/south run share z
    const line = (c) => (alongZ ? c.z : c.x), pos = (c) => (alongZ ? c.x : c.z);
    const cs = ring1.filter((c) => c.face === face).sort((a, b) => line(a) - line(b) || pos(a) - pos(b));
    let run = [];
    for (const c of cs) {
      const l = run[run.length - 1];
      if (l && line(l) === line(c) && pos(c) - pos(l) === 1) run.push(c);
      else { if (run.length) out.push({ cells: run.map((p) => [p.x, p.z]), face }); run = [c]; }
    }
    if (run.length) out.push({ cells: run.map((p) => [p.x, p.z]), face });
  }
  return out;
}

// Doors (plan.md, plot-local): the first ring-1 cell of each 2-wide opening, the floor y is 3.
const DOORS = [
  { x: 32, z: 1, face: "north", name: "lobby" },
  { x: 24, z: 1, face: "north", name: "shop" },
  { x: 42, z: 1, face: "north", name: "shop" },
  { x: 62, z: 10, face: "east", name: "shop" },
  { x: 62, z: 16, face: "east", name: "shop" },
];
const DOOR_Y = 3;

export function build(gm) {
  const g = local(gm);
  const rings = ringOf(plot);
  const ringAt = (x, z) => rings.get(KEY(x, z))?.ring;
  const cellsOfRing = (pred) => [...rings].filter(([, v]) => pred(v.ring)).map(([k]) => k.split(",").map(Number));

  // door cells: both halves along the wall, ring 1
  const doorCells = new Set();
  for (const d of DOORS) {
    const along = d.face === "north" || d.face === "south" ? [1, 0] : [0, 1];
    for (const k of [0, 1]) doorCells.add(KEY(d.x + k * along[0], d.z + k * along[1]));
  }

  // 1. shell: brick ring 1 from the ground up to the tower roof (y48), doorways left open
  for (const [x, z] of cellsOfRing((r) => r === 1)) {
    if (!doorCells.has(KEY(x, z))) { groundColumn(g, plot, { x, z, top: 48, block: "bricks" }); continue; }
    for (let y = groundAt(plot, x, z); y <= 48; y++) if (y < DOOR_Y || y > DOOR_Y + 1) g.set(x, y, z, "bricks");
  }

  const treads = treadsOf(rings);
  const long = treads.filter((t) => t.cells.length >= 5);
  const short = treads.filter((t) => t.cells.length < 5);

  // 2. doors (before the shop glass, so the glass segments can skip the door cells)
  for (const d of DOORS) {
    const ring0 = d.face === "north" ? [d.x, d.z - 1] : [d.x + 1, d.z];
    doorPair(g, { x: d.x, z: d.z, y: DOOR_Y, face: d.face, ground: groundAt(plot, ring0[0], ring0[1]) });
  }

  // 3. shop base: glass on the long treads in segments between the doors, polished frame, smooth fascia at y8
  for (const t of long) {
    let seg = [];
    const flush = () => { if (seg.length >= 3) shopfront(g, { wall: seg, cells: seg, face: t.face }, { baseY: 3, h: 4, frame: "polished_andesite", pierEvery: 7, fascia: "smooth_sandstone", fasciaY: 8, over: ["bricks"] }); seg = []; };
    for (const c of t.cells) { if (doorCells.has(KEY(...c))) flush(); else seg.push(c); }
    flush();
  }

  // 4. office storeys: ribbon windows on every long tread, floors at 9..44 (the storey band runs 9..48)
  const FLOORS = [9, 14, 19, 24, 29, 34, 39, 44];
  FLOORS.forEach((floorY, i) => {
    for (const t of long) ribbonStorey(g, { cells: t.cells, face: t.face }, { floorY, project: i % 2 === 1, over: true });
  });

  // floor slabs at each storey y on the interior rings (ring 2 and in): the hollow is floored, not open to the shaft
  const floor = (y, pred, block, skip = () => false) => { for (const [x, z] of cellsOfRing(pred)) if (!skip(x, z) && g.isAir(x, y, z)) g.set(x, y, z, block); };
  // the lobby and shop floor (y3) stays open for 2 cells inside each doorway, so the doors lead somewhere
  const inside = new Set();
  for (const d of DOORS) for (const k of [0, 1]) {
    const along = d.face === "north" || d.face === "south" ? [1, 0] : [0, 1];
    const [ix, iz] = d.face === "north" ? [0, 1] : d.face === "east" ? [-1, 0] : [0, -1];
    for (const n of [1, 2]) inside.add(KEY(d.x + k * along[0] + n * ix, d.z + k * along[1] + n * iz));
  }
  const notInside = (x, z) => inside.has(KEY(x, z));
  for (const y of FLOORS) floor(y, (r) => r >= 2, "smooth_stone");
  floor(DOOR_Y, (r) => r >= 2, "smooth_stone", notInside);

  // 5. risers and corners: brick pilasters at ring 0 from y9, on the proud cell of every short-run wall cell
  const seen = new Set();
  for (const t of short) for (const [x, z] of t.cells) {
    const [dx, dz] = DIRS[t.face];
    const px = x + dx, pz = z + dz;
    if (ringAt(px, pz) !== 0 || seen.has(KEY(px, pz))) continue;
    seen.add(KEY(px, pz));
    pilaster(g, [[px, pz]], { y0: 9, y1: 48, block: "bricks" });
  }

  // 6. tower roof at y49 (smooth stone deck, a 1-high parapet on ring 1 with its coping); ring 5 is the first terrace wall
  deckAndParapet(g, plot, { deckY: 49, deck: "smooth_stone", parapet: "smooth_sandstone", parapetH: 1, coping: "smooth_sandstone", rail: false, ring: 1, skip: (x, z) => ringAt(x, z) === 5 });

  // 7. terraces: T1 ring 5 (y49..58, deck 59), T2 ring 9 (y59..63, deck 64), T3 ring 13 (y64..68, deck 69 over everything inside)
  terrace(g, plot, { ring: 5, next: 9, y0: 49, y1: 58 });
  terrace(g, plot, { ring: 9, next: 13, y0: 59, y1: 63 });
  terrace(g, plot, { ring: 13, next: Infinity, y0: 64, y1: 68 });
  floor(59, (r) => r >= 10, "smooth_stone");                   // T2 floor inside the ring-9 wall
  floor(64, (r) => r >= 14, "smooth_stone");                   // T3 floor inside the ring-13 wall

  // 8. penthouse on ring 18: brick walls y70..74, smooth sandstone cap at y75
  for (const [x, z] of cellsOfRing((r) => r === 18)) for (let y = 70; y <= 74; y++) if (g.isAir(x, y, z)) g.set(x, y, z, "bricks");
  for (const [x, z] of cellsOfRing((r) => r >= 18)) if (g.isAir(x, 75, z)) g.set(x, 75, z, "smooth_sandstone");
}
