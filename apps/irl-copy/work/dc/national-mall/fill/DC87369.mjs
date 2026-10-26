import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Second Division Memorial: a 1930s stripped-classical stone memorial. A 6-block quartz shaft on the west end
// (lidar 6), a 4-high north wall with a glazed-and-gated front (lidar 2-4, smoothed to 3/4), and a flat stone
// terrace across the middle and south (lidar 0-1). Ground from the record fills solid under each cell.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87369.cells.json", "utf8"));
const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const on = (x, z) => byXZ.has(`${x},${z}`);

// Smoothed roof tier per footprint cell (blocks above y 0)
const H = (x, z) => {
  if (!on(x, z)) return 0;
  if (z === 0) return x >= 2 && x <= 5 ? 4 : 3;   // north wall: 4-high core, 3-high shoulders
  if (x <= 1) return 6;                            // west shaft
  return 1;                                        // terrace
};
const solid = (x, y, z) => y < H(x, z);
const exposed = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !solid(x + dx, y, z + dz));

const STONE = "stone_bricks", BODY = "smooth_quartz", TRIM = "chiseled_quartz_block", TERR = "smooth_stone";
const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GATE = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

const g = new Voxels([9, 18, 3]);

// Massing: foundation to the record's ground, then the tiers. Shaft: base, body, two storey lines, body, cornice.
for (const [key, { ground }] of byXZ) {
  const [x, z] = key.split(",").map(Number), h = H(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, STONE);
  for (let y = 0; y < h; y++) {
    let b = BODY;
    if (h === 1) b = TERR;
    else if (y === 0) b = STONE;                       // base course
    else if (y === h - 1) b = TRIM;                    // cornice
    else if (h === 6 && (y === 2 || y === 4)) b = TRIM; // shaft storey lines
    g.set(x, y, z, b);
  }
}

// North wall facade (z = 0): glass windows on even columns with air behind, quartz piers between,
// a bronze-grey iron gate on the centre bay, and a warm glowstone behind each window bay.
for (let x = 1; x <= 8; x++) {
  if (!on(x, 0)) continue;
  const h = H(x, 0);
  for (let y = 1; y <= h - 2; y++) {
    if (x === 3) g.set(x, y, 0, "iron_bars", GATE);
    else if (x % 2 === 0) g.set(x, y, 0, "glass_pane", GLASS);
  }
}
for (const x of [2, 4, 6]) g.set(x, 1, 1, "glowstone");

// Roof: a lantern on the shaft's top; the terrace stays open (the plaza is the roof there).
g.set(0, 6, 1, "lantern", { hanging: "false", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87369.nbt";
const r = g.save(out);
console.log(JSON.stringify(r));
