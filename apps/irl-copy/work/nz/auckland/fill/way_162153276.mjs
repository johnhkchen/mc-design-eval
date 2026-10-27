// The Chatham, Auckland (way 162153276): a 1960s-70s concrete-frame office block, seven storeys over a dark basalt-look
// plinth, on a 37 x 25 footprint. The lidar roof reads one flat top at 33 across the main body, a 16 wing (three storeys
// with a planted terrace), a 20 and a 12 low edge: 3x3 median of the lidar, snapped to the storey grid (tops 12, 16, 20,
// 33; floor lines every 4 blocks from the datum at y 2). The facade: white floor lines and piers, light-blue glass ribbons,
// light-grey spandrels, a cornice and a parapet cap; a polished-deepslate base course and a shopfront at the ground; a
// double door under a canopy on the longest street face. Plant room on the roof, glowstone behind some panes. Interiors
// are air with a slab per storey. Foundation: solid from y 0 to the datum under every footprint cell (nothing floats).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153276.cells.json", "utf8"));
const W = 37, D = 25, H = 46, DATUM = 2;   // y 2 is the ground-floor datum, above the highest ground (2)
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof tiers: the 3x3 median of the lidar roof, snapped to tops that stand on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));   // top (exclusive): solid from y 0 to T-1
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z);
  T[x][z] = r >= 30 ? 33 : r >= 18 ? 20 : r >= 14 ? 16 : 12;
}

// outward normals; a door's facing is the name of its outward normal
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
// the faces a cell shows at height y: outside the footprint, or beside a neighbour whose top is at or below y
const faces = (x, z, y) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz) || T[x + dx][z + dz] <= y);
// position along a facade (x on north/south faces, z on east/west) so piers and bays count in the same grid
const along = (name, x, z) => (name === "north" || name === "south" ? x : z);

// the entrance: a double door at the middle of the south (front) face, which the elevation sheet shows first. North
// and south both have 37 cells on their outer edge, so the choice is the front, not the longer run
const runs = Object.fromEntries(DIRS.map(([name]) => [name, []]));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z))
  for (const [name, dx, dz] of DIRS) if (!inside(x + dx, z + dz)) runs[name].push([x, z]);
const doorFace = "south";
const street = runs[doorFace].sort((a, b) => along(doorFace, a[0], a[1]) - along(doorFace, b[0], b[1]));
const mid = Math.floor(street.length / 2);
const door = [street[mid], street[mid + 1]];   // the two leaves, side by side
const doorKey = (x, z) => `${x},${z}`;
const doorSet = new Set(door.map(([x, z]) => doorKey(x, z)));
const doorLo = Math.min(...door.map(([x, z]) => along(doorFace, x, z)));
const doorHi = Math.max(...door.map(([x, z]) => along(doorFace, x, z)));

const g = new Voxels([W, H, D]);
const glow = [];   // interior cells behind a lit pane, set after the walls

// the facade at a shell cell: storey rhythm of 4 (floor line, two glazed rows, spandrel), piers every 3rd cell
const facade = (x, y, z, exposed) => {
  const storey = Math.floor((y - DATUM) / 4), rel = (y - DATUM) % 4;
  const name = doorSet.has(doorKey(x, z)) && exposed.some(([n]) => n === doorFace) ? doorFace : exposed[0][0];
  const a = along(name, x, z);
  const normal = DIRS.find(([n]) => n === name);
  if (y === T[x][z] - 2) return g.set(x, y, z, "white_concrete");                    // the cornice band
  if (rel === 0) return g.set(x, y, z, storey === 0 ? "polished_deepslate" : "white_concrete");   // floor line / base course
  if (rel === 3) {
    const canopy = storey === 0 && name === doorFace && a >= doorLo - 1 && a <= doorHi + 1;
    return g.set(x, y, z, canopy ? "smooth_stone" : "light_gray_concrete");          // spandrel, or the canopy over the door
  }
  if (storey === 0 && doorSet.has(doorKey(x, z))) {                                  // the double door, lower and upper leaf
    const leaf = door.findIndex(([dx, dz]) => dx === x && dz === z) === 0 ? "left" : "right";
    return g.set(x, y, z, "dark_oak_door", { facing: name, half: rel === 1 ? "lower" : "upper", hinge: leaf, open: "false", powered: "false" });
  }
  if (a % 3 === 0) return g.set(x, y, z, storey === 0 ? "deepslate_bricks" : "white_concrete");   // piers and mullions
  g.set(x, y, z, "light_blue_stained_glass");
  // a warm light behind about one pane in six (the air cell inside the glass, if it is a room cell)
  if (rel === 1 && (storey * 3 + a + (name === "east" || name === "west" ? 1 : 0)) % 6 === 0) {
    const ix = x - normal[1], iz = z - normal[2];
    if (inside(ix, iz) && T[ix][iz] > y && faces(ix, iz, y).length === 0) glow.push([ix, y, iz]);
  }
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const t = T[x][z];
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, "deepslate_bricks");               // plinth: nothing floats on the slope
  for (let y = DATUM; y < t; y++) {
    if (y === t - 1) { g.set(x, y, z, faces(x, z, y).length ? "smooth_stone" : "gray_concrete"); continue; }   // parapet cap, roof
    const exposed = faces(x, z, y);
    if (exposed.length) facade(x, y, z, exposed);
    else if ((y - DATUM) % 4 === 0) g.set(x, y, z, "light_gray_concrete");          // a floor slab per storey inside
  }
}
for (const [x, y, z] of glow) g.set(x, y, z, "glowstone");

// roof plant room: an enclosed box on the flat top, its louvres a grate band; every cell must stand on the 33 roof
const PX0 = 13, PX1 = 22, PZ0 = 8, PZ1 = 16;
for (let x = PX0; x <= PX1; x++) for (let z = PZ0; z <= PZ1; z++) {
  if (!inside(x, z) || T[x][z] !== 33) throw new Error(`plant room cell ${x},${z} is off the roof`);
  const wall = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
  for (let y = 33; y <= 35; y++) if (wall) g.set(x, y, z, y === 34 ? "copper_grate" : "light_gray_concrete");
  g.set(x, 36, z, "smooth_stone");
}

// wing terrace (the 16 roof): planters of moss with azaleas, standing on the roof cap
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && T[x][z] === 16 && faces(x, z, 16).length === 0 && (2 * x + z) % 5 === 0) {
  g.set(x, 16, z, "moss_block"); g.set(x, 17, z, "flowering_azalea");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153276.nbt");
console.log(`way_162153276: ${out.blocks} blocks, ${out.palette} palette entries; door on ${doorFace} at ${door.map(([x, z]) => `${x},${z}`).join(" ")}; ${glow.length} lit panes`);
