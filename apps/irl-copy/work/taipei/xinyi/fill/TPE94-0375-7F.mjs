import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0375-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 47, D = 32;
const ROOF = 35;
const STOREY = 5;

const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street face: the lowest-z footprint row, with the entrance on the cell nearest the middle
let minZ = Infinity;
for (const [, z] of cells) if (z < minZ) minZ = z;
const streetXs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const midX = (Math.min(...streetXs) + Math.max(...streetXs)) / 2;
const DOOR_X = streetXs.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), streetXs[0]);
const DOOR_Z = minZ;
const isStreetDoorZone = (x, z) => z === DOOR_Z && Math.abs(x - DOOR_X) <= 1;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const zExposed = !has(x, z - 1) || !has(x, z + 1);
  const u = zExposed ? x : z;

  for (let y = gr; y <= ROOF + 1; y++) {
    if (y >= ROOF) {
      if (edge) put(x, y, z, "white_concrete");
      else if (y === ROOF) put(x, y, z, "gray_concrete");
      continue;
    }

    const rel = y - gr;
    const k = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (!edge) {
      if (r === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (k === 0) {
      // Ground-floor shopfront with stone plinth and entrance surround
      if (r === 0) {
        put(x, y, z, "stone_bricks");
      } else if (r === 4) {
        put(x, y, z, "white_concrete");
      } else if (z === DOOR_Z && x === DOOR_X && (r === 1 || r === 2)) {
        put(x, y, z, "oak_door", {
          facing: "north", half: r === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (isStreetDoorZone(x, z) && r === 3) {
        put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // lintel course
      } else if (isStreetDoorZone(x, z) && x !== DOOR_X) {
        put(x, y, z, "polished_andesite"); // stone pilasters flanking the door
      } else if (u % 3 === 0) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "cyan_stained_glass");
      }
    } else {
      if (r === 0 || r === 4) {
        put(x, y, z, "white_concrete");
      } else if (u % 3 === 0) {
        put(x, y, z, "light_gray_concrete");
      } else if (((u * 5 + k * 7 + z * 3) % 37) === 0) {
        put(x, y, z, "glowstone"); // sparse warm lights
      } else {
        put(x, y, z, "cyan_stained_glass");
      }
    }
  }
}

// Roof plant box and lightning rod on the central roof
for (let x = 7; x <= 11; x++) {
  for (let z = 11; z <= 20; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
  }
}
const rodX = Math.round((Math.min(...cells.map(c => c[0])) + Math.max(...cells.map(c => c[0]))) / 2);
const rodZ = Math.round((Math.min(...cells.map(c => c[1])) + Math.max(...cells.map(c => c[1]))) / 2);
if (has(rodX, rodZ) && !isEdge(rodX, rodZ)) {
  put(rodX, ROOF + 4, rodZ, "light_gray_concrete");
  for (let y = ROOF + 5; y <= ROOF + 7; y++)
    put(rodX, y, rodZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
