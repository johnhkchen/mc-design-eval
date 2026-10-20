import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408132";

// [x, z, ground] per footprint cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 11;
const vox = new Voxels([W, H, D]);

// Lookup helpers
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Only place blocks inside the volume and on footprint cells
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Glass pane connection states: a pane on a wall running along x connects east/west
const pane = (x, z) => {
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Facade: white concrete piers on a 3-cell rhythm, glass panes between
const facadeBand = (x, y, z) => {
  const pier = (x + z) % 3 === 0;
  if (pier) put(x, y, z, "white_concrete");
  else put(x, y, z, "glass_pane", pane(x, z));
};

// Inward direction for a perimeter cell (toward the building interior)
const inward = (x, z) => {
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x + 1, z)) return [-1, 0];
  if (!has(x, z - 1)) return [0, 1];
  if (!has(x, z + 1)) return [0, -1];
  return null;
};

// Main massing: foundation, two storeys of shopfronts and windows, parapet, roof units
for (const [x, z, gr] of cells) {
  const e = edge(x, z);
  const pier = (x + z) % 3 === 0;

  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab / plinth
  put(x, gr, z, e ? "stone_bricks" : "smooth_stone");

  // Ground storey: shopfront glazing, gr+1..gr+3, lintel at gr+4
  if (e) {
    for (let y = gr + 1; y <= gr + 3; y++) facadeBand(x, y, z);
    put(x, gr + 4, z, "light_gray_concrete");
  }

  // Storey line / floor slab at gr+5
  put(x, gr + 5, z, e ? "light_gray_concrete" : "smooth_stone");

  // Upper storey: windows gr+6..gr+8, sill/lintel at gr+9
  if (e) {
    for (let y = gr + 6; y <= gr + 8; y++) facadeBand(x, y, z);
    put(x, gr + 9, z, "light_gray_concrete");
  }

  // Parapet ring on the perimeter, roof slab inside; top surface at gr+11
  put(x, gr + 10, z, e ? "gray_concrete" : "smooth_stone");

  // Roof equipment: AC plant boxes on a few interior cells
  if (!e && x % 6 === 2 && z % 5 === 2) put(x, gr + 11, z, "iron_block");

  // Warm light behind some upper-storey windows (sits on the interior floor slab)
  if (e && !pier && (x + z) % 4 === 1) {
    const d = inward(x, z);
    if (d) {
      const ix = x + d[0], iz = z + d[1];
      if (has(ix, iz) && !edge(ix, iz)) {
        const g2 = ground.get(`${ix},${iz}`);
        put(ix, g2 + 6, iz, "glowstone");
      }
    }
  }
}

// Entrance: centred on the south-most row (highest z), with a brown canopy over it
const zmax = Math.max(...cells.map(([, z]) => z));
const row = cells.filter(([, z]) => z === zmax).sort((a, b) => a[0] - b[0]);
const [ex, , ge] = row[Math.floor(row.length / 2)];

// Canopy over the door and its neighbours (each at its own ground level)
for (let dx = -1; dx <= 1; dx++) {
  const cx = ex + dx;
  if (!has(cx, zmax)) continue;
  const gc = ground.get(`${cx},${zmax}`);
  put(cx, gc + 4, zmax, "brown_concrete");
}

// Door: two-high, opening outward to the south face
vox.set(ex, ge + 1, zmax, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
vox.set(ex, ge + 2, zmax, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

vox.save(`${DIR}/${ID}.nbt`);
