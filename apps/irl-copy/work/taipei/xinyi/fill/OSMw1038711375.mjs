import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711375";
const W = 22, H = 33, D = 16;

// Record: 22 x 16 footprint, roof ~21 blocks above lowest ground.
// Read as a four-storey Taipei commercial block of the 1980s-90s:
// white concrete frame, cyan-tinted glazing in grid bays, stone base,
// shopfront at ground, one entrance on the north street face, and a
// small roof penthouse behind a parapet. Roof surface at y 21.
const ROOF_Y = 20;          // roof slab (top surface at y 21)
const FLOORS = [5, 10, 15]; // floor slabs between storeys
const BANDS = [[6, 9], [11, 14], [16, 19]]; // storeys 2-4 (spandrel rows at ends)
const GLASS = "cyan_stained_glass_pane";
const PIER = "light_gray_concrete";
const WALL = "white_concrete";

const FACES = {
  north: { dx: 0, dz: -1, along: "x" },
  south: { dx: 0, dz: 1, along: "z" },
  west: { dx: -1, dz: 0, along: "z" },
  east: { dx: 1, dz: 0, along: "x" },
};

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

function S(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function paneProps(face) {
  // Panes connect along the wall they sit in.
  const alongX = face === "north" || face === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// Returns [id, props?] for a facade block at height y, position t along the face.
function facadeBlock(y, t, gi, face) {
  if (y < 5) {
    if (y === gi) return ["stone_bricks"];      // base course
    if (y === 4) return [WALL];                  // shopfront lintel
    if (t % 3 === 0) return [PIER];              // shopfront piers
    return [GLASS, paneProps(face)];
  }
  for (const [lo, hi] of BANDS) {
    if (y >= lo && y <= hi) {
      if (y === lo || y === hi) return [WALL];   // spandrels
      if (t % 3 === 0) return [PIER];            // window piers
      return [GLASS, paneProps(face)];
    }
  }
  return null;
}

// Pass 1: foundations, floor slabs, roof, facades.
const perimeter = [];
for (const [x, z, graw] of cells) {
  const gi = clamp(Math.round(graw), 0, 19);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gi; y++) S(x, y, z, "stone");

  // Floor slabs and roof slab (full cell).
  for (const y of FLOORS) if (y >= gi) S(x, y, z, WALL);
  if (ROOF_Y >= gi) S(x, ROOF_Y, z, "light_gray_concrete");

  const out = Object.keys(FACES).filter((f) => !has(x + FACES[f].dx, z + FACES[f].dz));
  if (out.length === 0) continue; // interior cell: air behind the shell
  perimeter.push({ x, z, gi, out });

  // Cornice and parapet on the perimeter.
  S(x, ROOF_Y, z, "smooth_stone");
  S(x, 21, z, WALL);

  if (out.length >= 2) {
    // Corner column: solid concrete from ground to the cornice.
    for (let y = gi; y < ROOF_Y; y++) {
      if (FLOORS.includes(y)) continue;
      S(x, y, z, PIER);
    }
    continue;
  }

  const face = out[0];
  const t = FACES[face].along === "x" ? x : z;
  for (let y = gi; y < ROOF_Y; y++) {
    if (FLOORS.includes(y)) continue; // floor slab already placed
    const b = facadeBlock(y, t, gi, face);
    if (b) {
      if (b[1]) S(x, y, z, b[0], b[1]);
      else S(x, y, z, b[0]);
    }
  }
}

// Pass 2: entrance on the north (street) face, and warm lights behind glass.
for (const { x, z, gi, out } of perimeter) {
  if (out.length !== 1) continue;
  const face = out[0];
  const { dx, dz } = FACES[face];

  // Entrance: two-leaf door in the centre of the north face, at ground level.
  if (face === "north" && (x === 10 || x === 11) && gi + 2 <= 3) {
    const common = { facing: "south", hinge: "left", open: "false", powered: "false" };
    S(x, gi + 1, z, "oak_door", { ...common, half: "lower" });
    S(x, gi + 2, z, "oak_door", { ...common, half: "upper" });
    continue;
  }

  // Warm light: glowstone on the inward cell behind selected lit windows (storey 2 row 7).
  const t = FACES[face].along === "x" ? x : z;
  const lit = t % 6 === 2;
  if (lit && gi <= 7 && has(x - dx, z - dz)) {
    S(x - dx, 7, z - dz, "glowstone");
  }
}

// Pass 3: roof penthouse, set back in the middle of the roof.
for (let x = 7; x <= 14; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    const gi = clamp(Math.round(ground.get(`${x},${z}`)), 0, 19);
    if (gi > ROOF_Y) continue;
    S(x, 21, z, PIER);
    S(x, 22, z, PIER);
    S(x, 23, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
