import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei commercial block (c. 1970s-80s): two glazed storeys over a
// shophouse-style street frontage, cream quartz walls with stone base and red
// signage band, a flat roof with a plant housing.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1008721387";
const W = 49, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());

const g = new Voxels([W, H, D]);

// Roof level (flat), 11 blocks above the lowest ground; cap sits on top.
const roofOf = (gr) => Math.max(minG + 9, gr + 10);

// Street frontage = north edge (z-min side of the footprint).
const northXs = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([, z]) => z === Math.min(...[...ground.keys()].map((k) => Number(k.split(",")[1]))))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const DOOR = northXs[Math.floor(northXs.length / 2)];

const isEdge = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Which outward face a boundary cell shows (N has priority).
function faceOf(x, z) {
  if (!inFp(x, z - 1)) return "N";
  if (!inFp(x, z + 1)) return "S";
  if (!inFp(x - 1, z)) return "W";
  return "E";
}

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// Pass 1: foundations, floor slabs, roof slab, shell.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const R = roofOf(gr);
  const T = R + 2; // cap course

  // Foundation from y 0 up to ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs per storey (interior-solid, air gap behind glass).
  g.set(x, gr, z, "smooth_stone");
  g.set(x, gr + 5, z, "smooth_stone");
  g.set(x, R, z, "gray_concrete");

  if (!isEdge(x, z)) continue;

  const face = faceOf(x, z);
  const onStreet = face === "N";
  const i = face === "N" || face === "S" ? x : z;

  for (let y = gr; y <= T; y++) {
    let b = null;
    let props;

    if (y === T) {
      b = "smooth_quartz_slab";
      props = { type: "bottom", waterlogged: "false" };
    } else if (y === R + 1) {
      b = "smooth_quartz"; // parapet
    } else if (y === gr) {
      b = "stone_bricks"; // base course
    } else if (y === gr + 4) {
      b = onStreet ? "red_concrete" : "smooth_quartz"; // sign / storey band
    } else if (y === gr + 5) {
      b = "smooth_quartz"; // string course
    } else if (y === gr + 9 || y === R) {
      b = "smooth_quartz"; // lintel / cornice
    } else if (y > gr + 9 && y < R) {
      b = "smooth_quartz";
    } else if (onStreet && y >= gr + 1 && y <= gr + 3) {
      // Ground-floor shopfront
      if (x === DOOR && (y === gr + 1 || y === gr + 2)) {
        b = "oak_door";
        props = doorProps(y === gr + 1 ? "lower" : "upper");
      } else if (i % 3 === 0) {
        b = "polished_andesite"; // arcade pier
      } else {
        b = "light_blue_stained_glass";
      }
    } else if (y >= gr + 1 && y <= gr + 3) {
      // Ground floor, side/rear faces
      b = i % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass";
    } else if (y >= gr + 6 && y <= gr + 8) {
      // Upper storey glazing with mullions
      b = i % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass";
    } else {
      b = "smooth_quartz";
    }

    if (b) g.set(x, y, z, b, props);
  }
}

// Pass 2: door pair sits on the street face only where a cell exists.
if (inFp(DOOR, 0)) {
  const gr = gnd(DOOR, 0);
  g.set(DOOR, gr + 1, 0, "oak_door", doorProps("lower"));
  g.set(DOOR, gr + 2, 0, "oak_door", doorProps("upper"));
  g.set(DOOR, gr + 3, 0, "light_blue_stained_glass");
}

// Pass 3: rooftop plant housing, centred, standing on the roof slab.
for (let x = 16; x <= 32; x++) {
  for (let z = 3; z <= 10; z++) {
    if (!inFp(x, z)) continue;
    const R = roofOf(gnd(x, z));
    if (R + 4 >= H) continue;
    const edge = x === 16 || x === 32 || z === 3 || z === 10;
    for (let y = R + 1; y <= R + 3; y++) {
      if (edge) {
        const winBand = y === R + 2 && (x + z) % 3 !== 0;
        g.set(x, y, z, winBand ? "light_blue_stained_glass" : "light_gray_concrete");
      } else {
        g.set(x, y, z, "air");
      }
    }
    g.set(x, R + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 4: warm lights behind some glazed bays (interior side).
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (!isEdge(x, z)) continue;
  const face = faceOf(x, z);
  const i = face === "N" || face === "S" ? x : z;
  if (i % 6 !== 1 || i % 3 === 0) continue;
  const y = gr + 7;
  let ix = x, iz = z;
  if (face === "N") iz = z + 1;
  else if (face === "S") iz = z - 1;
  else if (face === "W") ix = x + 1;
  else ix = x - 1;
  if (inFp(ix, iz)) g.set(ix, y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
