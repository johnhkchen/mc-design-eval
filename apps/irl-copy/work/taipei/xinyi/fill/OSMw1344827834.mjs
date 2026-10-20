import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1344827834";
const W = 26, H = 19, D = 63;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Outward face of an edge cell; null for interior cells.
// t is the coordinate running along that wall; (dx,dz) points inward.
function faceOf(x, z) {
  if (!has(x - 1, z)) return { f: "west", dx: 1, dz: 0, t: z };
  if (!has(x + 1, z)) return { f: "east", dx: -1, dz: 0, t: z };
  if (!has(x, z - 1)) return { f: "north", dx: 0, dz: 1, t: x };
  if (!has(x, z + 1)) return { f: "south", dx: 0, dz: -1, t: x };
  return null;
}

// Palette: 1960s–70s Taipei commercial block; white tile walls, stone base and
// cornice, blue-green glass in terracotta-framed bays, flat concrete roof.
const WALL = "white_terracotta";
const BASE = "smooth_stone";
const CORNICE = "stone_bricks";
const FOUND = "stone_bricks";
const ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";

for (const [x, z, gr] of cells) {
  // Clamp so the roof (ground + 7) stays inside the grid.
  const base = Math.min(gr, H - 8);
  const edge = faceOf(x, z);

  // Foundation from y=0 up to the cell's ground, so nothing floats on slopes.
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUND);

  // Floor slab of the single storey.
  g.set(x, base, z, edge ? BASE : "smooth_stone");

  if (edge) {
    const { f, dx, dz, t } = edge;
    const alongX = f === "north" || f === "south";
    // Pane connections so window runs look continuous.
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    // Entrance columns: two-block-wide door bays every 16 blocks.
    const isDoor = t % 16 === 6 || t % 16 === 7;
    // Window columns: two glass blocks out of every four.
    const isWin = t % 4 === 1 || t % 4 === 2;

    // Walls: plinth, window band, lintel.
    for (let y = base + 1; y <= base + 5; y++) g.set(x, y, z, WALL);

    if (isDoor) {
      // Door lower and upper halves at the entrance.
      const dprops = { facing: f, hinge: t % 16 === 6 ? "left" : "right", open: "false", powered: "false" };
      g.set(x, base + 1, z, "dark_oak_door", { ...dprops, half: "lower" });
      g.set(x, base + 2, z, "dark_oak_door", { ...dprops, half: "upper" });
      // Glass transom above the door.
      g.set(x, base + 3, z, GLASS, paneProps);
    } else if (isWin) {
      // Window band rows base+2..base+4 with glass panes.
      for (let y = base + 2; y <= base + 4; y++) g.set(x, y, z, GLASS, paneProps);
      // Warm lamp standing just inside a subset of windows.
      const ix = x + dx, iz = z + dz;
      const inside = has(ix, iz) && !faceOf(ix, iz);
      if (inside && ((Math.floor(t / 4) + Math.floor((x + z) / 3)) % 3 === 0)) {
        g.set(ix, base + 1, iz, "glowstone");
      }
    }

    // Cornice on the parapet line.
    g.set(x, base + 6, z, CORNICE);
  } else {
    // Interior: concrete roof slab over the storey.
    g.set(x, base + 6, z, ROOF);
    // Roof equipment: scattered plant boxes, some stacked.
    if ((x * 5 + z * 7) % 41 === 0) {
      g.set(x, base + 7, z, "light_gray_concrete");
      if ((x + z) % 2 === 0) g.set(x, base + 8, z, "smooth_stone");
    }
    // Hanging warm lanterns from the roof slab.
    if (x % 9 === 4 && z % 9 === 4) {
      g.set(x, base + 5, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
