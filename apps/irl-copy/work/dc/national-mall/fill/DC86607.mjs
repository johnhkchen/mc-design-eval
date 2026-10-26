import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86607";
const W = 8, H = 31, D = 14;

// Commercial office, 1612 K St NW: 1980s precast-clad mid-rise, pale precast piers
// and spandrels, tinted glazing, shop-fronted ground floor, setback top storeys.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr, rf] of cells) foot.set(key(x, z), { ground: Math.round(gr), roof: rf });
const inside = (x, z) => foot.has(key(x, z));
// Top tier: footprint inset by one cell, leaving a terrace ring around it.
const tierIn = (x, z) => inside(x, z) && x >= 1 && x <= W - 2 && z >= 1 && z <= D - 2;

// Flat floor plate at the highest ground under the footprint; roof smoothed to one flat tier.
const F = Math.max(...cells.map(c => Math.round(c[2])));
const roofSorted = cells.map(c => c[3]).sort((a, b) => a - b);
const T = Math.min(Math.round(roofSorted[Math.floor(roofSorted.length / 2)]), 27);
const SB = (T - 4 >= F + 6) ? T - 4 : T; // setback level for the top tier

const g = new Voxels([W, H, D]);

// Which outward faces a cell exposes, judged against a given membership test.
function exposures(x, z, test) {
  const e = [];
  if (!test(x, z - 1)) e.push({ face: "north", idx: x });
  if (!test(x, z + 1)) e.push({ face: "south", idx: x });
  if (!test(x - 1, z)) e.push({ face: "west", idx: z });
  if (!test(x + 1, z)) e.push({ face: "east", idx: z });
  return e;
}

// Shell material for a wall-level cell at height y, given its exposed faces.
function wallBlock(x, z, y, ex) {
  const k = y - F;
  const corner = ex.length > 1;
  const edge = ex.length === 1;
  const winCol = edge && ex[0].idx % 2 === 1;
  const northFace = ex.some(e => e.face === "north");
  if (y === T - 1) return "smooth_quartz";            // roof slab / coping
  if (y >= T - 2 && ex.length) return "smooth_quartz"; // cornice parapet
  if (!ex.length) return (k % 3 === 0 && y <= T - 3) ? "smooth_quartz" : null; // floor slabs, air otherwise
  if (k === 0) return "stone_bricks";                  // base course
  if (k % 3 === 0) return corner ? "smooth_quartz" : "white_concrete"; // storey spandrel
  if (northFace && !corner && k <= 2) return "gray_stained_glass";     // shopfront
  if (winCol) return "light_blue_stained_glass";      // window panes
  return "smooth_quartz";                             // piers / mullions
}

// Pass 1: foundation, lower shell, setback tier.
for (const c of cells) {
  const x = c[0], z = c[1];
  for (let y = 0; y < F; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposures(x, z, inside);
  for (let y = F; y < T; y++) {
    let b;
    if (SB < T && y >= SB) {
      if (!tierIn(x, z)) {
        b = (y === SB) ? "iron_bars" : null; // terrace railing on the ring
      } else {
        b = wallBlock(x, z, y, exposures(x, z, tierIn));
      }
    } else if (SB < T && y === SB - 1) {
      b = ex.length ? "white_concrete" : "smooth_quartz"; // terrace slab
    } else {
      b = wallBlock(x, z, y, ex);
    }
    if (b) g.set(x, y, z, b);
  }
}

// Pass 2: warm light behind some lower-floor windows on the west and east faces.
for (const c of cells) {
  const x = c[0], z = c[1];
  const ex = exposures(x, z, inside);
  if (ex.length !== 1) continue;
  const f = ex[0].face;
  if (f !== "west" && f !== "east") continue;
  if (ex[0].idx % 4 !== 1) continue;
  const ix = f === "west" ? x + 1 : x - 1;
  if (!inside(ix, z)) continue;
  for (let y = F + 4; y < SB - 3; y++) {
    const k = y - F;
    if (k % 3 === 1 && (k / 3 | 0) % 2 === 0) g.set(ix, y, z, "glowstone");
  }
}

// Pass 3: entrance on the north (K Street) frontage, on cells that really are north-exposed.
const northCells = cells
  .filter(c => !inside(c[0], c[1] - 1))
  .map(c => [c[0], c[1]])
  .sort((a, b) => a[0] - b[0]);
if (northCells.length >= 2) {
  const mid = Math.floor(northCells.length / 2);
  const doorCells = [northCells[mid - 1], northCells[mid]];
  doorCells.forEach(([dx, dz], i) => {
    const hinge = i === 0 ? "left" : "right";
    g.set(dx, F + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    g.set(dx, F + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  });
  // Hanging lanterns inside the shopfront bay, either side of the door.
  for (const idx of [mid - 2, mid + 1]) {
    const cell = northCells[idx];
    if (!cell) continue;
    const [lx, lz] = cell;
    if (inside(lx, lz + 1) && F + 2 < H) {
      g.set(lx, F + 2, lz + 1, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Pass 4: rooftop mechanical penthouse on the top tier, with louvred sides.
for (let x = 2; x <= 5; x++) {
  for (let z = 4; z <= 9; z++) {
    if (!tierIn(x, z)) continue;
    if (T + 1 < H) {
      g.set(x, T, z, "light_gray_concrete");
      g.set(x, T + 1, z, "light_gray_concrete");
    }
  }
}
for (let z = 4; z <= 9; z += 5) {
  if (tierIn(2, z) && T < H) g.set(2, T, z, "iron_bars");
  if (tierIn(5, z) && T < H) g.set(5, T, z, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
