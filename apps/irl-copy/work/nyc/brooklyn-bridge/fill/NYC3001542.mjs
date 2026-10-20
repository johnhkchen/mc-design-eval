import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001542.cells.json`, "utf8"));

const W = 7, H = 20, D = 18;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  cm.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => cm.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const c of cells) {
  minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
  minZ = Math.min(minZ, c[1]); maxZ = Math.max(maxZ, c[1]);
}

// One flat roof tier from the median lidar height, rounded to an even course
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const R = 2 * Math.round(medRoof / 2);

// Entrance on the long (18-block) street-side west face, nearest its middle
const midZ = (minZ + maxZ) / 2;
let door = null;
{
  let best = Infinity;
  for (const c of cells) {
    const [x, z] = c;
    const edgeN = !has(x, z - 1), edgeS = !has(x, z + 1), edgeW = !has(x - 1, z);
    if (edgeW && !edgeN && !edgeS) {
      const d = Math.abs(z - midZ);
      if (d < best) { best = d; door = { x, z, facing: "west" }; }
    }
  }
}

// Window bay pattern along a face: piers every 3rd block, pairs of windows between
const isPier = (i) => i % 3 === 0;

for (const c of cells) {
  const [x, z] = c;
  const { gr, roof } = cm.get(`${x},${z}`);
  const g0 = gr;
  const top = Math.min(Math.max(R, g0 + 4), H - 2);

  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  const edgeN = !has(x, z - 1), edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z), edgeE = !has(x + 1, z);
  const edge = edgeN || edgeS || edgeW || edgeE;
  const corner = (edgeN || edgeS) && (edgeW || edgeE);
  const zFace = (edgeN || edgeS) && !(edgeW || edgeE);
  const xFace = (edgeW || edgeE) && !(edgeN || edgeS);

  for (let y = g0; y < top; y++) {
    const off = y - g0;

    if (y === top - 1) {
      put(x, y, z, "smooth_stone"); // roof deck / cornice course
      continue;
    }

    if (!edge) {
      if (off % 2 === 0) put(x, y, z, "smooth_stone"); // floor slabs
      continue;
    }

    if (off === 0) {
      put(x, y, z, "stone_bricks"); // rusticated base course
    } else if (off % 2 === 0) {
      put(x, y, z, "smooth_stone"); // storey string course / lintel line
    } else {
      put(x, y, z, "bricks");
      if (!corner) {
        let i = null, props = null;
        if (zFace) { i = x - minX; props = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }; }
        else if (xFace) { i = z - minZ; props = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }; }
        if (i !== null && !isPier(i)) {
          put(x, y, z, "glass_pane", props);
          // Warm light behind selected panes, in the air gap just inside
          let ix = x, iz = z;
          if (edgeN) iz = z + 1;
          else if (edgeS) iz = z - 1;
          else if (edgeW) ix = x + 1;
          else if (edgeE) ix = x - 1;
          const inwardEdge = !has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz);
          if (has(ix, iz) && !inwardEdge && ((x * 7 + z * 3 + y) % 9 === 0)) {
            put(ix, y, iz, "shroomlight");
          }
        }
      }
    }
  }

  // Parapet course, and a cornice band one block above the deck line on the edges
  if (edge) put(x, top, z, "smooth_stone");
  // Roof chimneys on interior roof cells
  if (!edge && x === 2 && z % 6 === 3) {
    for (let y = top; y < Math.min(top + 2, H); y++) put(x, y, z, "bricks");
  }
}

// Entrance: stone surround either side, then the two-block door
if (door) {
  const { x, z, facing } = door;
  const g0 = cm.get(`${x},${z}`).gr;
  // Stone jambs flanking the door along the face
  for (const dz of [-1, 1]) {
    if (has(x, z + dz)) {
      put(x, g0, z + dz, "stone_bricks");
      put(x, g0 + 1, z + dz, "stone_bricks");
      put(x, g0 + 2, z + dz, "smooth_stone");
    }
  }
  // Door lintel
  put(x, g0 + 2, z, "smooth_stone");
  put(x, g0, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, g0 + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Warm hall light just inside the door
  const ix = x + 1;
  if (has(ix, z)) put(ix, g0 + 1, z, "lantern");
}

g.save(`${DIR}/NYC3001542.nbt`);
