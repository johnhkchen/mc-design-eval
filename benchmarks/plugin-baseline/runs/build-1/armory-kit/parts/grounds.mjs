// Grounds and lighting (P6): the Armory lawn with its curving path and plane trees, the planting strips along the hall,
// the lightwell courtyard, the garden glass sculptures in plots 1 and 2, and the lamp posts along every path.
// The ground layer (y 0) is laid here as grass or paving: it is the one layer earlier parts leave writable, and every
// other write stays in air. Lamps and trees keep off the paths and off each other's crowns.
import { rng, lawnPath, planeTree, lampPost, glassBlossom, POLISHED_ANDESITE, GRASS_BLOCK, SHORT_GRASS, AZALEA, FLOWERING_AZALEA } from "../vocab.mjs";

// the lawn's path (owner's comment): from the plot's north edge it curves gently south along the hall's lawn side, past
// the glass arcade, then swings east to the red canopy at the pavilion's north door; the middle of the lawn stays open
const LAWN_PATH = [[110, 0], [112, 12], [116, 26], [119, 42], [119, 58], [117, 72], [116, 84], [122, 91], [140, 92], [160, 92], [171, 94]];
// short spurs from the arcade's lawn doors (z 55..56, 79..80) out to the path
const SPURS = [[[108, 55], [119, 55]], [[108, 79], [118, 79]]];
// the west strip's path to the hall's side door at x 4, z 85..86
const WEST_PATH = [[0, 85], [3, 85]];

// the centre cells of a path (the same walk lawnPath takes), so trees and lamps can keep clear of it
function centreCells(points) {
  const out = new Set();
  for (let i = 0; i + 1 < points.length; i++) {
    const [[ax, az], [bx, bz]] = [points[i], points[i + 1]];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(bz - az), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / steps);
      const z = Math.round(az + ((bz - az) * s) / steps);
      out.add(`${x},${z}`);
    }
  }
  return out;
}

// every cell a path covers at width 2, across the path's direction of travel (lawnPath's own rule)
function pathCover(points, width = 2) {
  const out = new Set();
  for (const key of centreCells(points)) {
    const [x, z] = key.split(",").map(Number);
    for (let k = 0; k < width; k++) { out.add(`${x},${z + k}`); out.add(`${x + k},${z}`); }
  }
  return out;
}

// A London plane: a tall pale trunk (birch_log, 8..11 high) with a few short boughs, and a broad, open crown of
// persistent oak_leaves (an ellipsoid ~11 wide, 5 deep) with gaps bitten out of its rim; h = the top of the crown.
function londonPlane(g, { x, z, h, rand }) {
  const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
  const trunkTop = h - 4, cy = h - 2, r = 5, ry = 2.6;
  const set = (xx, yy, zz, b, st) => { if (g.isAir(xx, yy, zz)) g.set(xx, yy, zz, b, st); };
  for (let y = 1; y <= trunkTop; y++) set(x, y, z, "birch_log", { axis: "y" });
  for (const [dx, dz, ax] of [[1, 0, "x"], [-1, 0, "x"], [0, 1, "z"], [0, -1, "z"]]) {
    const len = 2 + Math.floor(rand() * 2);                     // boughs rise into the crown, leaves all round them
    for (let i = 1; i <= len; i++) set(x + dx * i, trunkTop + (i > 1 ? 1 : 0), z + dz * i, "birch_log", { axis: ax });
  }
  const crown = new Set();
  for (let dy = -3; dy <= 3; dy++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const d = (dx * dx + dz * dz) / (r * r) + (dy * dy) / (ry * ry);
    if (d > 1) continue;
    if (d > 0.6 && rand() < 0.3) continue;                      // an open, ragged rim
    crown.add(`${x + dx},${cy + dy},${z + dz}`);
  }
  // drop rim leaves left hanging by a single face (they read as stray blocks)
  const solid = (k) => crown.has(k) || /log/.test(g.blockAt(...k.split(",").map(Number)));
  for (let pass = 0; pass < 3; pass++) for (const k of [...crown]) {
    const [a, b, c] = k.split(",").map(Number);
    const n = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].filter(([p, q, w]) => solid(`${a + p},${b + q},${c + w}`)).length;
    if (n <= 1) crown.delete(k);
  }
  for (const k of crown) set(...k.split(",").map(Number), "oak_leaves", LEAF);
}

// a 5 x 5 crown footprint around a tree centre
function crownCover(x, z) {
  const out = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) out.push(`${x + dx},${z + dz}`);
  return out;
}

