import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401650";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 69 x 111, roof about 12 blocks above lowest ground.
// Reads as a two-storey commercial block: stone base course, shopfronts,
// a white-concrete pier grid with glazed bays on the upper storey, a stone
// cornice and parapet, and a few rooftop plant boxes.
const W = 69, H = 24, D = 111;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Which face a boundary cell sits on (outward direction)
const faceOf = (x, z) => {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
};

// Group edge cells by face and choose a central entrance on each main frontage
const faces = {};
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!isEdge(x, z)) continue;
  const f = faceOf(x, z);
  if (!f) continue;
  const i = (f === "west" || f === "east") ? z : x;
  (faces[f] ??= []).push({ x, z, i });
}
const entrance = new Map(); // key -> outward facing
for (const f of Object.keys(faces)) {
  const list = faces[f].sort((a, b) => a.i - b.i);
  if (list.length < 20) continue;
  const mid = list[Math.floor(list.length / 2)];
  entrance.set(key(mid.x, mid.z), f);
}

// Build each footprint cell
for (const [x, z, gr] of cells) {
  const b = gr;

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const f = faceOf(x, z) ?? "north";
    const i = (f === "west" || f === "east") ? z : x;
    const pier = i % 4 === 0;
    const doorFace = entrance.get(key(x, z));

    // Base course
    put(x, b, z, "stone_bricks");

    // Storey 1: shopfront with piers, door at the entrance
    if (doorFace) {
      put(x, b + 1, z, "oak_door", { facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "oak_door", { facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, b + 3, z, "glass");
    } else {
      for (let y = b + 1; y <= b + 3; y++) put(x, y, z, pier ? "white_concrete" : "glass");
    }
    put(x, b + 4, z, "stone_bricks"); // lintel

    // Storey line
    put(x, b + 5, z, "white_concrete");

    // Storey 2: glazed bays between concrete piers, some lit
    const lit = ((Math.floor(i / 4) + x + z) % 5 === 0) && i % 4 === 2;
    for (let y = b + 6; y <= b + 8; y++) {
      if (pier) put(x, y, z, "white_concrete");
      else if (lit && y === b + 7) put(x, y, z, "glowstone");
      else put(x, y, z, "glass");
    }

    // Spandrel, cornice, parapet
    put(x, b + 9, z, "white_concrete");
    put(x, b + 10, z, "stone_bricks");
    put(x, b + 11, z, "white_concrete");
  } else {
    // Interior: floor slabs and roof only, air between
    put(x, b, z, "light_gray_concrete");
    put(x, b + 5, z, "light_gray_concrete");
    put(x, b + 11, z, "light_gray_concrete");
  }
}

// Rooftop plant boxes on interior roof, standing on the roof slab
for (const [x, z, gr] of cells) {
  if (x % 16 !== 8 || z % 16 !== 8) continue;
  let ok = true;
  for (let dx = 0; dx <= 2 && ok; dx++)
    for (let dz = 0; dz <= 1 && ok; dz++) {
      const gg = G.get(key(x + dx, z + dz));
      if (gg === undefined || gg !== gr || isEdge(x + dx, z + dz)) ok = false;
    }
  if (!ok) continue;
  for (let dx = 0; dx <= 2; dx++)
    for (let dz = 0; dz <= 1; dz++)
      for (let y = gr + 12; y <= gr + 13; y++)
        put(x + dx, y, z + dz, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
