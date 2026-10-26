import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC60455 - 1709 New York Ave NW. 1980s-era speculative office block: beige precast
// piers, light-grey spandrels, bronze-tinted glass, stone base, setback core and
// a stepped penthouse. Storeys are 3 blocks; roof follows lidar, smoothed to one
// main tier with a taller core where the lidar says so.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC60455";
const W = 57, H = 26, D = 25;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, rf] of raw) {
  map.set(key(x, z), { x, z, gr: Math.round(gr), rf: Math.round(rf) });
}

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const nb = (c, dx, dz) => map.get(key(c.x + dx, c.z + dz));

// Smooth roof: main tier = median roof over perimeter cells; core rises only if lidar says so.
const edgeCells = [...map.values()].filter(c => DIRS.some(([dx, dz]) => !nb(c, dx, dz)));
const sortedRf = (edgeCells.length ? edgeCells : [...map.values()]).map(c => c.rf).sort((a, b) => a - b);
const mainTop = sortedRf[Math.floor(sortedRf.length / 2)];
const minZ = Math.min(...[...map.values()].map(c => c.z));

for (const c of map.values()) {
  const top = c.rf > mainTop + 2 ? c.rf : mainTop;
  c.top = Math.min(H - 4, Math.max(c.gr + 4, top));
}

// Returns the [dx,dz] of an exposed (outward-facing) side at height y, or null.
const exposed = (c, y) => {
  for (const [dx, dz] of DIRS) {
    const n = nb(c, dx, dz);
    if (!n || (y >= n.gr && n.top <= y)) return [dx, dz];
  }
  return null;
};

const g = new Voxels([W, H, D]);

const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Corner pilasters: cells on the footprint corners read as solid stone columns.
const isCorner = (c) => {
  const zFree = !nb(c, 0, -1) || !nb(c, 0, 1);
  const xFree = !nb(c, -1, 0) || !nb(c, 1, 0);
  return zFree && xFree;
};

for (const c of map.values()) {
  // Foundation up to the cell's ground.
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");

  for (let y = c.gr; y < c.top; y++) {
    const rel = y - c.gr;
    const face = exposed(c, y);

    if (!face) {
      // Interior: floor slab per storey, roof deck on top, air between.
      if (y === c.top - 1) g.set(c.x, y, c.z, "light_gray_concrete");
      else if (rel % 3 === 0) g.set(c.x, y, c.z, "light_gray_concrete");
      continue;
    }

    if (y === c.top - 1) { g.set(c.x, y, c.z, "smooth_stone"); continue; }     // cornice cap
    if (y === c.top - 2) { g.set(c.x, y, c.z, "white_concrete"); continue; }   // parapet course
    if (rel === 0) { g.set(c.x, y, c.z, "stone_bricks"); continue; }           // base course
    if (rel % 3 === 0) { g.set(c.x, y, c.z, "light_gray_concrete"); continue; } // spandrel / floor line

    const [dx, dz] = face;
    const alongX = dz !== 0;            // wall runs along x on a z-facing side
    const u = alongX ? c.x : c.z;
    if (isCorner(c)) {
      g.set(c.x, y, c.z, "stone_bricks");                                        // corner pilaster
    } else if (u % 3 === 0) {
      g.set(c.x, y, c.z, "white_concrete");                                      // precast pier
    } else if (rel < 3) {
      g.set(c.x, y, c.z, "light_blue_stained_glass");                            // shopfront glass
    } else {
      g.set(c.x, y, c.z, "light_blue_stained_glass_pane", paneProps(alongX));    // office window
    }

    // Warm light in the air gap behind some windows.
    if (u % 3 !== 0 && !isCorner(c) && rel >= 1 && (u + rel) % 9 === 4) {
      const n = map.get(key(c.x - dx, c.z - dz));
      if (n && y >= n.gr && y < n.top && !exposed(n, y)) {
        g.set(n.x, y, n.z, "glowstone");
      }
    }
  }
}

// Lobby entrance on the street (min-z) face: five-bay glass bay, dark canopy, door, lanterns.
const entCells = [...map.values()].filter(c => c.z === minZ).sort((a, b) => a.x - b.x);
if (entCells.length) {
  const cx = entCells[Math.floor(entCells.length / 2)].x;
  for (const c of entCells) {
    if (Math.abs(c.x - cx) > 2 || c.top < c.gr + 5) continue;
    // Stone threshold on the ground, glass above.
    g.set(c.x, c.gr, c.z, "polished_andesite");
    for (let rel = 1; rel <= 2; rel++) g.set(c.x, c.gr + rel, c.z, "light_blue_stained_glass");
    // Dark canopy band over the bay, a slab-width lip reads from the street.
    g.set(c.x, c.gr + 3, c.z, "dark_oak_planks");
    g.set(c.x, c.gr + 4, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    if (c.x === cx) {
      g.set(c.x, c.gr, c.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(c.x, c.gr + 1, c.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }
  // Lanterns hang inside the lobby either side of the door.
  for (const off of [-2, 2]) {
    const lobby = map.get(key(cx + off, minZ + 1));
    if (lobby && lobby.top > lobby.gr + 3) {
      g.set(cx + off, lobby.gr + 2, minZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
  const lobby = map.get(key(cx, minZ + 1));
  if (lobby && lobby.top > lobby.gr + 3) {
    g.set(cx, lobby.gr + 2, minZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Penthouse plant on some interior roof cells of the main tier.
for (const c of map.values()) {
  if (c.top !== mainTop) continue;
  if (exposed(c, c.top - 1)) continue;
  if (((c.x * 7 + c.z * 5) % 17) !== 0 || c.x % 3 !== 1) continue;
  if (c.top + 1 >= H) continue;
  g.set(c.x, c.top, c.z, "gray_concrete");
  g.set(c.x, c.top + 1, c.z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
