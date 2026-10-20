import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR_PATH = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711377";

const cells = JSON.parse(readFileSync(`${DIR_PATH}/${ID}.cells.json`, "utf8"));
const g = new Voxels([23, 33, 16]);

// Footprint lookup
const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Outward directions for each cell (directions where the neighbour is off the footprint)
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const outsOf = (x, z) =>
  Object.keys(DIRS).filter(([d]) => {
    const [dx, dz] = DIRS[d];
    return !inFoot(x + dx, z + dz);
  });

// Deterministic pseudo-random for sparse lit windows
const hash = (x, y, z) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) % 11;
};

// Building parameters: 4 storeys of 5 blocks, roof at y 20, parapet top at y 21
const STOREY = 5;
const STOREYS = 4;
const ROOF_Y = STOREY * STOREYS; // 20
const PARAPET_Y = ROOF_Y + 1;    // 21

const cx = 11;
const cz = 7.5;

// Pick the entrance: a perimeter cell facing south (or any outward face), nearest to centre x
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const o = outsOf(x, z);
    if (!o.length) continue;
    const pref = o.includes("south") ? 0 : 100;
    const score = pref + Math.abs(x - cx);
    if (score < best) {
      best = score;
      entrance = { x, z, face: o.includes("south") ? "south" : o[0] };
    }
  }
}

// Central mast cell: interior cell nearest the centroid
let mast = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (outsOf(x, z).length) continue;
    const d = Math.hypot(x - cx, z - cz);
    if (d < best) {
      best = d;
      mast = { x, z };
    }
  }
}

for (const [x, z, gr0] of cells) {
  const ground = Math.max(0, Math.round(gr0));
  const outs = outsOf(x, z);
  const isP = outs.length > 0;
  const primary = outs[0];
  const idx = primary === "north" || primary === "south" ? x : z;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < Math.max(ground, 1); y++) {
    g.set(x, y, z, "stone_bricks");
  }

  // Base course on the perimeter
  if (isP) g.set(x, 0, z, "polished_granite");

  // Storeys: floor slab at each storey base, walls with window grids on perimeter
  for (let s = 0; s < STOREYS; s++) {
    const base = s * STOREY;
    g.set(x, base, z, "light_gray_concrete");

    if (!isP) continue;

    // Window zone k = 1..3, spandrel at k = 4
    for (let k = 1; k <= 3; k++) {
      const y = base + k;
      if (s === 0) {
        // Shopfront: clear glass with granite piers
        g.set(x, y, z, idx % 3 === 0 ? "polished_granite" : "glass");
      } else {
        g.set(x, y, z, idx % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
      }
    }
    g.set(x, base + 4, z, "white_concrete");

    // Warm light behind some upper-storey glass (in the interior cell)
    if (s >= 1 && s <= 2 && idx % 3 !== 0 && hash(x, base, z) < 2) {
      for (const d of outs) {
        const [dx, dz] = DIRS[d];
        const ix = x - dx;
        const iz = z - dz;
        if (inFoot(ix, iz) && !outsOf(ix, iz).length) {
          g.set(ix, base + 2, iz, "shroomlight");
          break;
        }
      }
    }
  }

  // Cornice and parapet on the roof edge
  if (isP) {
    g.set(x, ROOF_Y, z, "smooth_quartz");
    g.set(x, PARAPET_Y, z, "white_concrete");
  } else {
    // Roof slab over the interior
    g.set(x, ROOF_Y, z, "light_gray_concrete");
    // HVAC plant boxes on some interior roof cells
    if ((x * 7 + z * 3) % 11 === 0) {
      g.set(x, PARAPET_Y, z, "iron_block");
    }
  }
}

// Entrance: double door with lintel and a quartz hood
if (entrance) {
  const { x, z, face } = entrance;
  g.set(x, 1, z, "dark_oak_door", {
    facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, 2, z, "dark_oak_door", {
    facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, 3, z, "quartz_stairs", {
    facing: face, half: "top", shape: "straight", waterlogged: "false",
  });
}

// Roof mast: iron bars with an end rod, on the interior cell nearest the centroid
if (mast) {
  for (let y = PARAPET_Y; y <= PARAPET_Y + 4; y++) {
    g.set(mast.x, y, mast.z, "iron_bars");
  }
  g.set(mast.x, PARAPET_Y + 5, mast.z, "end_rod", { facing: "up" });
}

g.save(`${DIR_PATH}/${ID}.nbt`);
