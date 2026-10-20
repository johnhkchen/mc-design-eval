// Low-rise commercial/office block, Xinyi district, Taipei.
// Read from the lidar roof height (about 11 blocks above the lowest ground), this is a two-storey
// podium-scale block of the 1990s Xinyi commercial type: white concrete piers, tinted glazing in
// frames, a polished granite base, stone storey lines, a cornice and a parapet. The ground floor
// is a shopfront with a central entrance, and a rooftop plant room sits on the deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw520038132";
const W = 29, H = 23, D = 59;
const ROOF = 11;          // top of parapet, absolute y (lowest ground is y 0)
const DECK = 10;          // roof deck / cornice line
const SLAB = 5;           // storey line between the two storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Number(gr));
const inF = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const [x, z, gr] of cells) {
  // Ground level of this cell, clamped so the body always has room under the deck.
  const gy = Math.min(Math.max(Math.round(gr), 0), DECK);

  // Foundation: solid from y 0 up to this cell's ground so nothing floats on a slope.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const outs = NB.filter(([dx, dz]) => !inF(x + dx, z + dz));

  // Interior cells: floor slab per storey, roof deck, plant room on the roof.
  if (outs.length === 0) {
    if (SLAB >= gy) put(x, SLAB, z, "smooth_stone");
    put(x, DECK, z, "gray_concrete");
    const plant = x >= 8 && x <= 20 && ((z >= 12 && z <= 18) || (z >= 40 && z <= 46));
    if (plant) {
      put(x, 11, z, "light_gray_concrete");
      if ((x === 8 || x === 20) && (z === 12 || z === 18 || z === 40 || z === 46)) {
        put(x, 12, z, "lantern", { hanging: "false" });
      }
    }
    continue;
  }

  // Corner or notch cells: full-height white concrete piers with the storey lines.
  if (outs.length >= 2) {
    for (let y = gy; y <= ROOF; y++) {
      let b = "white_concrete";
      if (y === gy) b = "polished_granite";
      else if (y === SLAB || y === DECK) b = "smooth_stone";
      put(x, y, z, b);
    }
    continue;
  }

  // Single-facade edge cells.
  const [dx, dz] = outs[0];
  const idx = dx !== 0 ? z : x;                 // position along the facade
  const ix = x - dx, iz = z - dz;               // interior neighbour, behind the glass
  const paneProps = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const isPier = idx % 4 === 0;
  // Entrance: centre bay of the north (min z) facade on the ground storey.
  const isEntrance = dz === -1 && x === 14 && gy <= 2;

  for (let y = gy; y <= ROOF; y++) {
    let b, p;

    if (y === gy) {
      b = "polished_granite";                   // base course
    } else if (y === SLAB || y === DECK) {
      b = "smooth_stone";                       // storey line / cornice
    } else if (y === ROOF) {
      b = "white_concrete";                     // parapet cap
    } else if (y === 4 || y === 6 || y === 9) {
      b = "white_concrete";                     // window heads and sills
    } else if (isEntrance && (y === gy + 1 || y === gy + 2)) {
      b = "oak_door";
      p = {
        facing: "north",
        half: y === gy + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (isPier) {
      b = "white_concrete";
    } else {
      b = "light_blue_stained_glass_pane";
      p = paneProps;
    }

    put(x, y, z, b, p);

    // Warm light behind some glass: glowstone on the upper storey, shroomlight on the ground floor.
    if (!isPier && !isEntrance) {
      if (y === 7 && idx % 8 === 2 && inF(ix, iz) && G(ix, iz) <= 7) {
        put(ix, 7, iz, "glowstone");
      }
      if (y === 2 && idx % 8 === 6 && inF(ix, iz) && G(ix, iz) <= 2) {
        put(ix, 2, iz, "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
