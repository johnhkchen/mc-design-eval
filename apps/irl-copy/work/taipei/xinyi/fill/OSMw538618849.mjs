import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618849";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Palette: a two-storey 1980s Xinyi-era commercial block, pale concrete frame,
// tinted glazing, red awning over a street-front shopfront.
const WALL = "white_concrete";
const SLAB_FLOOR = "light_gray_concrete";
const ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR_GROUND = "smooth_stone";
const CORNICE = "stone_brick_slab";
const AWNING = "red_concrete";
const PLANT = "iron_block";

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

const FACES = [
  { dx: 0, dz: -1, f: "north", along: "x" },
  { dx: 0, dz: 1, f: "south", along: "x" },
  { dx: -1, dz: 0, f: "west", along: "z" },
  { dx: 1, dz: 0, f: "east", along: "z" },
];
const exterior = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

// Street front = northern exposed edge; door sits at the middle non-corner cell.
const frontCells = [];
for (const [x, z] of cells) {
  const ex = exterior(x, z);
  if (ex.length === 1 && ex[0].f === "north") frontCells.push([x, z]);
}
frontCells.sort((a, b) => a[0] - b[0]);
const doorCell = frontCells.length
  ? frontCells[Math.floor(frontCells.length / 2)]
  : null;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerim = (x, z) => exterior(x, z).length > 0;

// Foundation, base course and ground floor slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  put(x, gr, z, isPerim(x, z) ? BASE : FLOOR_GROUND);
}

// Storeys, cornice, parapet, roof and rooftop plant
for (const [x, z, gr] of cells) {
  const ex = exterior(x, z);
  const perim = ex.length > 0;
  const corner = ex.length >= 2;
  const face = ex[0] ?? null;
  const along = face ? (face.along === "x" ? x : z) : 0;
  const pier = corner || (perim && along % 3 === 0);
  const isFront = ex.some((f) => f.f === "north");
  const isDoor = doorCell && x === doorCell[0] && z === doorCell[1];

  const paneProps =
    face && face.along === "x"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr + 1; y <= 12; y++) {
    let spec = null;

    if (y === 4) {
      if (perim) spec = [WALL];
    } else if (y === gr + 1 || y === gr + 2) {
      if (perim) {
        if (isDoor) {
          spec = [
            "dark_oak_door",
            {
              facing: "north",
              half: y === gr + 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false",
            },
          ];
        } else if (pier) spec = [WALL];
        else spec = [GLASS, paneProps];
      }
    } else if (y === gr + 3) {
      if (perim) spec = [isFront ? AWNING : WALL];
    } else if (y === 5) {
      spec = [perim ? WALL : SLAB_FLOOR];
    } else if (y >= 6 && y <= 9) {
      if (perim) {
        if (y === 6 || y === 9 || pier) spec = [WALL];
        else spec = [GLASS, paneProps];
      }
    } else if (y === 10) {
      spec = perim
        ? [CORNICE, { type: "top", waterlogged: "false" }]
        : [SLAB_FLOOR];
    } else if (y === 11) {
      spec = [perim ? WALL : ROOF];
    } else if (y === 12) {
      if (!perim && ((x >= 6 && x <= 7 && z >= 7 && z <= 8) || (x >= 10 && x <= 11 && z >= 11 && z <= 12))) {
        spec = [PLANT];
      }
    }

    if (spec) put(x, y, z, spec[0], spec[1]);
  }
}

// Warm light behind some street-facing windows (glowstone just inside the glass)
for (const [x, z, gr] of cells) {
  const ex = exterior(x, z);
  if (ex.length !== 1) continue;
  const face = ex[0];
  const along = face.along === "x" ? x : z;
  if (along % 3 === 0) continue; // piers
  if (along % 2 !== 0) continue; // every other window
  const ix = x - face.dx;
  const iz = z - face.dz;
  if (has(ix, iz) && !isPerim(ix, iz)) {
    put(ix, 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
