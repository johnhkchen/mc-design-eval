// Building OSMw839833592: no record, so this is a generic two-storey 1980s Taipei
// commercial block. White tiled concrete frame, light-blue tinted glazing in
// bays of three, a dark-trimmed shopfront with a sign band, a single entrance on
// the north street face, and a flat roof with parapet and rooftop plant.
// Lidar roof at about 11 blocks above lowest ground: roof slab y=10, parapet y=11.

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833592";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Materials
const FOUNDATION = "stone_bricks";
const FLOOR = "smooth_stone";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const FRAME = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const ROOF = "smooth_stone";
const PLANT = "light_gray_concrete";
const LIGHT = "glowstone";

const ROOF_Y = 10;     // roof slab
const PARAPET_Y = 11;  // top of parapet, about 11 above lowest ground
const STOREY_Y = 5;    // floor line between storeys
const SHOP_TOP = 3;    // shopfront glazing top row
const SIGN_Y = 4;      // dark sign band over the shopfront
const WIN_BOT = 6;     // upper-floor window band
const WIN_TOP = 8;
const SILL_Y = 9;      // lintel course above windows

// Footprint lookup
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

function exposed(x, z) {
  return {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
}

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: solid body, foundation, floors, roof slab, and interior fit-out.
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  // Ground-floor slab across every footprint cell
  if (gr <= ROOF_Y) g.set(x, gr, z, FLOOR);

  // Storey line and roof slab across every cell, so nothing hangs
  if (STOREY_Y >= gr) g.set(x, STOREY_Y, z, BAND);
  if (ROOF_Y >= gr) g.set(x, ROOF_Y, z, ROOF);
}

// Pass 2: facade on exposed cells.
for (const [x, z, gr] of cells) {
  if (gr > ROOF_Y) continue;
  const e = exposed(x, z);
  if (!(e.N || e.S || e.E || e.W)) continue;

  // Orientation: along-x for N/S faces, along-z for E/W faces
  const nsFace = e.N || e.S;
  const t = nsFace ? x : z;
  const isPier = t % 3 === 0;

  // Shopfront band
  for (let y = gr; y <= SHOP_TOP; y++) {
    if (isPier) g.set(x, y, z, FRAME);
    else if (nsFace) g.set(x, y, z, GLASS, paneNS);
    else g.set(x, y, z, GLASS, paneEW);
  }

  // Sign band over the shopfront
  if (SIGN_Y >= gr) g.set(x, SIGN_Y, z, FRAME);

  // Upper-floor windows
  for (let y = WIN_BOT; y <= WIN_TOP; y++) {
    if (isPier) g.set(x, y, z, WALL);
    else if (nsFace) g.set(x, y, z, GLASS, paneNS);
    else g.set(x, y, z, GLASS, paneEW);
  }

  // Sill and lintel course, storey line, parapet
  g.set(x, SILL_Y, z, WALL);
  g.set(x, PARAPET_Y, z, WALL);
}

// Pass 3: entrance on the north street face, at the centre of that run.
{
  const northCells = cells
    .filter(([x, z, gr]) => gr <= 3 && !has(x, z - 1))
    .map(([x, z, gr]) => ({ x, z, gr }));
  if (northCells.length) {
    const mean = northCells.reduce((s, c) => s + c.x, 0) / northCells.length;
    northCells.sort((a, b) => Math.abs(a.x - mean) - Math.abs(b.x - mean));
    const { x, z, gr } = northCells[0];
    g.set(x, gr, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    if (gr + 1 <= SHOP_TOP) {
      g.set(x, gr + 1, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    }
    // Small canopy over the entrance, one block out from the sign band
    if (SIGN_Y >= gr) g.set(x, SIGN_Y, z, FRAME);
  }
}

// Pass 4: warm light behind some upper-floor windows.
for (const [x, z, gr] of cells) {
  if (gr > 6) continue;
  const e = exposed(x, z);
  if (!(e.N || e.S || e.E || e.W)) continue;
  const nsFace = e.N || e.S;
  const t = nsFace ? x : z;
  if (t % 3 === 0 || t % 6 !== 2) continue;

  // Inward neighbour cell for the lit window
  let ix = x, iz = z;
  if (e.N) iz = z + 1;
  else if (e.S) iz = z - 1;
  else if (e.W) ix = x + 1;
  else if (e.E) ix = x - 1;
  if (!has(ix, iz)) continue;
  if (gOf(ix, iz) > 6) continue;
  g.set(ix, 7, iz, LIGHT);
}

// Pass 5: rooftop plant on interior roof cells.
for (const [x, z, gr] of cells) {
  if (gr > ROOF_Y) continue;
  const e = exposed(x, z);
  if (e.N || e.S || e.E || e.W) continue;
  if ((x * 3 + z * 5) % 7 === 0 && x > 2 && x < W - 3 && z > 2 && z < D - 3) {
    g.set(x, PARAPET_Y, z, PLANT);
    g.set(x, PARAPET_Y + 1, z, PLANT);
  }
}

g.save(`${DIR}/${ID}.nbt`);
