import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial-Office-Large, 1025 Connecticut Ave NW.
// Mid-century (c. 1960s-70s) Portland-stone-and-bronze-glass office slab:
// stone base course, stone piers between tinted-glass window bands, spandrel
// bands at each floor line, a stone cornice cap with parapet, a dark roof deck
// and rooftop mechanical boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC77754";
const W = 24, H = 33, D = 28;
const STEP = 4; // 3 blocks of glazing + 1 floor/spandrel course per storey

const PIER = "smooth_quartz";
const CAP = "smooth_quartz";
const SPAN = "light_gray_concrete";
const BASE = "stone_bricks";
const FOUND = "stone";
const SLAB = "light_gray_concrete";
const ROOF = "gray_concrete";
const MECH = "light_gray_concrete";
const GLASS = "gray_stained_glass_pane";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, ground, roof] of cells) {
  const gr = Math.max(0, Math.min(H - 6, Math.round(ground)));
  // quantise lidar roof into clean storey tiers
  let top = Math.round(roof / STEP) * STEP;
  top = Math.max(gr + STEP, Math.min(H - 2, top));
  map.set(key(x, z), { x, z, g: gr, top });
}

const FACES = [
  { dx: 0, dz: -1 }, // north
  { dx: 0, dz: 1 },  // south
  { dx: -1, dz: 0 }, // west
  { dx: 1, dz: 0 },  // east
];

// a face is exposed where the neighbour is outside the footprint or its roof is below this y
function exposures(c, y) {
  const out = [];
  for (const f of FACES) {
    const n = map.get(key(c.x + f.dx, c.z + f.dz));
    if (!n || y >= n.top) out.push(f);
  }
  return out;
}

// choose one primary face per cell so windows run around the whole perimeter
function primaryFace(ex) {
  const zf = ex.find(f => f.dz !== 0);
  if (zf) return zf;
  return ex[0];
}

// true corner: one exposed N/S face and one exposed E/W face
function isCorner(ex) {
  return ex.some(f => f.dz !== 0) && ex.some(f => f.dx !== 0);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const c of map.values()) {
  // foundation up to ground
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, FOUND);

  for (let y = c.g; y < c.top; y++) {
    const ex = exposures(c, y);
    const perimeter = ex.length > 0;

    // roof deck / cornice cap
    if (y === c.top - 1) {
      put(c.x, y, c.z, perimeter ? CAP : ROOF);
      continue;
    }

    // base course at ground
    if (y === c.g) {
      put(c.x, y, c.z, perimeter ? BASE : SLAB);
      continue;
    }

    if (!perimeter) {
      // interior floor slabs only; air elsewhere (no interiors)
      if (y % STEP === 0) put(c.x, y, c.z, SLAB);
      // warm light behind the glass on rim interior cells
      if (y % STEP === 2 && isRimLit(c, y)) put(c.x, y, c.z, "glowstone");
      continue;
    }

    // parapet course just under the cap on the outer faces
    if (y === c.top - 2 && y % STEP !== 0) {
      put(c.x, y, c.z, PIER);
      continue;
    }

    if (isCorner(ex)) {
      put(c.x, y, c.z, PIER);
      continue;
    }

    const f = primaryFace(ex);
    const along = f.dz !== 0 ? c.x : c.z; // position along the chosen face
    if (y % STEP === 0) {
      put(c.x, y, c.z, SPAN); // floor/spandrel band
    } else if (along % 3 === 0) {
      put(c.x, y, c.z, PIER);
    } else {
      const props = f.dz !== 0
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(c.x, y, c.z, GLASS, props);
    }
  }

  // rooftop mechanical boxes on interior cells of the highest tiers
  if (c.top <= H - 4 && exposures(c, c.top - 1).length === 0 &&
      c.x >= 6 && c.x <= 9 && c.z >= 8 && c.z <= 11) {
    put(c.x, c.top, c.z, MECH);
    put(c.x, c.top + 1, c.z, MECH);
  }
}

// Main entrance on the north (z = 0) face, two door cells centred on the facade
for (const c of map.values()) {
  if (c.z !== 0 || (c.x !== 11 && c.x !== 12)) continue;
  if (!exposures(c, c.g).some(f => f.dz < 0)) continue;
  const hinge = c.x === 11 ? "left" : "right";
  put(c.x, c.g, c.z, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(c.x, c.g + 1, c.z, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Interior cell directly behind a window band gets warm light on a pattern
function isRimLit(c, y) {
  if (exposures(c, y).length > 0) return false;
  if ((c.x * 5 + c.z * 3 + y) % 4 !== 0) return false;
  for (const f of FACES) {
    const n = map.get(key(c.x + f.dx, c.z + f.dz));
    if (n && n.top > y && exposures(n, y).length > 0) return true;
  }
  return false;
}

g.save(`${DIR}/${ID}.nbt`);
