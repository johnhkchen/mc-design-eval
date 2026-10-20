import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s Xinyi commercial/office block: white tiled spandrels, blue glass
// window bands with grey mullions, granite shopfront base, quartz cornice, parapet,
// and a rooftop plant box with antenna.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011417";
const W = 23, H = 38, D = 19;
const ROOF = 25;   // roof slab level
const TOP = 26;    // parapet level (roof about 26 above lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces: a footprint cell whose neighbour is missing.
const exteriorCount = (x, z) =>
  (!has(x - 1, z) ? 1 : 0) + (!has(x + 1, z) ? 1 : 0) +
  (!has(x, z - 1) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0);

// Entrance: middle cell of the north-most row (min z), facing outward (north).
const minZ = Math.min(...cells.map(c => c[1]));
const frontRow = cells.filter(c => c[1] === minZ).sort((a, b) => a[0] - b[0]);
const doorX = frontRow[Math.floor(frontRow.length / 2)][0];
const doorZ = minZ;
const doorG = gOf(doorX, doorZ);

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const ext = exteriorCount(x, z);
  const per = ext > 0;
  const corner = ext >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, per ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (y === TOP) {
      if (per) put(x, y, z, "white_concrete");
      continue;
    }

    // Entrance door and canopy (ground storey, front row only).
    if (x === doorX && z === doorZ && (y === doorG || y === doorG + 1)) {
      put(x, y, z, "dark_oak_door", y === doorG ? DOOR_LOWER : DOOR_UPPER);
      continue;
    }
    if (per && z === doorZ && Math.abs(x - doorX) <= 1 && y === doorG + 3 && y < 5) {
      put(x, y, z, "stone_brick_slab", SLAB_BOTTOM);
      continue;
    }

    const r = y % 5;

    if (!per) {
      // Interior: floor slab at each storey line, otherwise air.
      if (r === 0 && y > 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter facade.
    if (y === gr && y < 5) { put(x, y, z, "polished_granite"); continue; }
    if (r === 0) { if (y > 0) put(x, y, z, "white_concrete"); continue; }
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }

    // r = 1..3: window zone.
    if (corner || (x + z) % 3 === 0) {
      put(x, y, z, "gray_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", PANE);
    }
  }

  // Warm lights behind glass in some upper-storey windows.
  if (per) {
    for (let y = Math.max(gr, 2); y <= 24; y += 5) {
      if (y % 5 !== 2) continue;
      if (((x * 5 + z * 7 + y) % 4) !== 0) continue;
      if (corner || (x + z) % 3 === 0) continue;
      const inners = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
      for (const [ix, iz] of inners) {
        if (!has(ix, iz)) continue;
        if (exteriorCount(ix, iz) > 0) continue;
        if (gOf(ix, iz) > y) continue;
        put(ix, y, iz, "glowstone");
        break;
      }
    }
  }
}

// Rooftop plant box, vent and antenna with aviation lantern.
for (let x = 7; x <= 15; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z)) continue;
    put(x, TOP, z, "light_gray_concrete");
    put(x, TOP + 1, z, "light_gray_concrete");
  }
}
if (has(11, 9)) {
  for (let y = TOP + 2; y <= TOP + 4; y++) put(11, y, 9, "iron_bars");
  put(11, TOP + 5, 9, "lantern", LANTERN);
}

g.save(`${DIR}/${ID}.nbt`);
