import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458220";
const W = 12, H = 23, D = 22;
const ROOF = 10;   // roof slab layer; roof top sits at y = 11
const FLOOR2 = 5;  // floor slab / storey line between the two storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const isInterior = (x, z) => has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (xFace) =>
  xFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Entrance: on the north (min z) face, non-corner cell nearest the middle of the face.
const northFace = cells
  .filter(([x, z]) => !has(x, z - 1) && has(x + 1, z) === has(x - 1, z) ? true : (!has(x, z - 1) && !(has(x + 1, z) === false || has(x - 1, z) === false)))
  .map(([x, z]) => x);
let entranceX = -1;
{
  const xs = cells.filter(([, z]) => !has(0, 0) || true)
    .filter(([x, z]) => !has(x, z - 1) && has(x - 1, z) && has(x + 1, z))
    .map(([x]) => x);
  if (xs.length) {
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    entranceX = xs.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  }
}
void northFace;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = ground.get(`${x},${z}`);

  // Foundation: solid from y 0 up to the cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr > ROOF) continue;

  const ex = { e: !has(x + 1, z), w: !has(x - 1, z), n: !has(x, z - 1), s: !has(x, z + 1) };
  const perim = ex.e || ex.w || ex.n || ex.s;
  const corner = (ex.e || ex.w) && (ex.n || ex.s);
  const xFace = (ex.e || ex.w) && !(ex.n || ex.s);
  const idx = xFace ? z : x;

  // Ground-level floor (base course on the facade, floor inside).
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, perim ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (y === FLOOR2) {
      put(x, y, z, perim ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (!perim) continue; // interior air behind the glass

    if (corner) { put(x, y, z, "white_concrete"); continue; }
    if (y === 4) { put(x, y, z, "white_concrete"); continue; }
    if (idx % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", paneProps(xFace));
  }

  // Entrance door and awning on the north face.
  if (perim && !corner && !has(x, z - 1) && x === entranceX && gr + 2 <= 4) {
    const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
  }
  if (!corner && !has(x, z - 1) && Math.abs(x - entranceX) <= 1 && gr + 3 <= 4) {
    put(x, gr + 3, z, "red_terracotta_slab", { type: "bottom", waterlogged: "false" });
  }

  // Warm lights inside, behind a facade window.
  if (perim && !corner && !(idx % 3 === 0)) {
    const ix = ex.e ? x - 1 : ex.w ? x + 1 : x;
    const iz = ex.n ? z + 1 : ex.s ? z - 1 : z;
    if (has(ix, iz) && isInterior(ix, iz)) {
      if (idx % 4 === 2 && gr < 4) put(ix, 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
      if (idx % 6 === 1) put(ix, 9, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // Roof plant on interior cells, standing on the roof slab.
  if (!perim && isInterior(x, z) && (x * 3 + z * 5) % 11 === 0) {
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
