import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147851949";
const W = 47, H = 23, D = 18;

// Footprint: [x, z, ground] per cell.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const cells = new Map();
for (const [x, z, g] of list) cells.set(`${x},${z}`, Math.round(g));

const has = (x, z) => cells.has(`${x},${z}`);
const groundAt = (x, z) => cells.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Classify a footprint cell: perimeter? outward normal, facade index, pier or bay.
function classify(x, z) {
  const eN = !has(x, z - 1), eS = !has(x, z + 1);
  const eW = !has(x - 1, z), eE = !has(x + 1, z);
  const perim = eN || eS || eW || eE;
  let dx = 0, dz = 0;
  if (eN) dz = -1; else if (eS) dz = 1; else if (eW) dx = -1; else if (eE) dx = 1;
  const corner = (eN || eS) && (eW || eE);
  const idx = dz !== 0 ? x : z;
  const pier = corner || idx % 4 === 0;
  return { perim, dx, dz, idx, pier, corner };
}

const facingName = (dx, dz) =>
  dz === -1 ? "north" : dz === 1 ? "south" : dx === -1 ? "west" : "east";

// Pass 1: foundations, floors, roof, walls.
const info = new Map();
for (const key of cells.keys()) {
  const [x, z] = key.split(",").map(Number);
  const b = groundAt(x, z);
  const c = classify(x, z);
  info.set(key, c);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone");

  if (!c.perim) {
    // Interior: floor slabs per storey, roof deck, air between.
    put(x, b, z, "gray_concrete");
    put(x, b + 5, z, "gray_concrete");
    put(x, b + 10, z, "gray_concrete");
    // Rooftop AC units on a few interior cells.
    if (x % 10 === 5 && (z === 6 || z === 11)) {
      put(x, b + 11, z, "iron_block");
    }
    continue;
  }

  // Perimeter: full wall from base course to cornice.
  const door = c.dz === -1 && (x === 10 || x === 34) && !c.pier;
  for (let y = b; y <= b + 10; y++) {
    let id;
    if (y === b) id = "polished_andesite";              // base course
    else if (y === b + 4) id = c.pier ? "white_concrete" : "red_concrete"; // awning band
    else if (y >= b + 1 && y <= b + 3) id = c.pier ? "white_concrete" : "glass"; // shopfront
    else if (y === b + 5 || y === b + 9) id = "light_gray_concrete";           // storey lines
    else if (y >= b + 6 && y <= b + 8) id = c.pier ? "white_concrete" : "glass"; // upper windows
    else if (y === b + 10) id = "smooth_stone";         // cornice
    put(x, y, z, id);
  }
  put(x, b + 11, z, "stone_brick_wall");                // parapet

  if (door) {
    const facing = facingName(c.dx, c.dz);
    put(x, b + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Pass 2: roof cover at perimeter top is the cornice; roof deck interior already set.

// Pass 3: warm lights behind glass, one cell inside the facade.
for (const [key, c] of info) {
  if (!c.perim || c.pier) continue;
  const [x, z] = key.split(",").map(Number);
  const b = groundAt(x, z);
  const ix = x - c.dx, iz = z - c.dz;
  if (!has(ix, iz) || info.get(`${ix},${iz}`).perim) continue;
  if (c.idx % 8 === 6) put(ix, b + 7, iz, "glowstone");   // upper storey
  if (c.idx % 8 === 2 && !(c.dz === -1 && (x === 10 || x === 34))) {
    put(ix, b + 2, iz, "glowstone");                     // shop interior
  }
}

g.save(`${DIR}/${ID}.nbt`);
