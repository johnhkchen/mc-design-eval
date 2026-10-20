import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3411556.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3411556.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 5, H = 22, D = 11;
const g = new Voxels([W, H, D]);

// ---- footprint and lidar massing -----------------------------------
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { g: ground, roof });
const has = (x, z) => fp.has(`${x},${z}`);

const sortedRoofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medRoof = sortedRoofs[Math.floor(sortedRoofs.length / 2)];
const Bbase = Math.max(...cells.map((c) => c[2]));          // common floor line
const xmin = Math.min(...cells.map((c) => c[0])), xmax = Math.max(...cells.map((c) => c[0]));
const zmin = Math.min(...cells.map((c) => c[1])), zmax = Math.max(...cells.map((c) => c[1]));

// smooth lidar noise: near-median cells take the median, true setbacks keep their own height
function topOf(roof) {
  const r = Math.abs(roof - medRoof) <= 2 ? medRoof : roof;
  let t = 2 * Math.round(r / 2);
  t = Math.max(Bbase + 4, t);
  return Math.min(20, t);
}

const exposure = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const exposedCount = (e) => (e.N ? 1 : 0) + (e.S ? 1 : 0) + (e.W ? 1 : 0) + (e.E ? 1 : 0);

// ---- solid massing ---------------------------------------------------
for (const [x, z, ground, roof] of cells) {
  const e = exposure(x, z);
  const exposed = exposedCount(e) > 0;
  const Ttop = topOf(roof);
  fp.get(`${x},${z}`).top = Ttop;
  for (let y = 0; y < Ttop; y++) {
    let b = "bricks";
    if (y < Bbase) b = "stone_bricks";                        // plinth and foundation
    else if (exposed && y === Ttop - 1) b = "stone_bricks";   // cornice course
    else if (!exposed && y === Ttop - 1) b = "smooth_stone";  // roof deck
    else if (exposed && (y - Bbase) % 2 === 0) b = "smooth_stone"; // storey belt courses
    g.set(x, y, z, b);
  }
  if (exposed) {
    g.set(x, Ttop, z, "bricks");                                       // parapet
    g.set(x, Ttop + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- entrance on the centre of the street (north) face ----------------
const northCells = cells.filter(([x, z]) => !has(x, z - 1));
let doorX = Math.round((xmin + xmax) / 2), doorZ = null;
if (northCells.length) {
  const candidates = northCells.map((c) => c[0]);
  doorX = candidates.reduce((a, b) => (Math.abs(b - (xmin + xmax) / 2) < Math.abs(a - (xmin + xmax) / 2) ? b : a));
  doorZ = zmin;
} else {
  doorZ = zmin;
}
const doorInside = has(doorX, doorZ + 1);

// ---- windows on exposed faces ----------------------------------------
let glowCount = 0;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const e = exposure(x, z);
  if (exposedCount(e) !== 1) continue;      // corners and notches stay solid masonry
  const top = fp.get(`${x},${z}`).top;
  const faces = e.N ? "N" : e.S ? "S" : e.W ? "W" : "E";

  let windowable = false;
  if (faces === "N" || faces === "S") windowable = (x - xmin) % 2 === 1;
  else windowable = z !== zmin && z !== zmax && (z - zmin) % 2 === 0;
  if (!windowable) continue;

  const [dx, dz] = faces === "N" ? [0, 1] : faces === "S" ? [0, -1] : faces === "W" ? [1, 0] : [-1, 0];
  const pocketInFp = has(x + dx, z + dz);
  if (!pocketInFp) continue;

  for (let k = 0; ; k++) {
    const row = Bbase + 2 * k + 1;
    if (row >= top - 1) break;
    if (x === doorX && z === doorZ && k === 0) continue;   // door occupies this bay
    const px = x + dx, pz = z + dz;
    let pocket = "air";
    if ((k + x + z) % 5 === 0 && glowCount < 6) { pocket = "glowstone"; glowCount++; }
    g.set(px, row, pz, pocket);
    const paneProps = (faces === "N" || faces === "S")
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, row, z, "glass_pane", paneProps);
  }
}

// ---- entrance -----------------------------------------------------------
if (doorZ !== null && has(doorX, doorZ)) {
  if (doorInside) {
    g.set(doorX, Bbase, doorZ + 1, "air");
    g.set(doorX, Bbase + 1, doorZ + 1, "air");
  }
  g.set(doorX, Bbase, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, Bbase + 1, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// ---- roof equipment: one stair bulkhead on the tallest interior cell -----
let best = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const e = exposure(x, z);
  const interior = exposedCount(e) === 0;
  const t = fp.get(`${x},${z}`).top;
  if (!best || (interior && !best.interior) || (interior === best.interior && t > best.t)) {
    best = { x, z, t, interior };
  }
}
if (best) {
  g.set(best.x, best.t, best.z, "stone_bricks");
  g.set(best.x, best.t + 1, best.z, "stone_bricks");
  g.set(best.x, best.t + 2, best.z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(OUT);
