import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0324-3F-3";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 2002 Taipei mid-rise office/retail block: three storeys of 5 blocks,
// white and light-grey tiled concrete, light-blue glass bands, polished
// andesite base, stone-slab cornice, solid roof plant box.
const W = 14, H = 28, D = 10;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inFP = (x, z) => G.has(`${x},${z}`);
const gr = (x, z) => G.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (!inFP(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exX = (x, z) => !inFP(x - 1, z) || !inFP(x + 1, z);
const exZ = (x, z) => !inFP(x, z - 1) || !inFP(x, z + 1);
const perim = (x, z) => exX(x, z) || exZ(x, z);
const corner = (x, z) => exX(x, z) && exZ(x, z);

// Window columns alternate along each exposed face, never on corners.
const isWin = (x, z) => {
  if (!perim(x, z) || corner(x, z)) return false;
  const along = exZ(x, z) ? x : z;
  return along % 2 === 1;
};

// Entrance: the cell on the min-z face nearest the footprint's mean x.
let doorKey = null;
{
  const minZFace = cells.filter(([x, z]) => !inFP(x, z - 1));
  const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  let best = Infinity;
  for (const [x, z] of minZFace) {
    const d = Math.abs(x - meanX);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

const paneProps = (x, z) =>
  exZ(x, z)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const WIN = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const HEADER = "light_gray_concrete";
const SILL = "quartz_slab";

for (const [x, z, ground] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const edge = perim(x, z);
  const key = `${x},${z}`;

  // Base course on the perimeter, floor slab inside.
  put(x, ground, z, edge ? "polished_andesite" : "smooth_stone");

  // Storey rows: slab at ground+5s, walls in rows +1..+4.
  for (let r = 1; r <= 15; r++) {
    const y = ground + r;
    const rel = r % 5;
    const s = Math.floor(r / 5);
    if (rel === 0) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (!edge) continue; // interior air gap behind the glass
    if (corner(x, z)) { put(x, y, z, PIER); continue; }

    if (key === doorKey) {
      if (r === 1) {
        put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (r === 2) {
        put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (r === 3) {
        // Lintel over the entrance.
        put(x, y, z, "smooth_stone");
      } else {
        put(x, y, z, rel === 4 ? HEADER : SPANDREL);
      }
      continue;
    }

    if (isWin(x, z)) {
      if (s === 0) {
        // Ground-floor shopfront: glass from the base course to the header.
        if (rel === 4) put(x, y, z, HEADER);
        else put(x, y, z, WIN, paneProps(x, z));
      } else {
        if (rel === 1) put(x, y, z, SILL, { type: "bottom", waterlogged: "false" });
        else if (rel === 4) put(x, y, z, HEADER);
        else put(x, y, z, WIN, paneProps(x, z));
      }
    } else {
      put(x, y, z, rel === 1 || rel === 4 ? SPANDREL : PIER);
    }
  }

  // Parapet and stone cornice cap.
  if (edge) {
    put(x, ground + 16, z, "light_gray_concrete");
    put(x, ground + 17, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights behind some panes (interior cell next to a window).
for (const [x, z, ground] of cells) {
  if (!isWin(x, z)) continue;
  if ((x + z) % 3 !== 0) continue;
  let ix = x, iz = z;
  if (exZ(x, z)) iz = z === 0 ? z + 1 : z - 1;
  else ix = x === 0 ? x + 1 : x - 1;
  if (!inFP(ix, iz) || perim(ix, iz)) continue;
  for (let s = 0; s < 3; s++) {
    put(ix, ground + 5 * s + 2, iz, "glowstone");
  }
}

// Roof plant box: solid block on the roof slab, with a cover and a vent.
{
  const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const x0 = minX + 4, x1 = maxX - 4, z0 = minZ + 3, z1 = maxZ - 3;
  for (const [x, z, ground] of cells) {
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    for (let r = 16; r <= 18; r++) {
      put(x, ground + r, z, ring ? "light_gray_concrete" : "white_concrete");
    }
    put(x, ground + 19, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
