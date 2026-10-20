import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833571";
const W = 18, H = 23, D = 23;
const ROOF = 11;          // roof top (parapet top) above lowest ground
const DECK = 10;          // roof deck / ceiling of storey 2
const FLOOR2 = 5;         // storey 2 floor line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const perimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const faces = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

const g = new Voxels([W, H, D]);

// 1. Shell: foundation, storeys, floor lines, cornice, parapet
for (const [x, z, gr] of cells) {
  const perim = perimeter(x, z);
  const f = faces(x, z);
  const corner = (f.n || f.s) && (f.w || f.e);
  const t = (f.n || f.s) ? x : z;
  const mull = corner || t % 3 === 0;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= DECK; y++) {
    let b = null;
    if (y === gr) {
      b = perim ? "polished_andesite" : "smooth_stone";           // base course / ground floor slab
    } else if (y <= 4) {
      if (perim) b = (y === 4 || mull) ? "white_concrete" : "glass"; // shopfront + sign band
    } else if (y === FLOOR2) {
      b = perim ? "white_concrete" : "light_gray_concrete";        // storey 2 floor / spandrel
    } else if (y <= 9) {
      if (perim) {
        if (mull) b = "white_concrete";
        else if (y === 6 || y === 9) b = "white_terracotta";        // spandrels
        else b = "light_blue_stained_glass";                       // storey 2 windows
      }
    } else if (y === DECK) {
      b = perim ? "smooth_stone" : "light_gray_concrete";          // cornice / roof deck
    }
    if (b) g.set(x, y, z, b);
  }

  if (perim) g.set(x, ROOF, z, "white_concrete");                  // parapet
}

// 2. Entrance on the north face (z = 0), centred on x 8..9
for (let x = 7; x <= 10; x++) {
  const gr0 = G.get(`${x},0`);
  if (gr0 === undefined || gr0 > 2) continue;
  g.set(x, 4, 0, "smooth_stone");                                  // canopy / lintel
  if (x === 7 || x === 10) {
    for (let y = gr0 + 1; y <= 3; y++) g.set(x, y, 0, "white_concrete");
  } else {
    for (let y = gr0 + 1; y <= 3; y++) g.set(x, y, 0, "glass");   // transom
    if (gr0 + 2 <= 3) {
      const hinge = x === 8 ? "left" : "right";
      g.set(x, gr0 + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
      g.set(x, gr0 + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
    }
  }
}

// 3. Warm lights in the rooms behind some window bays
for (const [x, z, gr] of cells) {
  if (!perimeter(x, z)) continue;
  const f = faces(x, z);
  if ((f.n || f.s) && (f.w || f.e)) continue;             // skip corners
  const t = (f.n || f.s) ? x : z;
  if (t % 3 === 0 || t % 6 !== 1) continue;               // every other bay, away from mullions
  let ix = x, iz = z;
  if (f.n) iz = z + 1;
  else if (f.s) iz = z - 1;
  else if (f.w) ix = x + 1;
  else if (f.e) ix = x - 1;
  if (!has(ix, iz) || perimeter(ix, iz)) continue;
  g.set(ix, 9, iz, "lantern", { hanging: "true", waterlogged: "false" });   // storey 2, hung from deck
  if (gr + 1 <= 4) g.set(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" }); // storey 1, standing
}

// 4. Roof plant: two rooftop equipment boxes on the deck
const boxes = [[4, 7, 8, 10], [11, 13, 14, 15]];
for (const [x0, x1, z0, z1] of boxes) {
  let ok = true;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!has(x, z) || perimeter(x, z)) ok = false;
  if (!ok) continue;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (G.get(`${x},${z}`) > DECK - 1) continue;
    g.set(x, ROOF, z, "light_gray_concrete");
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
