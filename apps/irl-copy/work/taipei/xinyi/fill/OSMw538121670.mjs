import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw538121670.cells.json`, "utf8"));

// Mid-century Taipei commercial block: two storeys over a shopfront ground floor,
// white tiled concrete facade, quartz cornice, flat roof with parapet and rooftop plant.
const W = 31, H = 23, D = 15;
const ROOF = 11;            // parapet top, about 11 blocks above lowest ground
const WINDOW_TOP = ROOF - 2; // highest window row, below the cornice
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occ.has(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const facesOf = (x, z) =>
  Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Pane connections follow the wall they sit in.
const paneProps = (d) =>
  d === "N" || d === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: the middle of the south-facing street frontage.
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : -1;

const edgeCells = [];

// Pass 1: structure, foundation, floors, facades, roof.
for (const [x, z, gr] of cells) {
  const gz = Math.max(0, Math.round(gr));
  const faces = facesOf(x, z);

  // Foundation from y 0 up to the ground under this cell.
  for (let y = 0; y < gz; y++) put(x, y, z, "stone_bricks");

  if (faces.length === 0) {
    // Interior: floor slabs per storey, roof deck, air elsewhere.
    put(x, gz, z, "smooth_stone");
    if (gz + 5 < ROOF - 1) put(x, gz + 5, z, "light_gray_concrete");
    put(x, ROOF - 1, z, "light_gray_concrete");
    // Rooftop plant: a few small service housings.
    if (x % 9 === 4 && z === 7) {
      put(x, ROOF, z, "light_gray_concrete");
      put(x, ROOF + 1, z, "light_gray_concrete");
    }
    continue;
  }

  edgeCells.push({ x, z, gz, faces });

  // Base course at ground, then tiled walls up to the cornice.
  put(x, gz, z, "stone_bricks");
  for (let y = gz + 1; y <= ROOF - 2; y++) put(x, y, z, "white_concrete");

  // Storey slab line (spandrel band) and cornice / parapet.
  if (gz + 5 <= ROOF - 2) put(x, gz + 5, z, "light_gray_concrete");
  put(x, ROOF - 1, z, "quartz_block");
  put(x, ROOF, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // Roof deck fill inside the parapet, so the roof reads as solid.
  put(x, ROOF - 1, z, "quartz_block");

  for (const d of faces) {
    const [dx, dz] = DIRS[d];
    const pos = d === "N" || d === "S" ? x : z;
    const pier = pos % 3 === 0;
    const isSouth = d === "S";

    // Ground storey: shopfront glazing, door and striped awning on the street face.
    if (isSouth) {
      if (x === doorX) {
        put(x, gz + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, gz + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, gz + 3, z, "glass_pane", paneProps(d));
        continue;
      }
    }
    if (isSouth && gz + 4 <= WINDOW_TOP) {
      put(x, gz + 4, z, pos % 2 === 0 ? "red_concrete" : "white_concrete");
    }
    for (let y = gz + 1; y <= Math.min(gz + 3, WINDOW_TOP); y++) {
      if (!pier) put(x, y, z, "glass_pane", paneProps(d));
      else put(x, y, z, isSouth ? "stone_bricks" : "white_concrete");
    }

    // Upper storey window grid.
    for (let y = gz + 6; y <= Math.min(gz + 8, WINDOW_TOP); y++) {
      if (!pier) put(x, y, z, "glass_pane", paneProps(d));
    }
  }
}

// Pass 2: warm light behind some glass, on interior floors only.
for (const { x, z, gz, faces } of edgeCells) {
  for (const d of faces) {
    const [dx, dz] = DIRS[d];
    const pos = d === "N" || d === "S" ? x : z;
    if (pos % 6 !== 1) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz) || facesOf(ix, iz).length) continue;
    const lightY = gz + 6;
    if (lightY <= WINDOW_TOP) put(ix, lightY, iz, "glowstone");
  }
}

g.save(`${DIR}/OSMw538121670.nbt`);
