import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075575.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075575.nbt";

const W = 8, H = 20, D = 17;
const ROOF = 8;      // roof deck top layer (about 8 blocks above lowest ground)
const PARAPET = 9;   // parapet course on the perimeter
const FLOOR2 = 4;    // storey line between ground floor and second storey

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const glass = "light_blue_stained_glass_pane";
const wall = "white_concrete";
const base = "light_gray_concrete";
const slab = "smooth_stone";
const awning = "red_concrete";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

function paneProps(axis) {
  // axis "ew": pane runs along x (front/back faces); "ns": runs along z (side faces)
  const p = axis === "ew"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return p;
}

for (const [x, z, gr] of cells) {
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const sideAxis = front || z === D - 1 ? "ew" : "ns";

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base course
  if (perim) g.set(x, gr, z, base);
  else g.set(x, gr, z, slab);

  // Ground storey (shopfront on the front, glazed bays on the sides and back)
  for (let y = gr + 1; y <= 3; y++) {
    if (!perim) continue;
    if (front) {
      if (x === 0 || x === W - 1) { g.set(x, y, z, wall); continue; }
      if (y === 3) { g.set(x, y, z, awning); continue; }      // signage / canopy band
      if (x === 3 || x === 4) continue;                       // entrance opening
      g.set(x, y, z, glass, paneProps("ew"));
    } else {
      if (y === 3) { g.set(x, y, z, wall); continue; }
      if (z % 2 === 1) g.set(x, y, z, glass, paneProps(sideAxis));
      else g.set(x, y, z, wall);
    }
  }

  // Storey line at y=4
  if (FLOOR2 > gr) g.set(x, FLOOR2, z, slab);

  // Upper storey (y 5..7): windows with white mullions, spandrel at y=7
  if (perim) {
    for (let y = 5; y <= 7; y++) {
      if (y === 7) { g.set(x, y, z, wall); continue; }
      if (front) {
        if (x === 0 || x === W - 1) g.set(x, y, z, wall);
        else if ((x - 1) % 2 === 0) g.set(x, y, z, glass, paneProps("ew"));
        else g.set(x, y, z, wall);
      } else {
        if (z % 2 === 1) g.set(x, y, z, glass, paneProps(sideAxis));
        else g.set(x, y, z, wall);
      }
    }
  } else if (x === 1 && z % 4 === 1) {
    // warm light behind the west-side windows
    g.set(x, 5, z, "shroomlight");
  }

  // Roof deck
  g.set(x, ROOF, z, base);

  // Parapet course
  if (perim) g.set(x, PARAPET, z, wall);
}

// Roof plant room: stands on the roof deck, inside the footprint only
for (let x = 2; x <= 5; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!ground.has(`${x},${z}`)) continue;
    g.set(x, PARAPET, z, base);
    g.set(x, PARAPET + 1, z, base);
  }
}

// Small lanterns on the roof plant room corners
for (const [x, z] of [[2, 5], [5, 11]]) {
  if (ground.has(`${x},${z}`)) g.set(x, PARAPET + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(OUT);
