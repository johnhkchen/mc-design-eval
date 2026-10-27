// Way 910658685, Auckland (the Eden Terrace / CBD-ring edge, seen from Maungawhau): a two-storey Edwardian brick shop
// block, c. 1910, the kind on the old Mt Eden and Karangahape arterials. The lidar roof is flat across all 49 cells
// (ground 0, roof 10), so it is one tier: a 4-block ground storey (shopfront, fascia band), a 4-block first storey
// (sash windows in brick piers), a smooth-stone roof deck and a 2-block brick parapet with a stone coping.
// Front is the face with the most exposure (south here), the door sits in its middle bay, quoins on the corners.
// Hollow: one block of shell, air behind the glass, a solid floor slab per storey, a roof deck over the interior.
// Warm light: a shroomlight in the ground-floor air gap and glowstone behind some first-floor panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658685.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658685.nbt";

const W = 9, D = 7, H = 23;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));                       // [x, z, ground, roof]
const cell = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { x, z, gr, r }]));
const has = (x, z) => cell.has(`${x},${z}`);

const TOP = Math.round(cells.reduce((s, c) => s + c[3], 0) / cells.length);  // the flat tier: roof at y = TOP
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));
const behind = (x, z, f) => [x - DIRS[f][0], z - DIRS[f][1]];               // the cell inside a face

// The front: the face with the most exposed cells (ties keep south).
const count = { N: 0, S: 0, E: 0, W: 0 };
for (const c of cells) for (const f of exposed(c[0], c[1])) count[f]++;
const FRONT = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a), "S");

// Along a face: N/S faces run along x, E/W faces along z. Sash windows sit on every third bay, brick piers between.
const along = (x, z, f) => ((f === "N" || f === "S") ? x : z);
const bayWindow = (u) => u % 3 === 1;

// The door: the front cell nearest the middle of the front, and not a corner.
const frontCells = cells.filter(c => exposed(c[0], c[1]).length === 1 && exposed(c[0], c[1])[0] === FRONT);
const us = frontCells.map(c => along(c[0], c[1], FRONT));
const mid = (Math.min(...us) + Math.max(...us)) / 2;
const doorCell = frontCells.reduce((a, c) => (Math.abs(along(c[0], c[1], FRONT) - mid) < Math.abs(along(a[0], a[1], FRONT) - mid) ? c : a));
const DOOR = `${doorCell[0]},${doorCell[1]}`;

const pane = (f) => (f === "N" || f === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
const door = (half) => ({ facing: FRONT === "N" ? "north" : FRONT === "S" ? "south" : FRONT === "E" ? "east" : "west", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([W, H, D]);
const interior = [];
const windowInner = [];      // inner cells behind upper windows (for glowstone)
const shopInner = [];        // inner cells behind the shopfront (for the shroomlight)

for (const [x, z, gr, r] of cells) {
  const top = r - 1;          // the highest layer; the parapet coping is on top
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");       // foundation to the lidar ground (none on this flat site)
  const faces = exposed(x, z);

  if (faces.length === 0) {                                     // interior: floor, air storeys, ceiling and deck
    interior.push([x, z]);
    g.set(x, 0, z, "stone");
    g.set(x, 3, z, "smooth_stone");                             // first-floor slab
    g.set(x, 7, z, "smooth_stone");                             // roof deck
    continue;
  }

  // a quoin only on a true convex corner: two perpendicular exposed faces and the diagonal cell outside the footprint
  const convex = faces.length === 2 && (faces.includes("N") || faces.includes("S")) && (faces.includes("E") || faces.includes("W"))
    && !has(x + (faces.includes("E") ? 1 : -1), z + (faces.includes("S") ? 1 : -1));
  const corner = convex;
  const f = faces[0];
  const u = along(x, z, f);
  const key = `${x},${z}`;

  for (let y = 0; y <= top; y++) {
    if (corner) {                                                // quoins: dressed stone up the corner
      if (y === 9) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }       // base course
    if (y === 3 || y === 7) { g.set(x, y, z, "smooth_stone"); continue; } // floor belt and the lintel/roof line
    if (y === 9) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === 8) { g.set(x, y, z, "bricks"); continue; }                  // parapet
    const ground = y <= 2;
    if (ground && f === FRONT && key === DOOR) {                          // the entrance bay
      g.set(x, y, z, "dark_oak_door", door(y === 1 ? "lower" : "upper"));
      continue;
    }
    if (ground && f === FRONT) {                                          // the shopfront: glass the full bay
      g.set(x, y, z, "glass_pane", pane(f));
      continue;
    }
    if (bayWindow(u)) {
      g.set(x, y, z, "glass_pane", pane(f));
      continue;
    }
    g.set(x, y, z, "bricks");
  }

  // the air gap behind the glass: the inner neighbour is interior, so a lamp can stand there
  if (!corner && f !== undefined) {
    const [bx, bz] = behind(x, z, f);
    if (has(bx, bz) && exposed(bx, bz).length === 0) {
      if (key === DOOR) continue;
      if (f === FRONT) shopInner.push([bx, bz]);
      else if (bayWindow(u)) windowInner.push([bx, bz]);
    }
  }
}

// warm light: a shroomlight on the ground floor behind the shopfront, glowstone behind some first-floor panes
const shroom = shopInner.find(([x, z]) => !g.get(x, 1, z)) ?? shopInner[0];
if (shroom) g.set(shroom[0], 1, shroom[1], "shroomlight");
windowInner.forEach(([x, z], i) => { if (i % 2 === 0) g.set(x, 4, z, "glowstone"); });

// roof plant: two iron boxes on the deck, set toward the middle of the roof
const plant = [...interior].sort((a, b) => Math.abs(a[0] - 4) + Math.abs(a[1] - 3) - (Math.abs(b[0] - 4) + Math.abs(b[1] - 3))).slice(0, 2);
for (const [x, z] of plant) g.set(x, 8, z, "iron_block");

g.save(OUT);
