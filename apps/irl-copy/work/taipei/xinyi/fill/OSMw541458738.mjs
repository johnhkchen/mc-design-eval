import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458738";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr]) => [x, z, gr]);

const W = 25, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Massing: two storeys of ~5 blocks, cornice at y=10, parapet to y=11.
const LINE = 5;   // storey line / floor slab between storeys
const ROOF = 10;  // roof deck and cornice course
const PARAPET = 11;

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Outward normals. axis = the coordinate running along that face.
const DIRS = [
  { dx: 0, dz: -1, name: "north", axis: "x" },
  { dx: 0, dz: 1, name: "south", axis: "x" },
  { dx: -1, dz: 0, name: "west", axis: "z" },
  { dx: 1, dz: 0, name: "east", axis: "z" },
];

const paneNS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, interior floors/roof, and exterior facade columns.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (gr > ROOF) continue;

  const faces = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  const edge = faces.length > 0;

  if (!edge) {
    // Interior: floor slab at storey line, roof deck at top, air between.
    for (let y = gr; y <= ROOF; y++) {
      if (y === LINE || y === ROOF) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = faces.length >= 2;
  const face = faces[0];
  const idx = face.axis === "x" ? x : z;
  const pier = corner || idx % 3 === 0;

  for (let y = gr; y <= ROOF; y++) {
    let b, props;
    if (y === ROOF || y === LINE) {
      b = "smooth_quartz";                      // cornice and storey line
    } else if (y === gr) {
      b = "polished_andesite";                  // base course
    } else if (pier) {
      b = "smooth_quartz";                      // piers
    } else if (y <= 3) {
      b = "light_blue_stained_glass";           // shopfront glass
    } else if (y === 4) {
      b = "smooth_quartz";                      // shopfront lintel
    } else if (y <= 8) {
      b = "gray_stained_glass_pane";            // upper storey windows
      props = face.axis === "x" ? paneNS : paneEW;
    } else if (y === 9) {
      b = "light_gray_concrete";                // spandrel
    } else {
      b = "white_concrete";
    }
    if (props) g.set(x, y, z, b, props);
    else g.set(x, y, z, b);
  }

  // Parapet cap on the outer edge.
  if (gr <= ROOF) g.set(x, PARAPET, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind some upper windows (interior cell must be open air there).
  if (!corner && !pier && idx % 6 === 1) {
    const ix = x - face.dx, iz = z - face.dz;
    const ig = ground.get(key(ix, iz));
    if (ig !== undefined && ig <= 6) g.set(ix, 7, iz, "glowstone");
  }
}

// Pass 2: entrance on the north (street) face, centred on x=12.
for (const [x, z, gr] of cells) {
  if (x !== 12 || z !== 0 || has(x, z - 1)) continue;
  if (gr <= 2) {
    const dprops = { facing: "north", hinge: "left", open: "false", powered: "false" };
    g.set(x, gr, z, "oak_door", { ...dprops, half: "lower" });
    g.set(x, gr + 1, z, "oak_door", { ...dprops, half: "upper" });
    if (gr <= 1) g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 3: rooftop plant on a few interior roof cells.
const plant = [[5, 2], [6, 2], [5, 3], [6, 3], [16, 4], [17, 4]];
for (const [x, z] of plant) {
  const gr = ground.get(key(x, z));
  if (gr === undefined || gr > ROOF) continue;
  const edge = DIRS.some((d) => !has(x + d.dx, z + d.dz));
  if (edge) continue;
  g.set(x, PARAPET, z, "light_gray_concrete");
  g.set(x, PARAPET + 1, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
