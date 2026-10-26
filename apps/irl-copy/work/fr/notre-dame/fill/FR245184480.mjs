// FR245184480: a residential block of 1750 (six storeys, stone walls, a flat slate roof behind a parapet), built on the
// lidar footprint. Storeys are 4 blocks (a stone string course, two window rows, a stone lintel), so the storey lines fall
// on y = 1 mod 4 and every tier top is a lintel. The lidar's roof tops are snapped to those tiers (cells whose ground sits
// higher than their tier get the next tier up), so the walls read as flat courses, not noise. Walls are a 1-block shell
// with air behind the glass and a slab per floor; the low east wing (tiers 5-13) steps down from the main block.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const OUT = `${DIR}/FR245184480.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/FR245184480.cells.json`, "utf8"));

const W = 25, H = 41, D = 44;
const LINES = [5, 9, 13, 17, 21, 25];              // storey lines: ground storey 5 tall, then 4 each; top tier 25
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const DIR_NAME = { N: "north", S: "south", W: "west", E: "east" };
const SHORT = { N: "north", S: "south", W: "west", E: "east" };

const src = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const has = (x, z) => src.has(`${x},${z}`);
const keyOf = (k) => k.split(",").map(Number);

// Snap each cell's lidar roof to the nearest storey line (ties go up), never below its ground plus one storey.
const tierOf = (r, g) => {
  let best = LINES[0];
  for (const L of LINES) if (Math.abs(L - r) <= Math.abs(best - r)) best = L;
  return LINES.find((L) => L >= Math.max(best, g + 4)) ?? LINES[LINES.length - 1];
};
const top = new Map([...src].map(([k, { g, r }]) => [k, tierOf(r, g)]));

// The faces each cell stands on the outside of (a neighbour not in the footprint).
const outward = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Two entrances, on the two faces with the most outside walls, at the middle of each face's ground-level run.
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const k of src.keys()) for (const d of outward(...keyOf(k))) faceCount[d]++;
const doors = [];
for (const d of Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a]).slice(0, 2)) {
  const [dx, dz] = DIRS[d];
  const cands = [];
  for (const [k, { g }] of src) {
    const [x, z] = keyOf(k);
    const out = outward(x, z);
    if (out.length !== 1 || out[0] !== d) continue;           // straight run, not a corner
    const ix = x - dx, iz = z - dz;                            // the cell just inside the porch
    if (!has(ix, iz) || src.get(`${ix},${iz}`).g !== g) continue;
    cands.push({ x, z, ix, iz, g, d, t: d === "N" || d === "S" ? x : z });
  }
  cands.sort((a, b) => a.t - b.t);
  if (cands.length) doors.push(cands[Math.floor(cands.length / 2)]);
}
const porchAt = new Map(doors.map((p) => [`${p.x},${p.z}`, p]));
const doorIn = new Map(doors.map((p) => [`${p.ix},${p.iz}`, p]));

const V = new Voxels([W, H, D]);
const GLASS = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [k, { g }] of src) {
  const [x, z] = keyOf(k);
  const T = top.get(k);
  const out = outward(x, z);
  const perim = out.length > 0;
  const porch = porchAt.get(k);
  const door = doorIn.get(k);
  const floors = [g, ...LINES.filter((L) => L > g && L < T)];
  const nextOf = (f) => { const i = floors.indexOf(f); return i + 1 < floors.length ? floors[i + 1] : T; };
  const floorOf = (y) => floors.filter((f) => f <= y).pop();

  // foundation below the cell's ground, then a slab at every storey line (the ground floor's is the cell's own floor)
  for (let y = 0; y < g; y++) V.set(x, y, z, "stone_bricks");
  for (const f of floors) V.set(x, f, z, "smooth_stone");

  if (door) {
    const st = { facing: DIR_NAME[door.d], hinge: "left", open: "false", powered: "false" };
    V.set(x, g, z, "dark_oak_door", { ...st, half: "lower" });
    V.set(x, g + 1, z, "dark_oak_door", { ...st, half: "upper" });
  }

  if (perim) {
    const d = out[0];
    const tangential = d === "N" || d === "S" ? x : z;
    const windowed = out.length === 1 && !porch && tangential % 3 === 1;
    for (let y = g + 1; y < T; y++) {
      if (floors.includes(y)) continue;
      const f = floorOf(y), nf = nextOf(f);
      if (y === nf - 1) { V.set(x, y, z, "stone_bricks"); continue; }        // lintel, or cornice on the top tier
      if (porch && (y === g + 1 || y === g + 2)) continue;                  // open porch: air under its canopy
      if (porch && y === g + 3) { V.set(x, y, z, "dark_oak_planks"); continue; } // canopy
      if (windowed && y <= nf - 2) { V.set(x, y, z, "glass_pane", GLASS(d)); continue; }
      V.set(x, y, z, "calcite");
    }
    V.set(x, g, z, "stone_bricks");                                         // base course (replaces the floor slab)
    V.set(x, T, z, "stone_brick_wall");                                     // parapet
    if (porch) V.set(x, g + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
    if (windowed && (x + z) % 4 === 0) {                                    // warm light behind some panes, one per storey
      const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
      for (const f of floors) {
        if (f + 1 > nextOf(f) - 2 || !has(ix, iz) || doorIn.has(`${ix},${iz}`)) continue;
        V.set(ix, f + 1, iz, "glowstone");
      }
    }
  } else {
    V.set(x, T - 1, z, "deepslate_tiles");                                  // roof covering over the interior
    if (T === 25 && x % 7 === 3 && z % 9 === 5) {                          // a chimney stack on the roof
      V.set(x, T, z, "bricks"); V.set(x, T + 1, z, "bricks");
    }
  }
}

const stats = V.save(OUT);
console.log(`FR245184480: ${stats.blocks} blocks, palette ${stats.palette}, doors ${doors.map((p) => `${p.d}@${p.x},${p.z}`).join(" ")}`);
