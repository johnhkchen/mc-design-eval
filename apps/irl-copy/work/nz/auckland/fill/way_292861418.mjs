// Imperial Buildings, Auckland CBD (way 292861418): an Edwardian commercial block, brick with cream render piers and
// bands, a dark shopfront storey and a stone plinth. Massing from the lidar roof record: the 5x5 median of roof heights
// is snapped to four flat tiers (28 / 26 / 22 / 12 blocks), so the block reads as a 6-storey top with lower wings.
// The shell is one block thick with air behind the glass; each storey is 4 blocks (a slab line every 4 rows).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_292861418.cells.json`, "utf8"));

const W = 34, D = 34, H = 40;
const g = new Voxels([W, H, D]);

// footprint and the lidar roof height per cell (cell ground is 0 everywhere here)
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, , r] of cells) roof[x][z] = r;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[x][z] >= 0;

// 5x5 median of the lidar roof over footprint cells, then four flat tiers
const median = (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; };
const smooth = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  return median(v);
};
const tier = (h) => (h >= 26.5 ? 28 : h >= 24.5 ? 26 : h >= 19 ? 22 : 12);
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = tier(smooth(x, z));

const DIRS = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];
// the faces of cell (x, z) at row y that look out of the massing: off the footprint, or onto a lower tier
const exposed = (x, z, y) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz) || T[x + d.dx][z + d.dz] <= y);

// entrance: a single-face north-facing ground-storey wall cell nearest the middle of the north run
const northOnly = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const f = exposed(x, z, 1);
  if (f.length === 1 && f[0].name === "north") northOnly.push([x, z]);
}
const [doorX, doorZ] = northOnly.length ? northOnly[Math.floor(northOnly.length / 2)] : [-1, -1];

const paneState = (along) => (along === "x" ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const t = T[x][z];
  for (let y = 0; y < t; y++) {
    const faces = exposed(x, z, y);
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                     // plinth / floor
    if (y === t - 1) { g.set(x, y, z, faces.length ? "white_concrete" : "stone"); continue; }   // roof, cream parapet cap
    if (y % 4 === 0) { g.set(x, y, z, faces.length ? "white_concrete" : "stone"); continue; }   // floor slab, cream string course
    if (!faces.length) continue;                                                   // interior air behind the glass

    const s = Math.floor(y / 4), r = y % 4;                                       // storey and row within it
    if (faces.length >= 2) { g.set(x, y, z, "white_concrete"); continue; }        // quoins at corners
    const f = faces[0];
    const idx = f.along === "x" ? x : z;
    const isDoor = s === 0 && x === doorX && z === doorZ;
    if (isDoor && r === 3) { g.set(x, y, z, "stone_brick_stairs", { facing: f.name, half: "top", shape: "straight", waterlogged: "false" }); continue; }  // door hood
    if (isDoor && (r === 1 || r === 2)) { g.set(x, y, z, "dark_oak_door", { facing: f.name, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (r === 3) { g.set(x, y, z, s === 0 ? "dark_oak_planks" : "bricks"); continue; }   // shop fascia / spandrel
    if ((idx + s) % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }     // pier
    g.set(x, y, z, "glass_pane", paneState(f.along));
    // warm light in some windows: a glowstone on the room side of the glass (air behind it)
    if (r === 1 && (idx * 5 + s * 7) % 4 === 0) {
      const ix = x - f.dx, iz = z - f.dz;
      if (inside(ix, iz) && y < T[ix][iz] && exposed(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
    }
  }
}

// roof plant room on the top tier, centred on the roof
for (let x = 14; x <= 19; x++) for (let z = 13; z <= 18; z++) {
  if (!inside(x, z) || T[x][z] !== 28) continue;
  g.set(x, 28, z, "stone_bricks"); g.set(x, 29, z, "stone_bricks"); g.set(x, 30, z, "white_concrete");
}

const out = g.save(`${FILL}/way_292861418.nbt`);
console.log(`way_292861418: ${out.blocks} blocks, ${out.palette} palette entries, door at x=${doorX} z=${doorZ}`);
