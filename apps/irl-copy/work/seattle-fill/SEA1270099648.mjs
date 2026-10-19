// SEA1270099648 - Pacific Science Center campus utility / stair tower (2 storeys, flat parapet roof).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270099648";
const BOX = { x0: 0, z0: 320, W: 6, D: 7, heightBlocks: 6 };
const H = BOX.heightBlocks + 6;
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = manifest.buildings.find((q) => q.id === ID);
if (!b) throw new Error("no building " + ID);

const F = new Set(b.footprint.map(([x, z]) => `${x - BOX.x0},${z - BOX.z0}`));
if (F.size !== BOX.W * BOX.D) throw new Error("footprint size " + F.size);
const cells = [...F].map((k) => k.split(",").map(Number));
const isEdge = (x, z) => x === 0 || z === 0 || x === BOX.W - 1 || z === BOX.D - 1;
const isCorner = (x, z) => (x === 0 || x === BOX.W - 1) && (z === 0 || z === BOX.D - 1);

const g = new Voxels([BOX.W, H, BOX.D]);
const ROOF_Y = 7;

// base course: dark deepslate bricks, y0-1 under the whole footprint
for (const [x, z] of cells) { g.set(x, 0, z, "deepslate_bricks"); g.set(x, 1, z, "deepslate_bricks"); }

// interior floor slab at y4 (storey line) and roof deck at y7
for (const [x, z] of cells) {
  if (!isEdge(x, z)) { g.set(x, 4, z, "light_gray_concrete"); g.set(x, ROOF_Y, z, "light_gray_concrete"); }
}

// window cells: tall narrow glass slots, one per face-run (x1,x4 on north/south; z2,z4 on east/west)
const glass = new Set();
for (const [x, z] of cells) {
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  if ((z === 0 || z === BOX.D - 1) && (x === 1 || x === 4)) glass.add(`${x},${z}`);
  if ((x === 0 || x === BOX.W - 1) && (z === 2 || z === 4)) glass.add(`${x},${z}`);
}
const door = [2, BOX.D - 1];

// walls: white concrete, light-grey corner pilasters, light-grey storey band at y4, glass slots, parapet at y7
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const k = `${x},${z}`;
  const pier = isCorner(x, z) ? "light_gray_concrete" : "white_concrete";
  for (let y = 2; y <= 6; y++) {
    if (glass.has(k)) { g.set(x, y, z, "light_blue_stained_glass"); continue; }
    if (y === 4) { g.set(x, y, z, isCorner(x, z) ? "light_gray_concrete" : "light_gray_concrete"); continue; }
    g.set(x, y, z, pier);
  }
  g.set(x, ROOF_Y, z, "white_concrete");
  g.set(x, ROOF_Y + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// entrance: iron door on the south face at x=2, lower/upper at y2-3, flush light-grey lintel over it at y4
{
  const [dx, dz] = door;
  g.set(dx, 2, dz, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, 3, dz, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx, 4, dz, "light_gray_concrete");
  g.set(dx + 1, 4, dz, "light_gray_concrete");
}

// rooftop: two vent boxes (y8-9) and a lightning-rod iron-bar mast to y11
g.set(1, ROOF_Y + 1, 2, "light_gray_concrete");
g.set(1, ROOF_Y + 2, 2, "light_gray_concrete");
g.set(3, ROOF_Y + 1, 4, "light_gray_concrete");
g.set(3, ROOF_Y + 2, 4, "light_gray_concrete");
for (let y = ROOF_Y + 1; y <= ROOF_Y + 4; y++) {
  const top = y === ROOF_Y + 4;
  g.set(2, y, 2, "iron_bars", { north: String(top), south: String(top), east: String(top), west: String(top), waterlogged: "false" });
}

g.save(`/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/${ID}.nbt`);
console.log(JSON.stringify({ id: ID, size: [BOX.W, H, BOX.D], footprint: F.size, glass: [...glass], door, mastTop: ROOF_Y + 4 }));
