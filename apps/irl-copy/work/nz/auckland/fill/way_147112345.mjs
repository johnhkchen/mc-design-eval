// Centur on Anzac: a late-20th-century commercial tower on a five-storey basalt podium. The footprint is the OSM
// outline (658 of 33 x 32 cells); the lidar roof reads 66-69 over it, so the massing is a flat roof at 68 with the
// setbacks cut as insets of the outline (depth from the edge: podium all of it, tower from 3 in, upper from 6 in,
// plant room on the core from 9 in). Storey lines every 4 blocks; glazing in cyan, frames in white concrete, a
// shopfront and an iron entrance door at the low corner of the podium.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112345.cells.json", "utf8"));   // [x, z, ground, roof]

const M = {
  stone: "stone_bricks",           // foundation fill
  shop:"gray_stained_glass",      // ground-floor shopfront
  glass: "cyan_stained_glass",     // curtain wall
  frame: "white_concrete",         // mullions, cornice, parapets
  band: "light_gray_concrete",     // storey lines and floor slabs
  roof: "smooth_stone",
  terrace: "moss_block",           // setback terraces
  light: "glowstone",              // lit rooms, behind the glass
  door: "iron_door",
  canopy: "smooth_stone_slab",
};

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACE = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;

const foot = new Map();                                    // "x,z" -> { x, z, g, r }
for (const [x, z, g0, r0] of cells) foot.set(key(x, z), { x, z, g: g0, r: r0 });
const inFoot = (x, z) => foot.has(key(x, z));

// depth: 1 on the outline, one more per step inward
const depth = new Map();
let front = [];
for (const c of foot.values()) if (N4.some(([dx, dz]) => !inFoot(c.x + dx, c.z + dz))) { depth.set(key(c.x, c.z), 1); front.push(c); }
for (let d = 1; front.length; d++) {
  const nextFront = [];
  for (const c of front) for (const [dx, dz] of N4) {
    const k = key(c.x + dx, c.z + dz);
    if (foot.has(k) && !depth.has(k)) { depth.set(k, d + 1); nextFront.push(foot.get(k)); }
  }
  front = nextFront;
}

// tiers: each a set of cells standing from base (its floor, the tier below's roof) up to top
const TIERS = [
  { base: 0, top: 20, minDepth: 1 },    // podium, five storeys
  { base: 20, top: 44, minDepth: 3 },   // tower
  { base: 44, top: 68, minDepth: 6 },   // upper tower, roof at the lidar's median
  { base: 68, top: 72, minDepth: 9 },   // plant room on the core
];
for (const t of TIERS) {
  t.cells = [...foot.values()].filter((c) => depth.get(key(c.x, c.z)) >= t.minDepth);
  t.set = new Set(t.cells.map((c) => key(c.x, c.z)));
}
const edgeOuts = (t, c) => N4.filter(([dx, dz]) => !t.set.has(key(c.x + dx, c.z + dz)));

const g = new Voxels([33, 82, 32]);

// foundation: solid from y 0 up to each cell's ground, so the walls stand on the slope
for (const c of foot.values()) for (let y = 0; y <= c.g; y++) g.set(c.x, y, c.z, M.stone);

TIERS.forEach((t, i) => {
  const above = TIERS[i + 1];
  for (const c of t.cells) {
    const edge = edgeOuts(t, c).length > 0;
    const covered = above ? above.set.has(key(c.x, c.z)) : false;
    // the podium's ground storey: from the first row above the ground to the storey's last glass row
    let gs = c.g + 1; if (gs % 4 === 0) gs++;
    const ge = 4 * Math.floor(gs / 4) + 3;

    for (let y = t.base + 1; y <= t.top; y++) {
      if (y <= c.g) continue;                                 // terrain
      if (y % 4 === 0 || y === t.top) {
        // floor slabs; the top row is a roof (terrace or roof surface) where nothing stands above
        if (y === t.top && !covered) g.set(c.x, y, c.z, i <= 1 ? M.terrace : M.roof);
        else g.set(c.x, y, c.z, M.band);
        continue;
      }
      if (!edge) continue;                                    // air gap behind the glass
      if (i === 0 && y >= gs && y <= ge) { g.set(c.x, y, c.z, (c.x + c.z) % 3 === 0 ? M.frame : M.shop); continue; }
      if (i === 2 && y === t.top - 1) { g.set(c.x, y, c.z, M.frame); continue; }   // cornice
      if (i === 3) { g.set(c.x, y, c.z, M.band); continue; }                       // plant room: solid louvred walls
      g.set(c.x, y, c.z, (c.x + c.z) % 3 === 0 ? M.frame : M.glass);
    }

    // parapet on the outer edge where nothing stands above
    if (edge && !covered) g.set(c.x, t.top + 1, c.z, M.frame);
  }

  // lit rooms: a glowstone on the floor slab, one cell inside the glass
  if (i < 3) for (const c of t.cells) {
    if (edgeOuts(t, c).length === 0) continue;
    for (let y = t.base + 1; y < t.top; y += 4) {
      const row = y + 1;
      if (row > c.g && row < t.top && (c.x + c.z) % 3 !== 0 && (c.x * 7 + c.z * 3 + row) % 3 === 0) {
        if (i === 0) {
          let gsL = c.g + 1; if (gsL % 4 === 0) gsL++;
          if (row >= gsL && row <= 4 * Math.floor(gsL / 4) + 3) continue;   // not behind the shopfront
        }
        const inner = N4.map(([dx, dz]) => [c.x + dx, c.z + dz]).find(([x, z]) => t.set.has(key(x, z)) && edgeOuts(t, { x, z }).length === 0);
        if (inner) g.set(inner[0], row, inner[1], M.light);
      }
    }
  }
});

// entrance: the lowest corner-free podium face, a door with a canopy over the three-cell bay
const P = TIERS[0];
const candidates = P.cells
  .filter((c) => edgeOuts(P, c).length === 1 && c.g >= 0)
  .filter((c) => { let gs = c.g + 1; if (gs % 4 === 0) gs++; return gs % 4 !== 3; })
  .sort((a, b) => a.g - b.g || b.z - a.z || a.x - b.x);
const door = candidates[0];
const [ox, oz] = edgeOuts(P, door)[0];
let gs = door.g + 1; if (gs % 4 === 0) gs++;
const ge = 4 * Math.floor(gs / 4) + 3;
const doorState = { facing: FACE[`${-ox},${-oz}`], hinge: "left", open: "false", powered: "false" };
g.set(door.x, gs, door.z, M.door, { ...doorState, half: "lower" });
g.set(door.x, gs + 1, door.z, M.door, { ...doorState, half: "upper" });
if (gs + 2 <= ge) {
  const [ax, az] = [Math.abs(oz), Math.abs(ox)];
  for (const s of [-1, 0, 1]) g.set(door.x + ax * s, gs + 2, door.z + az * s, M.canopy, { type: "top", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112345.nbt";
const r = g.save(out);
console.log(`way_147112345: ${r.blocks} blocks, ${r.palette} palette entries, tiers ${TIERS.map((t) => t.cells.length).join("/")} cells`);
