// An Interwar brick commercial block on the slope below Mt Eden: a 3-storey main block (lidar roof tier 11) and a
// 2-storey lower wing (tier 9). Shopfronts on the ground storey, brick piers between paired sash windows with white
// sills and lintels, stone plinth on a stone foundation to each cell's ground, parapet on the roof, a door on the low
// south face, and a plant room on the main roof. Interior is air between the floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269715910.cells.json`, "utf8"));

// Each footprint cell: g = its ground, T = its roof tier (the top layer is T-1). The lidar roofs are smoothed into two
// flat tiers: 11 where the lidar reads 10 or more, 9 elsewhere.
const plan = new Map();
for (const [x, z, g, r] of cells) plan.set(`${x},${z}`, { g, T: r >= 10 ? 11 : 9 });
const cellAt = (x, z) => plan.get(`${x},${z}`);

// Solid is anything under a cell's roof (foundation, slabs, walls); the air is the interior void between slabs.
const solid = (x, y, z) => { const c = cellAt(x, z); return !!c && y >= 0 && y < c.T; };
const SIDES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, y, z) => SIDES.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const FLOORS = [4, 8];                                          // floor slabs, absolute
const groundTop = (g) => (g < 4 ? 3 : 7);                       // the shopfront storey's fascia row
const pier = (along) => along % 3 === 0;                        // every third cell along a face is a brick pier

// The block at a footprint cell, or null for interior air. `win` marks a glass window cell (lit from behind).
function role(x, y, z) {
  const { g, T } = cellAt(x, z);
  if (y < g) return { block: "stone_bricks" };                  // foundation to the ground
  const ex = exposed(x, y, z), out = ex.length > 0;
  if (y === T - 1) return { block: out ? "stone_bricks" : "smooth_stone" };      // roof deck, parapet on the edge
  if (y === g) return { block: out ? "stone_bricks" : "smooth_stone" };         // ground slab, plinth on the edge
  if (FLOORS.includes(y)) return { block: out ? "white_concrete" : "smooth_stone" };  // floor slab, string course
  if (!out) return null;                                        // interior air between slabs
  const [dx, dz] = ex[0];
  const along = dz !== 0 ? x : z;
  const p = pier(along);
  if (y <= groundTop(g)) {                                      // shopfront storey
    if (y === groundTop(g)) return { block: "stone_bricks" };   // fascia
    return p ? { block: "dark_oak_planks" } : { block: "glass", win: true };
  }
  if (y === 7) return p ? { block: "bricks" } : { block: "white_concrete" };   // lintel course
  if (p) return { block: "bricks" };
  // a sash pair: glass pane with its connections set along the face
  const state = dz !== 0
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return { block: "glass_pane", state, win: true };
}

// The entrance: a window bay on the low south face, as near the middle of the front as possible.
const door = cells
  .filter(([x, z, g]) => g <= 1 && !pier(x) && exposed(x, g + 1, z).some(([dx, dz]) => dx === 0 && dz === 1))
  .sort((a, b) => a[2] - b[2] || Math.abs(a[0] - 20) - Math.abs(b[0] - 20))[0];
const [doorX, doorZ, doorG] = door;

// A plant room on the main roof: a 3 x 2 patch of tier-11 roof with a full ring of roof cells around it.
let plant = null;
{
  let best = Infinity;
  for (let x0 = 1; x0 < 37; x0++) for (let z0 = 1; z0 < 18; z0++) {
    let ok = true;
    for (let x = x0 - 1; x <= x0 + 3 && ok; x++) for (let z = z0 - 1; z <= z0 + 2 && ok; z++) {
      const c = cellAt(x, z); if (!c || c.T !== 11) ok = false;
    }
    if (!ok) continue;
    const d = Math.abs(x0 + 1 - 20) + Math.abs(z0 + 0.5 - 10);
    if (d < best) { best = d; plant = { x0, z0 }; }
  }
}

const V = new Voxels([40, 24, 20]);
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
for (const [key, { g, T }] of plan) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (x === doorX && z === doorZ && (y === g + 1 || y === g + 2)) {
      V.set(x, y, z, "dark_oak_door", { ...DOOR, half: y === g + 1 ? "lower" : "upper" });
      continue;
    }
    const r = role(x, y, z);
    if (r) { V.set(x, y, z, r.block, r.state); continue; }
    // interior air: a light on the floor slab, behind a window (one in five windows)
    const onSlab = y - 1 === g || FLOORS.includes(y - 1);
    if (!onSlab) continue;
    const behindWindow = SIDES.some(([dx, dz]) => role(x + dx, y, z + dz)?.win);
    const h = (x * 7 + y * 13 + z * 5) % 5;
    if (behindWindow && h < 1) {
      const kind = (x * 3 + z) % 3;
      if (kind === 0) V.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else if (kind === 1) V.set(x, y, z, "glowstone");
      else V.set(x, y, z, "shroomlight");
    }
  }
}

// the plant room: brick walls on the roof, a stone cap
if (plant) {
  const { x0, z0 } = plant;
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0; z <= z0 + 1; z++) {
    V.set(x, 11, z, "bricks");
    V.set(x, 12, z, "stone_bricks");
  }
}

const stats = V.save(`${DIR}/way_269715910.nbt`);
console.log(JSON.stringify({ door: { x: doorX, z: doorZ, g: doorG }, plant, ...stats }));
