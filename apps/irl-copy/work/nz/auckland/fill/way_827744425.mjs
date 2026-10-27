// Way 827744425: a 1970s concrete-framed office block on a basalt plinth. Auckland's post-war office stock is
// a light concrete frame with bands of tinted glazing between white piers, and the volcanic ground shows in the
// plinth. Massing from the lidar roof, snapped to a few flat tiers (12, 20, 26, 30, 33): a low wing, a main block,
// and a higher tower. The main block's outer ring steps down to 30 so the tower sets back. Storey lines sit on
// absolute multiples of 4, so every floor lines up across the slope; the downhill side shows its extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744425.cells.json", "utf8"));
const W = 84, D = 126, H = 45;
const TIERS = [12, 20, 26, 30, 33];
const PLINTH = "deepslate_bricks", WALL = "white_concrete", LEDGE = "light_gray_concrete", ROOF = "smooth_stone";
const PANE = "light_blue_stained_glass_pane", SLAB = "smooth_stone_slab";
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACING = { W: "west", E: "east", N: "north", S: "south" };

const snap = (r) => TIERS.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
const at = (x, z) => x * D + z;
const G = new Int16Array(W * D).fill(-1), T = new Int16Array(W * D);
for (const [x, z, g, r] of cells) { G[at(x, z)] = g; T[at(x, z)] = Math.max(snap(r), g + 4); }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[at(x, z)] >= 0;
const occ = (x, y, z) => inF(x, z) && y < T[at(x, z)];
const faceOf = (x, y, z) => Object.keys(DIRS).filter((d) => !occ(x + DIRS[d][0], y, z + DIRS[d][1]));

// Tier 33's outer ring steps down to 30: the setback that makes the tower read as rising from a podium.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
  if (inF(x, z) && T[at(x, z)] === 33 && Object.values(DIRS).some(([dx, dz]) => !inF(x + dx, z + dz))) T[at(x, z)] = 30;

const pane = (nx) => [PANE, nx
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }];

// the block at a footprint cell: plinth below ground, roof on top, facade on exposed faces, slabs inside
function cell(x, y, z) {
  const i = at(x, z), g = G[i], top = T[i];
  if (y < g) return [PLINTH];
  if (y === top - 1) return [ROOF];
  const faces = faceOf(x, y, z);
  if (!faces.length) return y % 4 === 0 && y > g ? [LEDGE] : null;   // interior: a floor slab per storey, air between
  const nx = faces.includes("W") || faces.includes("E"), nz = faces.includes("N") || faces.includes("S");
  const corner = nx && nz, phase = nx ? z : x;
  const glazed = !corner && phase % 4 !== 0;                           // three glass bays to a white pier
  if (y < g + 3) return glazed ? pane(nx) : [WALL];                    // ground storey: a shopfront
  if (y % 4 === 0) return [LEDGE];                                     // storey line
  if (y % 4 === 3) return [WALL];                                      // spandrel under each window band
  return glazed ? pane(nx) : [WALL];
}

const v = new Voxels([W, H, D]);
const facade = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const top = T[at(x, z)], g = G[at(x, z)];
  for (let y = 0; y < top; y++) { const c = cell(x, y, z); if (c) v.set(x, y, z, c[0], c[1]); }
  if (faceOf(x, top - 1, z).length) {
    v.set(x, top, z, SLAB, { type: "bottom", waterlogged: "false" });   // parapet on the roof edge
    const f = faceOf(x, g, z);
    if (f.length && g < top - 4) facade.push({ x, z, g, faces: f });
  }
}

// Main entrance: the street-side (lowest-ground) run of the facade, its largest face, middle bay.
const minG = Math.min(...facade.map((c) => c.g));
const street = facade.filter((c) => c.g === minG && c.faces.length === 1);
const byFace = Object.groupBy(street, (c) => c.faces[0]);
const face = Object.keys(byFace).sort((a, b) => byFace[b].length - byFace[a].length)[0];
const run = byFace[face].sort((a, b) => (face === "W" || face === "E" ? a.z - b.z : a.x - b.x));
const door = run[Math.floor(run.length / 2)];
const [ox, oz] = DIRS[face];
v.set(door.x, door.g, door.z, "iron_door", { facing: FACING[face], half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(door.x, door.g + 1, door.z, "iron_door", { facing: FACING[face], half: "upper", hinge: "left", open: "false", powered: "false" });
// a canopy one block out from the shopfront, carried by the spandrel above the door
for (const k of [-1, 0, 1]) {
  const cx = door.x + ox + (face === "W" || face === "E" ? 0 : k), cz = door.z + oz + (face === "W" || face === "E" ? k : 0);
  if (!occ(cx, door.g + 3, cz)) v.set(cx, door.g + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Plant boxes on the main roof (tier 30): a 3 x 3 ledge box with a grille, where a 5 x 5 patch is flat and inside.
for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) {
  if (x % 16 !== 8 || z % 16 !== 8) continue;
  let flat = true;
  for (let a = -2; a <= 2 && flat; a++) for (let b = -2; b <= 2; b++)
    if (!inF(x + a, z + b) || T[at(x + a, z + b)] !== 30 || faceOf(x + a, 29, z + b).length) { flat = false; break; }
  if (!flat) continue;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) v.set(x + a, 30, z + b, LEDGE);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) v.set(x + a, 31, z + b, "iron_bars");
}

// Lift and stair penthouse on the tower (tier 33): a 4 x 4 box, glass in its ring, a cap of ledge at the top.
let core = null;
for (let x = 2; x < W - 7 && !core; x++) for (let z = 2; z < D - 7 && !core; z++) {
  let ok = true;
  for (let a = 0; a < 6 && ok; a++) for (let b = 0; b < 6; b++)
    if (!inF(x + a, z + b) || T[at(x + a, z + b)] !== 33 || faceOf(x + a, 32, z + b).length) { ok = false; break; }
  if (ok) core = { x: x + 1, z: z + 1 };
}
if (core) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
  const cx = core.x + a, cz = core.z + b, ring = a === 0 || a === 3 || b === 0 || b === 3;
  v.set(cx, 33, cz, LEDGE);
  if (ring) { v.set(cx, 34, cz, ...pane(a === 0 || a === 3)); v.set(cx, 35, cz, WALL); }
  v.set(cx, 36, cz, LEDGE);
}

// Warm light: a few windows on the upper storeys with a glowstone in the air gap behind the pane.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  for (let y = G[at(x, z)] + 3; y < T[at(x, z)] - 1; y++) {
    if (y % 4 === 0 || y % 4 === 3 || (x * 7 + z * 3 + y) % 11 !== 0) continue;
    const f = faceOf(x, y, z);
    if (f.length !== 1) continue;
    const [dx, dz] = DIRS[f[0]];
    const ix = x - dx, iz = z - dz;
    if (occ(ix, y, iz) && faceOf(ix, y, iz).length === 0 && y % 4 !== 0) v.set(ix, y, iz, "glowstone");
  }
}

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744425.nbt");
console.log(`way_827744425: ${stats.blocks} blocks, ${stats.palette} palette entries; door on ${face} at ${door.x},${door.z}; core ${core ? "placed" : "none"}`);
