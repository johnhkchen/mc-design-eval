import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC66968";
const W = 44, H = 32, D = 18;
const TOP_MAX = 27;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- footprint map -------------------------------------------------------
const cm = new Map();
for (const c of list) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cm.set(`${x},${z}`, { gr: Math.max(0, Math.round(gr)), rf: Math.round(rf) });
}
const has = (x, z) => cm.has(`${x},${z}`);

// Storeys: 3 blocks each (storey line, spandrel, glass), quantised per cell
const info = new Map();
for (const [key, c] of cm) {
  let n = Math.round((c.rf - c.gr) / 3);
  if (n < 1) n = 1;
  if (c.gr + 3 * n > TOP_MAX) n = Math.max(1, Math.floor((TOP_MAX - c.gr) / 3));
  info.set(key, { gr: c.gr, n, top: c.gr + 3 * n });
}

// Street frontage = south-facing exposed row (highest z)
const southCells = [];
for (const [key] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z + 1)) southCells.push([x, z]);
}
let entrance = null, entranceZ = null;
if (southCells.length) {
  entranceZ = Math.max(...southCells.map(c => c[1]));
  const row = southCells.filter(c => c[1] === entranceZ).map(c => c[0]).sort((a, b) => a - b);
  entrance = row[Math.floor(row.length / 2)];
}

// ---- build ---------------------------------------------------------------
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  const { gr, n, top } = info.get(key);

  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const edge = exN || exS || exW || exE;
  const corner = (exN || exS) && (exW || exE);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");

  for (let s = 0; s < n; s++) {
    const yb = gr + 3 * s;

    // Floor slab / storey line on every cell
    if (edge && s === 0) put(x, yb, z, "polished_granite");   // base course
    else put(x, yb, z, "smooth_quartz");

    if (!edge) continue;   // interior: air gap, no fit-out

    const idx = (exN || exS) ? x : z;
    const isPier = corner || idx % 4 === 0;

    // Three-wide entrance with granite pilasters on the street face
    const onStreet = exS && z === entranceZ;
    if (s === 0 && onStreet && Math.abs(x - entrance) <= 1) {
      if (x === entrance) {
        put(x, yb + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, yb + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, yb + 1, z, "polished_granite");
        put(x, yb + 2, z, "polished_granite");
      }
      continue;
    }

    if (isPier) {
      // Piers: quartz pillars for a little tonal relief against the flat smooth bands
      put(x, yb + 1, z, "quartz_pillar", { axis: "y" });
      put(x, yb + 2, z, "quartz_pillar", { axis: "y" });
    } else {
      // Spandrel (sill) then glazing with a few lit bays
      put(x, yb + 1, z, "light_gray_concrete");
      const lit = ((idx + s * 3) % 9) === 4;
      put(x, yb + 2, z, lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane");
    }
  }

  // Cornice on edges, roof deck inside
  put(x, top, z, edge ? "smooth_quartz" : "smooth_stone");
  if (edge) put(x, top + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Roof plant: a few coherent mechanical boxes on the interior roof
  if (!edge && (x % 8 === 4) && (z % 2 === 1)) {
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
