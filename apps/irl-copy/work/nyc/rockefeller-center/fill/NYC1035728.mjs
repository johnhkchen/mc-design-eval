// 515 Madison Avenue (1931): a setback Art Deco office tower. The lidar roof is median-smoothed over 5x5 (building
// cells only) and snapped to whole storeys of 3 blocks, H = 3n + 1, so the roof course sits on the last storey and
// each tier steps back cleanly. Pale piers run up the facade between dark spandrels and blue glass; the base is
// granite, with shopfronts and a door under a lintel on the 26th-row street face. The tower crowns in three
// stepped setbacks with a lantern finial. Hollow: a one-cell shell, a floor slab per storey, air behind the glass,
// and glowstone behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1035728.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [41, 163, 27];
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];
const OPEN_ROOF = 5;   // a lidar roof this low is ground-level open court, not a building

const k2 = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));

// Per footprint cell: ground, height H (top of the cap course, exclusive), and whether it is an open court.
const S = new Map();
for (const [key, { g, r }] of raw) {
  if (r <= OPEN_ROOF) { S.set(key, { g, H: g, open: true }); continue; }
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = raw.get(k2(x + dx, z + dz));
    if (c && c.r > OPEN_ROOF) vals.push(c.r);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let n = Math.max(1, Math.round((med - 1) / 3));
  while (3 * n + 1 < g + 4) n++;   // at least one storey above the ground
  S.set(key, { g, H: 3 * n + 1, open: false });
}

const cell = (x, z) => S.get(k2(x, z));
const solid = (x, z, y) => { const c = cell(x, z); return !!c && y < c.H; };
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !solid(x + dx, z + dz, y));
const shell = (x, z, y) => solid(x, z, y) && exposed(x, z, y).length > 0;

const vox = new Voxels(SIZE);
const put = (x, y, z, block, state) => { if (y >= 0 && y < SIZE[1]) vox.set(x, y, z, block, state); };
const DOOR = 30, GLOW_ODDS = 7;
const glass = (u, k) => ((u + k) % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

let maxH = 0;
for (const { H } of S.values()) maxH = Math.max(maxH, H);

for (const [key, { g: gr, H, open }] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < H; y++) {
    // Foundation: solid up to the cell's ground, paved where it is an open court.
    if (y < gr) {
      put(x, y, z, open && y === gr - 1 ? "smooth_stone" : shell(x, z, y) ? "polished_granite" : "stone");
      continue;
    }
    // Roof course, the cap on top of the last storey.
    if (y === H - 1) { put(x, y, z, shell(x, z, y) ? "smooth_quartz" : "smooth_stone"); continue; }

    const k = Math.floor(y / 3), r = y % 3;
    if (!shell(x, z, y)) {   // interior: a floor slab per storey, air between
      if (r === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    const ex = exposed(x, z, y);
    const [dx, dz] = ex[0];
    const corner = ex.length > 1;
    const u = dz ? x : z;   // position along the face
    const pier = corner || u % 3 === 0;
    const base = k === 0;

    // Entrance on the street face (z 26): door under a lintel, shopfront glass either side.
    if (base && dz === 1 && Math.abs(x - DOOR) <= 1) {
      if (x === DOOR && y === gr) { put(x, y, z, "iron_door", door("lower")); continue; }
      if (x === DOOR && y === gr + 1) { put(x, y, z, "iron_door", door("upper")); continue; }
      if (x === DOOR && y === gr + 2) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      if (r === 0) { put(x, y, z, "polished_granite"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    if (k === 1 && r === 0 && dz === 1 && Math.abs(x - DOOR) <= 2) { put(x, y, z, "polished_granite"); continue; }   // canopy lintel

    if (r === 0) { put(x, y, z, base ? "polished_granite" : pier ? "smooth_quartz" : "deepslate_tiles"); continue; }

    if (pier) { put(x, y, z, base ? "polished_granite" : "smooth_quartz"); continue; }
    put(x, y, z, base ? "light_blue_stained_glass" : glass(u, k));

    // Warm light behind some panes: the interior air cell inward of the glass.
    const [ix, iz] = [x - dx, z - dz];
    if (solid(ix, iz, y) && !shell(ix, iz, y) && (x * 5 + z * 3 + y) % GLOW_ODDS === 0) put(ix, y, iz, "glowstone");
  }
}

// Stepped crown on the tallest tier: three setbacks on the tower's centre, each standing on the one below.
const tall = [...S].filter(([, c]) => c.H === maxH).map(([k]) => k.split(",").map(Number));
const cx = Math.round(tall.reduce((a, [x]) => a + x, 0) / tall.length);
const cz = Math.round(tall.reduce((a, [, z]) => a + z, 0) / tall.length);
const crown = [[3, 1, 3], [2, 1, 3], [1, 1, 3]];   // half-width, half-depth, height
let y0 = maxH;
for (const [w, d, h] of crown) {
  for (let x = cx - w; x <= cx + w; x++) for (let z = cz - d; z <= cz + d; z++) {
    const c = cell(x, z);
    if (!c || c.H !== maxH) continue;   // only on the tier's own cap
    for (let y = y0; y < y0 + h; y++) {
      const top = y === y0 + h - 1;
      const edge = Math.abs(x - cx) === w || Math.abs(z - cz) === d;
      put(x, y, z, top ? "deepslate_tiles" : edge && y > y0 ? "light_blue_stained_glass" : "smooth_quartz");
    }
  }
  y0 += h;
}
for (const [x, z] of [[cx - 3, cz - 1], [cx + 3, cz - 1], [cx - 3, cz + 1], [cx + 3, cz + 1]]) {
  if (cell(x, z)?.H === maxH) put(x, maxH + 2, z, "shroomlight");
}
put(cx, y0, cz, "lantern", { hanging: "false", waterlogged: "false" });

// Roof plant: 2-high mechanical boxes on flat interior roofs, standing on the cap.
let plant = 0;
for (const [key, { g: gr, H, open }] of S) {
  if (open || H < 40 || H === maxH) continue;
  const [x, z] = key.split(",").map(Number);
  const flat = DIRS.every(([dx, dz]) => cell(x + dx, z + dz)?.H >= H);
  if (!flat || (x * 7 + z * 11) % 13 !== 0) continue;
  put(x, H, z, "light_gray_concrete");
  put(x, H + 1, z, "iron_bars");
  plant++;
}

const stats = vox.save(`${FILL}/NYC1035728.nbt`);
const tops = {};
for (const { H, open } of S.values()) if (!open) tops[H] = (tops[H] || 0) + 1;
console.log(JSON.stringify({ ...stats, cells: S.size, maxH, tierTops: tops, roofPlant: plant }));
