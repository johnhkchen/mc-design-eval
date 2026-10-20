import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1980s: two storeys of white tiled
// concrete over a granite shopfront. Revision: grey stone foundation,
// pilaster bays on the upper storey for relief, a three-bay recessed
// entrance with a centred door, and a cornice band with a parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650501";
const W = 46, H = 23, D = 34;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const exposedOf = (x, z) =>
  [[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => exposedOf(x, z).length > 0;

const DOOR_X = Math.floor(W / 2);
const ENTRY_HALF = 1; // entrance spans DOOR_X-1 .. DOOR_X+1 on the south face

for (const [x, z, gr] of cells) {
  const exp = exposedOf(x, z);
  const perim = exp.length > 0;
  const corner = exp.length >= 2;
  const [fdx, fdz] = perim ? exp[0] : [0, 0];
  const a = perim ? (fdz !== 0 ? x : z) : 0; // position along the exposed face

  // Foundation: grey stone solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Floor / base course. Perimeter gets a polished andesite plinth.
  g.set(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  if (perim) {
    // Entrance: three cells centred on the south face.
    const onEntry = !corner && fdz === 1 && Math.abs(x - DOOR_X) <= ENTRY_HALF;
    const isDoor = onEntry && x === DOOR_X;

    // Ground-floor shopfront, y gr+1 .. gr+3.
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isDoor && y <= gr + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (corner) {
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else if (onEntry) {
        // Entrance flank: solid pier beside the door, glass above.
        if (y === gr + 3) g.set(x, y, z, "light_blue_stained_glass_pane");
        else g.set(x, y, z, "smooth_stone");
      } else if (a % 4 === 0) {
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
      }
    }

    // Fascia / lintel over the shopfront, with a warm lamp over the entrance.
    if (isDoor) {
      g.set(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      g.set(x, gr + 4, z, "brown_concrete");
    }

    // Warm light just inside some shopfront bays (not at the entrance).
    if (!corner && !onEntry && a % 8 === 2) {
      const ix = x - fdx, iz = z - fdz;
      if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, G(ix, iz) + 1, iz, "glowstone");
    }
  }

  // Storey line between the two storeys.
  g.set(x, gr + 5, z, perim ? "light_gray_concrete" : "smooth_stone");

  // Upper storey, y gr+6 .. gr+9: sill and head bands, pilaster bays, glass.
  if (perim) {
    g.set(x, gr + 6, z, "light_gray_concrete"); // sill band
    g.set(x, gr + 9, z, "light_gray_concrete"); // head band
    const pilaster = corner || a % 3 === 0;
    for (let y = gr + 7; y <= gr + 8; y++) {
      if (pilaster) g.set(x, y, z, "quartz_block");
      else g.set(x, y, z, "light_blue_stained_glass_pane");
    }

    // Warm lights standing on the floor slab, inside some upper bays.
    if (!corner && a % 6 === 1) {
      const ix = x - fdx, iz = z - fdz;
      if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, G(ix, iz) + 6, iz, "shroomlight");
    }
  }

  // Roof deck at gr+10; the perimeter reads as a cornice band.
  g.set(x, gr + 10, z, perim ? "light_gray_concrete" : "smooth_stone");

  // Parapet ring at gr+11 with a stone cap.
  if (perim) g.set(x, gr + 11, z, "white_concrete");
}

// Rooftop plant room and air-conditioning units, set back from the parapet.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 15 && x <= 20 && z >= 12 && z <= 21) {
    g.set(x, gr + 11, z, "light_gray_concrete");
    if (x >= 16 && x <= 19 && z >= 14 && z <= 19 && (x + z) % 3 !== 0) {
      g.set(x, gr + 12, z, "iron_bars");
    }
  }
  if (x >= 23 && x <= 25 && z >= 13 && z <= 15) {
    g.set(x, gr + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
