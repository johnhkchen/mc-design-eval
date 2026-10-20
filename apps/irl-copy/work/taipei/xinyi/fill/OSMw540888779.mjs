// Taipei, Xinyi district: low-rise reinforced-concrete commercial block (c. 1975-85).
// Two storeys over a stone plinth, white concrete frame with light-grey bands,
// glass panes in piered bays, a shopfront-style entrance on the north face, a
// cornice and parapet, and a rooftop water tank. Roof sits at ground + 11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888779";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);

const paneZ = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneX = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Pick the north-face entrance cell: non-corner north-facing perimeter cell nearest x = 5.
let doorCell = null;
for (const [x, z] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1), Wd = !has(x - 1, z), E = !has(x + 1, z);
  const corner = (N || S) && (Wd || E);
  if (!N || corner) continue;
  if (!doorCell || Math.abs(x - 5) < Math.abs(doorCell[0] - 5)) doorCell = [x, z];
}

for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  const perim = N || S || Wd || E;
  const corner = (N || S) && (Wd || E);
  const base = gr + 1;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air elsewhere (no interiors).
    put(x, base + 5, z, "white_concrete");
    put(x, base + 9, z, "light_gray_concrete");
    continue;
  }

  // Exterior walls, base at `base`, top parapet at base + 10.
  const alongZ = N || S; // wall runs along x
  const along = alongZ ? x : z;
  const pier = corner || along % 3 === 0;

  for (let y = base; y <= base + 10; y++) {
    let b = "white_concrete", p;
    if (y === base || y === base + 4 || y === base + 5 || y === base + 9) {
      b = "light_gray_concrete";
    } else if (y === base + 10) {
      b = "white_concrete";
    } else if (pier) {
      b = "white_concrete";
    } else {
      b = "glass_pane";
      p = alongZ ? paneZ : paneX;
    }
    put(x, y, z, b, p);
  }

  // Entrance on the north face.
  if (doorCell && doorCell[0] === x && doorCell[1] === z) {
    put(x, base, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, base + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, base + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Warm light behind some upper-floor windows.
  if (!corner && !pier && along % 6 === 1) {
    let ix = x, iz = z;
    if (N) iz = z + 1;
    else if (S) iz = z - 1;
    else if (Wd) ix = x + 1;
    else if (E) ix = x - 1;
    if (has(ix, iz)) put(ix, base + 7, iz, "shroomlight");
  }
}

// Rooftop water tank and plant on the interior roof deck.
for (const [x, z, gr] of cells) {
  const base = gr + 1;
  const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (perim) continue;
  if (x >= 4 && x <= 6 && z >= 5 && z <= 7) {
    put(x, base + 10, z, "gray_concrete");
    put(x, base + 11, z, "gray_concrete");
  }
  if (x === 9 && z === 3) put(x, base + 10, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
