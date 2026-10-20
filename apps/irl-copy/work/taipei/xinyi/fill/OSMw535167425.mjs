import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167425";
const W = 13, H = 38, D = 20;
const STOREY = 5, STOREYS = 5;

// Materials: 1980s Taipei mid-rise commercial block, cream tiled concrete,
// blue-green glazing, light-grey floor slabs, shopfront at street level.
const FOUND = "gray_concrete";
const SLAB = "light_gray_concrete";
const WALL = "white_concrete";
const BASE = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "cyan_stained_glass_pane";
const CAP = "smooth_stone_slab";
const DOOR = "dark_oak_door";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const exposed = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const isPerim = (x, z) => { const e = exposed(x, z); return e.n || e.s || e.w || e.e; };
const isFull = (id) => !/(slab|door|lantern|pane)/.test(id);

const out = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  out.set(`${x},${y},${z}`, { x, y, z, id, props });
};

// Street face = the exposed north (min z) side; door centred on it.
const northCells = cells.filter(([x, z]) => exposed(x, z).n);
let doorX = null, doorZ = null;
if (northCells.length) {
  northCells.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
  doorX = northCells[0][0];
  doorZ = northCells[0][1];
}

for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.n || ex.s || ex.w || ex.e;
  const corners = [ex.n, ex.s, ex.w, ex.e].filter(Boolean).length;
  const pier = corners >= 2 || ((ex.n || ex.s) && x % 3 === 0) || ((ex.w || ex.e) && z % 3 === 0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Storeys: each 5 tall = band row + 3 window rows (+ band of next storey).
  for (let s = 0; s < STOREYS; s++) {
    const y0 = gr + s * STOREY;
    if (perim) put(x, y0, z, s === 0 ? BASE : WALL);
    else put(x, y0, z, SLAB);

    if (perim) {
      for (let dy = 1; dy <= 3; dy++) {
        const y = y0 + dy;
        if (pier) put(x, y, z, WALL);
        else if (s === 0) put(x, y, z, SHOP, true);
        else put(x, y, z, GLASS, true);
      }
    }
    if (s === STOREYS - 1) {
      put(x, y0 + 4, z, perim ? WALL : SLAB);
    }
  }

  // Roof: slab over footprint, parapet on perimeter, stone cap.
  const roofY = gr + STOREYS * STOREY; // g+25
  put(x, roofY, z, SLAB);
  if (perim) {
    put(x, roofY, z, WALL);
    put(x, roofY + 1, z, WALL);
    put(x, roofY + 2, z, CAP, { type: "bottom" });
  }
}

// Shopfront entrance on the street face.
for (const [x, z, gr] of cells) {
  if (x === doorX && z === doorZ) {
    put(x, gr + 1, z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm interior lights behind some window bays (glowstone one cell inside the glass).
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (!(ex.n || ex.s || ex.w || ex.e) || (x === doorX && z === doorZ)) continue;
  const corners = [ex.n, ex.s, ex.w, ex.e].filter(Boolean).length;
  const pier = corners >= 2 || ((ex.n || ex.s) && x % 3 === 0) || ((ex.w || ex.e) && z % 3 === 0);
  if (pier) continue;
  let dx = 0, dz = 0;
  if (ex.n) dz = 1; else if (ex.s) dz = -1; else if (ex.w) dx = 1; else if (ex.e) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  for (let s = 0; s < STOREYS; s++) {
    if ((x + z + s * 3) % 4 !== 1) continue;
    const y = gr + s * STOREY + 2;
    put(ix, y, iz, "glowstone");
  }
}

// Roof plant: a 3x3 water tank on the central interior, and two small AC units.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  const roofY = gr + STOREYS * STOREY;
  if (x >= 5 && x <= 7 && z >= 8 && z <= 10) {
    put(x, roofY + 1, z, "spruce_planks");
    put(x, roofY + 2, z, "spruce_planks");
    put(x, roofY + 3, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
  }
  if ((x === 2 && z === 3) || (x === 10 && z === 15)) {
    put(x, roofY + 1, z, "iron_block");
  }
}

// Write everything, computing pane connections from neighbours.
const g = new Voxels([W, H, D]);
for (const b of out.values()) {
  if (b.id.endsWith("glass_pane")) {
    const nb = (dx, dz) => {
      const e = out.get(`${b.x + dx},${b.y},${b.z + dz}`);
      return !!e && (e.id.endsWith("glass_pane") || isFull(e.id));
    };
    g.set(b.x, b.y, b.z, b.id, {
      north: String(nb(0, -1)),
      south: String(nb(0, 1)),
      east: String(nb(1, 0)),
      west: String(nb(-1, 0)),
    });
  } else if (b.props) {
    g.set(b.x, b.y, b.z, b.id, b.props);
  } else {
    g.set(b.x, b.y, b.z, b.id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
