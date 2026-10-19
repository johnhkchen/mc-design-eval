// 23 West 45 Street, 1929: a five-storey midtown commercial office block on a deep, narrow midblock lot. The 45th Street
// front is the high-z end; the shopfront and entrance sit there, with a service door on the rear. Buff brick over
// limestone-coloured storey bands, polished granite at the base, black glass in the shopfront. Lidar roof heights
// (zeros are dropouts, filled from their neighbours) read a 15-block rim on the west party wall, the rear and a small
// bump, over a 12-block body (the zero-roof cells are lidar dropouts, read as their neighbours): so the fifth storey is an L of the west strip and the rear, set back from the street
// front the way the 1916 zoning height rule pushed midtown towers back. The body's top is a terrace cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034246.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const inF = (x, z) => ground.has(key(x, z));

// The fifth storey: the west strip (x 0..1), the rear two rows, the small bump at x 7, all set back from the street front.
const T5 = (x, z) => inF(x, z) && z <= 21 && (x <= 1 || z <= 1 || x === 7);
const top = (x, z) => (T5(x, z) ? 15 : 12);                 // roof height above y 0 (lidar-driven tiers)
const solid = (x, y, z) => inF(x, z) && y >= (ground.get(key(x, z)) ?? 0) && y < top(x, z);

// Storey grid: ground 0..2 (shopfront), then floors every 3 blocks from y 3: a band row, then two window rows.
const storey = (y) => (y < 3 ? 0 : 1 + Math.floor((y - 3) / 3));
const row = (y) => (y < 3 ? y : (y - 3) % 3);

const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // on a north/south face
const PANE_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };  // on an east/west face
const door = (half, facing) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const BAND = "smooth_quartz", PIER = "bricks", QUOIN = "smooth_quartz", BASE = "polished_granite";

// A street or rear face: piers and windows on the bay grid (windows at x 1-2 and 4-5; piers at 0, 3, 6, the bump at 7).
function bayFace(x, y, face) {
  const s = storey(y), r = row(y);
  if (s === 0) {
    if (y === 0) return x === 3 ? ["dark_oak_door", door("lower", face === "front" ? "south" : "north")] : [BASE];
    if (x === 3) return y === 1 ? ["dark_oak_door", door("upper", face === "front" ? "south" : "north")] : [BAND];
    if (x === 0 || x === 6) return [BASE];
    return face === "front" ? ["black_stained_glass", null, "win"] : ["glass_pane", PANE_EW, "win"];
  }
  if (r === 0) return [BAND];
  if ([1, 2, 4, 5].includes(x)) return ["glass_pane", PANE_EW, "win"];
  return [x === 0 || x === 6 ? QUOIN : PIER];
}

// A party-wall side: blank brick with a storey band; a window every second bay on the sides of the tower and the rear strip.
function sideFace(z, y) {
  const s = storey(y), r = row(y);
  if (s === 0) return y === 0 ? [BASE] : [PIER];
  if (r === 0) return [BAND];
  if (z % 4 === 1 || z % 4 === 2) return ["glass_pane", PANE_NS, "win"];
  return [PIER];
}

const body = new Map(), gaps = new Map();
const put = (x, y, z, block, state) => body.set(`${x},${y},${z}`, { block, state });

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const g = ground.get(k) ?? 0;
  for (let y = g; y < top(x, z); y++) {
    const ex = {
      px: !solid(x + 1, y, z), mx: !solid(x - 1, y, z),
      pz: !solid(x, y, z + 1), mz: !solid(x, y, z - 1), up: !solid(x, y + 1, z),
    };
    let d;
    if (ex.pz) d = { ...pick(bayFace(x, y, "front")), gap: [x, y, z - 1] };
    else if (ex.mz) d = { ...pick(bayFace(x, y, "rear")), gap: [x, y, z + 1] };
    else if (ex.px) d = { ...pick(sideFace(z, y)), gap: [x - 1, y, z] };
    else if (ex.mx) d = { ...pick(sideFace(z, y)), gap: [x + 1, y, z] };
    else if (ex.up && y === top(x, z) - 1) d = { block: "gray_concrete" };
    else d = { block: PIER };
    put(x, y, z, d.block, d.state);
    // A gap under open sky would notch the roof, so only where the block above it is solid.
    const [gx, gy, gz] = d.gap ?? [];
    if (d.win && solid(gx, gy + 1, gz)) gaps.set(`${gx},${gy},${gz}`, true);
  }
}
function pick([block, state, win]) { return { block, state, win: win === "win" }; }

// Behind the glass an air gap one block deep, with the storey bands as floor slabs above and below.
for (const k of gaps.keys()) body.delete(k);

// Parapet on the fifth storey, a cornice where the body's roof steps down to the terrace.
const out = new Voxels([8, 27, 25]);
for (const [k, v] of body) {
  const [x, y, z] = k.split(",").map(Number);
  out.set(x, y, z, v.block, v.state);
}
for (let z = 0; z <= 24; z++) for (let x = 0; x < 8; x++) {
  if (!inF(x, z)) continue;
  if (T5(x, z)) out.set(x, 15, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  else if (top(x, z) === 12 && N4.some(([dx, dz]) => !inF(x + dx, z + dz) || T5(x + dx, z + dz)))
    out.set(x, 12, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Warm light behind some of the glass, and a pair of lanterns on the terrace.
for (const k of gaps.keys()) {
  const [x, y, z] = k.split(",").map(Number);
  if ((x * 3 + y * 5 + z) % 7 === 0) out.set(x, y, z, "glowstone");
}
out.set(2, 12, 23, "lantern", { hanging: "false", waterlogged: "false" });
out.set(5, 12, 23, "lantern", { hanging: "false", waterlogged: "false" });

out.save(`${dir}/NYC1034246.nbt`);
console.log(`NYC1034246: ${out.count()} blocks, palette ${out.palette.length}`);
