import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey 1980s commercial block: cream concrete with quartz piers,
// stone base course, storey lines, dark shopfront with a central entrance,
// flat roof with a quartz cornice, parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343868";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Common floor datum: highest ground under the footprint, so every storey is level.
const F = Math.max(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const slabProps = { type: "bottom", waterlogged: "false" };
const topSlabProps = { type: "top", waterlogged: "false" };

// 1. Foundation: solid from y 0 up to the datum under every footprint cell.
for (const [x, z] of cells) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");
}

// 2. Ground-floor slab / base course, and floor slabs at each storey line.
for (const [x, z] of cells) {
  const edge = isEdge(x, z);
  put(x, F, z, edge ? "polished_andesite" : "smooth_stone");
  put(x, F + 5, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, F + 10, z, edge ? "smooth_quartz" : "light_gray_concrete");
}

// 3. Storey walls (two storeys, each 4 high above its slab).
for (const b of [F, F + 5]) {
  for (const [x, z] of cells) {
    if (!isEdge(x, z)) continue;
    const pier = (x + z) % 3 === 0;
    for (let y = b + 1; y <= b + 4; y++) {
      if (pier) {
        put(x, y, z, "smooth_quartz");
      } else if (b === F) {
        // Shopfront: glass to the lintel, quartz lintel on top.
        put(x, y, z, y <= b + 3 ? "glass_pane" : "smooth_quartz");
      } else {
        // Upper storeys: windows with white spandrel below the head.
        put(x, y, z, y <= b + 3 ? "glass_pane" : "white_concrete");
      }
    }
  }
}

// 4. Parapet and cornice on the roof edge.
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  put(x, F + 11, z, "white_concrete");
}

// 5. Entrance: edge cell on the far (max z) side nearest the centre line.
const edgeCells = cells.filter(([x, z]) => isEdge(x, z));
const maxZ = Math.max(...cells.map((c) => c[1]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const cx = (minX + maxX) / 2;
let entrance = null;
for (const [x, z] of edgeCells) {
  if (z !== maxZ) continue;
  if (!entrance || Math.abs(x - cx) < Math.abs(entrance[0] - cx)) entrance = [x, z];
}
if (entrance) {
  const [ex, ez] = entrance;
  // Double-height-ish door: lower and upper halves in the glass row.
  put(ex, F + 1, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, F + 2, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy over the entrance bay and its neighbours.
  for (const dx of [-1, 0, 1]) {
    const x = ex + dx;
    if (inside(x, ez) && isEdge(x, ez)) put(x, F + 3, ez, "stone_brick_slab", topSlabProps);
  }
  // Warm light just inside the entrance.
  if (inside(ex, ez - 1) && !isEdge(ex, ez - 1)) {
    put(ex, F + 2, ez - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 6. Warm light behind some windows (interior cell next to the glass).
for (const b of [F, F + 5]) {
  for (const [x, z] of cells) {
    if (!isEdge(x, z)) continue;
    if ((x + z) % 3 === 0) continue; // pier
    if (b === F && entrance && x === entrance[0] && z === entrance[1]) continue;
    if ((x * 3 + z * 5 + b) % 4 !== 0) continue;
    // Find the inward neighbour (inside the footprint and not itself an edge).
    const nbrs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
    const inward = nbrs.find(([nx, nz]) => inside(nx, nz) && !isEdge(nx, nz));
    if (inward) put(inward[0], b + 2, inward[1], (x + z + b) % 8 === 0 ? "shroomlight" : "glowstone");
  }
}

// 7. Roof plant and a lightning rod on the flat roof (above the slab at F+10).
const interior = cells.filter(([x, z]) => !isEdge(x, z));
for (const [x, z] of interior) {
  if (x % 4 === 1 && z % 4 === 1) {
    put(x, F + 11, z, "gray_concrete");
    if ((x + z) % 2 === 0) put(x, F + 12, z, "gray_concrete");
  }
}
if (interior.length) {
  const [rx, rz] = interior[Math.floor(interior.length / 2)];
  put(rx, F + 11, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
