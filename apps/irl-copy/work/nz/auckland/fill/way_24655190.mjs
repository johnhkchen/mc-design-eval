// Heritage Hotel (the footprint at Maungawhau's south-east, roof 36-44 blocks over its lowest ground): a 1920s brick and
// render hotel, ten to eleven storeys, the body on a stone plinth, a setback core rising over the middle, a stone cornice
// and parapet on top, shopfronts and two doorways at the street level. Walls are one cell thick on the footprint's edge;
// the windows are recessed a cell so the brick reveals and the 1-block relief read from the street and the air. Floor
// slabs sit on every absolute storey line (y = 4k) across the footprint, so every storey and setback stands on the one
// below and nothing hangs. Massing comes from the lidar roof, median-smoothed and snapped to the storey lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24655190.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24655190.nbt";

const X = 122, Y = 60, Z = 90;
const g = new Voxels([X, Y, Z]);

// --- footprint, per-cell ground and roof ---------------------------------------------------------------------------------
const raw = new Map();                                  // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { ground, roof });
const inFoot = (x, z) => raw.has(`${x},${z}`);

// a 3x3 median of the lidar roof stops single-cell noise; the top block then sits on a storey line (the roof deck is at T,
// the roof surface at T+1), and each column's floor slab sits on the ground storey line GF (the plinth runs up to it)
const col = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = raw.get(`${x + dx},${z + dz}`); if (n) near.push(n.roof); }
  near.sort((a, b) => a - b);
  const rm = near[(near.length - 1) >> 1];
  const GF = 4 * Math.ceil(c.ground / 4);               // the ground-floor line: the plinth from the lidar ground up to it
  const T = Math.max(4 * Math.floor((rm - 1) / 4), GF + 4);
  col.set(key, { x, z, ground: c.ground, GF, T });
}
const cellOf = (x, z) => col.get(`${x},${z}`) ?? null;
const topOf = (x, z) => { const c = cellOf(x, z); return c ? c.T : -Infinity; };

// the four side directions, and each one's outward compass facing
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
// the sides of a cell that open to the air at height y: the edge of the footprint, or a neighbour whose roof is below y
const exposures = (x, z, y) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || topOf(x + dx, z + dz) < y);
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !inFoot(x + dx, z + dz));

