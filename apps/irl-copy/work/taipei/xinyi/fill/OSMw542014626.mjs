import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542014626";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Record-based design: no survey, so a 1980s-era two-storey concrete commercial block
// with a white tiled facade, grey concrete floor bands, a shopfront on the street side,
// a parapet, and a rooftop water tank (typical Taipei low-rise). Roof sits 11 blocks
// above the lowest ground.

const key = (x, z) => `${x},${z}`;
const G = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => G.has(key(x, z));
const minZ = Math.min(...cells.map((c) => c[1]));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// outward directions: dz = -1 is north (street side at the lowest z)
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const DOOR_X = 4;

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slabs: ground floor, upper floor, roof deck
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  const outs = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  if (outs.length === 0) continue; // interior: air behind the walls

  // wall shell, both storeys
  for (const wb of [gr + 1, gr + 6]) {
    for (let y = wb; y <= wb + 3; y++) put(x, y, z, "white_concrete");
  }
  // parapet on the roof edge
  put(x, gr + 11, z, "white_concrete");

  // corners keep plain tile; single-face cells get the window grid
  if (outs.length !== 1) continue;
  const d = outs[0];
  const idx = d.dx !== 0 ? z : x; // position along the facade
  const paneProps = d.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const inX = x - d.dx, inZ = z - d.dz;
  const isFront = d.name === "north" && z === minZ;

  [gr + 1, gr + 6].forEach((wb, storey) => {
    if (idx % 3 !== 1) return;
    // sill and lintel in light concrete frame, glass between
    put(x, wb, z, "light_gray_concrete");
    put(x, wb + 3, z, "light_gray_concrete");
    put(x, wb + 1, z, "glass_pane", paneProps);
    put(x, wb + 2, z, "glass_pane", paneProps);
    // warm light behind some upper-floor glass
    if (storey === 1 && idx % 6 === 1 && has(inX, inZ)) {
      put(inX, wb + 1, inZ, "glowstone");
    }
  });

  // street-front shopfront on the ground floor
  if (isFront) {
    if (idx === DOOR_X) {
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      put(x, gr + 1, z, "glass_pane", paneProps);
      put(x, gr + 2, z, "glass_pane", paneProps);
    }
    put(x, gr + 3, z, "glass_pane", paneProps);
    // dark fascia over the shopfront
    put(x, gr + 4, z, "dark_oak_planks");
    // a lantern under the canopy at the door
    if (idx === DOOR_X + 1 || idx === DOOR_X - 1) {
      put(x, gr + 4, z, "dark_oak_planks");
    }
  }
}

// rooftop water tank: a round drum on the roof, inside the footprint
for (const [x, z, gr] of cells) {
  const inside = (x - 4.5) ** 2 + (z - 13.5) ** 2 <= 4.5;
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (!inside || !interior) continue;
  for (let y = gr + 11; y <= gr + 12; y++) put(x, y, z, "light_gray_concrete");
  put(x, gr + 13, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
