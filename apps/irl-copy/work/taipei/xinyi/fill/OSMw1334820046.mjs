import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334820046";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 19, D = 5;
const ROOF = 7;                       // roof about 7 blocks above lowest ground
const g = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, b] of cells) groundOf.set(`${x},${z}`, b);
const has = (x, z) => groundOf.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false",
});

// Facade/perimeter classification
function sideOf(x, z) {
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  if (corner) return "corner";
  if (z === D - 1) return "south";
  if (z === 0) return "north";
  if (x === 0) return "west";
  if (x === W - 1) return "east";
  return "interior";
}

// Window rule: alternate bays along each facade
function isWindow(side, x, z) {
  const idx = (side === "south" || side === "north") ? x : z;
  return idx % 2 === 1;
}

// Returns [id, props] for the cell at height y, or null for air
function cellBlock(x, z, b, y) {
  const side = sideOf(x, z);
  const perim = side !== "interior";

  if (y < b) return ["stone_bricks"];                       // foundation fill
  const rel = y - b;

  if (y === ROOF) return perim ? ["white_concrete"] : ["light_gray_concrete"]; // cornice / roof deck
  if (y > ROOF) return null;

  if (rel === 0) return perim ? ["stone_bricks"] : ["smooth_stone"];  // base course / floor slab
  if (rel === 4) return ["smooth_stone"];                              // storey line + floor slab

  if (!perim) return null;                                            // no interiors: air gap
  if (side === "corner") return ["light_gray_concrete"];              // corner columns

  if (rel <= 3) {                                                     // ground storey / shopfront
    if (side === "south") {
      if (rel === 3) return ["red_concrete"];                         // shop fascia
      const idx = x;
      if (idx === 2) {                                                // entrance door
        return rel === 1 ? ["oak_door", doorProps("lower")] : ["oak_door", doorProps("upper")];
      }
      if (rel === 2) return ["lantern", { hanging: "true", waterlogged: "false" }];
      return ["glass"];
    }
    if (rel === 3) return ["light_gray_concrete"];                    // lintel band
    return isWindow(side, x, z) ? ["glass"] : ["white_concrete"];
  }

  // upper storey (rel 5..6)
  return isWindow(side, x, z) ? ["glass"] : ["white_concrete"];
}

// Build body
for (const [x, z, b] of cells) {
  for (let y = 0; y <= ROOF; y++) {
    const blk = cellBlock(x, z, b, y);
    if (blk) put(x, y, z, blk[0], blk[1]);
  }
}

// Warm lights behind some upper-storey windows (air gap sits between glass and light)
for (const [x, z, b] of cells) {
  const side = sideOf(x, z);
  if (side === "corner" || side === "interior") continue;
  const rel = 5;
  const y = b + rel;
  if (y >= ROOF) continue;
  if (!isWindow(side, x, z)) continue;
  if ((x + z) % 2 !== 0) continue;
  let dx = 0, dz = 0;
  if (side === "south") dz = -1;
  if (side === "north") dz = 1;
  if (side === "west") dx = 1;
  if (side === "east") dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  put(ix, y, iz, "glowstone");
}

// Rooftop water tank on the roof deck
if (has(2, 2)) put(2, ROOF + 1, 2, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
