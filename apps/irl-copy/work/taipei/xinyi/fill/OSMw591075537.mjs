import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075537";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 12 x 18 footprint, roof about 8 blocks above lowest ground.
// Reads as a 1990s-era two-storey commercial block in Xinyi:
// stone plinth, shopfront storey with a red fascia band, white-clad upper storey with
// glass bays, cornice and parapet, rooftop plant.
const W = 12, H = 20, D = 18;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const gr = new Map();
for (const [x, z, h] of cells) gr.set(k(x, z), h);
const inFp = (x, z) => gr.has(k(x, z));

const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const depth0 = (x, z) => inFp(x, z) && exposed(x, z).length > 0;
const depth1 = (x, z) =>
  inFp(x, z) && !depth0(x, z) &&
  DIRS.some(([dx, dz]) => inFp(x + dx, z + dz) && depth0(x + dx, z + dz));

// Entrance: middle of the south (+z) facade.
const southXs = cells
  .filter(([x, z]) => depth0(x, z) && exposed(x, z).some(([, dz]) => dz === 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : 6;

const body = [];
const cuts = [];
const put = (x, y, z, b, p) => { if (y >= 0 && y < H) body.push([x, y, z, b, p]); };
const cut = (x, y, z, b) => { if (y >= 0 && y < H) cuts.push([x, y, z, b]); };

for (const [x, z] of cells) {
  const base = gr.get(k(x, z));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const exp = exposed(x, z);

  if (exp.length === 0) {
    // Interior: floor slabs and solid core, with rooftop plant on the deck.
    for (let r = 0; r <= 7; r++) {
      put(x, base + r, z, r === 4 ? "smooth_stone" : "light_gray_concrete");
    }
    if (!depth1(x, z) && x % 5 === 2 && z % 5 === 2) {
      put(x, base + 8, z, "iron_block");
    }
    continue;
  }

  // Facade cell.
  const [fdx, fdz] = exp[0];
  const t = fdx !== 0 ? z : x;
  const corner = exp.length > 1;
  const pillar = corner || t % 3 === 0;
  const isEntrance = fdz === 1 || exp.some(([, dz]) => dz === 1);
  const doorHere = exp.some(([, dz]) => dz === 1) && x === entranceX &&
    !exp.some(([dx]) => dx !== 0) ? true :
    (exp.some(([, dz]) => dz === 1) && x === entranceX);

  for (let r = 0; r <= 8; r++) {
    const y = base + r;
    let b;
    let props;
    if (r === 0) b = "polished_andesite";
    else if (r === 3) b = "red_concrete";
    else if (r === 4) b = "light_gray_concrete";
    else if (r === 7) b = "smooth_stone";
    else if (r === 8) b = "stone_brick_wall";
    else if ((r === 1 || r === 2) && doorHere) {
      b = "dark_oak_door";
      props = {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else {
      b = pillar ? "white_concrete" : "glass_pane";
    }
    put(x, y, z, b, props);

    // Air gap behind the window bays, with a warm light in some upper bays.
    if ((r === 1 || r === 2 || r === 5 || r === 6) && !pillar && !doorHere) {
      for (const [dx, dz] of exp) {
        const ix = x - dx, iz = z - dz;
        if (inFp(ix, iz) && depth1(ix, iz)) {
          if (r === 6 && t % 6 === 1) cut(ix, y, iz, "glowstone");
          else cut(ix, y, iz, "air");
        }
      }
    }
  }
}

// Apply solid placements first, then air gaps and lights behind the glass.
for (const [x, y, z, b, p] of body) g.set(x, y, z, b, p);
for (const [x, y, z, b] of cuts) g.set(x, y, z, b);

g.save(`${DIR}/${ID}.nbt`);
