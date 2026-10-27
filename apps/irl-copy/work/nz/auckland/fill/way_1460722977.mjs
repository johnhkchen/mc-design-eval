import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1980s Auckland office tower on a basalt plinth: pale precast spandrels and piers, blue-glass bays, a shopfront
// ground storey, stepped setbacks and a plant room on the top tier. Storey lines sit on multiples of 4 from the y=8
// ground datum, so every floor is shared across the footprint; the plinth fills y 0..7 under every cell.
const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_1460722977.cells.json`, "utf8"));   // [x, z, ground, roof]

const [X, Y, Z] = [40, 67, 34];
const vox = new Voxels([X, Y, Z]);
const BASE = 8;                                    // ground-floor datum (highest ground under the footprint)
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const key = (x, z) => `${x},${z}`;

// Lidar roof heights -> 3x3 median (lidar noise) -> one flat tier per roof band.
const tierOf = (h) => (h < 12 ? 12 : h < 18 ? 16 : h < 30 ? 24 : h < 40 ? 40 : h < 47 ? 44 : h < 51 ? 48 : 56);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[s.length >> 1]; };
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(key(x, z), { g: ground, h: roof, T: 0 });
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  const hs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = col.get(key(x + dx, z + dz)); if (n) hs.push(n.h); }
  c.T = tierOf(median(hs));
}

// A storey at level D exists over the columns whose roof is at least D+4; its edge cells are the storey's walls.
const inS = (x, z, D) => { const c = col.get(key(x, z)); return !!c && c.T >= D + 4; };
const outward = (x, z, D) => DIRS.filter(([, dx, dz]) => !inS(x + dx, z + dz, D));
const levels = []; for (let D = BASE; D <= 52; D += 4) levels.push(D);

// Entrance: the street side is the high (west) ground; take the middle of its ground-storey cells at the top grade.
const westEdge = [...col.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => inS(x, z, BASE) && outward(x, z, BASE).some(([n]) => n === "west"));
const topG = Math.max(...westEdge.map(([x, z]) => col.get(key(x, z)).g));
const doorCands = westEdge.filter(([x, z]) => col.get(key(x, z)).g === topG).sort((a, b) => a[1] - b[1]);
const [doorX, doorZ] = doorCands[doorCands.length >> 1];
const doorKey = key(doorX, doorZ);

const lightCells = [];   // interior cells behind a lit window, placed after the shell
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  // plinth: solid from y 0 to the ground-floor datum (the downhill side shows its extra storey of stone)
  for (let y = 0; y < BASE; y++) vox.set(x, y, z, "stone_bricks");

  for (const D of levels) {
    if (!inS(x, z, D)) continue;
    const O = outward(x, z, D);
    const roofStorey = c.T === D + 4;
    vox.set(x, D, z, "light_gray_concrete");                     // floor slab, the whole storey
    if (O.length === 0) {                                        // interior: air gap, except the roof's solid deck
      if (roofStorey) vox.set(x, D + 3, z, "stone");           // a mid-grey roof membrane, not a dark pit from the air
      continue;
    }

    // edge cell: a corner pier, or a face of piers every third cell with a glass bay between them
    const ns = O.some(([, , dz]) => dz !== 0), ew = O.some(([, dx]) => dx !== 0);
    const corner = ns && ew;
    const idx = ns && !ew ? x : z;
    const pier = corner || idx % 3 === 0;
    const pane = ns && !ew
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    const outDir = O[0];
    const top = D + 3;                                            // the storey's upper course

    if (D === BASE) {
      // ground storey: basalt base course, shopfront glazing, a fascia; entrance and canopy on the west side
      vox.set(x, D + 1, z, "polished_basalt");
      if (k === doorKey) {
        vox.set(x, D + 1, z, "iron_door", { facing: outDir[0], half: "lower", hinge: "left", open: "false", powered: "false" });
        vox.set(x, D + 2, z, "iron_door", { facing: outDir[0], half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pier) {
        vox.set(x, D + 2, z, "polished_basalt");
      } else {
        vox.set(x, D + 2, z, "light_blue_stained_glass_pane", pane);
        if ((idx + D) % 4 === 0) lightCells.push([x, z, D + 1, outDir, D]);
      }
      vox.set(x, top, z, roofStorey ? "polished_basalt" : "light_gray_concrete");
      continue;
    }

    // upper storeys: glazing (or piers) in two rows, then the spandrel course; the roof storey ends in a cornice
    vox.set(x, D + 1, z, pier ? "light_gray_concrete" : "light_blue_stained_glass_pane", pier ? undefined : pane);
    vox.set(x, D + 2, z, pier ? "light_gray_concrete" : "light_blue_stained_glass_pane", pier ? undefined : pane);
    if (!pier && (idx + D) % 4 === 0) lightCells.push([x, z, D + 1, outDir, D]);
    vox.set(x, top, z, roofStorey ? "polished_basalt" : "light_gray_concrete");
  }
}

// Lit windows: glowstone two cells in, behind a one-cell air gap at the glass.
for (const [x, z, y, [, dx, dz], D] of lightCells) {
  const qx = x - 2 * dx, qz = z - 2 * dz;
  if (inS(qx, qz, D) && outward(qx, qz, D).length === 0) vox.set(qx, y, qz, "glowstone");
}

// Parapet on the roof edge (every edge cell with open sky or a lower roof beside it).
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(([, dx, dz]) => { const n = col.get(key(x + dx, z + dz)); return !n || n.T < c.T; });
  if (edge) vox.set(x, c.T, z, "stone_bricks");
}

// Plant room on the top tier: a solid box set well inside the tier's edge.
for (const [k, c] of col) {
  if (c.T !== 56) continue;
  const [x, z] = k.split(",").map(Number);
  let inner = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = col.get(key(x + dx, z + dz)); if (!n || n.T !== 56) inner = false; }
  if (inner) { vox.set(x, 56, z, "gray_concrete"); vox.set(x, 57, z, "gray_concrete"); }
}

// Canopy over the entrance: the lintel row across the door's neighbours.
for (const dz of [-1, 0, 1]) {
  const kk = key(doorX, doorZ + dz);
  if (col.has(kk) && inS(doorX, doorZ + dz, BASE)) vox.set(doorX, BASE + 3, doorZ + dz, "polished_basalt");
}

const { blocks, palette } = vox.save(`${FILL}/way_1460722977.nbt`);
console.log(`way_1460722977: ${blocks} blocks, palette ${palette}, footprint ${col.size}, tiers ${[...new Set([...col.values()].map((c) => c.T))].join("/")}`);
