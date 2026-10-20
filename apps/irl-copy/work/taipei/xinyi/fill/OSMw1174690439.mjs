// Era: 1980s-90s low-rise commercial block in Xinyi. Two storeys over a shopfront
// ground floor, pale rendered walls, light-blue tinted glazing, a quartz cornice,
// a parapet, and rooftop AC plant. The body is a shell with a floor slab at y 6 and
// a roof at y 11, so there are no interiors. Lamps show behind the glass at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690439";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const set = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// exposure to the outside on the north/south faces (wall runs east-west) and east/west faces
const exZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const exX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isEdge = (x, z) => exZ(x, z) || exX(x, z);

// pane connection props: a pane on a north/south face joins east and west, and vice versa
const paneP = (onNS) => onNS
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const BASE = "smooth_stone";
const FLOOR = "smooth_quartz";
const CORNICE = "smooth_quartz";
const ROOF = "smooth_stone";
const ROOF_TOP = 11;

// 1. Foundation, ground slab and the storey shell for each footprint cell
for (const [x, z, b] of cells) {
  for (let y = 0; y < b; y++) set(x, y, z, "stone_bricks");
  set(x, b, z, ROOF); // ground slab the cell stands on
  if (b >= ROOF_TOP) continue;

  const edge = isEdge(x, z);
  const onNS = exZ(x, z);
  const along = onNS ? x : z;
  const pane = along % 3 === 1; // window columns on exterior faces

  for (let y = b + 1; y <= ROOF_TOP; y++) {
    // interior cells carry only the floor slab (y 6) and roof (y 11); the rest is air
    if (!edge && y !== 6 && y !== ROOF_TOP) continue;

    let id = PIER, p = null;
    if (y === ROOF_TOP) {
      id = edge ? CORNICE : ROOF;
    } else if (y === 6) {
      id = edge ? FLOOR : ROOF;
    } else if (y === b + 1) {
      id = BASE; // base course
    } else if (y <= 5) {
      // shopfront: glazing from b+2 to y 4, transom at y 5
      if (pane && y >= b + 2 && y <= 4) { id = GLASS; p = paneP(onNS); }
      else id = PIER;
    } else if (y >= 7 && y <= 10) {
      // upper storey windows, with a transom course at y 10
      if (pane && y <= 9) { id = GLASS; p = paneP(onNS); }
      else id = PIER;
    }
    set(x, y, z, id, p);
  }

  // parapet
  if (edge) set(x, ROOF_TOP + 1, z, PIER);
}

// 2. Warm light: lanterns on the upper floor, shroomlights on the ground floor (interior only)
for (const [x, z, b] of cells) {
  if (b >= ROOF_TOP) continue;
  if (isEdge(x, z)) continue;
  if (b < 6 && (x * 5 + z * 3) % 7 === 0) {
    set(x, 7, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (b + 2 <= 5 && (x + 2 * z) % 6 === 0) {
    set(x, b + 2, z, "shroomlight");
  }
}

// 3. Rooftop plant: AC boxes on a sparse grid of interior cells
for (const [x, z, b] of cells) {
  if (b >= ROOF_TOP) continue;
  if (isEdge(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    set(x, ROOF_TOP + 1, z, "light_gray_concrete");
    set(x, ROOF_TOP + 2, z, "light_gray_concrete");
  }
}

// 4. Entrance: on the north face (min z row), nearest the centre line; oak door with a canopy lintel
const cand = cells
  .filter(([x, z, b]) => isEdge(x, z) && !has(x, z - 1) && b < ROOF_TOP - 3)
  .sort((a, c) => (a[1] - c[1]) || (Math.abs(a[0] - 10) - Math.abs(c[0] - 10)));
if (cand.length) {
  const [dx, dz, db] = cand[0];
  set(dx, db + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(dx, db + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy: top slabs across the entrance bay at y b+3
  for (const ox of [-1, 0, 1]) {
    const cx = dx + ox;
    if (has(cx, dz) && isEdge(cx, dz)) {
      set(cx, db + 3, dz, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