// deterministic pseudo-random in [0, 1) so the same build repeats
const H = (a, b, c) => {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// --- palette --------------------------------------------------------------------------------------------------------------
const FILL = "stone";
const PLINTH = "stone_bricks";        // the base course and the ground-floor piers
const COURSE = "polished_andesite";   // a course on each storey line of the base
const BRICK = "bricks";                // the red-brick walls and piers
const RENDER = "smooth_quartz";        // storey lines, sills, the cornice (edge cells)
const DECK = "smooth_stone";           // interior floor slabs and the roof deck
const HEAD = "white_concrete";         // window heads over each opening
const GLASS = "glass_pane";
const FASCIA = "dark_oak_planks";      // the shopfront fascia
const CAP = "stone_brick_slab";        // the parapet cap and the door canopy
const PLANT = "stone_bricks";          // the roof plant room

const paneState = (dx) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const glass = (x, y, z, dx, dz) => g.set(x, y, z, GLASS, paneState(dx));

// --- the main pass: one column per footprint cell -----------------------------------------------------------------------
const lamps = [];                                        // [x, y, z] lanterns set after the walls
for (const c of col.values()) {
  const { x, z, ground, GF, T } = c;
  const edge = isEdge(x, z);

  // foundation: solid from y 0 up to the lidar ground, the plinth from there up to the ground-floor line
  // the exposed base is coursed masonry: a course on every storey line, so the downhill fill reads as a base, not a mass
  for (let y = 0; y < GF; y++) g.set(x, y, z, !edge ? FILL : y % 4 === 0 ? COURSE : PLINTH);

  // storey lines, then the walls between them
  for (let y = GF; y <= T; y++) {
    if (y % 4 === 0) {
      g.set(x, y, z, edge ? RENDER : DECK);
      continue;
    }
    const rel = y % 4, sb = y - rel, ground_floor = sb === GF;
    const exps = exposures(x, z, y);
    if (!exps.length) continue;                          // interior: air
    const [dx, dz] = exps[0];                            // the face this cell shows at this height
    const bay = dx !== 0 ? z : x;
    const b = ((bay % 3) + 3) % 3;                       // 0 = pier, 1 and 2 = window
    const wi = Math.floor(bay / 3);
    const face = (dx + 2) * 5 + (dz + 2);
    const storey = Math.floor(y / 4);

    if (b === 0) { g.set(x, y, z, ground_floor ? PLINTH : BRICK); continue; }

    if (ground_floor) {
      // a doorway in the window bay with its canopy over it; the other bays are shopfront glass on a fascia
      const door = b === 1 && edge && H(wi, face, 7) < 0.14;
      if (door) {
        if (rel === 1 || rel === 2) {
          g.set(x, y, z, "dark_oak_door", {
            facing: FACING[`${dx},${dz}`], half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
          });
        } else g.set(x, y, z, CAP);
        continue;
      }
      if (rel === 3) g.set(x, y, z, FASCIA);
      else { glass(x, y, z, dx, dz); }
      continue;
    }

    // upper storeys: the window is recessed one cell behind the brick when the cell behind it is interior at this height
    const bx = x - dx, bz = z - dz;
    const recess = edge && inFoot(bx, bz) && !exposures(bx, bz, y).length && rel >= 1;
    if (recess) {
      // the opening is air in this cell; the glass and its head sit one cell in, with air behind them
      if (rel === 3) g.set(bx, y, bz, HEAD);
      else glass(bx, y, bz, dx, dz);
      if (rel === 1 && H(x, z, storey) < 0.25) lamps.push([x - 2 * dx, y, z - 2 * dz]);
    } else {
      if (rel === 3) g.set(x, y, z, HEAD);
      else glass(x, y, z, dx, dz);
    }
  }

  // parapet and cap on the roof's outer edge
  if (edge) {
    g.set(x, T + 1, z, BRICK);
    g.set(x, T + 2, z, CAP);
  }
}

// lamps in the second and third cells behind the glass: standing on the floor slab, so nothing floats
for (const [x, y, z] of lamps) {
  if (!inFoot(x, z) || exposures(x, z, y).length) continue;
  g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// --- roof plant: two rooms on the largest flat decks inside the footprint, each resting on its deck ----------------------
{
  const cands = [];
  for (const c of col.values()) {
    const w = 6, d = 4;
    let ok = true;
    for (let dz = 0; dz < d && ok; dz++) for (let dx = 0; dx < w && ok; dx++) {
      const n = cellOf(c.x + dx, c.z + dz);
      if (!n || n.T !== c.T || isEdge(n.x, n.z)) ok = false;
    }
    if (!ok) continue;
    const cx = c.x + w / 2, cz = c.z + d / 2;
    cands.push({ ...c, score: -Math.hypot(cx - X / 2, cz - Z / 2) + c.T * 0.5 });
  }
  cands.sort((a, b) => b.score - a.score);
  const picked = [];
  for (const c of cands) {
    if (picked.length >= 2) break;
    if (picked.some((p) => Math.abs(p.x - c.x) < 10 && Math.abs(p.z - c.z) < 10)) continue;
    picked.push(c);
  }
  for (const best of picked) {
    for (let dz = 1; dz < 3; dz++) for (let dx = 1; dx < 5; dx++) {
      const x = best.x + dx, z = best.z + dz;
      g.set(x, best.T + 1, z, PLANT); g.set(x, best.T + 2, z, PLANT); g.set(x, best.T + 3, z, CAP);
    }
  }
}

const stats = g.save(OUT);
console.log(`way_24655190: ${stats.blocks} blocks, ${stats.palette} palette entries, ${cells.length} footprint cells -> ${OUT}`);
