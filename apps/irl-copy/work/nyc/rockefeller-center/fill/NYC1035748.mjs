// 55 East 54th Street, 1980 Midtown office block. Footprint 6 x 23 cells (x 0..5, z 0..22).
// Massing: lidar roof per cell, 3x3 median to drop noise, then four flat tiers (8 podium, 11 wing, 18 main slab, 20 tower).
// Skin: light precast spandrels, tinted blue glass with dark mullions, granite base, quartz storey lines every 3 blocks,
// a lobby door and canopy on the west face, warm glowstone behind a few panes. Air behind the glass, slabs per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035748.cells.json`, "utf8"));
const X = 6, Z = 23, Y = 32;

const G = Array.from({ length: X }, () => Array(Z).fill(0));
const R = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }

// 3x3 median of the lidar roof heights (noise out), then quantise into four flat tiers.
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nx = x + dx, nz = z + dz;
    if (nx >= 0 && nx < X && nz >= 0 && nz < Z) v.push(R[nx][nz]);
  }
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const tier = (r) => (r <= 8 ? 8 : r <= 12 ? 11 : r <= 18 ? 18 : 20);
const H = Array.from({ length: X }, (_, x) => Array.from({ length: Z }, (_, z) => tier(median(x, z))));

// Print the massing once so the tiers can be checked against the lidar.
if (process.env.SHOW_MASSING) for (let z = 0; z < Z; z++) console.log(String(z).padStart(2), H.map((c) => c[z]).join(" "));

const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;
// A wall block is exposed when a 4-neighbour is outside the footprint or stands no higher than this block.
const exposed = (x, y, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFoot(x + dx, z + dz) || H[x + dx][z + dz] <= y);

const g = new Voxels([X, Y, Z]);
const edgeX = (x) => x === 0 || x === X - 1;
const edgeZ = (z) => z === 0 || z === Z - 1;

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const ground = G[x][z], top = H[x][z];
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");           // foundation
  for (let y = ground; y < top; y++) {
    if (y === top - 1 || y % 3 === 2) { g.set(x, y, z, "smooth_quartz"); continue; }   // cap / storey line, full width
    if (!(edgeX(x) || edgeZ(z) || exposed(x, y, z))) continue;                        // interior air
    if (edgeX(x) && edgeZ(z)) { g.set(x, y, z, "quartz_pillar"); continue; }          // corner piers
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                    // base course
    if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }             // spandrel
    const key = edgeX(x) ? z : x;                                                     // glass row, mullion every 3rd bay
    g.set(x, y, z, key % 3 === 0 ? "gray_concrete" : "light_blue_stained_glass");
  }
}

// Lobby on the west face (x = 0): canopy over the entrance, glass either side of a door at z 11.
for (let z = 9; z <= 13; z++) { g.set(0, 3, z, "black_concrete"); g.set(1, 3, z, "black_concrete"); }
for (const z of [10, 12]) g.set(0, 1, z, "light_blue_stained_glass");
g.set(0, 1, 11, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 11, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm glass: glowstone just behind a few panes (air gap otherwise), never in the lobby.
for (let z = 0; z < Z; z++) for (let y = 4; y < 18; y++) {
  if (y % 3 !== 1 || z % 3 !== 1 || ((z * 7 + y * 5) % 4) !== 0) continue;
  for (const [x, bx] of [[0, 1], [X - 1, X - 2]]) {
    if (y < H[x][z] && g.get(bx, y, z) === null) g.set(bx, y, z, y % 2 ? "glowstone" : "shroomlight");
  }
}

// Roof plant: a penthouse on the main slab and a small mechanical box on the tower crown with a lightning rod.
for (let x = 1; x <= 4; x++) for (let z = 18; z <= 20; z++) if (H[x][z] === 18) {
  g.set(x, 18, z, "light_gray_concrete"); g.set(x, 19, z, "light_gray_concrete");
}
for (let z = 13; z <= 15; z++) if (H[2][z] === 20) { g.set(2, 20, z, "light_gray_concrete"); g.set(2, 21, z, "light_gray_concrete"); }
g.set(2, 22, 14, "lightning_rod", { facing: "up", powered: "false" });

const out = `${dir}/NYC1035748.nbt`;
console.log(g.save(out));
