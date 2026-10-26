import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1328 14th St NW (Logan Circle): a 1910s-20s red-brick apartment block with Indiana-limestone
// quoins, bands and cornices in the Renaissance Revival manner. Three massing tiers from the lidar
// roof (median-smoothed): a 3-storey base across the whole footprint, a 6-storey tall wing on the
// north half and a short spine on the south-east, and a 6-storey crown with a frieze in the north
// middle. Flat tar roofs, parapet cornices, a recessed front entrance with a hood, two roof
// units on the base. Lights behind some windows. Storeys are 3 blocks.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64171.cells.json`, "utf8"));

const W = 15, D = 10, H = 32;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const gnd = [...Array(W)].map(() => Array(D).fill(0));
const lidar = [...Array(W)].map(() => Array(D).fill(0));
for (const [x, z, gr, roof] of cells) { gnd[x][z] = gr; lidar[x][z] = roof; }

// 3x3 median of the lidar roof heights knocks out single-cell spikes, then the result snaps to three tiers:
// 10 = 3 storeys + cornice, 19 = 6 storeys + cornice, 20 = 6 storeys + frieze + cornice (the crown)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const X = x + dx, Z = z + dz;
    if (X >= 0 && X < W && Z >= 0 && Z < D) v.push(lidar[X][Z]);
  }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const TIER = (m) => (m < 13 ? 10 : m < 19 ? 19 : 20);
const top = [...Array(W)].map((_, x) => [...Array(D)].map((_, z) => TIER(median(x, z))));

const out = (x, z) => x < 0 || z < 0 || x >= W || z >= D;
// a face of column (x, z) at layer L is open to the air when the cell beyond it is off the footprint or no higher than L
const faceOpen = (x, z, L, dx, dz) => out(x + dx, z + dz) || top[x + dx][z + dz] <= L;
const xFace = (x, z, L) => faceOpen(x, z, L, 1, 0) || faceOpen(x, z, L, -1, 0);
const zFace = (x, z, L) => faceOpen(x, z, L, 0, 1) || faceOpen(x, z, L, 0, -1);

// Facade grammar: piers on the x-facing walls every third z-bay, on the z-facing walls every third x-bay
const PIER_X = new Set([0, 3, 6, 9, 12, 14]), PIER_Z = new Set([0, 3, 6, 9]);
const DOOR_X = 7;                                    // the front (z = 9, south) entrance

// What fills cell (x, L, z): one of the kinds below, or "air" (an empty room cell)
function kind(x, z, L) {
  const T = top[x][z];
  if (L >= T) return null;
  const xf = xFace(x, z, L), zf = zFace(x, z, L);
  if (!xf && !zf) {
    if (L === T - 1) return "roof";
    if (L % STOREY === 0) return "floor";
    return "air";
  }
  if (L === T - 1) return "cornice";
  if (xf && zf) return "quoin";
  if (zf && z === D - 1 && L === 3 && x >= 6 && x <= 8) return "canopy";
  if (zf && z === D - 1 && x === DOOR_X && (L === 1 || L === 2)) return "door";
  if (L % STOREY === 0) return "band";
  const pier = xf ? PIER_Z.has(z) : PIER_X.has(x);
  return pier ? "pier" : "window";
}
const isWin = (x, z, L) => !out(x, z) && L < top[x][z] && kind(x, z, L) === "window";

// A window pane joins its neighbouring panes along the wall it sits in
function paneState(x, z, L) {
  const xf = xFace(x, z, L);
  const s = xf
    ? { north: isWin(x, z + 1, L), south: isWin(x, z - 1, L), east: false, west: false }
    : { north: false, south: false, east: isWin(x + 1, z, L), west: isWin(x - 1, z, L) };
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ? "true" : "false"]));
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = top[x][z];
  // Foundation: solid from y 0 up to this cell's ground (zero on this lot, so nothing to fill)
  for (let y = 0; y < gnd[x][z]; y++) g.set(x, y, z, "stone");
  for (let L = gnd[x][z]; L < T; L++) {
    const k = kind(x, z, L);
    if (k === "roof") g.set(x, L, z, "stone");
    else if (k === "floor") g.set(x, L, z, "stone");
    else if (k === "cornice" || k === "quoin" || k === "band") g.set(x, L, z, "calcite");
    else if (k === "pier") g.set(x, L, z, "bricks");
    else if (k === "window") g.set(x, L, z, "glass_pane", paneState(x, z, L));
    else if (k === "door") g.set(x, L, z, "oak_door", {
      facing: "south", half: L === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
    });
    else if (k === "canopy") g.set(x, L, z, "stone_brick_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
    else if (k === "air") {
      // a warm light in the room behind some lower-row windows on the north and south walls
      const behind = L % STOREY === 1 && x % 4 === 2 && (z === 1 || z === D - 2) && Math.floor(L / STOREY) % 2 === 0;
      if (behind) g.set(x, L, z, "glowstone");
    }
  }
}

// Roof plant on the base tier: two brick-capped units standing on the roof deck
for (const [x0, x1] of [[2, 3], [12, 13]]) for (let x = x0; x <= x1; x++) for (let z = 6; z <= 7; z++) {
  g.set(x, 10, z, "stone_bricks");
}

g.save(`${DIR}/DC64171.nbt`);
