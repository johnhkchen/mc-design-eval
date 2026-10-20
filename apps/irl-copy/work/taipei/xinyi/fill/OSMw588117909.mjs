import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-style 1970s-90s commercial block: 3 storeys (5 blocks each) over a
// stone-base shopfront, white tiled walls, grey pilasters, glazed bays,
// a parapet with cap, and a central roof penthouse. Roof ~17 blocks above
// lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588117909";
const W = 12, H = 29, D = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];
const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));

// Which outer faces each footprint cell presents to the street/air.
const facade = new Map();
const sides = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells) {
  const ds = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  if (ds.length) facade.set(key(x, z), ds);
  for (const d of ds) sides[d.name].push({ x, z });
}

// Main entrance: middle single-face cell of the longest facade.
let doorAt = null;
{
  const best = Object.entries(sides).sort((a, b) => b[1].length - a[1].length)[0];
  if (best) {
    const [name, list] = best;
    const d = DIRS.find((q) => q.name === name);
    const single = list
      .filter((c) => facade.get(key(c.x, c.z)).length === 1)
      .sort((a, b) => (d.along === "x" ? a.x - b.x : a.z - b.z));
    if (single.length) {
      const c = single[Math.floor(single.length / 2)];
      doorAt = { x: c.x, z: c.z, d };
    }
  }
}

const GLASS = "light_blue_stained_glass_pane";
const PILLAR = "light_gray_concrete";
const WALL = "white_concrete";
const SILL = "calcite";
const BASE = "stone_bricks";
const FLOOR = "light_gray_concrete";

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const ds = facade.get(key(x, z)) ?? [];

  // Foundation under every footprint cell so nothing floats on the slope.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Storey floor slabs (ground, 2nd, 3rd floor, roof deck) on every cell.
  for (const rel of [0, 5, 10, 15]) put(x, gr + rel, z, rel === 0 && ds.length ? BASE : FLOOR);

  // Air gap behind glass: interior cells stay empty between floor slabs.
  if (ds.length === 0) continue;

  const corner = ds.length > 1;
  const d0 = ds[0];
  const u = d0.along === "x" ? x : z;
  const pillar = corner || u % 3 === 0;

  // Ground floor: shopfront glass in bays, pilasters between.
  for (let rel = 1; rel <= 4; rel++) {
    if (pillar) put(x, gr + rel, z, PILLAR);
    else if (rel <= 3) {
      const connect = d0.along === "x"
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, gr + rel, z, GLASS, connect);
    } else put(x, gr + rel, z, WALL);
  }

  // Upper two storeys: sill, two glass rows, head course.
  for (const zone of [0, 1]) {
    const base = zone === 0 ? 6 : 11;
    for (let k = 0; k < 5; k++) {
      const rel = base + k;
      if (pillar) put(x, gr + rel, z, PILLAR);
      else if (k === 0) put(x, gr + rel, z, SILL);
      else if (k === 4) put(x, gr + rel, z, WALL);
      else {
        const connect = d0.along === "x"
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, gr + rel, z, GLASS, connect);
      }
    }
    // Warm light behind some glass, in the air gap on the inside.
    if (!pillar && !corner && (u * 7 + zone * 3) % 4 === 0) {
      const ix = x - d0.dx, iz = z - d0.dz;
      if (has(ix, iz) && !facade.has(key(ix, iz))) {
        put(ix, gr + base + 1, iz, "glowstone");
      }
    }
  }

  // Parapet and cap course.
  put(x, gr + 16, z, WALL);
  put(x, gr + 17, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Entrance door with transom.
  if (doorAt && doorAt.x === x && doorAt.z === z) {
    const facing = doorAt.d.name;
    put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, PILLAR);
    put(x, gr + 4, z, WALL);
  }
}

// Roof penthouse on the central roof deck, resting on the roof slab.
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  if (x >= 3 && x <= 8 && z >= 10 && z <= 20 && !facade.has(key(x, z))) {
    put(x, gr + 16, z, "gray_concrete");
    put(x, gr + 17, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
