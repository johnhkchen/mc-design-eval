import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC86600.cells.json`, "utf8"));

// 1608 K Street NW: 1970s Downtown office. Granite-clad base, concrete floor-slab
// spandrels, glass window bays between concrete piers, smooth-stone cornice,
// and a setback mechanical penthouse on the tallest tier.
const W = 6, H = 30, D = 14;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const list = cells.map(([x, z, gr, rf]) => ({
  x, z,
  gr: Math.max(0, Math.round(gr)),
  rf: Math.round(rf),
}));

const byKey = new Map(list.map(c => [`${c.x},${c.z}`, c]));
const has = (x, z) => byKey.has(`${x},${z}`);

// Smooth the lidar roof: median of the 3x3 neighbourhood, then snap to storey tiers.
const median = arr => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
for (const c of list) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = byKey.get(`${c.x + dx},${c.z + dz}`);
    if (n) vals.push(n.rf);
  }
  c.topRaw = median(vals);
}
const maxTop = Math.max(...list.map(c => c.topRaw));
for (const c of list) {
  let top = Math.round(c.topRaw / STOREY) * STOREY;
  const gl = Math.min(c.gr, H - 10);
  top = Math.max(gl + 6, Math.min(H - 6, top));
  c.gl = gl;
  c.top = top;
}
const topMax = Math.max(...list.map(c => c.top));

// Pier pattern: a regular bay grid, piers on alternating columns.
const pier = (x, z) => ((x + z) % 2 === 0);

for (const c of list) {
  const { x, z, gl, top } = c;
  const perim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gl; y++) g.set(x, y, z, "stone_bricks");

  // Setback: interior cells on the tallest tier step in one cell from the perimeter
  // on the top storey, so the crown reads as a stepped penthouse.
  let bodyTop = top;
  if (top === topMax && !perim) bodyTop = top; // full height inside
  if (top === topMax && perim && (x === 0 || x === W - 1)) bodyTop = top; // keep corners full

  for (let y = gl; y < bodyTop; y++) {
    const h = y - gl;

    if (y === bodyTop - 1) {
      g.set(x, y, z, perim ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    if (h === 0) {
      g.set(x, y, z, perim ? "polished_granite" : "light_gray_concrete");
      continue;
    }

    // Entrance: north face, x = 2, ground storey.
    if (perim && z === 0 && x === 2 && (h === 1 || h === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: h === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (h % STOREY === 0) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (perim) {
      g.set(x, y, z, pier(x, z) ? "light_gray_concrete" : "light_blue_stained_glass_pane");
      continue;
    }

    // Interior: air behind the glass, warm lanterns on the floor slabs.
    if (h % STOREY === 1 && (x + z) % 4 === 0) {
      g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // Penthouse on the tallest tier: a set-in mechanical box on the interior.
  if (top === topMax && !perim && x >= 2 && x <= 3 && z >= 4 && z <= 9 && top + 2 < H) {
    g.set(x, top, z, "iron_block");
    g.set(x, top + 1, z, "iron_block");
  }
}

g.save(`${dir}/DC86600.nbt`);
