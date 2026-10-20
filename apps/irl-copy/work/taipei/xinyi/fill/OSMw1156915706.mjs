import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915706";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground (y 0 = lowest ground under the building).
const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr ?? 0)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey lines: ground storey y gr..4, upper storey 5..9, roof deck 10, parapet 11.
const ROOF = 10;
const PARAPET = 11;

function facadeBlock(x, y, z, gr) {
  const nsFace = !has(x, z - 1) || !has(x, z + 1);
  const ewFace = !has(x - 1, z) || !has(x + 1, z);
  const pier = (nsFace && ewFace) || (nsFace && x % 3 === 0) || (ewFace && z % 3 === 0);

  if (y === gr) return { id: "stone_bricks" };                       // base course
  if (y <= 3) return { id: pier ? "white_concrete" : "light_blue_stained_glass" }; // shopfront
  if (y === 4) return { id: "light_gray_concrete" };                 // ground lintel
  if (y === 5) return { id: "light_gray_concrete" };                 // string course
  if (y >= 6 && y <= 8) {
    if (pier) return { id: "white_concrete" };
    if (y === 7 && (x * 5 + z * 3) % 7 === 0) return { id: "glowstone" }; // lit window
    return { id: "light_blue_stained_glass" };
  }
  if (y === 9) return { id: "light_gray_concrete" };                 // upper spandrel
  return null;
}

// Main shell, per footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ext = exterior(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, ext ? "stone_bricks" : "gray_concrete");

  if (ext) {
    for (let y = gr; y <= 9; y++) {
      const b = facadeBlock(x, y, z, gr);
      if (b) put(x, y, z, b.id);
    }
  } else {
    // Interior: ground floor slab, air above, storey-two floor slab.
    put(x, gr, z, "smooth_quartz");
    if (gr < 5) put(x, 5, z, "smooth_quartz");
  }

  // Roof deck and parapet/cornice on every footprint cell.
  if (gr <= ROOF) {
    put(x, ROOF, z, ext ? "smooth_quartz" : "gray_concrete");
  }
  if (ext) put(x, PARAPET, z, "white_concrete");
}

// Entrance on the north (lowest z) face, nearest the middle.
{
  const minZ = Math.min(...[...ground.keys()].map((k) => Number(k.split(",")[1])));
  const candidates = [...ground.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => z === minZ && exterior(x, z));
  if (candidates.length) {
    candidates.sort((a, b) => Math.abs(a[0] - 11.5) - Math.abs(b[0] - 11.5));
    const [ex, ez] = candidates[0];
    const gr = gnd(ex, ez);
    put(ex, gr, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(ex, gr + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gr + 2 <= 3) put(ex, gr + 2, ez, "glowstone"); // warm transom light
  }
}

// Roof plant penthouse on the interior of the roof, stepped in from the parapet.
for (let x = 8; x <= 15; x++) {
  for (let z = 6; z <= 11; z++) {
    if (!has(x, z) || exterior(x, z)) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
