import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC58672";
const W = 22, H = 32, D = 34;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => x + "," + z;
const map = new Map();
for (const c of cells) {
  map.set(key(c[0], c[1]), { x: c[0], z: c[1], ground: Math.round(c[2]), roof: Math.round(c[3]) });
}
const has = (x, z) => map.has(key(x, z));

// Interior vs exterior: a cell is exterior if any neighbour is outside the footprint
const isExt = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const cx = Math.round((W - 1) / 2); // centre column for the entrance
const minZ = Math.min(...cells.map((c) => c[1]));

const glassXFace = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // pane runs along z
const glassZFace = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }; // pane runs along x
const parapetProps = { type: "bottom", waterlogged: "false" };

const lights = [];
const entrance = []; // [x, y, z, block, props] applied after the walls

for (const cell of map.values()) {
  const { x, z, ground: gr } = cell;
  // Roof: lidar height, at least six blocks of massing above the base, within build height
  const r = Math.min(H - 1, Math.max(cell.roof, gr + 6));

  // Foundation: solid from y 0 up to ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const W0 = gr + 1; // first wall row
  const mx = !has(x - 1, z) || !has(x + 1, z); // wall plane is x-constant
  const mz = !has(x, z - 1) || !has(x, z + 1); // wall plane is z-constant

  if (!isExt(x, z)) {
    // Interior cell: floor slabs per storey, air between, flat roof deck
    g.set(x, W0, z, "smooth_stone");
    for (let y = W0 + 2; y <= r - 2; y += 3) g.set(x, y, z, "smooth_stone");
    g.set(x, r - 1, z, "gray_concrete");
    // Roof plant on a few cells
    if (((x * 3 + z * 5) % 13 === 0) && r <= H - 2) {
      g.set(x, r, z, "light_gray_concrete");
      g.set(x, r + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior cell: walls from W0 to r-1, parapet at r
  const corner = mx && mz;
  for (let y = W0; y <= r - 1; y++) {
    if (y <= W0 + 1) {
      g.set(x, y, z, "polished_granite"); // base course
    } else if (y === r - 1) {
      g.set(x, y, z, "smooth_quartz"); // cornice
    } else {
      const rel = (y - W0 - 2) % 3;
      if (rel === 0) {
        g.set(x, y, z, "calcite"); // storey spandrel band
      } else {
        const pier = corner || (mx && !mz ? z % 3 === 0 : x % 3 === 0);
        if (pier) {
          g.set(x, y, z, "calcite");
        } else {
          const props = mx && !mz ? glassXFace : glassZFace;
          g.set(x, y, z, "glass_pane", props);
          // Sparse warm light in the room behind this window
          if (((x * 5 + z * 3 + y) % 11) === 0) {
            let dx = 0, dz = 0;
            if (!has(x - 1, z)) dx = 1; else if (!has(x + 1, z)) dx = -1;
            else if (!has(x, z - 1)) dz = 1; else if (!has(x, z + 1)) dz = -1;
            const ix = x + dx, iz = z + dz;
            if (has(ix, iz) && !isExt(ix, iz)) lights.push([ix, y, iz]);
          }
        }
      }
    }
  }

  // Parapet cap on the exterior ring
  if (r <= H - 1) g.set(x, r, z, "smooth_quartz_slab", parapetProps);

  // Entrance on the front (lowest z) face
  if (!has(x, z - 1) && z === minZ) {
    const dx = Math.abs(x - cx);
    if (dx <= 2) {
      // Granite jambs and lintel frame the opening
      if (dx === 2) {
        for (let y = W0; y <= W0 + 3; y++) entrance.push([x, y, z, "polished_granite"]);
      } else if (dx === 1) {
        // Glazed doors, two blocks tall
        entrance.push([x, W0, z, "glass"]);
        entrance.push([x, W0 + 1, z, "glass"]);
        entrance.push([x, W0 + 2, z, "glass"]);
      } else {
        // Centre: door glass with a hanging lantern under the lintel
        entrance.push([x, W0, z, "glass"]);
        entrance.push([x, W0 + 1, z, "glass"]);
        entrance.push([x, W0 + 2, z, "lantern", { hanging: "true", waterlogged: "false" }]);
      }
      // Lintel canopy across the frame
      entrance.push([x, W0 + 3, z, "polished_granite_slab", { type: "bottom", waterlogged: "false" }]);
    }
  }
}

// Warm lights behind the glazing
for (const [lx, ly, lz] of lights) g.set(lx, ly, lz, "glowstone");

// Entrance last so it overrides wall and window blocks
for (const [ex, ey, ez, block, props] of entrance) {
  if (ey < H) g.set(ex, ey, ez, block, props);
}

g.save(`${DIR}/${ID}.nbt`);
