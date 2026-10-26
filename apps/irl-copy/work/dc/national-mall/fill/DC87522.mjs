import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Oscar Strauss Memorial Fountain site, 1300 Pennsylvania Ave NW.
// Record: Commercial-Office-Large, footprint 10 x 14, roof about 1 block above lowest ground.
// Read as a compact limestone-clad Federal-era office block on Pennsylvania Avenue:
// rusticated stone base, quartz walls with pilaster rhythm, a glass window grid,
// a continuous cornice, and a roof plant box.
// Roof tops are quantised into two clean tiers so the massing reads as flat storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87522";
const W = 10, H = 13, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => cmap.has(key(x, z));

// Raw readings first.
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(key(x, z), {
    ground: Math.max(0, Math.min(H - 5, Math.round(gr))),
    roof: Math.round(rf),
  });
}

// Quantise: one common base tier and a second tier for the taller core.
const cmap = raw;
const roofs = [...raw.values()].map(c => c.roof).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const groundMin = Math.min(...[...raw.values()].map(c => c.ground));
const tierLow = Math.min(H - 2, Math.max(groundMin + 4, Math.round(median / 2) * 2));
const tierHigh = Math.min(H - 2, tierLow + 2);

for (const [k, c] of cmap) {
  const top = c.roof >= median + 2 ? tierHigh : tierLow;
  c.top = Math.max(top, c.ground + 4); // at least one storey above its own ground
  c.top = Math.min(c.top, H - 2);      // cap sits at top+1 within the grid
}

const exposure = (x, z) => {
  let n = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!has(x + dx, z + dz)) n++;
  }
  return n;
};

// Build the massing column by column.
for (const [k, c] of cmap) {
  const [x, z] = k.split(",").map(Number);
  const { ground, top } = c;
  const ex = exposure(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y <= top; y++) {
    const rel = y - ground;
    if (ex === 0) {
      // Interior mass: solid so every storey stands on what is below it.
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, "stone_bricks"); // rusticated base course
    } else if (rel % 4 === 0) {
      g.set(x, y, z, "smooth_quartz"); // storey string course
    } else if (rel % 4 === 3) {
      g.set(x, y, z, "quartz_block"); // header band
    } else if (ex === 1) {
      // Single-face wall: window bays with quartz mullions between.
      const bay = (x + z) % 2 === 0;
      if (bay) {
        if (rel % 4 === 1 && (x * 3 + z) % 7 === 0) {
          g.set(x, y, z, "glowstone"); // warm light behind glass
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane");
        }
      } else {
        g.set(x, y, z, "quartz_pillar", { axis: "y" }); // pilaster rhythm
      }
    } else {
      g.set(x, y, z, "quartz_block"); // corner post
    }
  }

  // Roof: continuous cornice on the perimeter, flat cap elsewhere.
  if (ex > 0) {
    g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, top + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant: two mechanical boxes on the highest interior cells.
const interiorTop = [...cmap.entries()]
  .filter(([k]) => { const [x, z] = k.split(",").map(Number); return exposure(x, z) === 0; })
  .sort((a, b) => b[1].top - a[1].top);
for (const [k, c] of interiorTop.slice(0, 2)) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, c.top + 1, z, "iron_block");
}

// Entrance: north face, cell nearest the middle of the front, lowest ground.
let door = null;
for (const [k, c] of cmap) {
  const [x, z] = k.split(",").map(Number);
  if (has(x, z - 1)) continue;
  if (exposure(x, z) === 0) continue;
  if (x === 0 || x === W - 1) continue;
  const score = Math.abs(x - (W - 1) / 2) * 2 + c.ground;
  if (!door || score < door.score) door = { x, z, ground: c.ground, score };
}
if (door) {
  const { x, z, ground } = door;
  g.set(x, ground, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, ground + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, ground + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
