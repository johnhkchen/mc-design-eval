import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Office tower, c. 1995-2005 Xinyi-style: white concrete piers and spandrels,
// blue-green tinted curtain-wall glass, light-grey floor lines, a 5-storey
// stack with a 4-block parapet and rooftop plant. Roof is level at base+29.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265966";
const W = 37, H = 41, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const base = Math.min(...cells.map((c) => c[2]));

// Perimeter cells: at least one 4-neighbour is outside the footprint.
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const edgeSet = new Set(cells.filter(([x, z]) => isEdge(x, z)).map(([x, z]) => `${x},${z}`));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const TOP = base + 28; // parapet top, roof surface at base+29

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  // Facade orientation: a missing north/south neighbour means the cell is on a long (x-running) face.
  const xAxis = !has(x, z - 1) || !has(x, z + 1);
  const zAxis = !has(x - 1, z) || !has(x + 1, z);
  const corner = xAxis && zAxis;
  const bay = xAxis ? x : z;
  const pillar = corner || (xAxis ? x % 3 === 0 : z % 3 === 0);
  const frontSouth = xAxis && !has(x, z + 1); // main entrance face (z = 14 side)
  const nearEdge =
    edgeSet.has(`${x - 1},${z}`) || edgeSet.has(`${x + 1},${z}`) ||
    edgeSet.has(`${x},${z - 1}`) || edgeSet.has(`${x},${z + 1}`);

  for (let y = 0; y <= Math.min(H - 1, TOP); y++) {
    // Foundation: solid from y 0 up to this cell's ground.
    if (y < gr) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    const yy = y - base;

    // Roof level and parapet.
    if (yy >= 25) {
      if (yy === 25) {
        put(x, y, z, "light_gray_concrete"); // roof slab
      } else if (edge) {
        put(x, y, z, "white_concrete"); // cornice / parapet
      } else if (yy === 26 && x >= 8 && x <= 14 && z >= 5 && z <= 9) {
        // Rooftop mechanical plant, lower block.
        put(x, y, z, "light_gray_concrete");
      } else if (yy === 27 && x >= 9 && x <= 13 && z >= 6 && z <= 8) {
        // Rooftop mechanical plant, upper block.
        put(x, y, z, "iron_block");
      }
      continue;
    }

    const L = Math.floor(yy / 5);
    const r = yy % 5;

    // Floor slab line, shared by interior and facade.
    if (r === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Interior: air behind the glass, with warm lights near the windows.
    if (!edge) {
      if (r === 2 && L % 2 === 1 && nearEdge && x % 9 === 4 && (edgeSet.has(`${x},${z - 1}`) || edgeSet.has(`${x},${z + 1}`))) {
        put(x, y, z, "shroomlight");
      }
      continue;
    }

    // Facade.
    if (r === 4) {
      put(x, y, z, "white_concrete"); // spandrel band
      continue;
    }

    // Window band r = 1..3.
    if (L === 0 && frontSouth && bay === 18) {
      // Central entrance: double door with a hanging lantern above.
      if (r === 1) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (r === 2) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
      continue;
    }

    if (corner || pillar) {
      put(x, y, z, "white_concrete"); // mullion / pier
      continue;
    }

    put(x, y, z, L === 0 ? "light_blue_stained_glass" : "cyan_stained_glass");
  }
}

g.save(`${DIR}/${ID}.nbt`);
