import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871923";
const W = 21, H = 23, D = 30;
const RT = 10; // roof slab level; parapet sits at RT+1

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(6, Math.round(gr))));
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const perim = (x, z) => NB.some(([dx, dz]) => !has(x + dx, z + dz));
const xFace = (x, z) => !has(x + 1, z) || !has(x - 1, z);
const zFace = (x, z) => !has(x, z + 1) || !has(x, z - 1);
function pier(x, z) {
  const a = xFace(x, z), b = zFace(x, z);
  if (a && b) return true;
  if (a) return z % 3 === 0;
  return x % 3 === 0;
}

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassAt = (x, z) => (xFace(x, z) ? PANE_X : PANE_Z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => (p ? g.set(x, y, z, b, p) : g.set(x, y, z, b));

// Entrance: on the min-z row, median x of that row.
let zMin = Infinity;
for (const k of G.keys()) zMin = Math.min(zMin, Number(k.split(",")[1]));
const entRow = [...G.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => z === zMin)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const ex = entRow[Math.floor(entRow.length / 2)];
const ez = zMin;

// Main shell, floors, windows, foundation.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const pm = perim(x, z);
  const pr = pier(x, z);

  // Foundation under the building.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Ground floor slab / base course.
  put(x, gr, z, pm ? "polished_andesite" : "smooth_stone");

  // Ground storey: shopfront with glass bays, piers, sign band.
  const F = Math.min(gr + 5, RT - 3); // upper floor slab level
  for (let y = gr + 1; y < F; y++) {
    if (!pm) continue;
    if (y === F - 1) {
      put(x, y, z, pr ? "smooth_quartz" : "gray_concrete");
    } else if (pr) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", glassAt(x, z));
    }
  }

  // Floor slab per storey.
  put(x, F, z, pm ? "smooth_quartz" : "smooth_stone");

  // Upper storey: ribbon windows between piers, warm light behind some panes.
  for (let y = F + 1; y <= RT - 1; y++) {
    if (!pm) continue;
    if (pr) {
      put(x, y, z, "smooth_quartz");
    } else if (y === F + 2 || y === F + 3) {
      put(x, y, z, "light_blue_stained_glass_pane", glassAt(x, z));
      if (y === F + 2 && (x + z) % 4 === 0) {
        const dir = NB.find(([dx, dz]) => has(x + dx, z + dz));
        if (dir) {
          const ix = x + dir[0], iz = z + dir[1];
          if (!perim(ix, iz)) put(ix, F + 2, iz, "glowstone");
        }
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Roof slab, cornice, parapet.
  put(x, RT, z, pm ? "smooth_quartz" : "light_gray_concrete");
  if (pm) put(x, RT + 1, z, "white_concrete");
}

// Entrance: double-height-ish door with a dark canopy band above.
if (G.has(`${ex},${ez}`)) {
  const gr = gnd(ex, ez);
  const F = Math.min(gr + 5, RT - 3);
  if (gr + 2 < F) {
    put(ex, gr + 1, ez, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(ex, gr + 2, ez, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  if (gr + 3 < F) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ex + dx;
      if (has(cx, ez) && perim(cx, ez)) put(cx, gr + 3, ez, "black_concrete");
    }
  }
}

// Roof plant: a central equipment box on deep roof cells, kept off the parapet.
const deep = (x, z, d) => {
  for (let dx = -d; dx <= d; dx++)
    for (let dz = -d; dz <= d; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
};
let sx = 0, sz = 0, n = 0;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  sx += x; sz += z; n++;
}
const cx = sx / n, cz = sz / n;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!deep(x, z, 3)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 4) {
    put(x, RT + 1, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
      put(x, RT + 2, z, "white_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
