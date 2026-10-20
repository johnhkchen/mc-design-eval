import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no OSM tags. Reads as a 1990s Xinyi-style two-storey commercial block:
// granite base course, white terracotta walls, quartz pillars, bronze-tinted glass
// shopfront below and a glazed upper storey, with a cornice and parapet.
// Roof at about 11 blocks above the lowest ground (storey 1 = 5 blocks, storey 2 = 5 blocks, parapet 1).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864106";
const W = 17, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const has = (x, z) => ground.has(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z, d) => !has(x + DIRS[d][0], z + DIRS[d][1]);

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const cx = (W - 1) / 2;
const cz = (D - 1) / 2;

const gnd = (x, z) => Math.min(8, Math.max(0, Math.round(ground.get(key(x, z)))));

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane connections follow the facade direction.
const glassProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const isPerim = (x, z) => Object.keys(DIRS).some((d) => exposed(x, z, d));

// Pass 1: foundation, floors, facades, cornice, parapet.
const doorCells = [];
for (const [x, z] of cells) {
  const G = gnd(x, z);
  const faces = Object.keys(DIRS).filter((d) => exposed(x, z, d));
  const perim = faces.length > 0;
  const corner = faces.length >= 2;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Ground course / ground floor slab.
  put(x, G, z, perim ? "polished_granite" : "smooth_stone");

  // Interior floor slabs for each storey.
  if (!perim) {
    put(x, G + 5, z, "light_gray_concrete");
    put(x, G + 10, z, "light_gray_concrete");
    put(x, G + 11, z, "light_gray_concrete");
    continue;
  }

  // Perimeter facade.
  const face = faces[0];
  const axisX = face === "N" || face === "S";
  const idx = axisX ? x - minX : z - minZ;
  const pillar = corner || idx % 3 === 0;

  // Storey 1 (shopfront): glass between quartz pillars, lintel band above.
  for (let y = G + 1; y <= G + 3; y++) {
    put(x, y, z, pillar ? "smooth_quartz" : "light_blue_stained_glass_pane", pillar ? undefined : glassProps(face));
  }
  put(x, G + 4, z, "light_gray_concrete");

  // Storey line.
  put(x, G + 5, z, "smooth_quartz");

  // Storey 2: white terracotta sill, glazed panes between pillars.
  put(x, G + 6, z, pillar ? "smooth_quartz" : "white_terracotta");
  for (let y = G + 7; y <= G + 9; y++) {
    put(x, y, z, pillar ? "smooth_quartz" : "light_blue_stained_glass_pane", pillar ? undefined : glassProps(face));
  }

  // Cornice and parapet.
  put(x, G + 10, z, "smooth_quartz");
  put(x, G + 11, z, "white_terracotta");

  // Warm lights behind some upper-storey windows.
  if (!pillar && idx % 6 === 4) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx;
    const iz = z - dz;
    if (has(ix, iz) && !isPerim(ix, iz)) put(ix, G + 8, iz, "glowstone");
  }

  // Record door candidates on the street-facing north face (non-corner).
  if (face === "N" && !corner && z === minZ) doorCells.push([x, z, G]);
}

// Pass 2: entrance door on the north (street) face, centred.
doorCells.sort((a, b) => a[0] - b[0]);
if (doorCells.length) {
  const [x, z, G] = doorCells[Math.floor(doorCells.length / 2)];
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(x, G + 1, z, "dark_oak_door", doorProps("lower"));
  put(x, G + 2, z, "dark_oak_door", doorProps("upper"));
  // Lamp either side of the door on the lintel-height glass.
  for (const dxo of [-1, 1]) {
    const nx = x + dxo;
    if (has(nx, z) && isPerim(nx, z)) put(nx, G + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: rooftop plant box and a central mast on the roof.
for (const [x, z] of cells) {
  const G = gnd(x, z);
  if (isPerim(x, z)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) {
    put(x, G + 11, z, "light_gray_concrete");
    put(x, G + 12, z, "light_gray_concrete");
  }
  if (Math.round(x - cx) === 0 && Math.round(z - cz) === 0) {
    for (let y = G + 13; y <= G + 14; y++) put(x, y, z, "iron_block");
    put(x, G + 15, z, "lightning_rod", { facing: "up", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
