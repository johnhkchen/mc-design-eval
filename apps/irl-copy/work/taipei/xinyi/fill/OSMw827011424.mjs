import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011424";
const W = 23, H = 38, D = 19;
const ROOF_Y = 25;   // roof slab layer; roof surface at 26
const PARAPET_Y = 26;

// Palette: 1990s Taipei office tower, cream stone-look cladding, tinted glass, granite base.
const WALL = "smooth_quartz";
const PIER = "quartz_pillar";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const ROOF = "light_gray_concrete";
const CANOPY = "polished_andesite";
const LIGHT = "glowstone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inF = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell (a side with no neighbouring footprint cell).
const faces = (x, z) => ({
  n: !inF(x, z - 1), s: !inF(x, z + 1),
  w: !inF(x - 1, z), e: !inF(x + 1, z),
});

// Entrance: centre of the south (+z) face, storey 0.
const isEntranceX = (x) => x >= 9 && x <= 13;
const DOOR_X = 11;

for (const [x, z, gr0] of cells) {
  const gr = gAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const f = faces(x, z);
  const nf = [f.n, f.s, f.w, f.e].filter(Boolean).length;
  const perim = nf > 0;
  const corner = nf >= 2;
  const along = (f.n || f.s) ? x : z;

  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) {
      put(x, y, z, ROOF);
      continue;
    }
    const L = y - (y % 5);
    const k = y - L;

    if (!perim) {
      // Interior: only floor slabs; air otherwise (no interiors modelled).
      if (k === 0) put(x, y, z, WALL);
      continue;
    }

    // Perimeter shell.
    if (corner || along % 4 === 0) {
      put(x, y, z, PIER, { axis: "y" });
      continue;
    }
    if (k === 0) {
      put(x, y, z, L === 0 ? BASE : WALL);
      continue;
    }
    if (k === 4) {
      put(x, y, z, WALL);
      continue;
    }

    // Window rows k = 1..3.
    const entranceCol = L === 0 && f.s && !f.n && isEntranceX(x);
    if (entranceCol) {
      if (x === DOOR_X && k === 1) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (x === DOOR_X && k === 2) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, GLASS);
      }
      continue;
    }
    put(x, y, z, GLASS);

    // Warm light behind selected upper-floor windows, two blocks inside the shell.
    if (k === 2 && L >= 5 && along % 8 === 2) {
      let dx = 0, dz = 0;
      if (f.n) dz = 2;
      else if (f.s) dz = -2;
      else if (f.w) dx = 2;
      else if (f.e) dx = -2;
      const ix = x + dx, iz = z + dz;
      if (inF(ix, iz) && faces(ix, iz).n === false && faces(ix, iz).s === false &&
          faces(ix, iz).w === false && faces(ix, iz).e === false) {
        put(ix, y, iz, LIGHT);
      }
    }
  }

  // Parapet on the perimeter, one block above the roof slab.
  if (perim) put(x, PARAPET_Y, z, WALL);
}

// Canopy over the entrance (storey 0 transom row, k = 4).
for (let x = 9; x <= 13; x++) {
  if (inF(x, D - 1) && faces(x, D - 1).s) put(x, 4, D - 1, CANOPY);
}

// Roof penthouse: x 7..15, z 6..12, rising from the roof slab at 26..29.
const PH = { x0: 7, x1: 15, z0: 6, z1: 12 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inF(x, z)) continue;
    const edgeX = x === PH.x0 || x === PH.x1;
    const edgeZ = z === PH.z0 || z === PH.z1;
    for (let y = 26; y <= 29; y++) {
      if (y === 29) { put(x, y, z, ROOF); continue; }
      if (edgeX || edgeZ) {
        if (y === 26 || y === 29) put(x, y, z, WALL);
        else if (edgeX && edgeZ) put(x, y, z, PIER, { axis: "y" });
        else put(x, y, z, GLASS);
      }
    }
  }
}

// Antenna mast on the penthouse, top at y 37.
if (inF(11, 9)) {
  for (let y = 30; y <= 37; y++) {
    put(11, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
