import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001282.cells.json`, "utf8"));

const W = 5, H = 27, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const byKey = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  let top = Math.round(roof) - 1;
  top = Math.max(top, ground + 3);
  top = Math.min(top, H - 1);
  byKey.set(key(x, z), { x, z, gr: ground, top, roof: top + 1 });
}
const has = (x, z) => byKey.has(key(x, z));

for (const c of byKey.values()) {
  c.ext = [];
  if (!has(c.x - 1, c.z)) c.ext.push("west");
  if (!has(c.x + 1, c.z)) c.ext.push("east");
  if (!has(c.x, c.z - 1)) c.ext.push("north");
  if (!has(c.x, c.z + 1)) c.ext.push("south");
}

// Entrance: south face, centre column of the 5-wide front
const DOOR = { x: 2, z: 10 };
const isDoorCell = (c) => c.x === DOOR.x && c.z === DOOR.z && c.ext.includes("south");

const B = (id, p) => ({ id, p });

function spec(c, y) {
  const gr = c.gr, top = c.top;
  if (y < gr) return B("stone_bricks");
  if (y > top) return null;
  const k = y - gr;
  const ext = c.ext;

  // Interior: floor slabs and roof deck only, air elsewhere
  if (ext.length === 0) {
    if (y === top) return B("smooth_stone");
    if (k > 0 && k % 3 === 0) return B("smooth_stone");
    return null;
  }

  // Exterior shell
  if (y === top) return B("stone_brick_wall");          // parapet
  if (y === top - 1) return B("stone_bricks");          // cornice course
  if (k === 0) return B("stone_bricks");                // base course

  const face = ext[0];
  const idx = (face === "west" || face === "east") ? c.z : c.x;
  const win = idx % 2 === 1;

  if (k < 3) {
    // Ground-floor commercial shopfront with entrance
    if (isDoorCell(c)) {
      if (k === 1) return B("oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      if (k === 2) return B("oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Piers flanking the entrance so the door reads as a doorway
    const nextToDoor = face === "south" && c.z === DOOR.z && Math.abs(c.x - DOOR.x) === 1;
    if (nextToDoor) return B("stone_bricks");
    if (win && !(face === "south" && c.z === DOOR.z)) return B("glass");
    return B("dark_oak_planks");
  }

  // Upper storeys: 3-block storeys, lintel course at the bottom of each
  const sr = (k - 3) % 3;
  if (sr === 0) return B("stone_bricks");
  if (win) {
    if (sr === 1) return B("stone_brick_slab", { type: "bottom", waterlogged: "false" }); // sill
    if ((c.x + 2 * c.z + y) % 11 === 0) return B("glowstone");                               // rare warm light
    return B("glass");
  }
  return B("bricks");
}

for (const c of byKey.values()) {
  for (let y = 0; y < H; y++) {
    const s = spec(c, y);
    if (s) g.set(c.x, y, c.z, s.id, s.p);
  }
}

// Rooftop chimney on an interior roof cell
const interiorCells = [...byKey.values()].filter((c) => c.ext.length === 0);
const chimney = byKey.get(key(2, 5)) && byKey.get(key(2, 5)).ext.length === 0
  ? byKey.get(key(2, 5))
  : interiorCells[0];
if (chimney) {
  for (let y = chimney.top + 1; y <= Math.min(chimney.top + 3, H - 1); y++) {
    g.set(chimney.x, y, chimney.z, "bricks");
  }
  const capY = Math.min(chimney.top + 4, H - 1);
  g.set(chimney.x, capY, chimney.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/NYC1001282.nbt`);
