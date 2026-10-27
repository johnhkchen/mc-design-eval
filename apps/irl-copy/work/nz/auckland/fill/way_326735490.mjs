// Way 326735490, Mt Eden / Newton edge: a 1930s Moderne commercial block (rendered concrete, dark marble shopfronts,
// a lift overrun on a flat roof), read from the lidar roof tiers: one-storey wing, two-storey shoulder, 3.5-storey block.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326735490.cells.json`, "utf8"));
const X = 40, Z = 30, H = 28;

// Per footprint cell: G = lowest-ground-relative ground, T = smoothed roof top (flat tiers, never below ground).
const key = (x, z) => `${x},${z}`;
const G = {}, T = {};
for (const [x, z, g, r] of cells) {
  G[key(x, z)] = g;
  const tier = r <= 1 ? g : r <= 4 ? 4 : r <= 12 ? 8 : 14;   // noise bands -> one-storey wing / two-storey shoulder / main block
  T[key(x, z)] = Math.max(tier, g);
}
const inFp = (x, z) => G[key(x, z)] !== undefined;
const built = (x, z) => inFp(x, z) && T[key(x, z)] > G[key(x, z)];

// Outward faces where a built cell has a wall: the edge of the footprint, or a neighbour whose top is lower.
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const faceList = (x, z) => Object.keys(DIRS).filter((f) => {
  const [dx, dz] = DIRS[f];
  return !inFp(x + dx, z + dz) || T[key(x + dx, z + dz)] < T[key(x, z)];
});

// The model: sparse map of "x,y,z" -> { block, state }; written to the Voxels volume at the end.
const vox = new Map();
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { x, y, z, block, state });
const has = (x, y, z) => vox.has(`${x},${y},${z}`);

const pane = (f) => (f === "E" || f === "W" ? { north: "true", south: "true" } : { east: "true", west: "true" });

for (const k of Object.keys(G)) {
  const [x, z] = k.split(",").map(Number);
  const g = G[k], t = T[k];
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");        // foundation: solid from 0 up to this cell's ground
  if (t <= g) continue;
  const faces = faceList(x, z), perim = faces.length > 0, corner = faces.length > 1, f = faces[0];
  const along = f === "E" || f === "W" ? z : x;
  const pier = along % 3 === 0 || corner;                             // a pier every third cell along each face

  for (let y = g; y < t; y++) {
    if (!perim) {                                                      // interior: floors and roof only, air between
      if (y === t - 1) put(x, y, z, "light_gray_concrete");
      else if (y === g || (y % 4 === 0 && y < t - 1)) put(x, y, z, "smooth_stone");
      continue;
    }
    if (y === t - 1) put(x, y, z, "smooth_stone");                     // cornice / parapet cap
    else if (y === g) put(x, y, z, "polished_andesite");               // base course
    else if (y <= g + 3) {                                             // ground storey: shopfront
      if (y === g + 3) put(x, y, z, corner ? "smooth_quartz" : "smooth_stone");   // fascia
      else if (corner || pier) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass");
    } else {                                                           // upper storeys on 4-block lines
      const m = y % 4;
      if (m === 0) put(x, y, z, "smooth_stone");                       // storey line
      else if (m === 3) put(x, y, z, "white_concrete");                // lintel band
      else if (corner) put(x, y, z, "quartz_pillar", { axis: "y" });
      else if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", pane(f));
    }
  }
}

// Entrance: the southern edge, nearest the middle; a dark door in the shopfront with a canopy lip over it.
const doorCands = Object.keys(G).map((k) => k.split(",").map(Number))
  .filter(([x, z]) => built(x, z) && faceList(x, z).length === 1 && faceList(x, z)[0] === "S");
doorCands.sort((a, b) => Math.abs(a[0] - 19) - Math.abs(b[0] - 19));
const [dx0, dz0] = doorCands[0];
const dg = G[key(dx0, dz0)];
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(dx0, dg + 1, dz0, "dark_oak_door", doorState("lower"));
put(dx0, dg + 2, dz0, "dark_oak_door", doorState("upper"));
for (const u of [-1, 0, 1]) put(dx0 + u, dg + 3, dz0, "dark_oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });

// Roof: a lift overrun (two blocks over a 3x3 core near the middle of the 3.5-storey block), and small plant boxes on the shoulder.
const tall = Object.keys(G).map((k) => k.split(",").map(Number)).filter(([x, z]) => T[key(x, z)] === 14 && !faceList(x, z).length);
const cx = Math.round(tall.reduce((s, [x]) => s + x, 0) / tall.length), cz = Math.round(tall.reduce((s, [, z]) => s + z, 0) / tall.length);
for (const [x, z] of tall) if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
  put(x, 14, z, "stone_bricks"); put(x, 15, z, "stone_bricks"); put(x, 16, z, "smooth_stone");
}
for (const k of Object.keys(G)) {
  const [x, z] = k.split(",").map(Number);
  if (built(x, z) && T[k] === 8 && faceList(x, z).length === 0 && (x + z) % 6 === 0) put(x, 8, z, "iron_block");
}

// Warm light behind the glass: lanterns on the ground storey floor, glowstone and shroomlight on the upper floors.
for (const [k, v] of [...vox.entries()]) {
  if (!["glass_pane", "glass"].includes(v.block)) continue;
  const [x, z] = k.split(",").map(Number);
  const faces = faceList(x, z); if (!faces.length) continue;
  const [odx, odz] = DIRS[faces[0]];
  const xi = x - odx, zi = z - odz;
  if (!built(xi, zi) || faceList(xi, zi).length) continue;              // inward cell must be interior air
  const y = v.y;
  if (has(xi, y, zi) || !has(xi, y - 1, zi)) continue;                  // needs air to put it in, and a floor under it
  if (y <= G[key(x, z)] + 2 && (x + z) % 2 === 0) put(xi, y, zi, "lantern", { hanging: "false", waterlogged: "false" });
  else if (y % 4 === 1 && (x + 2 * z) % 3 === 0) put(xi, y, zi, y % 8 === 1 ? "glowstone" : "shroomlight");
}

// Write the volume.
const g = new Voxels([X, H, Z]);
let high = 0, floating = [];
for (const { x, y, z, block, state } of vox.values()) {
  if (y >= H) { high++; continue; }
  g.set(x, y, z, block, state);
}
// Support check: a block above y 0 with air under it must be a floor slab or a light standing on one.
for (const { x, y, z, block } of vox.values()) {
  if (y === 0 || has(x, y - 1, z)) continue;
  if (block !== "smooth_stone" && block !== "lantern" && block !== "glowstone" && block !== "shroomlight") floating.push(`${x},${y},${z} ${block}`);
}
const out = g.save(`${DIR}/way_326735490.nbt`);
console.log(`cells ${cells.length}, placed ${out.blocks} blocks, palette ${out.palette}, above H ${high}, unsupported non-floor ${floating.length}`);
if (floating.length) console.log(floating.slice(0, 20).join("\n"));
