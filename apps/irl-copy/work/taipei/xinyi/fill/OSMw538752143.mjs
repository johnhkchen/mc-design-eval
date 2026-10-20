import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752143";
const W = 8, H = 23, D = 22;

// Storey logic: ground storey y gr..4, upper storey y 6..9, floor slab at y 5,
// roof deck at y 10, parapet at y 11 (roof reads ~11 blocks above lowest ground).
const FLOOR2 = 5;
const ROOF = 10;
const PARAPET = 11;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) {
  // Clamp ground to 0..1 so the two storey lines stay true everywhere.
  ground.set(`${x},${z}`, Math.min(Math.max(0, Math.round(gr)), 1));
}
const at = (x, z) => ground.has(`${x},${z}`);
const facesOf = (x, z) => {
  const f = [];
  if (!at(x, z - 1)) f.push("north");
  if (!at(x, z + 1)) f.push("south");
  if (!at(x - 1, z)) f.push("west");
  if (!at(x + 1, z)) f.push("east");
  return f;
};
const isPerim = (x, z) => at(x, z) && facesOf(x, z).length > 0;

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

// Pass 1: foundations, floors, walls, facade articulation.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = facesOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "polished_andesite");

  if (faces.length === 0) {
    // Interior cell: floor slabs only, air between (no interiors).
    S(x, gr, z, "smooth_stone");
    S(x, FLOOR2, z, "smooth_stone");
    S(x, ROOF, z, "smooth_stone");
    continue;
  }

  // Perimeter cell: base course, then solid wall to the parapet.
  S(x, gr, z, "polished_granite");
  for (let y = gr + 1; y <= PARAPET; y++) S(x, y, z, "smooth_quartz");

  // Corner: quartz pillar column.
  if (faces.length >= 2) {
    for (let y = gr + 1; y <= PARAPET; y++) S(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }

  const f = faces[0];
  const idx = f === "north" || f === "south" ? x : z; // position along the face
  const inward = {
    north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
  }[f];

  // Ground storey shopfront glass (y gr+1 .. 3).
  for (let y = gr + 1; y <= 3; y++) S(x, y, z, "light_blue_stained_glass");

  // Entrance on the street (north) face.
  if (f === "north" && x === 3) {
    S(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    S(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Upper storey window grid: alternate bays, dark glass, y 6..8.
  const upperWindow = idx % 2 === 1;
  if (upperWindow) {
    for (let y = FLOOR2 + 1; y <= 8; y++) S(x, y, z, "gray_stained_glass");
  }

  // Warm lights just inside the glass.
  const ix = x + inward[0], iz = z + inward[1];
  if (at(ix, iz) && !isPerim(ix, iz)) {
    if (upperWindow && idx % 4 === 1) {
      S(ix, 7, iz, "shroomlight");
    } else if (!upperWindow && idx % 3 === 1 && gr + 1 <= 2) {
      S(ix, 2, iz, "glowstone");
    }
  }
}

// Pass 2: roof equipment on interior roof cells.
let rodPlaced = false;
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (x >= 2 && x <= 3 && z >= 9 && z <= 10) {
    S(x, PARAPET, z, "light_gray_concrete"); // rooftop AC unit
  }
  if (!rodPlaced && x === 5 && z === 5) {
    S(x, PARAPET, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    rodPlaced = true;
  }
}

g.save(`${DIR}/${ID}.nbt`);
