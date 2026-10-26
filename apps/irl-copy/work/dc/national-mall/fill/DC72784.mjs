// DC72784: a vacant 19th-century brick commercial block on the Mall's north-west edge. Two storeys at the tall
// bay (north, x 6..7), one storey with a parapet elsewhere, stepped down to a stone terrace on the west. Brick piers,
// stone plinth, string course and cornice; glass windows with air behind; the ground floor on the south and east
// is boarded (vacant); a stone-hooded entrance on the south; two glowstone lamps behind the tower windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC72784.cells.json`, "utf8"));

const PLINTH = "stone_bricks", TRIM = "smooth_sandstone", WALL = "bricks", ROOF = "smooth_stone", BOARD = "spruce_planks";
const GLASS_ALONG_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// The footprint's facades. Each face lists a role per position along it (u = x on north and south, z on east and west).
const ROLES = {
  N: ["corner", "pier", "pier", "bay", "bay", "pier", "bay", "bay", "pier", "corner"],
  S: ["corner", "pier", "pier", "door", "bay", "pier", "boards", "boards", "pier", "corner"],
  E: ["corner", "bay", "bay", "pier", "bay", "bay", "pier", "boards", "boards", "corner"],
  W: ["corner", "pier", "pier", "pier", "pier", "pier", "pier", "pier", "pier", "corner"],
};
// the cell inside the wall from a facade cell: the air behind each window
const INWARD = { N: [0, 0, 1], S: [0, 0, -1], E: [-1, 0, 0], W: [1, 0, 0] };

const facadeOf = (x, z) => {
  if (z === 0) return { face: "N", u: x };
  if (z === 9) return { face: "S", u: x };
  if (x === 9) return { face: "E", u: z };
  if (x === 0) return { face: "W", u: z };
  return null;
};

// Storey rows by height: 0 plinth, 1 ground-storey windows, a stone string course at 2 (on the 4 and 5 tiers),
// the upper windows at 3 on the 5 tier, and the cornice on the top course.
function rowKind(y, R) {
  if (y === R - 1) return "cap";
  if (y === 0) return "plinth";
  if (R >= 4 && y === 2) return "string";
  if (y === 1 || (R === 5 && y === 3)) return "win";
  return "wall";
}

const glass = (face) => ({ block: "glass_pane", state: face === "N" || face === "S" ? GLASS_ALONG_X : GLASS_ALONG_Z });
const door = (half) => ({ block: "dark_oak_door", state: { facing: "south", half, hinge: "left", open: "false", powered: "false" } });
const canopy = { block: "smooth_sandstone_stairs", state: { facing: "south", half: "top", shape: "straight", waterlogged: "false" } };

function facadeBlock(f, y, R) {
  if (f.face === "S" && f.u === 3) {                     // the entrance: door, then a stone hood over it
    if (y === 1) return door("lower");
    if (y === 2) return door("upper");
    if (y === R - 1) return canopy;
  }
  const role = ROLES[f.face][f.u], kind = rowKind(y, R);
  if (kind === "plinth") return { block: PLINTH };
  if (kind === "cap" || kind === "string" || role === "corner") return { block: TRIM };
  if (kind === "win" && role === "bay") return glass(f.face);
  if (kind === "win" && role === "boards") return { block: BOARD };
  return { block: WALL };                                // piers, and the brick between windows
}

// Pass 1: every footprint cell from y 0 up to its roof (solid core, facade on the edge), foundation under the ground
const put = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
for (const [x, z, ground, roof] of cells) {
  const f = facadeOf(x, z);
  for (let y = 0; y < ground; y++) put.set(key(x, y, z), { block: PLINTH });
  for (let y = ground; y < roof; y++) {
    const b = f ? facadeBlock(f, y, roof) : y === roof - 1 ? { block: ROOF } : { block: WALL };
    put.set(key(x, y, z), b);
  }
}

// Pass 2: an air gap one cell in behind every glass pane (the rest of the core stays solid)
const air = new Set();
for (const [x, z, , roof] of cells) {
  const f = facadeOf(x, z);
  if (!f) continue;
  for (let y = 0; y < roof; y++) {
    const b = put.get(key(x, y, z));
    if (b.block !== "glass_pane") continue;
    const [dx, dy, dz] = INWARD[f.face];
    air.add(key(x + dx, y + dy, z + dz));
  }
}

// Pass 3: roof work and the warm lights, set over the air gaps and the roof
const over = {
  [key(6, 1, 1)]: { block: "glowstone" },               // lamp behind the tower's ground-storey window
  [key(7, 3, 1)]: { block: "glowstone" },               // lamp behind the tower's upper window
  [key(6, 5, 2)]: { block: WALL }, [key(6, 6, 2)]: { block: WALL }, [key(6, 7, 2)]: { block: TRIM },   // chimney on the tower
  [key(4, 4, 6)]: { block: WALL }, [key(4, 4, 7)]: { block: TRIM },                                      // roof plant housing
};
for (const k of Object.keys(over)) { air.delete(k); put.set(k, over[k]); }

const g = new Voxels([10, 17, 10]);
for (const [k, b] of put) {
  if (air.has(k)) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const { blocks, palette } = g.save(`${FILL}/DC72784.nbt`);
console.log(`DC72784.nbt: ${blocks} blocks, ${palette} palette entries, ${air.size} air cells behind glass`);
