// Way 292667920: a 1970s-80s Auckland office block (Newton/Grafton edge of the CBD), read from the lidar roof record:
// a seven-storey concrete-and-tinted-glass main block with a lift/stair tower stepping up at its east end to about
// 59 blocks (≈ 12 storeys). Storeys are 4 blocks on one global datum (floor slabs at y = 4 + 4k), so every tier and
// roof sits on the floor below. Base course and foundation fill from y 0 up; the lidar roof is median-smoothed into
// clean tiers (roofs on a 4-block grid); the tower keeps its own steps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292667920.cells.json`, "utf8"));   // [x, z, ground, roof]

const SIZE = [45, 71, 32];
const TOWER_MIN = 40;                 // lidar roof at or above this is the lift/stair tower, kept as recorded
const FLOOR0 = 4;                     // ground-storey floor slab, above the 4-block base course

const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inFp = (x, z) => at.has(`${x},${z}`);
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };

// Tier each cell's roof: low/main massing is median-smoothed over the footprint's own neighbours, then snapped to
// 4-block storeys (minimum two storeys); the tower keeps its recorded height, snapped the same way.
const top = new Map();
for (const [x, z, , r] of cells) {
  let s = r;
  if (r < TOWER_MIN) {
    const nb = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const c = at.get(`${x + dx},${z + dz}`); if (c && c.r < TOWER_MIN) nb.push(c.r);
    }
    s = med(nb);
  }
  top.set(`${x},${z}`, Math.max(12, Math.round(s / 4) * 4));
}

// Outward faces: the sides of a cell with no footprint cell beyond them. Walls go on those cells only.
const faces = (x, z) => [
  !inFp(x, z - 1) && "N", !inFp(x, z + 1) && "S", !inFp(x - 1, z) && "W", !inFp(x + 1, z) && "E",
].filter(Boolean);
const perim = (x, z) => faces(x, z).length > 0;

// The plan. Grids: a pier on each 3rd cell of a facade, corners solid, glass between; spandrels under each window band.
const V = new Voxels(SIZE);
const M = {
  base: "stone_bricks", plinth: "smooth_stone", floor: "light_gray_concrete", band: "white_concrete",
  pier: "light_gray_concrete", roof: "gray_concrete", cornice: "smooth_stone", tint: "gray_stained_glass_pane",
  clear: "glass_pane", plant: "iron_block",
};

const paneState = (x, z, face) => {
  const link = (dx, dz) => (inFp(x + dx, z + dz) && perim(x + dx, z + dz) ? "true" : "false");
  return face === "z"
    ? { east: link(1, 0), west: link(-1, 0), north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: link(0, -1), south: link(0, 1), waterlogged: "false" };
};

// Entrance: the south-facing street cell nearest the middle of the block (x 22), with its two neighbours glazed.
const southCells = cells.filter(([x, z]) => faces(x, z).includes("S") && !faces(x, z).includes("W") && !faces(x, z).includes("E"));
const [ex, ez] = southCells.reduce((best, c) => (Math.abs(c[0] - 22) < Math.abs(best[0] - 22) ? c : best))
  .slice(0, 2);

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = top.get(`${x},${z}`);
  const out = faces(x, z), edge = out.length > 0, corner = out.length >= 2;
  // base course and foundation: solid from y 0 to the plinth, which meets the ground-storey slab
  for (let y = 0; y < 3; y++) V.set(x, y, z, M.base);
  V.set(x, 3, z, M.plinth);
  // storeys: a slab at each floor line, then walls (edge) or air behind a pane (interior: no interiors)
  const zFace = out.length === 1 && (out[0] === "N" || out[0] === "S");
  const index = zFace ? x : z;                                   // position along the face: every 3rd cell is a pier
  for (let F = FLOOR0; F <= T - 4; F += 4) {
    V.set(x, F, z, edge ? M.band : M.floor);
    if (!edge) continue;
    const ground = F === FLOOR0;
    for (let y = F + 1; y <= F + 2; y++) {
      if (corner || index % 3 === 0) V.set(x, y, z, M.pier);
      else V.set(x, y, z, ground ? M.clear : M.tint, paneState(x, z, zFace ? "z" : "x"));
    }
    V.set(x, F + 3, z, M.band);   // spandrel under the next floor line
  }
  // the roof: a membrane on the top storey's ceiling, a cornice on the walls, plant on interior roofs
  V.set(x, T - 1, z, M.roof);
  if (edge) V.set(x, T, z, M.cornice);
}

// Entrance bay: the centre street cell becomes a door (lower and upper halves), the bay's glass reads as a lobby,
// and a stone header stands over the door as the canopy line.
const bay = [ex - 1, ex, ex + 1].filter((x) => inFp(x, ez) && perim(x, ez));
for (const x of bay) {
  for (let y = FLOOR0 + 1; y <= FLOOR0 + 2; y++) V.set(x, y, ez, M.clear, paneState(x, ez, "z"));
  V.set(x, FLOOR0 + 3, ez, "stone_brick_slab", { type: "top", waterlogged: "false" });
}
const doorFacing = "north";
V.set(ex, FLOOR0 + 1, ez, "oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
V.set(ex, FLOOR0 + 2, ez, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
// a hanging lantern just inside the door, hung from the lobby's ceiling line
if (inFp(ex, ez - 1) && !perim(ex, ez - 1)) V.set(ex, FLOOR0 + 3, ez - 1, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light: glowstone just inside some upper-floor windows, and lanterns hung under the floor slabs of the interior.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (perim(x, z) || !inFp(x, z)) continue;
  const T = top.get(`${x},${z}`);
  for (let F = FLOOR0; F + 4 <= T - 4; F += 4) if (x % 6 === 3 && z % 6 === 2) V.set(x, F + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!perim(x, z)) continue;
  const T = top.get(`${x},${z}`);
  const out = faces(x, z);
  if (out.length !== 1) continue;
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[out[0]];
  const ix = x + inward[0], iz = z + inward[1];
  if (!inFp(ix, iz) || perim(ix, iz)) continue;
  for (let F = FLOOR0 + 4; F <= T - 4; F += 4) if ((x + z + F) % 5 === 0) V.set(ix, F + 1, iz, "glowstone");
}

// Roof plant: two-high equipment boxes on the main roof's interior, standing on the roof membrane.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (perim(x, z)) continue;
  const T = top.get(`${x},${z}`);
  if (T >= 28 && x % 7 === 3 && z % 7 === 4) { V.set(x, T, z, M.plant); V.set(x, T + 1, z, M.plant); }
}

const stats = V.save(`${DIR}/way_292667920.nbt`);
console.log("saved", stats, "entrance", [ex, ez]);
