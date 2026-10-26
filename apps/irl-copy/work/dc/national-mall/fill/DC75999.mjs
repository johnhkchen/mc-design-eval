import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75999.cells.json`, "utf8"));

const W = 24, H = 32, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const c of cells) {
  raw.set(key(Math.round(c[0]), Math.round(c[1])), {
    x: Math.round(c[0]), z: Math.round(c[1]),
    gr: Math.max(0, Math.round(c[2])),
    roof: Number(c[3]),
  });
}
const has = (x, z) => raw.has(key(x, z));

// Smooth lidar roof over a 3x3 neighbourhood, then snap to 4-block storey tiers
const map = new Map();
for (const c of raw.values()) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(key(c.x + dx, c.z + dz));
    if (n) vals.push(n.roof);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let top = Math.round(med / 4) * 4;
  top = Math.max(c.gr + 8, Math.min(H - 4, top));
  map.set(key(c.x, c.z), { ...c, top });
}
const maxTop = Math.max(...[...map.values()].map(c => c.top));

const DIRS = [
  { dx: 0, dz: -1, name: "N" },
  { dx: 0, dz: 1, name: "S" },
  { dx: -1, dz: 0, name: "W" },
  { dx: 1, dz: 0, name: "E" },
];

// Pass 1: solid massing, foundation, base course
for (const c of map.values()) {
  for (let y = 0; y < c.top; y++) {
    let id;
    if (y < c.gr) id = "stone_bricks";
    else if (y === c.gr) id = "polished_granite";
    else id = "smooth_quartz";
    g.set(c.x, y, c.z, id);
  }
}

// Pass 2: facade articulation
for (const c of map.values()) {
  const { x, z, gr, top } = c;
  const outward = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  if (outward.length === 0) continue;

  g.set(x, top - 1, z, "chiseled_quartz_block"); // cornice course

  for (const d of outward) {
    const along = d.dx !== 0 ? z : x;
    const isFront = d.name === "N";
    const inward = has(x - d.dx, z - d.dz);
    const ix = x - d.dx, iz = z - d.dz;

    // Entrance bay on the street (N) face, centred on the footprint
    if (isFront && along >= 9 && along <= 14) {
      // recessed bay: face and inward cell open for the ground storey
      for (let y = gr + 1; y <= gr + 3; y++) {
        if (along === 11 && y === gr + 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (along === 11 && y === gr + 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (y === gr + 3) {
          g.set(x, y, z, "smooth_quartz_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
        } else {
          g.set(x, y, z, "glass_pane");
        }
        if (inward) g.set(ix, y, iz, "air");
      }
      // stone steps at the threshold are not possible inside the footprint; keep a lit lintel instead
      if (inward && along === 11) g.set(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }

    for (let y = gr + 1; y <= top - 2; y++) {
      const rel = y - gr - 2;
      const floorRow = ((rel % 4) + 4) % 4 === 0;
      if (floorRow) {
        g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (along % 3 === 1) {
        g.set(x, y, z, "glass_pane");
        if (inward) {
          g.set(ix, y, iz, "air");
          if (((x * 7 + z * 3 + y) % 11) === 0 && ((rel % 4) === 2)) {
            g.set(ix, y, iz, "glowstone");
          }
        }
      } else {
        g.set(x, y, z, "smooth_quartz");
      }
    }
  }
}

// Pass 3: roof plant on the top tier only
for (const c of map.values()) {
  const { x, z, top } = c;
  const interior = DIRS.every(d => has(x + d.dx, z + d.dz));
  if (!interior || top !== maxTop) continue;
  if ((x + z) % 4 === 0 && top + 2 < H) {
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "iron_block");
  }
}

g.save(`${DIR}/DC75999.nbt`);
