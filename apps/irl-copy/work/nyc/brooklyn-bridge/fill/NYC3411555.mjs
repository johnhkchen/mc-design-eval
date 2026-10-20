import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3411555.cells.json", "utf8")
);

const W = 5, H = 24, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const footprint = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => footprint.has(key(x, z));

// Reference storey line: lowest ground under the building.
const G0 = Math.min(...cells.map(c => Math.round(c[2])));

// Lidar roof per cell, quantised to 2-block storey tiers from G0 so the
// massing follows the roof heights as clean flat tiers.
const tier = roof => G0 + 2 * Math.round((roof - G0) / 2);

const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isWindow = (x, z) => {
  if (isCorner(x, z)) return false;
  if (x === 0 || x === W - 1) return z % 2 === 1;
  if (z === 0 || z === D - 1) return x % 2 === 1;
  return false;
};
const isExterior = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const info = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const gy = Math.round(c[2]);
  const top = Math.min(H - 3, Math.max(gy + 4, tier(Math.round(c[3]))));
  info.set(key(x, z), { gy, top, ext: isExterior(x, z) });
}

// Entrance: west face, middle of the frontage.
const westExt = cells
  .filter(c => c[0] === 0 && isExterior(0, c[1]))
  .sort((a, b) => a[1] - b[1]);
const doorCell = westExt.length
  ? westExt[Math.floor(westExt.length / 2)]
  : cells.find(c => isExterior(c[0], c[1]));
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

for (const c of cells) {
  const x = c[0], z = c[1];
  const { gy, top, ext } = info.get(key(x, z));

  // Foundation under the cell.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Floor at this cell's ground.
  g.set(x, gy, z, "smooth_stone");

  for (let y = gy + 1; y < top - 1; y++) {
    const off = ((y - G0) % 2 + 2) % 2;   // 0 = storey line, 1 = window row
    if (!ext) {
      if (off === 0) g.set(x, y, z, "smooth_stone");   // interior floor slab
      continue;
    }
    if (off === 0) {
      g.set(x, y, z, "stone_bricks");                  // limestone band / sill
    } else if (isWindow(x, z)) {
      const alongZ = (x === 0 || x === W - 1);         // pane runs along the face
      g.set(x, y, z, "glass_pane", alongZ
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    } else {
      g.set(x, y, z, "bricks");                        // red brick pier
    }
  }

  // Roof deck across the cell, parapet and cornice on the perimeter.
  g.set(x, top - 1, z, "smooth_stone");
  if (ext) {
    g.set(x, top - 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    g.set(x, top, z, "stone_bricks");
  }
}

// Entrance: door, glass transom, and a lantern just inside.
if (doorCell) {
  const [dx, dz] = doorCell;
  const { gy: dgy, top: dtop } = info.get(doorKey);
  g.set(dx, dgy, dz, "dark_oak_door", {
    facing: "west", half: "lower", hinge: "left", open: "false", powered: "false"
  });
  g.set(dx, dgy + 1, dz, "dark_oak_door", {
    facing: "west", half: "upper", hinge: "left", open: "false", powered: "false"
  });
  if (dtop - 1 > dgy + 2) {
    g.set(dx, dgy + 2, dz, "glass_pane", {
      north: "true", south: "true", east: "false", west: "false", waterlogged: "false"
    });
  }
  if (has(1, dz)) {
    const ii = info.get(key(1, dz));
    if (ii && !ii.ext && ii.gy === dgy) {
      g.set(1, dgy + 1, dz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Warm lanterns behind some upper windows (interior air, standing on floor slabs).
for (const c of cells) {
  const x = c[0], z = c[1];
  const { gy, top, ext } = info.get(key(x, z));
  if (ext || x !== 1 || z % 3 !== 0) continue;
  for (let y = gy + 1; y < top - 2; y++) {
    const off = ((y - G0) % 2 + 2) % 2;
    const storey = Math.floor((y - G0) / 2);
    if (off === 1 && storey % 2 === 1) {
      g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Small rooftop mechanical box on the highest interior cells.
const maxTop = Math.max(...[...info.values()].map(v => v.top));
for (const c of cells) {
  const x = c[0], z = c[1];
  const v = info.get(key(x, z));
  if (v.ext || v.top !== maxTop) continue;
  if (x >= 1 && x <= 2 && z >= 4 && z <= 5) {
    g.set(x, v.top, z, "stone_bricks");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3411555.nbt");
