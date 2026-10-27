// Way 764144193: a three-storey brick commercial block (c. 1930s, Auckland Art Deco-era shop-office) on a plinth,
// with a two-storey wing to the west, a set-back top storey and a terrace over the step, and a shopfront on its
// north face. Massing comes from the lidar roof heights, smoothed into two tiers (12 and 10) by majority vote.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_764144193.cells.json`, "utf8"));
const SIZE = [24, 25, 12];

// ---- footprint, tiers and set-back -----------------------------------------------------------------------------------
const k = (x, z) => `${x},${z}`;
const inF = (x, z) => cells.some(([a, b]) => a === x && b === z);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];            // +x, -x, +z, -z (the -z face is the north shopfront)
const sides = (x, z, inside) => NB.filter(([dx, dz]) => !inside(x + dx, z + dz));

// tall (roof >= 11) or low, smoothed: a cell takes the majority of itself and its footprint neighbours, twice
let tall = new Map(cells.map(([x, z, , r]) => [k(x, z), r >= 11]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key, self] of tall) {
    const [x, z] = key.split(",").map(Number);
    let on = self ? 1 : 0, n = 1;
    for (const [dx, dz] of NB) if (inF(x + dx, z + dz)) { n++; if (tall.get(k(x + dx, z + dz))) on++; }
    next.set(key, on * 2 > n || (on * 2 === n && self));
  }
  tall = next;
}
const isH = (x, z) => inF(x, z) && !!tall.get(k(x, z));
// top storey: the tall cells not on the north or east edge of the tall tier (the set-back steps in there)
const isS3 = (x, z) => isH(x, z) && isH(x + 1, z) && isH(x, z - 1);
const notS3 = (x, z) => !isS3(x, z);

// ---- helpers ---------------------------------------------------------------------------------------------------------
const B = new Map();                                       // "x,y,z" -> { block, state, face }
const put = (x, y, z, block, state, face) => B.set(`${x},${y},${z}`, { block, state, face });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

// doorway: a north-face window column near the middle of the front
const doorCell = cells
  .filter(([x, z]) => !inF(x, z - 1) && x % 4 === 1)
  .sort((a, b) => Math.abs(a[0] - 11) - Math.abs(b[0] - 11))[0];

// rows of a storey, by the band they carry (1-8 are the lower storeys, 9-12 the top storey and its parapet)
const ROW = { 1: "base", 2: "win", 3: "win", 4: "head", 5: "string", 6: "win", 7: "win", 8: "sill",
              9: "string", 10: "win", 11: "win", 12: "parapet" };

function windowBlock(x, y, z, face) {
  if (face[1] === -1 && y < 4) return "cyan_stained_glass_pane";            // shop glass on the north front
  if ((x * 3 + z * 5 + y * 7) % 9 === 0) return y >= 10 ? "shroomlight" : "glowstone";   // a few warm lit windows
  return "light_blue_stained_glass_pane";
}

// ---- build ----------------------------------------------------------------------------------------------------------
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const s3 = isS3(x, z), ring = isH(x, z) && !s3;
  const lowF = sides(x, z, inF);                           // exterior faces of the lower storeys
  const highF = s3 ? sides(x, z, (a, b) => isS3(a, b)) : lowF;   // exterior faces of the top storey / cornice line
  const north = lowF.some(([, dz]) => dz === -1);          // the shopfront side

  // plinth under every footprint cell, then the storey slabs (y 1, 5, 9) that carry each floor and the roofs
  put(x, 0, z, "stone_bricks");
  put(x, 1, z, lowF.length ? "stone_bricks" : "smooth_stone");
  put(x, 5, z, lowF.length ? "smooth_quartz" : "smooth_stone");
  if (highF.length) put(x, 9, z, "smooth_quartz");
  else put(x, 9, z, s3 || ring ? "smooth_stone" : "gray_concrete");   // wing roof, terrace paving, top floor slab
  if (s3) put(x, 12, z, highF.length ? "smooth_quartz" : "gray_concrete");   // parapet, else the flat roof
  if (ring && lowF.length) put(x, 10, z, "smooth_quartz");                  // terrace balustrade

  // the walls: rows 1-8 stand on the lower faces, rows 9-12 on the top storey's faces (the cornice line above)
  for (const [yStr, band] of Object.entries(ROW)) {
    const y = Number(yStr), faces = y >= 9 ? highF : lowF;
    if (!faces.length || (y >= 10 && !s3)) continue;        // nothing above the wing and the terrace
    if (faces.length > 1) { put(x, y, z, "smooth_quartz", null, faces[0]); continue; }   // corner quoins
    const face = faces[0];
    if (y < 4 && face[1] === -1 && x === doorCell[0] && z === doorCell[1]) {
      const half = y === 2 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }, face);
      continue;
    }
    const u = face[0] !== 0 ? z : x;                         // along the face
    const pier = u % 4 === 0 || u % 4 === 3;                 // brick piers; the windows sit between them
    let block;
    if (band === "base") block = "stone_bricks";
    else if (band === "head" || band === "sill") {           // shopfront fascia, or cream surrounds over and under the windows
      block = north && y < 4 ? "dark_oak_planks" : pier ? "bricks" : "smooth_quartz";
    }
    else if (band === "string" || band === "parapet") block = "smooth_quartz";
    else if (pier) block = north && y < 4 ? "polished_andesite" : "bricks";
    else block = windowBlock(x, y, z, face);
    put(x, y, z, block, null, face);
  }
}

// ---- roof equipment: an air-cooled unit on the top roof and one on the wing deck ---------------------------------
for (const [x, z] of [[13, 6], [14, 6], [19, 8], [20, 8]]) if (isS3(x, z)) put(x, 13, z, "iron_block");
for (const [x, z] of [[3, 3], [4, 3]]) if (inF(x, z) && !isH(x, z)) put(x, 10, z, "iron_block");

// glass panes connect to the solid or glazed cells beside them, as in the game
for (const [key, e] of B) {
  if (!e.block.endsWith("_stained_glass_pane")) continue;
  const [x, y, z] = key.split(",").map(Number);
  const on = (v) => (v ? "true" : "false");
  if (e.face[1] !== 0) e.state = { north: "false", east: on(at(x + 1, y, z)), south: "false", west: on(at(x - 1, y, z)) };
  else e.state = { north: on(at(x, y, z - 1)), east: "false", south: on(at(x, y, z + 1)), west: "false" };
}

// ---- write ----------------------------------------------------------------------------------------------------------
const g = new Voxels(SIZE);
for (const [key, e] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, e.block, e.state);
}
const out = g.save(`${DIR}/way_764144193.nbt`);
console.log(`wrote way_764144193.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
