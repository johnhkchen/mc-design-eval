import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no metadata. Lidar roof ~11 blocks above lowest ground.
// Read as a 2-storey, flat-roofed Xinyi-style shophouse/office block of the
// 1980s-90s: white wall tiles, quartz piers and cornice, glazed shopfront,
// stone base, one canopied entrance, roof plant on a light grey deck.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752131";
const W = 35, H = 23, D = 67;
const ROOF_Y = 10;     // roof deck (interior) and cornice course
const PARAPET_Y = 11;  // top of parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of a perimeter cell (null if interior).
function outward(x, z) {
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  return null;
}
const OFF = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const INWARD = { west: "east", east: "west", north: "south", south: "north" };

// Pane connections run along the wall face.
function pane(face) {
  const alongX = face === "north" || face === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// Entrance: south-facing perimeter cell nearest the centre line (fallback any).
const cx = (W - 1) / 2;
let entranceKey = null;
{
  let best = Infinity;
  const pool = [];
  for (const [x, z] of cells.map(([a, b]) => [a, b])) {
    const o = outward(x, z);
    if (o === "south") pool.push([x, z]);
  }
  const list = pool.length ? pool : cells.map(([a, b]) => [a, b]).filter(([x, z]) => outward(x, z));
  for (const [x, z] of list) {
    const d = Math.abs(x - cx);
    if (d < best) { best = d; entranceKey = `${x},${z}`; }
  }
}

const WALL = "white_concrete";
const PIER = "smooth_quartz";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const CORNICE = "smooth_quartz";
const FLOOR = "smooth_quartz";
const ROOF = "light_gray_concrete";
const INTERIOR_FLOOR = "polished_andesite";
const GLASS = "glass_pane";

// Foundation, floors, walls, windows.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  if (gr >= PARAPET_Y) continue;

  const out = outward(x, z);
  const perim = out !== null;
  const isEntrance = `${x},${z}` === entranceKey;
  const along = out === "north" || out === "south" ? x : z;
  const pier = perim && (along % 4 === 0);

  // Floor structure (all cells, perimeter included).
  put(x, gr, z, perim ? BASE : INTERIOR_FLOOR);
  if (gr + 5 <= ROOF_Y) put(x, gr + 5, z, FLOOR);
  if (!perim && ROOF_Y > gr) put(x, ROOF_Y, z, ROOF);

  if (perim) {
    for (let y = gr + 1; y <= gr + 9 && y < ROOF_Y; y++) {
      if (y <= gr + 3) {
        if (isEntrance && y <= gr + 2) {
          const half = y === gr + 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: out, half, hinge: "left", open: "false", powered: "false",
          });
        } else if (isEntrance && y === gr + 3) {
          put(x, y, z, WALL);
        } else if (pier) {
          put(x, y, z, PIER);
        } else {
          put(x, y, z, GLASS, pane(out));
        }
      } else if (y === gr + 4) {
        if (isEntrance) {
          // canopy over the entrance: upside-down stair projecting outward
          put(x, y, z, "stone_brick_stairs", {
            facing: out, half: "top", shape: "straight", waterlogged: "false",
          });
        } else {
          put(x, y, z, WALL);
        }
      } else if (y === gr + 5) {
        put(x, y, z, FLOOR);
      } else if (y <= gr + 8) {
        put(x, y, z, pier ? PIER : GLASS, pier ? undefined : pane(out));
      } else {
        put(x, y, z, WALL);
      }
    }
    // Cornice and parapet.
    if (ROOF_Y >= gr) put(x, ROOF_Y, z, CORNICE);
    put(x, PARAPET_Y, z, "smooth_quartz_slab", {
      type: "bottom", waterlogged: "false",
    });

    // Dusk lighting behind selected windows (inside the air gap).
    if (!isEntrance && !pier && along % 4 === 2) {
      const [dx, dz] = OFF[INWARD[out]];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && outward(ix, iz) === null && ix < W && iz < D) {
        const ig = ground.get(`${ix},${iz}`);
        if (gr + 1 < ROOF_Y && ig <= gr + 1) {
          put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
        if (gr + 7 < ROOF_Y) put(ix, gr + 7, iz, "glowstone");
      }
    }
  }
}

// Roof plant on the deck: a few unit boxes on interior cells.
for (const [x, z, gr] of cells) {
  if (gr >= ROOF_Y) continue;
  if (outward(x, z) !== null) continue;
  if (x % 11 === 5 && z % 13 === 6) {
    put(x, PARAPET_Y, z, "iron_block");
    if (has(x + 1, z) && outward(x + 1, z) === null) put(x + 1, PARAPET_Y, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