export function build(g) {
  // ---- ground layers: grass where the plants go, paving where people walk ---------------------------------------
  // Lawn x108..220 z0..95 (the open north-east; no building stands here)
  g.fill([108, 0, 0], [220, 0, 95], GRASS_BLOCK);
  // Plot 0 planting strips: west x0..3 z36..131 and east x104..107 z36..119 (4 wide along the hall)
  g.fill([0, 0, 36], [3, 0, 131], GRASS_BLOCK);
  g.fill([104, 0, 36], [107, 0, 119], POLISHED_ANDESITE);   // the floor of the lawn-side glass arcade
  // Plot 1 garden beds: east of the vault x248..252 and west x221..223 (z 0..46)
  g.fill([248, 0, 0], [252, 0, 46], GRASS_BLOCK);
  g.fill([221, 0, 0], [223, 0, 46], GRASS_BLOCK);
  // Plot 2 gardens: x253..256 z8..91, x253..260 z92..95, x253..268 z96..103, and x293..296 z8..11
  g.fill([253, 0, 8], [256, 0, 91], GRASS_BLOCK);
  g.fill([253, 0, 92], [260, 0, 95], GRASS_BLOCK);
  g.fill([253, 0, 96], [268, 0, 103], GRASS_BLOCK);
  g.fill([293, 0, 8], [296, 0, 11], GRASS_BLOCK);

  // ---- paths ------------------------------------------------------------------------------------------------------
  lawnPath(g, { points: LAWN_PATH, y: 0, width: 2 });
  lawnPath(g, { points: WEST_PATH, y: 0, width: 2 });
  for (const sp of SPURS) lawnPath(g, { points: sp, y: 0, width: 2 });
  const paths = pathCover(LAWN_PATH);
  const westPath = pathCover(WEST_PATH);

  // ---- one row of tall London planes along the lawn side of the path, evenly spaced ----------------------------------
  const pathList = [...centreCells(LAWN_PATH)].map((k) => k.split(",").map(Number));
  const crowns = new Set();
  const trees = [];
  const trand = rng(11);
  for (let i = 6; i < pathList.length - 4; i += 15) {
    const [ax, az] = pathList[i - 2], [bx, bz] = pathList[i + 2];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    const nx = (bz - az) / len, nz = -(bx - ax) / len;          // the side away from the hall
    const x = Math.round(pathList[i][0] + 7 * nx), z = Math.round(pathList[i][1] + 7 * nz);
    if (x < 114 || x > 214 || z < 6 || z > 88) continue;
    trees.push([x, z]);
    for (const c of crownCover(x, z)) crowns.add(c);
  }
  for (const [x, z] of trees) londonPlane(g, { x, z, h: 13 + Math.floor(trand() * 5), rand: trand });

  // ---- lamp posts along the lawn path, every ~9 cells, set to one side of it ----------------------------------
  let placedLamps = 0;
  for (let i = 5; i < pathList.length; i += 9) {
    const [px, pz] = pathList[i];
    for (const [dx, dz] of [[-3, 0], [0, 3], [3, 0], [0, -3]]) {
      const x = px + dx, z = pz + dz;
      const key = `${x},${z}`;
      if (x < 108 || x > 220 || z < 0 || z > 95) continue;
      if (paths.has(key) || crowns.has(key)) continue;
      lampPost(g, { x, z });
      placedLamps++;
      break;
    }
  }

  // ---- west strip x0..3: lamps every ~9 cells, off the door path ----------------------------------------------------
  for (const z of [44, 53, 62, 71, 80, 89, 98, 107, 116, 125]) {
    if (westPath.has(`1,${z}`)) continue;
    lampPost(g, { x: 1, z });
  }


  // ---- planting in the strips: grass with short grass and azaleas, on the air above the ground ---------------------
  const rand = rng(7);
  const plant = (x, z) => {
    if (!g.isAir(x, 1, z)) return;
    const r = rand();
    if (r < 0.28) g.set(x, 1, z, SHORT_GRASS);
    else if (r < 0.33) g.set(x, 1, z, AZALEA);
    else if (r < 0.37) g.set(x, 1, z, FLOWERING_AZALEA);
  };
  for (let z = 36; z <= 131; z++) for (let x = 0; x <= 3; x++) if (!westPath.has(`${x},${z}`)) plant(x, z);

  // ---- lightwell E0 x104..107 z128..131: paved courtyard, one small tree, a lamp post -------------------------
  g.fill([104, 0, 128], [107, 0, 131], POLISHED_ANDESITE);
  for (let y = 1; y <= 3; y++) g.set(105, y, 129, "oak_log", { axis: "y" });
  for (let y = 3; y <= 4; y++) for (let x = 104; x <= 106; x++) for (let z = 128; z <= 130; z++) {
    if (x === 105 && z === 129 && y === 3) continue;
    if (g.isAir(x, y, z)) g.set(x, y, z, "oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
  }
  g.set(105, 5, 129, "oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
  lampPost(g, { x: 107, z: 128 });

  // ---- Glasshouse garden (plot 1): glass blossoms east of the vault, and two lamps ---------------------------------
  glassBlossom(g, { x: 250, z: 8, h: 4, colors: ["red", "yellow"] });
  glassBlossom(g, { x: 250, z: 22, h: 3, colors: ["orange", "red"] });
  glassBlossom(g, { x: 250, z: 38, h: 4, colors: ["yellow", "orange"] });
  glassBlossom(g, { x: 222, z: 22, h: 3, colors: ["red", "orange"] });
  lampPost(g, { x: 249, z: 15 });
  lampPost(g, { x: 249, z: 31 });

  // ---- Galleries garden (plot 2): glass blossoms along the strips, one at the east gate, two lamps ---------------
  glassBlossom(g, { x: 255, z: 20, h: 4, colors: ["red", "yellow"] });
  glassBlossom(g, { x: 255, z: 52, h: 3, colors: ["orange", "red"] });
  glassBlossom(g, { x: 255, z: 84, h: 4, colors: ["yellow", "orange"] });
  glassBlossom(g, { x: 258, z: 99, h: 3, colors: ["red", "orange"] });
  glassBlossom(g, { x: 265, z: 101, h: 4, colors: ["yellow", "red"] });
  glassBlossom(g, { x: 295, z: 9, h: 3, colors: ["orange", "yellow"] });
  lampPost(g, { x: 254, z: 36 });
  lampPost(g, { x: 254, z: 68 });

  console.log(`grounds: ${trees.length} trees, ${placedLamps} lawn lamps`);
}
