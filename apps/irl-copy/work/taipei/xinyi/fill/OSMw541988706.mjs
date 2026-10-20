import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 8 x 12 footprint, roof about 11 blocks above lowest ground.
// Read as a mid-rise 1970s-80s Taipei commercial block: white-tiled concrete
// frame, light-grey spandrels, a quartz cornice, a plain parapet with a
// rooftop plant box, and a glazed shopfront at street level.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988706";
const W = 8, H = 23, D = 12;

const ROOF_DECK = 10;   // roof slab level (interior), cornice row on the perimeter
const PARAPET = 11;     // parapet course on the perimeter
const TOP_BAND = 9;     // lintel band under the cornice
const FLOOR2 = 5;       // storey line / floor slab for the upper storey
const GF_LINTEL = 4;    // lintel band over the ground storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.max(0, Math.min(8, Math.round(gr))));
}

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const keys = [...ground.keys()].map((k) => k.split(",").map(Number));
const minX = Math.min(...keys.map((k) => k[0]));
const maxX = Math.max(...keys.map((k) => k[0]));
const minZ = Math.min(...keys.map((k) => k[1]));
const maxZ = Math.max(...keys.map((k) => k[1]));

// Which outer faces a cell touches: N = -z, S = +z, W = -x, E = +x.
function faces(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
}

// Entrance: on the south face if possible, otherwise the first available face.
// The door sits in an odd (glazed) bay nearest the middle of the face.
const faceOrder = ["S", "N", "E", "W"];
let door = null;
for (const face of faceOrder) {
  let best = null;
  for (const [x, z] of keys) {
    const f = faces(x, z);
    if (f.length !== 1 || f[0] !== face) continue;
    const rel = face === "N" || face === "S" ? x - minX : z - minZ;
    const span = face === "N" || face === "S" ? maxX - minX + 1 : maxZ - minZ + 1;
    if (rel % 2 !== 1) continue;
    const d = Math.abs(rel - span / 2);
    if (!best || d < best.d) best = { x, z, face, d };
  }
  if (best) { door = best; break; }
}
const doorKey = door ? `${door.x},${door.z}` : null;

const outward = { N: "north", S: "south", E: "east", W: "west" };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of keys) {
  const gr = gAt(x, z);
  const f = faces(x, z);
  const perimeter = f.length > 0;
  const corner = f.length >= 2;

  // Foundation fill up to ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor / base course at ground level.
  if (perimeter) put(x, gr, z, "smooth_stone");
  else put(x, gr, z, "light_gray_concrete");

  // Roof deck across the whole footprint.
  put(x, ROOF_DECK, z, perimeter ? "smooth_quartz" : "light_gray_concrete");

  // Interior: floor slab at the upper storey line.
  if (!perimeter) put(x, FLOOR2, z, "light_gray_concrete");

  // Parapet on the perimeter.
  if (perimeter) put(x, PARAPET, z, "white_concrete");

  // Rooftop plant box on interior cells.
  if (!perimeter && x >= minX + 2 && x <= maxX - 3 && z >= minZ + 3 && z <= maxZ - 4) {
    put(x, PARAPET, z, "stone_bricks");
    put(x, PARAPET + 1, z, "stone_bricks");
  }

  // Interior lanterns standing on the floor slabs (warm light behind the glass).
  if (!perimeter) {
    if (gr + 1 <= GF_LINTEL && (x + z) % 3 === 0) {
      put(x, gr + 1, z, "lantern", { hanging: "false" });
    }
    if (((x + 2 * z) % 4) === 0) {
      put(x, FLOOR2 + 1, z, "lantern", { hanging: "false" });
    }
  }

  if (!perimeter) continue;

  // Perimeter walls from ground to the top band.
  for (let y = gr + 1; y <= TOP_BAND; y++) {
    if (y === PARAPET) continue;

    // Horizontal bands: lintel over ground floor, storey line, top band.
    if (y === GF_LINTEL && y > gr) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === FLOOR2) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === TOP_BAND) { put(x, y, z, "light_gray_concrete"); continue; }

    if (corner) { put(x, y, z, "white_concrete"); continue; }

    const face = f[0];
    const alongAxis = face === "N" || face === "S" ? x - minX : z - minZ;
    const bayIsGlass = alongAxis % 2 === 1;

    if (!bayIsGlass) { put(x, y, z, "white_concrete"); continue; }

    // Door in the entrance bay: lower and upper halves, one storey tall.
    if (doorKey === `${x},${z}` && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: outward[face],
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Glass pane, connected along the facade.
    const pane = face === "N" || face === "S"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", pane);
  }
}

g.save(`${DIR}/${ID}.nbt`);
