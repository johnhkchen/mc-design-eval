// Federal City Apartments, Auckland (OSM way 632021114): a 1980s-style concrete apartment block on a stone plinth.
// The LINZ lidar roof is flat at 53 blocks over the whole footprint, so the massing is one prism with no invented
// setbacks: 12 storeys of 4 blocks from a datum of 3 (the highest ground under the footprint), a parapet and roof
// plant on top. White concrete spandrels, grey mullions, tinted glass, a polished base course, a shopfront-height
// ground floor with a lobby door under a lintel canopy, and warm glowstone lights in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_632021114.cells.json`, "utf8"));

const W = 50, D = 48, H = 66;
const DATUM = 3;      // ground floor slab: the highest ground under the footprint (cells sit 0..3)
const FLOORS = 12;    // storeys; the roof cap is the floor slab at DATUM + 4*FLOORS = 51, parapet 52 (top 53 = lidar)

const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => has.has(`${x},${z}`);
const FACES = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const exposed = (x, z) => FACES.filter(([, dx, dz]) => !inF(x + dx, z + dz)).map(([f]) => f);

// the entrance: the middle of the north face (z min), where the street is taken to be
const northFace = cells.filter(([x, z]) => exposed(x, z).includes("N")).map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = northFace[Math.floor(northFace.length / 2)];
const canopy = new Set([doorX - 1, doorX, doorX + 1]);

const g = new Voxels([W, H, D]);

// a window column: every third block along a face is a grey mullion, corners are piers; some windows are lit
function wall(x, z, k, faces) {
  const yS = DATUM + 1 + 4 * k, yA = yS + 1, yB = yS + 2;    // spandrel row, then the two glass rows
  const ns = faces.includes("N") || faces.includes("S"), ew = faces.includes("E") || faces.includes("W");
  const u = ns && ew ? null : ns ? x : z;
  const pier = u === null || u % 3 === 0;
  const lit = !pier && (x * 7 + z * 13 + k * 5) % 9 === 0;
  if (k === 0) {
    g.set(x, yS, z, "polished_andesite");                           // base course at the street
    if (x === doorX && z === doorZ) {
      const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
      g.set(x, yS, z, "dark_oak_door", { ...door, half: "lower" });
      g.set(x, yA, z, "dark_oak_door", { ...door, half: "upper" });
      g.set(x, yB, z, "light_gray_concrete");
      return;
    }
    if (faces.includes("N") && canopy.has(x)) { g.set(x, yB, z, "stone_bricks"); return; }   // the canopy lintel
    const shop = pier ? "smooth_stone" : "light_blue_stained_glass";
    g.set(x, yA, z, shop); g.set(x, yB, z, shop);
    return;
  }
  g.set(x, yS, z, "white_concrete");
  const face = pier ? "smooth_stone" : "light_blue_stained_glass";
  g.set(x, yA, z, lit ? "glowstone" : face);
  g.set(x, yB, z, face);
}

for (const [x, z] of cells) {
  const faces = exposed(x, z);
  // foundation: solid from y 0 up to the datum, so nothing floats on the slope
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, y === DATUM - 1 && faces.length ? "polished_andesite" : "stone_bricks");
  // a slab per storey: the floor line on the wall, the roof cap at the top
  for (let k = 0; k <= FLOORS; k++) g.set(x, DATUM + 4 * k, z, k === FLOORS ? "gray_concrete" : "light_gray_concrete");
  if (!faces.length) {
    // roof plant on the flat roof, away from the parapet
    const px = x % 9, pz = z % 9;
    if ((px === 4 || px === 5) && (pz === 4 || pz === 5)) {
      g.set(x, DATUM + 4 * FLOORS + 1, z, "light_gray_concrete");
      g.set(x, DATUM + 4 * FLOORS + 2, z, "iron_block");
    }
    continue;
  }
  for (let k = 0; k < FLOORS; k++) wall(x, z, k, faces);
  g.set(x, DATUM + 4 * FLOORS + 1, z, "light_gray_concrete");        // parapet
}

const out = `${DIR}/way_632021114.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries`);
