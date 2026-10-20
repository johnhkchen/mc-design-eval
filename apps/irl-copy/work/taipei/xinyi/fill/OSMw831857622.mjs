import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 19 x 18 footprint, roof ~11 blocks above lowest ground.
// Reading: a two-storey mid-century commercial block (reinforced concrete frame,
// pale cast-concrete facade, stone plinth, shopfront at street level, upper-floor
// window bays, cornice and parapet, flat roof with plant box and lightning rod).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857622";
const W = 19, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

// Storey lines (absolute y; roof sits at y = 11)
const LINTEL = 4;   // top of ground storey
const BELT = 5;     // upper floor line
const CORNICE = 9;  // cornice course
const PARAPET = 10; // parapet top course
const ROOF = 11;    // roof surface / parapet cap

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const exp = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const anyExp = (x, z) => {
  const e = exp(x, z);
  return e.n || e.s || e.w || e.e;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Pick the street entrance: middle bay of the south face (fallback north).
let entKey = null;
for (const face of ["s", "n"]) {
  const cand = [];
  for (const [x, z] of G.keys().map((k) => k.split(",").map(Number))) {
    const e = exp(x, z);
    if (e[face] && !e.w && !e.e && !(face === "s" ? e.n : e.s) && x % 3 !== 0) {
      cand.push([x, z]);
    }
  }
  if (cand.length) {
    cand.sort((a, b) => a[0] - b[0]);
    const [ex, ez] = cand[Math.floor(cand.length / 2)];
    entKey = `${ex},${ez}`;
    break;
  }
}

// 1) Foundations, interior floor slabs, and roof over interior cells.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!anyExp(x, z)) {
    put(x, gr, z, "smooth_stone");
    if (gr < BELT) put(x, BELT, z, "smooth_stone");
    put(x, PARAPET, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
  }
}

// 2) Facade on exposed edge cells.
const paneFor = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const slabCap = { type: "bottom", waterlogged: "false" };

function corner(x, z, gr) {
  for (let y = gr; y <= PARAPET; y++) {
    put(x, y, z, y === gr ? "stone_bricks" : "light_gray_concrete");
  }
  put(x, ROOF, z, "stone_brick_slab", slabCap);
}

function panel(x, z, gr, u, face, axis) {
  const pillar = u % 3 === 0;
  const isEnt = entKey === `${x},${z}` && gr <= 1;
  const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[face];
  const ix = x + inward[0], iz = z + inward[1];
  const glowOK = has(ix, iz) && !anyExp(ix, iz);
  const pane = paneFor(axis);

  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks");
    } else if (y < LINTEL) {
      // Ground storey: shopfront with pillars, entrance door centred
      if (isEnt && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: face,
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (pillar) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "glass_pane", pane);
      }
    } else if (y === LINTEL || y === BELT || y === CORNICE) {
      put(x, y, z, "light_gray_concrete");
    } else if (y > BELT && y < CORNICE) {
      // Upper storey window bays
      if (pillar) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "glass_pane", pane);
        if (y === 7 && u % 6 === 4 && glowOK) put(ix, 7, iz, "glowstone");
      }
    } else if (y === PARAPET) {
      put(x, y, z, "white_concrete");
    }
  }
  put(x, ROOF, z, "stone_brick_slab", slabCap);
}

for (const [x, z, gr] of cells) {
  const e = exp(x, z);
  if (!(e.n || e.s || e.w || e.e)) continue;
  const ns = e.n || e.s;
  const ew = e.w || e.e;
  if (ns && ew) corner(x, z, gr);
  else if (ns) panel(x, z, gr, x, e.n ? "north" : "south", "x");
  else panel(x, z, gr, z, e.w ? "west" : "east", "z");
}

// 3) Roof plant: a 3x3 mechanical box and a lightning rod, on interior cells only.
let sx = 0, sz = 0, n = 0;
for (const [x, z] of G.keys().map((k) => k.split(",").map(Number))) {
  sx += x; sz += z; n++;
}
const cx = Math.round(sx / n), cz = Math.round(sz / n);

let boxOK = true;
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  const x = cx + dx, z = cz + dz;
  if (!has(x, z) || anyExp(x, z)) boxOK = false;
}

if (boxOK) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(cx + dx, 12, cz + dz, "light_gray_concrete");
    put(cx + dx, 13, cz + dz, "light_gray_concrete");
  }
  put(cx, 14, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(cx, 15, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
} else {
  // Fallback: a single small unit on any interior cell.
  for (const [x, z] of G.keys().map((k) => k.split(",").map(Number))) {
    if (!anyExp(x, z)) {
      put(x, 12, z, "light_gray_concrete");
      put(x, 13, z, "smooth_stone_slab", slabCap);
      break;
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
