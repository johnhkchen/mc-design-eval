// Oxfam, Mt Eden: a three-storey 1970s concrete-and-brick shop block on the lidar footprint. The lidar roof sits at 11 to 12
// across the body (0.8 m of noise), so it is one tier at 12 with a parapet; the 13 to 18 cells are edge noise, not massing.
// Level storey lines at 4 and 8 keep the bands level over the slope; every wall runs from its own ground up to the parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1098153394.cells.json`, "utf8"));

const TOP = 12;                 // parapet top; the roof deck is one block below
const DECK = TOP - 1;
const LINES = [4, 8];           // storey lines (absolute y)
const ENTRY = { x: 22, z: 1 };  // recessed door on the north front, where the ground is lowest

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFp = (x, z) => ground.has(`${x},${z}`);
const faceOf = (x, z) => (!inFp(x, z - 1) ? "n" : !inFp(x, z + 1) ? "s" : !inFp(x - 1, z) ? "w" : !inFp(x + 1, z) ? "e" : null);
const inward = (x, z, face) => [x + (face === "e" ? -1 : face === "w" ? 1 : 0), z + (face === "s" ? -1 : face === "n" ? 1 : 0)];

const B = {
  found: "stone_bricks", base: "stone_bricks", slab: "smooth_stone", deck: "gravel", wall: "light_gray_concrete",
  pier: "white_concrete", brick: "bricks", lintel: "smooth_stone", fascia: "red_concrete", cap: "smooth_stone",
};
const paneNS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // on north/south faces
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on east/west faces
const pane = (face) => ({ block: "glass_pane", state: face === "n" || face === "s" ? paneNS : paneEW });
const pierAt = (x, z, face) => (face === "n" || face === "s" ? x : z) % 4 === 0;   // every fourth cell along a face

// what a footprint cell holds at height y: foundation, base, the walls on its outward faces, or the floor slabs inside
function cellBlock(x, y, z, g, face) {
  if (y < g) return { block: B.found };
  if (!face) return y === g || LINES.includes(y) ? { block: B.slab } : y === DECK ? { block: B.deck } : null;
  if (y === g) return { block: B.base };
  if (y === TOP) return { block: B.cap };
  if (LINES.includes(y)) return { block: B.slab };
  if (face === "n" && x === ENTRY.x && z === ENTRY.z && (y === 1 || y === 2)) {
    return { block: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (y === 3) return { block: face === "n" ? B.fascia : B.lintel };         // ground-storey head
  if (y < 4) return pierAt(x, z, face) ? { block: B.brick } : pane(face);    // shopfront: glass between brick piers
  if (y === 7 || y === 11) return { block: pierAt(x, z, face) ? B.pier : B.wall };   // spandrels
  return pierAt(x, z, face) ? { block: B.pier } : pane(face);
}

const v = new Voxels([63, 31, 64]);
for (const [x, z, g] of cells) {
  const face = faceOf(x, z);
  for (let y = 0; y <= TOP; y++) {
    const b = cellBlock(x, y, z, g, face);
    if (b) v.set(x, y, z, b.block, b.state);
  }
}

// warm light behind some windows (glowstone upstairs, lanterns on the ground floor), a lantern inside the door
for (const [x, z, g] of cells) {
  const face = faceOf(x, z);
  if (!face || pierAt(x, z, face)) continue;
  const [ix, iz] = inward(x, z, face);
  if (!inFp(ix, iz) || faceOf(ix, iz)) continue;                  // the room behind must be interior
  const gIn = ground.get(`${ix},${iz}`);
  for (const y of [1, 5, 9]) {
    if (y <= g || gIn >= y || (x * 7 + z * 13 + y) % 9 !== 0) continue;
    if (y === 1) v.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else v.set(ix, y, iz, "glowstone");
  }
}
v.set(ENTRY.x, 1, ENTRY.z + 1, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant rooms: solid boxes on the deck, louvred at their head and capped
for (const [PX, PZ] of [[[28, 35], [22, 27]], [[14, 19], [40, 44]]]) {
  for (let x = PX[0]; x <= PX[1]; x++) for (let z = PZ[0]; z <= PZ[1]; z++) {
    for (let y = TOP; y <= TOP + 2; y++) {
      const edge = x === PX[0] || x === PX[1] || z === PZ[0] || z === PZ[1];
      const louvre = edge && y === TOP + 1 && (x + z) % 2 === 0;
      v.set(x, y, z, louvre ? "iron_bars" : B.wall);
    }
    v.set(x, TOP + 3, z, B.cap);
  }
}

const stats = v.save(`${DIR}/way_1098153394.nbt`);
console.log(JSON.stringify(stats));
