// Mid-rise commercial block, Xinyi (c. 1990s): five storeys over a granite-and-glass shopfront,
// cream quartz piers and white spandrels, blue-tinted glazing, a roof plant deck with a
// lightning-rod mast. Roof at y 25, parapet to 26, plant to 28, mast to 32.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011433";
const W = 23, H = 38, D = 18;
const ROOF_Y = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
let minG = Infinity;
for (const c of cells) minG = Math.min(minG, c[2]);
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr - minG));

const inF = (x, z) => G.has(key(x, z));
const gr = (x, z) => G.get(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) =>
  Object.keys(DIRS).filter(f => !inF(x + DIRS[f][0], z + DIRS[f][1]));
const isEdge = (x, z) => outward(x, z).length > 0;
const fp = [...G.keys()].map(k => k.split(",").map(Number));

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// ---- foundation, floors, walls, roof deck ------------------------------------
for (const [x, z] of fp) {
  const ground = gr(x, z);
  const edge = isEdge(x, z);

  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = ground; y <= ROOF_Y; y++) {
    let b = null;

    if (y === ROOF_Y) {
      b = edge ? "smooth_quartz" : "light_gray_concrete";
    } else if (!edge) {
      if (y === ground || y % 5 === 0) b = "smooth_stone"; // floor slabs
    } else if (y < 5) {
      // Shopfront storey: granite base, glass with piers, black lintel, spandrel
      const r = y - ground;
      if (r === 0) b = "polished_granite";
      else if (r <= 2) b = (x + z) % 3 === 0 ? "iron_block" : "light_blue_stained_glass";
      else if (r === 3) b = "black_concrete";
      else b = "white_concrete";
    } else if (y % 5 === 0) {
      b = "smooth_quartz"; // storey line
    } else if (y % 5 === 4) {
      b = "white_concrete"; // spandrel
    } else {
      // window band
      if ((x + z) % 3 === 0) b = "smooth_quartz";
      else if ((x + z) % 6 === 4) b = "gray_stained_glass";
      else b = "light_blue_stained_glass";
    }

    if (b) put(x, y, z, b);
  }
}

// ---- warm lights behind some windows (interior, one cell in) -----------------
for (const [x, z] of fp) {
  if (!isEdge(x, z)) continue;
  const ground = gr(x, z);
  for (let y = 7; y < ROOF_Y; y += 5) {
    // y % 5 === 2 for window rows 1-3 of each storey
    if (y % 5 !== 2 || (x + z) % 6 !== 1) continue;
    const inner = Object.values(DIRS)
      .map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => inF(nx, nz) && !isEdge(nx, nz));
    if (!inner) continue;
    const [nx, nz] = inner;
    if (y - 1 < gr(nx, nz) || y - 1 < ground) continue;
    put(nx, y - 1, nz, "glowstone");
  }
}

// ---- entrance on the facade with most exposed cells --------------------------
const sides = { north: [], south: [], west: [], east: [] };
for (const [x, z] of fp) for (const f of outward(x, z)) sides[f].push([x, z]);
let best = "south";
for (const f of Object.keys(sides)) if (sides[f].length > sides[best].length) best = f;
const along = best === "north" || best === "south" ? 0 : 1;
const list = sides[best].sort((a, b) => a[along] - b[along]);
const [ex, ez] = list[Math.floor(list.length / 2)];
const eg = gr(ex, ez);

// double-height door (lower and upper halves) facing outward
put(ex, eg, ez, "dark_oak_door", { facing: best, half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 1, ez, "dark_oak_door", { facing: best, half: "upper", hinge: "left", open: "false", powered: "false" });

// canopy over the entrance, with a hanging lantern beneath
const [ax, az] = best === "north" || best === "south" ? [1, 0] : [0, 1];
for (const s of [-1, 0, 1]) {
  const cx = ex + ax * s, cz = ez + az * s;
  if (isEdge(cx, cz) && gr(cx, cz) === eg) put(cx, eg + 3, cz, "black_concrete");
}
put(ex, eg + 2, ez, "lantern", { hanging: "true" });

// ---- roof plant and mast -----------------------------------------------------
const plantBox = (x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inF(x, z) || isEdge(x, z)) continue;
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    put(x, ROOF_Y + 2, z, "light_gray_concrete");
    put(x, ROOF_Y + 3, z, "iron_bars");
  }
};
plantBox(5, 9, 5, 9);
plantBox(13, 17, 5, 9);

if (inF(11, 7) && !isEdge(11, 7)) {
  for (let y = ROOF_Y + 1; y <= 32; y++) put(11, y, 7, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
