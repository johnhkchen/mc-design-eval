import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167418";
const W = 15, H = 38, D = 17;

// Record: no building record. Read as a 1980s-90s Xinyi mid-rise: five storeys of
// white tiled concrete with a granite shopfront base, window bays, a cornice,
// and rooftop plant. Roof about 26 blocks above lowest ground.
const N = 5;          // storeys
const ROOF = 26;      // roof height above lowest ground (lidar)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occ.has(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Common floor datum: highest ground under the footprint, so every storey is level.
const gmax = Math.max(...cells.map((c) => c[2]));
const B = gmax;
// Storey height so that the parapet lands near ROOF.
const h = Math.max(3, Math.floor((ROOF - 1 - B) / N));
const ry = B + N * h; // roof slab level

function side(x, z) {
  const mx = !has(x - 1, z) || !has(x + 1, z);
  const mz = !has(x, z - 1) || !has(x, z + 1);
  return { mx, mz, corner: mx && mz, perim: mx || mz };
}
function inward(x, z) {
  const dx = !has(x - 1, z) ? 1 : (!has(x + 1, z) ? -1 : 0);
  const dz = !has(x, z - 1) ? 1 : (!has(x, z + 1) ? -1 : 0);
  return [dx, dz];
}

// 1. Foundation: solid from y 0 up to the datum under every cell (and to its own ground).
for (const [x, z, gr] of cells) {
  for (let y = 0; y < Math.max(gr, B); y++) put(x, y, z, "polished_andesite");
}

// 2. Storeys: floor slab, facade rows, window grid.
for (let s = 0; s <= N; s++) {
  const f = B + s * h;
  // Floor slab (also the roof slab at s = N).
  for (const [x, z] of cells) put(x, f, z, "smooth_quartz");
  if (s === N) break;

  for (const [x, z] of cells) {
    const si = side(x, z);
    if (!si.perim) continue;
    // Bay index along the wall: x for walls facing +/-z, z for walls facing +/-x.
    const u = si.mz ? x : z;
    const [dx, dz] = inward(x, z);
    for (let r = 1; r <= h - 1; r++) {
      const y = f + r;
      if (r === h - 1) {
        // Spandrel / transom band.
        put(x, y, z, s === 0 ? "polished_granite" : "light_gray_concrete");
        continue;
      }
      if (si.corner || u % 3 === 0) {
        // Pier.
        put(x, y, z, s === 0 ? "polished_granite" : "white_concrete");
        continue;
      }
      // Glass pane, oriented along the wall.
      const props = si.mz
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", props);

      // Warm light behind some windows: glowstone in the interior cell just inside.
      const lit = r === 2 && ((u + s * 3) % 7 === 1);
      if (lit) {
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !side(ix, iz).perim) put(ix, y, iz, "glowstone");
      }
    }
  }
}

// 3. Entrance on the south (+z) face: double door, granite canopy over it.
const mean = cells.reduce((a, c) => a + c[0], 0) / cells.length;
let doorCands = cells.filter(([x, z]) => !has(x, z + 1) && !side(x, z).corner);
if (doorCands.length === 0) doorCands = cells.filter(([x, z]) => side(x, z).perim && !side(x, z).corner);
if (doorCands.length > 0) {
  doorCands.sort((a, b) => Math.abs(a[0] - mean) - Math.abs(b[0] - mean));
  const [dx0, dz0] = doorCands[0];
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  put(dx0, B + 1, dz0, "dark_oak_door", doorProps("lower"));
  put(dx0, B + 2, dz0, "dark_oak_door", doorProps("upper"));
  // Canopy lintel over door and its along-wall neighbours.
  const along = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [ax, az] of along) {
    const cx = dx0 + ax, cz = dz0 + az;
    if (!has(cx, cz)) continue;
    const si = side(cx, cz);
    if (si.perim && !si.corner) put(cx, B + 3, cz, "polished_granite");
  }
}

// 4. Cornice and parapet on the roof edge.
for (const [x, z] of cells) {
  const si = side(x, z);
  if (!si.perim) continue;
  put(x, ry, z, "polished_granite");
  put(x, ry + 1, z, "white_concrete");
}

// 5. Rooftop plant in the middle of the roof.
const cx = (W - 1) / 2, cz = (D - 1) / 2;
for (const [x, z] of cells) {
  if (side(x, z).perim) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 3) {
    put(x, ry + 1, z, "light_gray_concrete");
    put(x, ry + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
