import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Christian Spiritualist Church of the Golden Light: a single-storey 1920s-style timber church
// (cream weatherboard walls on a stone plinth, quartz cornice, dark tiled roof, a small belfry on the ridge).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241836.cells.json", "utf8"));
const g = new Voxels([20, 19, 23]);

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => cell.has(key(x, z));

// Walls sit on the cell's own ground; the eave is one storey (~3 blocks) above the floor, or lower where the lidar roof is lower.
const wallTop = (c) => Math.min(c.ground + 3, c.roof - 1);

// The entrance: the north-facing wall cell at x 6 on the front (lowest z).
const door = { x: 6, z: 0 };

for (const [x, z, ground, roof] of cells) {
  const c = { ground, roof };
  // Plinth: solid from y 0 up to the cell's ground (nothing floats on the slope).
  for (let y = 0; y <= ground; y++) g.set(x, y, z, "stone_bricks");

  const exposed = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  const faces = Object.keys(exposed).filter((f) => exposed[f]);
  const shell = faces.length > 0;
  const top = wallTop(c);

  for (let y = ground + 1; y <= top; y++) {
    let block = "white_terracotta";
    if (y === ground + 1) block = "stone_bricks";                           // base course
    if (y === top) block = "smooth_quartz";                                 // cornice / ceiling
    if (shell && y < top && faces.length >= 2) block = "quartz_pillar";     // corner pilasters
    if (!shell && y < top) block = null;                                    // interior air (no interiors)
    if (shell && faces.length === 1 && y === ground + 2 && y < top) {
      const f = faces[0];
      const u = f === "N" || f === "S" ? x : z;
      if (u % 4 === 1 || u % 4 === 2) {                                     // two-pane window with frames either side
        const north = f === "E" || f === "W" ? "true" : "false";
        const east = f === "N" || f === "S" ? "true" : "false";
        g.set(x, y, z, "glass_pane", { north, south: north, east, west: east });
        if (u % 4 === 1 && (x + z) % 3 === 0) {                             // warm light behind some glass
          const [ix, iz] = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[f];
          if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
        continue;
      }
    }
    if (block) g.set(x, y, z, block, block === "quartz_pillar" ? { axis: "y" } : undefined);
  }
  // Ceiling of an interior cell (the wall line), so the roof stands on something.
  if (!shell) g.set(x, top, z, "smooth_quartz");

  // Roof: tiled slope from the wall line up to the lidar height.
  for (let y = top + 1; y <= roof - 1; y++) g.set(x, y, z, "deepslate_tiles");
}

// Door on the front wall, two blocks tall, with a light above.
g.set(door.x, 1, door.z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 2, door.z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 3, door.z, "lantern", { hanging: "true" });

// Belfry: a small tower on the highest tile at the front, with a finial.
let best = null;
for (const [x, z, , roof] of cells) if (!best || roof > best.roof || (roof === best.roof && z < best.z)) best = { x, z, roof };
for (let y = best.roof; y <= best.roof + 2; y++) g.set(best.x, y, best.z, "white_terracotta");
g.set(best.x, best.roof + 3, best.z, "deepslate_tiles");
g.set(best.x, best.roof + 4, best.z, "lightning_rod");

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241836.nbt");
console.log(JSON.stringify(info));
