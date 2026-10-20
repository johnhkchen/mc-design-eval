import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 22 x 18 footprint, roof about 11 blocks above the lowest ground.
// Reading: a two-storey (about 5 blocks per storey) commercial block with a
// stone base, a shopfront at street level, a white-and-quartz window grid above,
// a cornice and parapet, and a flat roof with plant boxes. Materials suit a
// late-20th-century Taipei low-rise: concrete, quartz-tile trim, glass, dark frames.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690431";
const W = 22, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Perimeter: any side with no neighbouring footprint cell.
const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Street face = northernmost (smallest z) row; entrance centred on it.
const minZ = Math.min(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

// Footprint centroid, used to find the inward direction of each facade cell.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, c] of cells) {
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < c; y++) put(x, y, z, "stone_bricks");

  if (perim) {
    // Base course
    put(x, c, z, "polished_andesite");
    // Shopfront, ground storey (c+1 .. c+3)
    for (let y = c + 1; y <= c + 3; y++) {
      if ((x + z) % 3 === 0) put(x, y, z, "dark_oak_planks");
      else put(x, y, z, "glass_pane", pane);
    }
    // Lintel and string course
    put(x, c + 4, z, "white_concrete");
    put(x, c + 5, z, "smooth_quartz");
    // Upper window grid (c+6 .. c+8)
    for (let y = c + 6; y <= c + 8; y++) {
      if ((x + z) % 3 === 0) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "glass_pane", pane);
    }
    // Spandrel, cornice, parapet
    put(x, c + 9, z, "white_concrete");
    put(x, c + 10, z, "smooth_quartz");
    put(x, c + 11, z, "white_concrete");

    // Warm light just inside a few upper windows
    if ((x * 7 + z * 11) % 5 === 0) {
      const dx = Math.abs(cx - x) > Math.abs(cz - z) ? Math.sign(cx - x) : 0;
      const dz = dx === 0 ? Math.sign(cz - z) : 0;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isPerim(ix, iz)) put(ix, c + 7, iz, "glowstone");
    }
  } else {
    // Interior: floor slabs only, air gap between them.
    put(x, c, z, "smooth_stone");
    put(x, c + 5, z, "smooth_stone");
    put(x, c + 10, z, "smooth_stone");
    // Roof plant boxes on a sparse pattern
    if ((x * 5 + z * 3) % 9 === 0) put(x, c + 11, z, "light_gray_concrete");
  }
}

// Entrance on the street face: double-height dark oak door, lantern above.
{
  const c = cells.find(([x, z]) => x === doorX && z === minZ)[2];
  put(doorX, c, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, c + 1, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, c + 3, minZ, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
