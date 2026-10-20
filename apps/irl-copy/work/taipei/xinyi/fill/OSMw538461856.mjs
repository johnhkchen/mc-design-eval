import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461856";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([18, 23, 18]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Roof deck level (about 11 blocks above lowest ground); parapet sits on top of it.
const TOP = 11;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= 23) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outer faces of a cell are exposed (no neighbour in footprint)
const exposed = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

// Inward step from an exposed face
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);

  if (ex.length === 0) {
    // Interior: floor slabs only, air elsewhere (no interiors)
    put(x, gr, z, "smooth_stone");
    if (gr < 5) put(x, 5, z, "smooth_stone");
    put(x, TOP, z, "light_gray_concrete");
    continue;
  }

  // Perimeter cell
  const corner = ex.length >= 2;

  // Roof deck and parapet
  put(x, TOP, z, "light_gray_concrete");
  put(x, TOP + 1, z, "stone_brick_wall");

  // Base course
  put(x, gr, z, "stone_bricks");

  const face = ex[0];
  const u = face === "north" || face === "south" ? x : z;
  const pier = corner || u % 3 === 0;
  const isDoor = !corner && face === "south" && u === 9;

  for (let y = gr + 1; y <= 10; y++) {
    if (y === 10) {
      // Cornice band
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === 5) {
      // Storey line
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y <= 4) {
      // Ground storey: shopfront
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (isDoor && y === gr + 3) {
        put(x, y, z, "smooth_quartz");
      } else if (pier) {
        put(x, y, z, "polished_andesite");
      } else if (y === 4) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass");
      }
    } else {
      // Upper storey: windows in concrete frame
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (y === 6) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (y === 9) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass");
      }
    }
  }

  // Warm lights behind some glass (inside the air gap)
  if (!corner && !pier && !isDoor) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && exposed(ix, iz).length === 0) {
      if (u % 6 === 1) {
        // Upper storey glowstone behind the glass
        put(ix, 7, iz, "glowstone");
      }
      if (u % 6 === 4 && gr + 1 <= 3) {
        // Ground-floor lantern behind the shopfront glass
        put(ix, gr + 1, iz, "lantern", { hanging: "false" });
      }
    }
  }
}

// Rooftop equipment: AC condensers and a lantern on interior roof cells
const roofIsInterior = (x, z) => has(x, z) && exposed(x, z).length === 0;
for (const [x, z] of [[5, 5], [6, 5], [5, 6], [6, 6]]) {
  if (roofIsInterior(x, z)) put(x, TOP + 1, z, "iron_block");
}
if (roofIsInterior(13, 13)) put(13, TOP + 1, 13, "lantern", { hanging: "false" });

g.save(`${DIR}/${ID}.nbt`);
