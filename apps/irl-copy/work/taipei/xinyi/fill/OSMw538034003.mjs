import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block: white concrete frame, light-blue
// glass bays, grey spandrel lines, a stone plinth, a shopfront entrance with a
// canopy, a parapet, and a small roof plant box. Roof sits 11 blocks above the
// lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034003";
const W = 15, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const gmap = new Map(cells.map(([x, z, gy]) => [`${x},${z}`, gy]));
const inF = (x, z) => gmap.has(`${x},${z}`);
const gnd = (x, z) => gmap.get(`${x},${z}`);
const G = Math.min(...cells.map((c) => c[2]));
const TOP = G + 11; // parapet top; roof deck surface sits at G + 11 too

const OFF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) => Object.keys(OFF).filter((d) => !inF(x + OFF[d][0], z + OFF[d][1]));
const isEdge = (x, z) => inF(x, z) && outward(x, z).length > 0;

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: a north-facing edge cell near the middle of the north frontage.
const edges1 = cells.filter(([x, z]) => outward(x, z).length === 1);
const pref = edges1.filter(([x, z]) => outward(x, z)[0] === "north");
const pool = (pref.length ? pref : edges1).slice().sort((a, b) => a[0] - b[0]);
const dc = pool[Math.floor(pool.length / 2)];
const door = dc ? { x: dc[0], z: dc[1], cg: dc[2], facing: outward(dc[0], dc[1])[0] } : null;

for (const [x, z, cg] of cells) {
  // Foundation below ground, plinth course at ground.
  for (let y = 0; y < cg; y++) put(x, y, z, "stone_bricks");
  put(x, cg, z, "smooth_stone");

  const out = outward(x, z);

  if (out.length === 0) {
    // Interior: floor slab at the second floor and roof deck. Air elsewhere.
    if (G + 5 >= cg) put(x, G + 5, z, "light_gray_concrete");
    if (G + 10 >= cg) put(x, G + 10, z, "light_gray_concrete");
    continue;
  }

  const corner = out.length >= 2;
  const alongX = out.includes("north") || out.includes("south");
  const k = alongX ? x : z;
  const pillar = corner || k % 3 === 0;
  const pane = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Inward offset (toward the footprint interior) for dusk lamps behind glass.
  const dx = (out.includes("west") ? 1 : 0) - (out.includes("east") ? 1 : 0);
  const dz = (out.includes("north") ? 1 : 0) - (out.includes("south") ? 1 : 0);

  for (let y = cg + 1; y <= TOP; y++) {
    if (y === TOP) {
      put(x, y, z, "white_concrete"); // parapet
    } else if (y === G + 10) {
      put(x, y, z, "light_gray_concrete"); // cornice / roof deck line
    } else if (y === G + 4 || y === G + 5 || y === G + 9) {
      put(x, y, z, "light_gray_concrete"); // transom, storey line, spandrel
    } else if (pillar) {
      put(x, y, z, "white_concrete"); // mullion / column
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", pane);
      // Warm light behind some glass panes, in the interior cell just inside.
      if (!corner && ((x * 31 + z * 17 + y * 7) % 5) === 0) {
        const ix = x + dx, iz = z + dz;
        if (inF(ix, iz) && !isEdge(ix, iz) && y >= gnd(ix, iz)) {
          put(ix, y, iz, y > G + 5 ? "shroomlight" : "glowstone");
        }
      }
    }
  }
}

// Shopfront entrance: double door with a small canopy over it.
if (door) {
  put(door.x, door.cg + 1, door.z, "oak_door",
    { facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.cg + 2, door.z, "oak_door",
    { facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.cg + 3, door.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: a small box on the interior cell nearest the footprint centre.
if (G + 12 < H) {
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = null;
  for (const [x, z] of cells) {
    if (isEdge(x, z)) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) {
    put(best.x, TOP, best.z, "light_gray_concrete");
    put(best.x, TOP + 1, best.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
