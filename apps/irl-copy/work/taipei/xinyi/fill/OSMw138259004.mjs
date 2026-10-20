import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 時代廣場 (Times Square), Taipei: a 1980s-90s shop-and-office block, three storeys
// over a red-tiled shopfront. Roof about 16 blocks above the lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw138259004";
const W = 28, H = 28, D = 115;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Outward facade normals for a footprint cell (empty for interior cells).
function exposure(x, z) {
  const out = [];
  if (!has(x - 1, z)) out.push([-1, 0]);
  if (!has(x + 1, z)) out.push([1, 0]);
  if (!has(x, z - 1)) out.push([0, -1]);
  if (!has(x, z + 1)) out.push([0, 1]);
  return out;
}

const SLABS = [5, 10, 15];
const TOP = 16;

const glassProps = (nx) => {
  const along = nx !== 0; // facade runs along z when the normal is x
  return {
    north: along ? "true" : "false",
    south: along ? "true" : "false",
    east: along ? "false" : "true",
    west: along ? "false" : "true",
    waterlogged: "false",
  };
};

// Pass 1: foundation, base course, slabs, facade, parapet and roof units.
for (const [x, z, gr] of cells) {
  const ex = exposure(x, z);
  const perim = ex.length > 0;
  const corner = ex.length > 1;
  const [nx] = ex[0] ?? [0, 0];
  const along = nx !== 0 ? z : x;
  const pier = corner || along % 3 === 0;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course at ground level.
  put(x, gr, z, "polished_granite");

  // Floor slabs across the whole footprint (air gap behind the glass).
  for (const sy of SLABS) if (sy >= gr) put(x, sy, z, "smooth_quartz");

  // Roof units on interior cells, standing on the roof slab at y=15.
  if (!perim && x % 6 === 2 && z % 8 === 3) {
    put(x, TOP, z, "iron_block");
    put(x, TOP + 1, z, "light_gray_concrete");
  }

  if (!perim) continue;

  for (let y = gr + 1; y <= TOP; y++) {
    if (SLABS.includes(y)) continue; // already set as a band

    if (y === TOP) {
      // Parapet with rhythm: merlon-like blocks over piers, gaps between bays.
      if (corner || along % 3 !== 2) put(x, y, z, "white_concrete");
    } else if (y <= 3) {
      // Ground-floor shopfront: red tile piers and glazed bays.
      if (pier) put(x, y, z, "red_terracotta");
      else put(x, y, z, "glass_pane", glassProps(nx));
    } else if (y === 4) {
      // Fascia with occasional signage strip.
      if (pier) put(x, y, z, "red_terracotta");
      else if (along % 9 === 4) put(x, y, z, "yellow_concrete");
      else put(x, y, z, "red_concrete");
    } else if ((y >= 6 && y <= 9) || (y >= 11 && y <= 14)) {
      const sill = y === 6 || y === 11;
      const lintel = y === 9 || y === 14;
      if (pier) put(x, y, z, "white_terracotta");
      else if (sill) put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      else if (lintel) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane", glassProps(nx));
    }
  }
}

// Pass 2: warm lights behind some windows, on interior cells.
for (const [x, z, gr] of cells) {
  const ex = exposure(x, z);
  if (ex.length !== 1) continue;
  const [nx, nz] = ex[0];
  const along = nx !== 0 ? z : x;
  if (along % 3 === 0) continue;
  const ix = x - nx, iz = z - nz;
  if (!has(ix, iz) || exposure(ix, iz).length !== 0) continue;
  if (along % 9 === 4 && gr < 7) put(ix, 7, iz, "glowstone");
  if (along % 9 === 1 && gr < 12) put(ix, 12, iz, "shroomlight");
}

// Pass 3: entrance on the west frontage, near the middle of the length.
// Candidates: plain (non-corner) facade cells whose door fits in the shopfront.
{
  const zc = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  const fits = ([x, z, gr]) => {
    const ex = exposure(x, z);
    return ex.length === 1 && gr + 2 <= 3 && (z % 3 === 1 || z % 3 === 2);
  };
  let cand = cells.filter((c) => fits(c) && exposure(c[0], c[1])[0][0] === -1);
  if (!cand.length) cand = cells.filter(fits);
  if (cand.length) {
    cand.sort((a, b) => Math.abs(a[1] - zc) - Math.abs(b[1] - zc));
    const [x, z, gr] = cand[0];
    const [nx, nz] = exposure(x, z)[0];
    const facing = nx === -1 ? "west" : nx === 1 ? "east" : nz === -1 ? "north" : "south";
    const door = { facing, hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...door, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...door, half: "upper" });
    // Lintel over the door.
    put(x, 4, z, "red_concrete");
    // Canopy slab in front of the door, on the interior cell.
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz) && exposure(ix, iz).length === 0) {
      put(ix, gr + 3, iz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      put(ix, gr + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
