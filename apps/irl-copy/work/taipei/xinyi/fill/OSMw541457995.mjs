import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541457995";
const W = 18, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Levels: base course at L0 (lowest ground), roof slab at R = L0 + 11.
const L0 = Math.min(...ground.values());
const R = L0 + 11;

// Entrance: on the south-facing edge (largest z), nearest the median x.
const southEdges = cells
  .map(([x, z]) => [Math.round(x), Math.round(z)])
  .filter(([x, z]) => !has(x, z + 1));
let doorX = -1, doorZ = -1;
if (southEdges.length) {
  const maxZ = Math.max(...southEdges.map(([, z]) => z));
  const row = southEdges.filter(([, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
  doorX = row[Math.floor(row.length / 2)];
  doorZ = maxZ;
}

const PANE = (axis) =>
  axis === "NS"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pick the block for an exterior wall position.
// k = height above L0; i = absolute coordinate along the face.
function facadeBlock(k, i, face, x, z) {
  const axis = face === "N" || face === "S" ? "NS" : "EW";
  const isPillarBay = i % 3 === 0;

  if (k === 0) return { id: "polished_andesite" };

  if (k >= 1 && k <= 3) {
    if (face === "S" && x === doorX && z === doorZ && (k === 1 || k === 2)) {
      return {
        id: "oak_door",
        props: { facing: "south", half: k === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
      };
    }
    if (k === 1) return { id: "smooth_quartz" };
    if (i % 4 === 0) return { id: "white_concrete" };
    return { id: "light_blue_stained_glass_pane", props: PANE(axis) };
  }

  if (k === 4) return { id: "red_concrete" };
  if (k === 5) return { id: "white_concrete" };

  if (k >= 6 && k <= 9) {
    if (isPillarBay) return { id: "white_concrete" };
    if (k === 7 && (i + k) % 5 === 0) return { id: "glowstone" };
    return { id: "light_blue_stained_glass_pane", props: PANE(axis) };
  }

  if (k === 10) return { id: "smooth_quartz" };
  return null;
}

for (const [xr, zr, gr] of cells) {
  const x = Math.round(xr), z = Math.round(zr);
  const gc = groundAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  const edge = faces.length > 0;

  // Interior floor slab at the storey line (kept under air gaps).
  if (L0 + 5 >= gc && L0 + 5 < R) put(x, L0 + 5, z, "smooth_stone");

  // Roof slab over the whole footprint.
  if (R >= gc) put(x, R, z, "light_gray_concrete");

  if (edge) {
    const face = faces[0];
    const i = face === "N" || face === "S" ? x : z;
    for (let y = Math.max(gc, L0); y < R; y++) {
      const k = y - L0;
      const b = facadeBlock(k, i, face, x, z);
      if (b) put(x, y, z, b.id, b.props);
    }
    // Parapet with coping.
    if (R >= gc) put(x, R, z, "smooth_quartz");
    put(x, R + 1, z, "white_concrete");
  }
}

// Roof equipment on a few interior cells (air units and a small mech box).
for (const [xr, zr] of cells) {
  const x = Math.round(xr), z = Math.round(zr);
  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (edge) continue;
  if (x < 4 || x > 13 || z < 4 || z > 15) continue;
  if ((x * 7 + z * 3) % 17 === 0) {
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
