// Mt Eden-side commercial block, 1930s: a three-storey cream-render Deco block on a brick plinth, with a
// two-storey lower wing, a rooftop plant room on the lidar 19 m patch, shopfronts and a timber bulkhead on the
// ground floor, and a stepped cornice. Built only on the footprint: the plinth fills every cell from y 0 up to the
// common floor datum (above the highest ground), each storey stands on the floor slab below, and the roof
// stands on the walls. Interiors are hollow behind the glazing, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_269465565.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${HERE}/way_269465565.nbt`;

const F = 4;                                  // common floor datum: the plinth fills 0..3 under every cell
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

const C = new Map();
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { x, z, g, r });
const col = (x, z) => C.get(`${x},${z}`);

// Storeys from the lidar roof height, smoothed into flat tiers: 3 storeys (deck 16, lidar 17) on the body,
// 2 on the lower wings (deck 12), none on the low fragments (plinth cap at 4). The 19 m patch is a plant room.
for (const c of C.values()) {
  c.N = c.r >= 14 ? 3 : c.r >= 10 ? 2 : c.r >= 6 ? 1 : 0;
  c.T = F + 4 * c.N;                          // roof deck row
  c.plant = c.r >= 19;
}

// Envelope: the solid volume the building takes up (plinth, storeys, deck, plant rows). Its interior is air.
const env = (x, z, y) => {
  const c = col(x, z); if (!c) return false;
  if (y < F || y <= c.T) return true;
  return c.plant && (y === 17 || y === 18);
};
const outward = (x, z, y) => DIRS.filter(([dx, dz]) => !env(x + dx, z + dz, y));

const over = new Map();                       // "x,y,z" -> [block, state]
const at = (x, y, z, block, state) => over.set(`${x},${y},${z}`, [block, state]);

// Door: on the north (min z) ground-floor wall, nearest the middle of its run
const northRun = [...C.values()].filter(c => { const o = outward(c.x, c.z, F + 1); return o.length === 1 && o[0][2] === "north"; });
const midX = northRun.reduce((s, c) => s + c.x, 0) / northRun.length;
const door = northRun.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best));
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
at(door.x, F + 1, door.z, "oak_door", doorState("lower"));
at(door.x, F + 2, door.z, "oak_door", doorState("upper"));
// canopy: a hood of stairs over the door, outward facing, on the spandrel row above it
for (const dx of [-1, 0, 1]) {
  const c = col(door.x + dx, door.z);
  if (!c || c.N < 1) continue;
  const o = outward(c.x, c.z, F + 3);
  if (o.length === 1 && o[0][2] === "north") at(c.x, F + 3, c.z, "smooth_quartz_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
}

// Warm lights behind some windows: lanterns on the ground floor, glowstone above, on the first glazed row
// (the interior cell behind the glass must be air, so it is not on the wall ring).
for (const c of C.values()) {
  for (let y = F + 1; y < c.T; y += 4) {
    if (((c.x * 7 + c.z * 5 + y) % 7) !== 0) continue;
    const o = outward(c.x, c.z, y);
    if (o.length !== 1) continue;
    const [dx, dz] = o[0];
    const ix = c.x - dx, iz = c.z - dz;
    if (!col(ix, iz) || env(ix, iz, y) === false || outward(ix, iz, y).length) continue;
    const ground = y === F + 1;
    at(ix, y, iz, ground ? "lantern" : "glowstone", ground ? { hanging: "false", waterlogged: "false" } : undefined);
  }
}

const glassState = (dx) => ({
  north: dx !== 0 ? "true" : "false", south: dx !== 0 ? "true" : "false",
  east: dx === 0 ? "true" : "false", west: dx === 0 ? "true" : "false", waterlogged: "false",
});

// The block for one footprint column at height y, or null for air (interior, or above the building)
function blockAt(c, y) {
  const { x, z, T } = c;
  const out = outward(x, z, y);
  if (y < F) return out.length ? [y === F - 1 ? "stone_bricks" : "bricks"] : ["stone"];      // plinth: brick outside, stone core
  if (y === T) return out.length ? ["smooth_quartz"] : ["smooth_stone"];                       // roof deck, solid cream cornice on the edge

  if (y > T) {                                                                                // rooftop plant room on the 19 m patch
    if (!c.plant) return null;
    if (y === 18) return ["smooth_stone"];
    if (!out.length) return null;
    const b = out[0][2] === "north" || out[0][2] === "south" ? x : z;
    return b % 3 === 1 ? ["iron_bars", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" }] : ["stone_bricks"];
  }
  if ((y - F) % 4 === 0) {                                                                    // storey line: the floor slab of each storey
    if (!out.length) return ["smooth_stone"];
    return y === F ? ["dark_oak_planks"] : ["smooth_quartz"];                                  // ground-floor timber bulkhead
  }
  if (!out.length) return null;                                                               // hollow interior behind the glass
  if (out.length >= 2) return ["quartz_pillar", { axis: "y" }];                               // corner pier
  const [dx, dz] = out[0];
  const b = dz !== 0 ? x : z;                                                                 // bay coordinate along that face
  if ((y - F) % 4 === 3) return ["quartz_block"];                                             // spandrel band under the storey line
  if (b % 3 === 0) return ["quartz_pillar", { axis: "y" }];                                   // pier between the bays
  return ["glass_pane", glassState(dx)];
}

const g = new Voxels([46, 32, 45]);
let placed = 0;
for (const c of C.values()) {
  for (let y = 0; y <= 18; y++) {
    const o = over.get(`${c.x},${y},${c.z}`);
    const b = o ?? blockAt(c, y);
    if (!b) continue;
    g.set(c.x, y, c.z, b[0], b[1]);
    placed++;
  }
}
const res = g.save(OUT);
console.log(`way_269465565: ${C.size} cells, ${placed} placed, ${res.blocks} blocks, ${res.palette} palette entries -> ${OUT}`);
