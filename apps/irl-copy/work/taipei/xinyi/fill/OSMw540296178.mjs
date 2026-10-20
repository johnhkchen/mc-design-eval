import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296178";
const W = 21, D = 18, H = 23;
const ROOF = 11;          // roof slab level (lidar: about 11 above lowest ground)
const PARAPET = 12;       // parapet walls y 12..13, lantern caps at 14
const STOREY = [5, 10];   // storey lines between the three levels

// Footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !inFp(x + dx, z + dz))
    .map(([name]) => name);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front entrance: the south face if present, else the first face with cells.
const cellsList = raw.map(([x, z]) => ({ x, z }));
let front = "south";
for (const f of ["south", "north", "east", "west"]) {
  if (cellsList.some((c) => outward(c.x, c.z).includes(f))) { front = f; break; }
}
const frontCells = cellsList
  .filter((c) => outward(c.x, c.z).includes(front))
  .sort((a, b) => (front === "south" || front === "north" ? a.x - b.x : a.z - b.z));
const doorCell = frontCells[Math.floor(frontCells.length / 2)] ?? null;
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

for (const { x, z } of cellsList) {
  const G = gAt(x, z);
  const outs = outward(x, z);
  const facade = outs.length > 0;
  const corner = outs.length >= 2;
  const isDoor = key(x, z) === doorKey;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Interior floor slabs (ground floor, then each storey line).
  if (!facade) {
    put(x, G, z, "smooth_stone");
    for (const y of STOREY) if (y > G) put(x, y, z, "smooth_quartz");
  }

  // Roof slab over every footprint cell.
  put(x, ROOF, z, "light_gray_concrete");

  if (!facade) continue;

  const nrm = outs[0];
  const [nx, nz] = DIRS[nrm];
  const pier = corner || isDoor || (x + z) % 3 === 0;

  // Ground storey: plinth, shopfront glass, granite piers, lintel.
  for (let y = G; y <= 4; y++) {
    if (y === G) { put(x, y, z, "polished_granite"); continue; }
    if (y === 4) { put(x, y, z, "polished_granite"); continue; }
    put(x, y, z, pier ? "polished_granite" : "glass");
  }

  // Upper storey: storey lines and window grid with white piers.
  for (let y = Math.max(G, 5); y <= 10; y++) {
    if (y === 5 || y === 10) { put(x, y, z, "smooth_quartz"); continue; }
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }

  // Warm light set just inside some upper windows.
  if (!pier && (x + z) % 6 === 1) {
    const ix = x - nx, iz = z - nz;
    if (inFp(ix, iz) && outward(ix, iz).length === 0) put(ix, 7, iz, "glowstone");
  }

  // Parapet and cornice cap.
  put(x, PARAPET, z, "white_concrete");
  put(x, PARAPET + 1, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  if (corner) put(x, PARAPET + 2, z, "sea_lantern");
}

// Entrance door, set after the walls so it overrides the granite cell.
if (doorCell) {
  const { x, z } = doorCell;
  const G = gAt(x, z);
  const base = { facing: front, hinge: "left", open: "false", powered: "false" };
  put(x, G, z, "oak_door", { ...base, half: "lower" });
  put(x, G + 1, z, "oak_door", { ...base, half: "upper" });
  // Recessed canopy lintel above the door.
  put(x, Math.min(G + 2, 4), z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// Rooftop plant box in the centre of the roof.
for (const { x, z } of cellsList) {
  if (outward(x, z).length > 0) continue;
  if (x < 6 || x > 14 || z < 5 || z > 12) continue;
  put(x, PARAPET, z, "light_gray_concrete");
  put(x, PARAPET + 1, z, "light_gray_concrete");
  put(x, PARAPET + 2, z, (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
