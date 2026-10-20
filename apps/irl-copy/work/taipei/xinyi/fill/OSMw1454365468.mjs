import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365468";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const ground = new Map(cells.map(([x, z, y]) => [key(x, z), y]));

// Place a block only on footprint cells and inside the volume.
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!foot.has(key(x, z))) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward faces a footprint cell exposes.
const faces = (x, z) => {
  const f = [];
  if (!foot.has(key(x, z + 1))) f.push("S");
  if (!foot.has(key(x, z - 1))) f.push("N");
  if (!foot.has(key(x + 1, z))) f.push("E");
  if (!foot.has(key(x - 1, z))) f.push("W");
  return f;
};

// Glass pane connection state so panes read as a continuous window wall.
const paneProps = (face) =>
  face === "S" || face === "N"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Door position: middle of the south-facing row.
const southIdx = cells
  .filter(([x, z]) => faces(x, z).includes("S") && faces(x, z).length === 1)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southIdx.length ? southIdx[Math.floor(southIdx.length / 2)] : -1;
const doorZ = D - 1;

// Water tank cell: interior cell nearest the centre.
let tank = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (faces(x, z).length) continue;
    const d = Math.hypot(x - (W - 1) / 2, z - (D - 1) / 2);
    if (d < best) { best = d; tank = [x, z]; }
  }
}

for (const [x, z, b] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Base course, floor slabs and roof deck (all footprint cells).
  put(x, b, z, "smooth_stone");
  put(x, b + 5, z, "light_gray_concrete");   // upper floor slab
  put(x, b + 10, z, "light_gray_concrete");  // roof deck / cornice level

  const f = faces(x, z);
  if (f.length === 0) continue; // interior cell: air behind the glass

  // Perimeter walls, both storeys.
  for (let y = b + 1; y <= b + 9; y++) {
    if (y === b + 5) continue;
    put(x, y, z, "white_concrete");
  }
  // Ground-floor awning band and parapet.
  put(x, b + 4, z, "gray_concrete");
  put(x, b + 11, z, "light_gray_concrete");

  // Corners stay as solid piers.
  if (f.length !== 1) continue;

  const face = f[0];
  const idx = face === "S" || face === "N" ? x : z;
  if (idx % 2 !== 1) continue; // piers between windows

  const pp = paneProps(face);

  // Entrance on the south front.
  if (face === "S" && x === doorX && z === doorZ) {
    const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, b + 1, z, "dark_oak_door", { ...dp, half: "lower" });
    put(x, b + 2, z, "dark_oak_door", { ...dp, half: "upper" });
    put(x, b + 3, z, "glass_pane", pp); // transom
    continue;
  }

  // Ground-floor shopfront glazing.
  for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass_pane", pp);

  // Upper-floor windows; every fourth one glows.
  const lit = idx % 4 === 1;
  put(x, b + 6, z, "glass_pane", pp);
  put(x, b + 7, z, lit ? "glowstone" : "glass_pane", lit ? undefined : pp);
  put(x, b + 8, z, "glass_pane", pp);
}

// Rooftop water tank on the deck.
if (tank) {
  const [tx, tz] = tank;
  const gb = ground.get(key(tx, tz));
  put(tx, gb + 11, tz, "iron_block");
  put(tx, gb + 12, tz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
