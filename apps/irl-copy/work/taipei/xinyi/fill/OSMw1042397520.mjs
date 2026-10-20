import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397520";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 15;
const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (absolute y of the cell's ground)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inF = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

// Lowest ground under the footprint: the record's y0 reference
const B = Math.min(...G.values());

// Footprint centre
let sx = 0, sz = 0;
for (const [x, z] of G.keys().toArray ? [] : []) {}
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length);
const cz = Math.round(sz / cells.length);

// Entrance: the south-facing edge cell (z+1 outside) nearest the centre line
let doorX = null;
for (const [x, z] of cells) {
  if (!inF(x, z + 1)) {
    if (doorX === null || Math.abs(x - cx) < Math.abs(doorX - cx)) doorX = x;
  }
}
const doorZ = (() => {
  for (const [x, z] of cells) if (x === doorX && !inF(x, z + 1)) return z;
  return null;
})();

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Distance from a cell to the nearest non-footprint cell (1 = edge)
const edgeDist = (x, z) => {
  let best = Infinity;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let k = 1;
    while (inF(x + k * dx, z + k * dz)) k++;
    best = Math.min(best, k);
  }
  return best;
};

// Plant room footprint on the roof (inset from the parapet)
const inPlant = (x, z) =>
  x >= cx - 4 && x <= cx + 4 && z >= cz - 3 && z <= cz + 3 && edgeDist(x, z) >= 3;

// Window / pillar pattern on a facade: pillars every 3 blocks along the wall
const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const nN = !inF(x, z - 1), nS = !inF(x, z + 1);
  const nW = !inF(x - 1, z), nE = !inF(x + 1, z);
  const edge = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);
  const wallNS = (nN || nS) && !corner;   // wall runs east-west
  const wallEW = (nW || nE) && !corner;   // wall runs north-south
  const u = wallNS ? x : z;               // position along the wall

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: storey slab, roof deck, no interior fit-out
    put(x, B + 5, z, "smooth_stone");
    put(x, B + 10, z, "light_gray_concrete");
    // Warm lights just inside the facade, behind the glass
    if (edgeDist(x, z) === 2 && (x + z) % 4 === 0) {
      put(x, B + 2, z, "glowstone");
      put(x, B + 7, z, "glowstone");
    }
  } else {
    for (let rel = 0; rel <= 11; rel++) {
      const y = B + rel;
      if (y < gr) continue; // already foundation below this cell's ground
      if (corner) { put(x, y, z, rel === 0 ? "stone_bricks" : "white_concrete"); continue; }

      if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }           // base course
      if (rel === 4 || rel === 5) { put(x, y, z, "smooth_stone"); continue; } // belt + floor line
      if (rel === 9) { put(x, y, z, "white_concrete"); continue; }          // upper spandrel
      if (rel === 10) { put(x, y, z, "smooth_stone"); continue; }           // cornice
      if (rel === 11) { put(x, y, z, "white_concrete"); continue; }         // parapet

      const winRow = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);
      if (!winRow) { put(x, y, z, "white_concrete"); continue; }

      // Entrance door on the south facade
      if (nS && x === doorX && z === doorZ) {
        if (rel === 1) { put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (rel === 2) { put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (rel === 3) { put(x, y, z, "glass_pane", GLASS_NS); continue; }
      }

      if (u % 3 === 0) { put(x, y, z, "white_concrete"); continue; } // mullion pillar
      if (wallNS) put(x, y, z, "glass_pane", GLASS_NS);
      else put(x, y, z, "glass_pane", GLASS_EW);
    }
  }
}

// Roof: smooth roof deck on perimeter, roof plant room with lantern-lit mast
for (const [x, z] of cells) {
  if (edgeDist(x, z) === 1) continue;
  put(x, B + 10, z, "light_gray_concrete");
}
for (const [x, z] of cells) {
  if (!inPlant(x, z)) continue;
  const perim = edgeDist(x, z) > 0 && (x === cx - 4 || x === cx + 4 || z === cz - 3 || z === cz + 3);
  const pu = x; // pattern along the plant walls
  if (perim) {
    put(x, B + 11, z, "stone_bricks");
    if (pu % 3 === 0) put(x, B + 12, z, "white_concrete");
    else put(x, B + 12, z, "glass_pane", (x === cx - 4 || x === cx + 4) ? GLASS_EW : GLASS_NS);
  }
  put(x, B + 13, z, "light_gray_concrete"); // plant room roof
}
put(cx, B + 14, cz, "lantern", { hanging: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);
