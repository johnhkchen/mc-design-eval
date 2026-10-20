import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise shophouse, c.1975-85: two storeys over a stone foundation,
// smooth quartz-tile cladding, granite base course, dark-wood shopfront fascia,
// pane windows with white-concrete spandrels, parapet with roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152169";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 10, H = 24, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const allG = [...ground.values()];
const minG = Math.min(...allG);
const maxG = Math.max(...allG);

const S1 = Math.max(minG + 5, maxG + 4);  // first-floor slab
const S2 = S1 + 5;                        // roof slab
const TOP = S2 + 2;                       // parapet coping
if (TOP > H - 1) throw new Error(`roof ${TOP} exceeds volume height`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

function exposure(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}

const paneProps = (dir) =>
  dir === "n" || dir === "s"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// Street face is north (z min). Entrance: front wall cell nearest the centre.
const frontCells = cells
  .filter(([x, z]) => exposure(x, z).includes("n"))
  .map(([x, z]) => [x, z]);
const meanFx = frontCells.reduce((s, [x]) => s + x, 0) / Math.max(1, frontCells.length);
const doorCell = frontCells
  .slice()
  .sort((a, b) => Math.abs(a[0] - meanFx) - Math.abs(b[0] - meanFx) ||
    exposure(a[0], a[1]).length - exposure(b[0], b[1]).length)[0];

for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  put(x, S1, z, "smooth_stone");
  put(x, S2, z, "smooth_stone");

  const ex = exposure(x, z);
  if (ex.length === 0) continue;

  const primary = ex[0];
  const idx = primary === "n" || primary === "s" ? x : z;
  const bay = idx % 3;
  const isCorner = ex.length > 1;
  const isDoor = doorCell && x === doorCell[0] && z === doorCell[1];

  for (let y = gr + 1; y <= TOP; y++) put(x, y, z, "smooth_quartz");

  put(x, gr + 1, z, "polished_granite");
  put(x, S1, z, "light_gray_concrete");
  put(x, S2, z, "light_gray_concrete");
  put(x, S1 - 1, z, "dark_oak_planks");
  put(x, TOP, z, "light_gray_concrete");

  put(x, S1 + 1, z, "white_concrete");
  put(x, S1 + 4, z, "white_concrete");
  if (bay !== 0 && !isCorner) {
    for (const y of [S1 + 2, S1 + 3]) put(x, y, z, "light_blue_stained_glass_pane", paneProps(primary));
  }

  if (primary === "n" && !isCorner && !isDoor) {
    for (let y = gr + 2; y <= S1 - 2; y++) put(x, y, z, "light_blue_stained_glass_pane", paneProps("n"));
  } else if (primary !== "n" && bay !== 0 && !isCorner) {
    for (let y = gr + 2; y <= S1 - 2; y++) put(x, y, z, "light_blue_stained_glass_pane", paneProps(primary));
  }

  if (isDoor) {
    // Entrance: lower and upper door halves, flanked by lit jambs.
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Hanging lantern from the first-floor slab, lighting the entrance.
    const [dx, dz] = inward.n;
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && exposure(ix, iz).length === 0) {
      put(ix, S1 - 1, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  if (bay !== 0 && !isCorner && idx % 6 === 1) {
    const [dx, dz] = inward[primary];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && exposure(ix, iz).length === 0) {
      put(ix, S1 + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Roof plant: small boxes standing on the roof slab, inside the parapet.
for (const [x, z] of cells) {
  if (exposure(x, z).length > 0) continue;
  if ((x === 2 || x === 3) && (z === 6 || z === 7)) {
    put(x, S2 + 1, z, "light_gray_concrete");
  }
  if ((x === 6 || x === 7) && (z === 15 || z === 16)) {
    put(x, S2 + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
