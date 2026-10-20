import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE106-0088-5F: 2017 mixed-use office block, 5 storeys (5 blocks each), 9 x 16 footprint.
// Light stone-and-glass frame: white floor lines, cream piers, glass bays, a continuous
// shopfront on the +z face with a central entrance, a parapet, and a roof plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE106-0088-5F";
const W = 9, H = 38, D = 16;
const ROOF = 25;      // roof deck: top of storey 5, storey lines at 5, 10, 15, 20, 25
const PARAPET = 26;   // coping course on the edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const xEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z);
const zEdge = (x, z) => !has(x, z + 1) || !has(x, z - 1);
const edge = (x, z) => xEdge(x, z) || zEdge(x, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass pane orientations: a pane on a z-facade runs east-west, on an x-facade north-south.
const PANE_ALONG_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations, floor slabs and facades
for (const [x, z, gr] of cells) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor and roof slabs over the whole footprint where it stands above ground
  for (const f of [5, 10, 15, 20, ROOF]) {
    if (f >= gr) put(x, f, z, "light_gray_concrete");
  }

  if (!edge(x, z)) continue;

  const cornerCell = xEdge(x, z) && zEdge(x, z);
  const paneP = zEdge(x, z) && !xEdge(x, z) ? PANE_ALONG_X : PANE_ALONG_Z;
  const frontShop = !has(x, z + 1) && x >= 2 && x <= 6; // continuous shopfront on the +z face

  // facade: granite base course, white floor lines, cream piers, glass bays
  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y % 5 === 0) { put(x, y, z, "white_concrete"); continue; }
    if (y < 5 && frontShop) { put(x, y, z, "glass_pane", paneP); continue; }
    if (cornerCell || (x + z) % 2 === 0) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "glass_pane", paneP);
  }

  // coping course on the parapet
  put(x, PARAPET, z, "smooth_quartz");
}

// 2. Entrance on the +z face, centred at x = 4: door flanked by shop glass, lintel above
for (const [x, z, gr] of cells) {
  if (x !== 4 || has(x, z + 1)) continue;
  if (gr <= 1) {
    put(x, gr + 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gr === 0) put(x, 3, z, "white_concrete"); // lintel over the door
    // warm lights either side of the entrance, set behind the shop glass
    put(x, gr + 3 <= 3 ? gr + 3 : 3, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. Warm light behind some south and north bays, two blocks inside the facade (keeps an air gap)
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (!zEdge(x, z) || xEdge(x, z)) continue;
  let dz = 0;
  if (!has(x, z + 1)) dz = -2;
  else if (!has(x, z - 1)) dz = 2;
  if (dz === 0) continue;
  const ix = x, iz = z + dz;
  if (!has(ix, iz) || edge(ix, iz)) continue;
  const floorGround = gnd(ix, iz);
  for (const rowY of [2, 7, 12, 17, 22]) {
    const k = Math.floor(rowY / 5);
    if (rowY < floorGround) continue;
    if ((x + k) % 3 === 0) put(ix, rowY, iz, "glowstone");
  }
}

// 4. Roof plant room, set back from the parapet on the roof deck
for (let x = 2; x <= 6; x++) {
  for (let z = 4; z <= 11; z++) {
    if (!has(x, z) || edge(x, z)) continue;
    const ring = x === 2 || x === 6 || z === 4 || z === 11;
    const cornerP = (x === 2 || x === 6) && (z === 4 || z === 11);
    if (ring) {
      for (let y = 26; y <= 28; y++) {
        if (cornerP) put(x, y, z, "smooth_quartz");
        else if (y === 27) {
          const p = (x === 2 || x === 6) ? PANE_ALONG_Z : PANE_ALONG_X;
          put(x, y, z, "glass_pane", p);
        } else put(x, y, z, "white_concrete");
      }
    }
    put(x, 29, z, "light_gray_concrete"); // roof cap
  }
}

g.save(`${DIR}/${ID}.nbt`);
