// FR245184824: a 17th-century hôtel on the Île de la Cité footprint. Four storeys of cream render over a stone plinth, a
// slate mansard that steps in from the eaves (lidar roof 25 at the main body, lower wings at 6, 9, 17 and 22), and
// chimney stacks. Walls are a one-cell ring round air with a floor slab per storey, and the attic is solid, so every
// storey and tier stands on the one below. Lamps sit just inside some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184824.cells.json", "utf8"));

const BODY = "calcite";            // cream render over stone
const BAND = "smooth_sandstone";   // string courses, sills and the cornice
const BASE = "stone_bricks";       // plinth
const FLOOR = "smooth_stone";      // storey slabs
const SLATE = "deepslate_tiles";   // mansard and roof cap
const EAVE = "deepslate_tile_stairs";
const STACK = "stone_bricks";      // chimney stacks
const GLASS = "glass_pane";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";          // warm light just inside a window

// Lidar tops -> clean tiers (ties go up); a flat roof is at least 4 above its ground so the cornice has walls under it
const TIERS = [6, 9, 12, 17, 22, 25];
const snap = (r) => { let best = TIERS[0]; for (const t of TIERS) if (Math.abs(t - r) <= Math.abs(best - r)) best = t; return best; };

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, T: Math.max(snap(r), gr + 4) });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const NB = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const faces = (x, z) => NB.filter(([, dx, dz]) => !inFp(x + dx, z + dz)).map(([f]) => f);   // outward faces, north first
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// edge distance: 1 on the outer ring, growing inward (drives the mansard's step-in)
const dist = new Map();
let frontier = [];
for (const [k] of byXZ) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z).length) { dist.set(k, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [, dx, dz] of NB) {
    const k = `${x + dx},${z + dz}`;
    if (byXZ.has(k) && !dist.has(k)) { dist.set(k, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

const g = new Voxels([20, 41, 14]);
const DOOR_CELL = [3, 0];   // the street door on the north front, middle bay

const winState = (face) => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const stairFacing = (face) => ({ facing: face, half: "bottom", shape: "straight", waterlogged: "false" });

// pass 1: the massing and the envelope of every footprint cell
for (const [x, z] of cells) {
  const { gr, T } = byXZ.get(`${x},${z}`);
  const d = dist.get(`${x},${z}`);
  const out = faces(x, z);
  const edge = out.length > 0;
  const face = out[0];
  const along = face === "north" || face === "south" ? x : z;
  const bay = along % 3 === 1;               // windows on every third cell, pillars between
  const mansard = T >= 20;
  const wallTop = mansard ? 19 : T - 2;      // y < wallTop is wall; y == wallTop is the cornice (edge) or roof (inside)
  const capTop = mansard ? Math.min(T, 20 + d) : T;   // the mansard steps in one block per cell from the eave
  const slabs = [gr];                        // ground floor, then a floor slab every storey (5 blocks)
  for (let y = 5; y < wallTop; y += 5) if (y > gr) slabs.push(y);
  const at = (y, block, state) => g.set(x, y, z, block, state);

  for (let y = 0; y < capTop; y++) {
    if (y < gr) { at(y, BASE); continue; }                       // foundation under the ground floor
    if (y >= wallTop) {
      if (y === wallTop && edge) { at(y, BAND); continue; }      // cornice
      if (edge && mansard && y === capTop - 1) at(y, EAVE, stairFacing(face));
      else at(y, SLATE);
      continue;
    }
    if (slabs.includes(y)) { at(y, edge ? (y === gr ? BASE : BAND) : FLOOR); continue; }
    if (!edge) continue;                                         // inside: air behind the glass
    const b = Math.max(...slabs.filter((s) => s < y));
    const top = Math.min(...[...slabs.filter((s) => s > y), wallTop]);
    const [dx, dz] = INWARD[face];
    if (x === DOOR_CELL[0] && z === DOOR_CELL[1] && (y === gr + 1 || y === gr + 2)) {
      at(y, DOOR, { facing: face, half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === b + 1) { at(y, BAND); continue; }                  // sill line
    if (y === top - 1) { at(y, BODY); continue; }                // plain head of each storey
    if (bay) {
      at(y, GLASS, winState(face));
      if (y === b + 2 && (x + z + b) % 4 === 0 && inFp(x + dx, z + dz)) {
        // a lamp just inside, if that cell is interior (not part of the wall ring)
        if (dist.get(`${x + dx},${z + dz}`) > 1) g.set(x + dx, y, z + dz, LAMP);
      }
    } else at(y, BODY);
  }
}

// pass 2: chimney stacks on the top of the main roof, set into the interior of the attic
for (const [x, z] of cells) {
  const { T } = byXZ.get(`${x},${z}`);
  const d = dist.get(`${x},${z}`);
  if (T === 25 && d >= 3 && (x * 5 + z * 3) % 13 === 0) {
    g.set(x, 25, z, STACK); g.set(x, 26, z, STACK);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184824.nbt");
