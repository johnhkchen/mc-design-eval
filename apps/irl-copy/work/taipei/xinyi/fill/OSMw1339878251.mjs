import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw1339878251: single-storey (5-block) civic/commercial annex, flat roof,
// quartz cornice and white parapet, dark glass panes in quartz mullions, stone plinth,
// dark oak double entrance with hanging lanterns, shroomlight glow behind some windows.
// Roof sits ~7 blocks above lowest ground (y 0..6 parapet top at 6 -> roof surface at 7).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339878251";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 58, H = 19, D = 45;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellList = cells.map(([x, z, gr]) => ({ x, z, g: gr ?? 0 }));
const at = new Map(cellList.map((c) => [key(c.x, c.z), c]));

// outward normals for each face
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// a face is exposed where the neighbour is outside the footprint or sits at a different ground
function exposed(c) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    const o = at.get(key(c.x + dx, c.z + dz));
    if (!o || o.g !== c.g) out.push(name);
  }
  return out;
}

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// pick the entrance face: south if exposed, else north, else any
const anyExposed = cellList.map((c) => ({ c, ex: exposed(c) }));
let doorFace = null;
for (const pref of ["south", "north", "east", "west"]) {
  if (anyExposed.some((e) => e.ex.includes(pref))) { doorFace = pref; break; }
}
let cx = 0;
if (doorFace) {
  const us = anyExposed
    .filter((e) => e.ex.includes(doorFace))
    .map((e) => (doorFace === "north" || doorFace === "south" ? e.c.x : e.c.z));
  cx = Math.round(us.reduce((a, b) => a + b, 0) / us.length);
}
const doorU = new Set([cx - 1, cx]);

// 1. plinth, floor, roof, cornice, parapet, roof plant
for (const c of cellList) {
  const { x, z, g: gr } = c;
  const per = exposed(c).length > 0;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks"); // foundation to lowest-ground datum
  put(x, gr, z, per ? "stone_bricks" : "smooth_stone");     // floor slab / base course
  put(x, gr + 5, z, per ? "quartz_block" : "light_gray_concrete"); // roof slab / cornice
  if (per) put(x, gr + 6, z, "white_concrete");              // parapet
  if (!per && x % 9 === 4 && z % 7 === 3) {
    put(x, gr + 6, z, "light_gray_concrete");               // roof ventilation boxes
  }
}

// 2. facades, entrance, glow
for (const { c, ex } of anyExposed) {
  const { x, z, g: gr } = c;
  for (const face of ex) {
    const along = face === "north" || face === "south";
    const u = along ? x : z;
    const [ox, oz] = DIRS[face];
    const isMullion = u % 4 === 0;

    // entrance on the chosen face
    if (face === doorFace && doorU.has(u)) {
      const hinge = u === cx - 1 ? "left" : "right";
      const doorProps = (half) => ({ facing: face, half, hinge, open: "false", powered: "false" });
      put(x, gr + 1, z, "dark_oak_door", doorProps("lower"));
      put(x, gr + 2, z, "dark_oak_door", doorProps("upper"));
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    // plinth / kickplate
    put(x, gr + 1, z, "polished_andesite");

    // frieze under cornice
    put(x, gr + 4, z, "white_concrete");

    // mullion column or glazing
    if (isMullion) {
      for (let y = gr + 2; y <= gr + 3; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      const paneProps = along
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      for (let y = gr + 2; y <= gr + 3; y++) {
        put(x, y, z, along ? "light_blue_stained_glass_pane" : "light_blue_stained_glass_pane", paneProps);
      }
      // warm light just inside selected windows
      if (u % 8 === 2) {
        const ix = x - ox, iz = z - oz;
        const inner = at.get(key(ix, iz));
        if (inner && exposed(inner).length === 0) put(ix, gr + 2, iz, "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
