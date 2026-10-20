import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807581";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 16;
const grid = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !(inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1));

const minG = Math.min(...ground.values());
// Storeys: ground band minG..minG+4, storey 2 minG+5..minG+9, roof/parapet row minG+10.
// Roof top surface sits at minG+11 (about 11 blocks above lowest ground).
const FLOOR2 = minG + 5;
const ROOF = minG + 10;

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz));

// ---- entrance: middle of the south-facing run ------------------------------
const southRun = cells
  .filter(([x, z]) => !inside(x, z + 1) && outward(x, z).length === 1)
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const southZ = Math.max(...cells.map(([, z]) => z));
const doorX = southRun.length ? southRun[Math.floor(southRun.length / 2)] : null;
const entranceX = new Set(doorX === null ? [] : [doorX - 1, doorX, doorX + 1]);

// ---- build each footprint column -------------------------------------------
for (const [x, z, gc] of cells) {
  const edge = isEdge(x, z);
  const out = outward(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) grid.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: ground floor, storey-2 slab, roof deck; air between (no interiors).
    grid.set(x, gc, z, "polished_andesite");
    if (FLOOR2 >= gc) grid.set(x, FLOOR2, z, "smooth_stone");
    grid.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  // Exterior wall column.
  const [, dx, dz] = out[0] ?? [null, 0, 0];
  const along = dx !== 0 ? z : x;
  const corner = out.length > 1;
  const pier = corner || along % 3 === 0;

  // Base course.
  grid.set(x, gc, z, "stone_bricks");

  // Ground storey: shopfront glazing around entrance, otherwise window grid.
  for (let y = gc + 1; y <= FLOOR2 - 1; y++) {
    if (y === gc + 1 || y === gc + 2) {
      if (entranceX.has(x) && out.some(([n]) => n === "south")) {
        // Door centre column is handled below; flanking cells are glazed.
        grid.set(x, y, z, x === doorX ? "air" : "light_blue_stained_glass");
        continue;
      }
    }
    if (y === gc + 3 && entranceX.has(x) && out.some(([n]) => n === "south")) {
      // Canopy over the entrance (sits on the wall line).
      grid.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    grid.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }

  // Storey line between floors.
  grid.set(x, FLOOR2, z, "smooth_stone");

  // Storey 2 window grid.
  for (let y = FLOOR2 + 1; y <= ROOF - 2; y++) {
    grid.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }

  // Cornice band and parapet.
  grid.set(x, ROOF - 1, z, "smooth_stone");
  grid.set(x, ROOF, z, "light_gray_concrete");
}

// Door on the south (front) facade.
if (doorX !== null && cells.some(([x, z]) => x === doorX && z === southZ)) {
  grid.set(doorX, minG + 1 - (minG - minG), southZ, "air"); // clear before door placement
  const dy = cells.find(([x, z]) => x === doorX && z === southZ)[2] + 1;
  grid.set(doorX, dy, southZ, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  grid.set(doorX, dy + 1, southZ, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light behind some windows (in the air gap, inside the footprint).
for (const [x, z, gc] of cells) {
  if (!isEdge(x, z)) continue;
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const [, dx, dz] = out[0];
  const along = dx !== 0 ? z : x;
  if (along % 3 === 0 || along % 6 !== 1) continue;
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || isEdge(ix, iz)) continue;
  for (const y of [gc + 2, FLOOR2 + 2]) {
    if (y < ROOF - 1) grid.set(ix, y, iz, "glowstone");
  }
}

// Rooftop plant room: small box on the roof deck, centred on the footprint.
const xs = cells.map(([x]) => x), zs = cells.map(([, z]) => z);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (let x = cx - 2; x <= cx + 1; x++) {
  for (let z = cz - 1; z <= cz; z++) {
    if (!inside(x, z) || isEdge(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      grid.set(x, y, z, "light_gray_concrete");
    }
  }
}

grid.save(`${DIR}/${ID}.nbt`);
