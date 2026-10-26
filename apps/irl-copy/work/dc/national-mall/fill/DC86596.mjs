import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1400 K St NW: late-20th-century Modern office. Pale precast concrete piers and
// quartz spandrel bands, gray tinted glazing, a smooth stone plinth at street level,
// stepped roof tiers from the lidar record, and a warm-lit glazing pattern.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86596.cells.json`, "utf8"));

const W = 19, H = 31, D = 15;
const STOREY = 3;          // blocks per storey
const MAXY = H - 1;

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { g: Math.round(gr), r: roof });
const has = (x, z) => cellMap.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y > MAXY) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = (axisX) => ({
  north: axisX ? "false" : "true",
  south: axisX ? "false" : "true",
  east: axisX ? "true" : "false",
  west: axisX ? "true" : "false",
  waterlogged: "false",
});

const ENTRY_X = Math.floor(W / 2);

for (const [x, z] of cells) {
  const { g: gnd0, r } = cellMap.get(`${x},${z}`);
  const gnd = Math.min(Math.max(gnd0, 0), 26);

  // Clean storey tiers from the lidar roof height above this cell's ground.
  const k = Math.max(1, Math.round((r - gnd) / STOREY));
  const top = Math.min(MAXY + 1, gnd + STOREY * k);

  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;

  // Foundation / plinth: solid from y0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) {
    put(x, y, z, perim ? "smooth_stone" : "stone");
  }

  for (let y = gnd; y < top; y++) {
    const off = (y - gnd) % STOREY;
    const storey = Math.floor((y - gnd) / STOREY);
    const isTop = y === top - 1;

    if (perim) {
      if (isTop) {
        put(x, y, z, "smooth_quartz");                  // cornice cap
        continue;
      }
      if (corner) {
        put(x, y, z, "light_gray_concrete");            // corner pier
        continue;
      }
      const along = edgeZ ? x : z;
      const pier = along % 3 === 0;

      if (off === 0) {
        put(x, y, z, storey === 0 ? "smooth_stone" : "smooth_quartz"); // spandrel / base course
        continue;
      }
      if (storey === 0) {
        // Ground floor: lobby / shopfront glazing, stone piers.
        if (pier) put(x, y, z, "stone_bricks");
        else put(x, y, z, "light_blue_stained_glass");
        continue;
      }
      if (pier) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      // Upper window bays: gray glazing with frames, some warm-lit.
      const warm = ((x * 7 + y * 5 + z * 3) % 11) === 0;
      if (warm) put(x, y, z, "yellow_stained_glass_pane", pane(edgeZ));
      else put(x, y, z, "gray_stained_glass_pane", pane(edgeZ));
    } else {
      // Interior: floor slab per storey, roof slab at the top, air otherwise (no interiors).
      if (isTop) put(x, y, z, "smooth_stone");
      else if (off === 0) put(x, y, z, "light_gray_concrete");
    }
  }

  // Sparse roof plant: a few single mechanical boxes on the interior roof,
  // each one block high and standing on the roof slab (no stacking).
  if (!perim && top <= MAXY && (x % 6 === 3) && (z % 5 === 2)) {
    put(x, top, z, "light_gray_concrete");
  }
}

// Street entrance on the z = 0 face: glazed flanks, central door, stone lintel.
for (const dx of [-1, 0, 1]) {
  const ex = ENTRY_X + dx;
  if (!has(ex, 0)) continue;
  const { g: gnd } = cellMap.get(`${ex},0`);
  if (dx === 0) {
    put(ex, gnd, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(ex, gnd + 1, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    put(ex, gnd, 0, "glass");
    put(ex, gnd + 1, 0, "glass");
  }
  put(ex, gnd + 2, 0, "smooth_stone");   // lintel / canopy line
}

// Warm accent on either side of the entrance.
for (const ex of [ENTRY_X - 2, ENTRY_X + 2]) {
  if (!has(ex, 0)) continue;
  const { g: gnd } = cellMap.get(`${ex},0`);
  put(ex, gnd + 1, 0, "yellow_stained_glass");
}

g.save(`${DIR}/DC86596.nbt`);
