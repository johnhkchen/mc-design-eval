import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1339540102";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 11, H = 19, D = 9;
const g = new Voxels([W, H, D]);

// footprint lookup: key -> ground
const inside = new Map();
for (const [x, z, gr] of cells) inside.set(`${x},${z}`, gr);
const has = (x, z) => inside.has(`${x},${z}`);

// floor level: highest ground under the footprint, lower cells get foundation up to it
const F = Math.max(...cells.map(c => c[2]));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// exterior = footprint cell with a missing 4-neighbour
const isExt = (x, z) => has(x, z) && (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1));

const outDir = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
};

const extCells = cells.filter(([x, z]) => isExt(x, z));
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;

// entrance: prefer the north (street-side) face, nearest the middle
const doorCell = [...extCells].sort((a, b) => {
  const na = outDir(a[0], a[1]) === "north" ? 0 : 1;
  const nb = outDir(b[0], b[1]) === "north" ? 0 : 1;
  if (na !== nb) return na - nb;
  return Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX);
})[0];
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;
const doorFacing = doorCell ? outDir(doorCell[0], doorCell[1]) : "north";

// 1. foundation: solid from y 0 up to the floor level under every footprint cell
for (const [x, z] of cells) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone");
}

// 2. floor slab at F for interior cells, and the shell
for (const [x, z] of cells) {
  const ext = isExt(x, z);
  if (!ext) {
    put(x, F, z, "light_gray_concrete");          // ground floor slab
    put(x, F + 4, z, "light_gray_concrete");      // upper floor slab
    put(x, F + 6, z, "gray_concrete");            // roof cover
    if ((x * 2 + z) % 5 === 0) put(x, F + 2, z, "glowstone"); // warm light behind glass
    continue;
  }

  const isDoorCell = `${x},${z}` === doorKey;
  const dir = outDir(x, z);
  const hasWindowLine = (x + z) % 3 !== 0;

  // plinth
  put(x, F, z, "stone_bricks");

  // ground storey: door + shopfront glazing, then upper wall
  for (let y = F + 1; y <= F + 3; y++) {
    if (isDoorCell && y === F + 1) {
      put(x, y, z, "oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    } else if (isDoorCell && y === F + 2) {
      put(x, y, z, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (isDoorCell) {
      put(x, y, z, "white_concrete");
    } else if (hasWindowLine) {
      put(x, y, z, "glass_pane");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // cornice band, parapet, roof cap
  put(x, F + 4, z, "smooth_stone");
  put(x, F + 5, z, "white_concrete");
  put(x, F + 6, z, "smooth_stone");
}

// 3. roof equipment: a small plant box on the middle of the roof
const interiorCells = cells.filter(([x, z]) => !isExt(x, z));
if (interiorCells.length) {
  const cx = Math.round(interiorCells.reduce((s, c) => s + c[0], 0) / interiorCells.length);
  const cz = Math.round(interiorCells.reduce((s, c) => s + c[1], 0) / interiorCells.length);
  for (const [x, z] of interiorCells) {
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
      put(x, F + 7, z, "light_gray_concrete");
    }
  }
  // one lantern marking the plant box
  put(cx, F + 8, cz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
