import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499597";
const W = 10, H = 18, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) cellMap.set(key(c[0], c[1]), { g: c[2], r: c[3] });

const has = (x, z) => cellMap.has(key(x, z));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const WALL = "light_gray_concrete";
const PILASTER = "white_concrete";
const FRAME = "white_concrete";
const FLOOR = "smooth_stone";
const FOUND = "stone_bricks";
const BELT = "stone_bricks";
const CORNICE = "stone_brick_slab";
const ROOF = "smooth_stone";

// outward facing of a perimeter cell (null if interior or corner)
function outward(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  if ((n ? 1 : 0) + (s ? 1 : 0) + (w ? 1 : 0) + (e ? 1 : 0) !== 1) return null;
  if (n) return "north";
  if (s) return "south";
  if (w) return "west";
  return "east";
}

// choose the entrance: a non-corner perimeter cell on the south face, nearest the middle
const faceOf = new Map();
for (const [k] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const f = outward(x, z);
  if (f) faceOf.set(k, f);
}
function pickDoor() {
  for (const want of ["south", "west", "north", "east"]) {
    const list = [];
    for (const [k, f] of faceOf) if (f === want) list.push(k.split(",").map(Number));
    if (list.length === 0) continue;
    const alongOf = (c) => (want === "north" || want === "south" ? c[0] : c[1]);
    const alongs = list.map(alongOf).sort((a, b) => a - b);
    const mid = alongs[Math.floor(alongs.length / 2)];
    const c = list.find((p) => alongOf(p) === mid);
    return { x: c[0], z: c[1], face: want };
  }
  return null;
}
const door = pickDoor();

for (const [k, { g: gr, r: rr }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const ground = Math.round(gr);
  const roof = clamp(Math.round(rr), ground + 4, H - 1);
  const top = roof - 1; // cornice / roof slab level

  // foundation
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);
  // ground floor slab
  g.set(x, ground, z, FLOOR);

  const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  const face = faceOf.get(k) ?? null;

  if (!perim) {
    // interior roof slab only
    g.set(x, top, z, ROOF);
    continue;
  }

  // walls with vertical rhythm: pilasters on alternate bays, panels between
  const along = face === "north" || face === "south" ? x : z;
  const isPilaster = face !== null && along % 3 === 0;
  for (let y = ground + 1; y <= top - 2; y++) {
    g.set(x, y, z, isPilaster ? PILASTER : WALL);
  }
  // stone string course just under the cornice
  if (top - 1 >= ground + 1) g.set(x, top - 1, z, BELT);
  // cornice: slab cap on top of the wall
  g.set(x, top, z, CORNICE, { type: "bottom", waterlogged: "false" });

  // storey line / base course above foundation
  if (ground + 1 <= top - 2 && face !== null) {
    // base course: darker stone band at ground+1 on facades
    g.set(x, ground + 1, z, BELT);
  }

  // facade openings
  if (face === null) continue; // corners stay solid

  const isDoor = door && door.x === x && door.z === z;
  const isWindow = !isPilaster && along % 3 === 1;

  if (isDoor) {
    const dfacing = face;
    g.set(x, ground + 1, z, "oak_door", { facing: dfacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    if (ground + 2 <= top - 2) {
      g.set(x, ground + 2, z, "oak_door", { facing: dfacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // lintel and lantern-lit transom above the door
    if (ground + 3 <= top - 2) g.set(x, ground + 3, z, FRAME);
  } else if (isWindow) {
    const paneProps = (face === "north" || face === "south")
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    // sill
    if (ground + 1 <= top - 2) g.set(x, ground + 1, z, FRAME);
    // glass band (two blocks tall)
    for (const yy of [ground + 2, ground + 3]) {
      if (yy <= top - 2) g.set(x, yy, z, "glass_pane", paneProps);
    }
    // head
    if (ground + 4 <= top - 2) g.set(x, ground + 4, z, FRAME);

    // warm light just inside every other window
    if (along % 6 === 1) {
      const ix = face === "west" ? x + 1 : face === "east" ? x - 1 : x;
      const iz = face === "north" ? z + 1 : face === "south" ? z - 1 : z;
      if (has(ix, iz) && ground + 2 <= top - 2) {
        g.set(ix, ground + 2, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
