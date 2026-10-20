import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280214";
const W = 20, H = 33, D = 19;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: a south-facing non-corner perimeter cell nearest the footprint's mid x.
const midX = cells.reduce((s, [x]) => s + x, 0) / cells.length;
let doorX = null, bestDist = Infinity;
for (const [x, z] of cells) {
  if (!has(x, z + 1) && has(x - 1, z) && has(x + 1, z)) {
    const d = Math.abs(x - midX);
    if (d < bestDist) { bestDist = d; doorX = x; }
  }
}

const TOP_REL = 21; // parapet sits 21 blocks above each cell's ground (roof ~21 above lowest ground)

for (const [x, z, gr] of cells) {
  const ex = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const perim = ex.n || ex.s || ex.w || ex.e;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey and roof slab, air between (no interiors)
    for (let k = 0; k <= 4; k++) put(x, gr + 5 * k, z, "light_gray_concrete");
    // Roof plant: small mechanical boxes on a lattice of interior cells
    if (x % 4 === 1 && z % 4 === 1) {
      put(x, gr + 21, z, "gray_concrete");
      put(x, gr + 22, z, "gray_concrete");
    }
    continue;
  }

  // Perimeter: full wall column with facade articulation
  const face = ex.n ? "n" : ex.s ? "s" : ex.w ? "w" : "e";
  const alongN = face === "n" || face === "s";
  const i = alongN ? x : z;
  const isDoor = face === "s" && x === doorX;
  const paneProps = alongN
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let rel = 0; rel <= TOP_REL; rel++) {
    const y = gr + rel;
    let b = "air", p;
    if (rel === 0) {
      b = "stone_bricks"; // base course
    } else if (rel <= 3) {
      if (isDoor && rel <= 2) {
        b = "oak_door";
        p = {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (i % 4 === 0) {
        b = "white_concrete"; // shopfront pier
      } else {
        b = "light_blue_stained_glass"; // shopfront glazing
      }
    } else if (rel === 4) {
      b = "white_concrete"; // ground-floor transom band
    } else if (rel === 20) {
      b = "light_gray_concrete"; // cornice
    } else if (rel === 21) {
      b = "white_concrete"; // parapet
    } else {
      const r = rel % 5;
      if (r === 0) b = "light_gray_concrete"; // storey string course
      else if (r === 4) b = "white_concrete"; // window head band
      else if (i % 3 === 0) b = "white_concrete"; // mullion pier
      else if (r === 2 && (i * 7 + rel * 3 + x * z) % 11 === 0) b = "glowstone"; // warm light behind glass
      else { b = "light_blue_stained_glass_pane"; p = paneProps; }
    }
    put(x, y, z, b, p);
  }

  // Roof plant on perimeter-adjacent corners is kept clear; interior plant handled above.
}

g.save(`${DIR}/${ID}.nbt`);
