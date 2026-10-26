// DC75891: a Federal-style (c. 1930s) limestone office block on the Mall, 8 x 13 cells, three storeys on a
// wing and a fourth on the tower core. Walls are cream quartz with a stone-brick plinth, one window row over
// one band row per storey (the lidar's 7 m tier gets a fourth window row and a cornice higher), dark-oak
// double doors on the z=0 face, and a hollow interior: air behind the glass, a floor slab per storey, a few lights.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75891.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..7, z 0..12

const fp = new Map();                                    // "x,z" -> { ground, roof } for every footprint cell
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);

// Lidar roof is noisy between 6 and 7 m: a cell takes the tier of the majority of its footprint neighbourhood (3 x 3)
// so the tower core reads as one clean block and the wings as one clean tier.
const tierOf = (x, z) => {
  let tall = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = fp.get(`${x + dx},${z + dz}`); if (!c) continue;
    n++; if (c.roof >= 7) tall++;
  }
  return tall * 2 > n ? 7 : 6;
};

// Perimeter: a footprint cell with a missing cardinal neighbour. Corner: two or more missing.
const missing = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFp(x + dx, z + dz)).length;

const H = new Map();
for (const [x, z] of fp.keys().map((k) => k.split(",").map(Number))) H.set(`${x},${z}`, tierOf(x, z));
const heightAt = (x, z) => H.get(`${x},${z}`);

const g = new Voxels([8, 19, 13]);
const WALL = "quartz_block", BAND = "quartz_bricks", BASE = "stone_bricks", CORNICE = "smooth_quartz";
const FLOOR = "smooth_stone", MULLION = "quartz_pillar";

for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const top = heightAt(x, z), ground = fp.get(key).ground;
  const perimeter = missing(x, z) > 0;
  for (let y = ground; y < top; y++) {
    if (perimeter) {
      if (y === 0) g.set(x, y, z, BASE);
      else if (y === top - 1) g.set(x, y, z, CORNICE);
      else if (y % 2 === 1) {                             // window row: glass panes between mullions, corners solid
        if (missing(x, z) >= 2 || (x + z) % 2 === 0) g.set(x, y, z, MULLION, { axis: "y" });
        else g.set(x, y, z, "glass_pane");
      } else g.set(x, y, z, BAND);                        // band row between the window rows
    } else {
      // interior: floor slabs on the even rows and under the top, air in between (no interiors, just the gap)
      if (y % 2 === 0 || y >= top - 2) g.set(x, y, z, FLOOR);
    }
  }
}

// Entrance: a pair of dark-oak doors on the z=0 face, facing out, with a solid lintel over them
for (const [x, hinge] of [[3, "left"], [4, "right"]]) {
  const base = { facing: "north", hinge, open: "false", powered: "false" };
  g.set(x, 1, 0, "dark_oak_door", { ...base, half: "lower" });
  g.set(x, 2, 0, "dark_oak_door", { ...base, half: "upper" });
  g.set(x, 3, 0, CORNICE);
}

// Warm lights behind the glass: glowstone on the ground floor, lanterns on the second, only behind some panes
const paneAt = (x, y, z) => g.get(x, y, z)?.block === "minecraft:glass_pane" || g.get(x, y, z)?.block === "glass_pane";
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (missing(x, z) > 0) continue;
  const top = heightAt(x, z);
  const behindGlass = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return inFp(nx, nz) && missing(nx, nz) > 0 && (paneAt(nx, 1, nz) || paneAt(nx, 3, nz));
  });
  if (!behindGlass) continue;
  if (!g.get(x, 1, z) && (x * 3 + z * 5) % 4 === 0) g.set(x, 1, z, "glowstone");
  if (!g.get(x, 3, z) && top >= 6 && (x * 2 + z * 3) % 5 === 0) g.set(x, 3, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Tower roof plant: one 2 x 2 air-handling plant on the tower's roof, standing on its cap (one clean mass, not scattered blocks)
for (const [x, z] of [[3, 5], [4, 5], [3, 6], [4, 6]]) {
  if (heightAt(x, z) === 7) g.set(x, 7, z, "iron_block");
}

// Pane connections: a pane joins its horizontal neighbours that hold anything (a pane, a mullion, a wall)
for (let x = 0; x < 8; x++) for (let y = 0; y < 19; y++) for (let z = 0; z < 13; z++) {
  if (!paneAt(x, y, z)) continue;
  const has = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  g.set(x, y, z, "glass_pane", {
    north: String(has(0, -1)), south: String(has(0, 1)), east: String(has(1, 0)), west: String(has(-1, 0)), waterlogged: "false",
  });
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75891.nbt");
console.log(out);
