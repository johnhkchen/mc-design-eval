import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711368";
const W = 13, H = 23, D = 22;

// Palette: late-1980s Taipei commercial block, off-white render, tinted glazing, red shop awnings.
const FOUND = "polished_andesite";
const WALL = "white_concrete";
const TRIM = "smooth_quartz";
const ROOFM = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "glass";
const AWN = "red_concrete";
const TANK = "iron_block";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) vox.set(x, y, z, id, p);
  else vox.set(x, y, z, id);
};

// Entrance: street-side (north, z-min) cell nearest the middle of the frontage.
let ent = null;
for (const [x, z] of cells) {
  if (has(x, z - 1)) continue;
  if (!ent || Math.abs(x - 6) < Math.abs(ent[0] - 6) ||
      (Math.abs(x - 6) === Math.abs(ent[0] - 6) && x < ent[0])) ent = [x, z];
}

let winN = 0;
for (const [x, z, gr0] of cells) {
  const gd = Math.max(0, Math.round(gr0));
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gd; y++) put(x, y, z, FOUND);

  const f = edge(x, z);
  const isEnt = !!ent && ent[0] === x && ent[1] === z;
  const win = (x + z) % 3 === 1;

  // Inward direction (toward the building core) for facade cells.
  let dx = 0, dz = 0;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  else if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;

  for (let y = gd + 1; y < H; y++) {
    let m = null;
    if (y === 11) m = ROOFM;                       // roof deck
    if ((y === 10 || y === 5)) m = f ? TRIM : ROOFM; // storey floor slabs / cornice bands
    if (y === 12 && f) m = TRIM;                   // parapet
    if (y >= 6 && y <= 9 && f) m = win ? GLASS : WALL; // upper storey: window grid with piers
    if (y === 4 && f) m = AWN;                     // shop awning band
    if (y >= 1 && y <= 3 && f && y > gd) m = (x + z) % 3 === 0 ? WALL : SHOP; // shopfront
    if (m) put(x, y, z, m);
  }

  if (f && win) {
    winN++;
    // Warm light behind every third upper window, on the inner neighbour.
    if (winN % 3 === 0 && has(x + dx, z + dz) && !edge(x + dx, z + dz)) {
      put(x + dx, 7, z + dz, "glowstone");
    }
  }

  if (isEnt) {
    // Door pair, inward-facing, under the awning band.
    const facing = dz === 1 ? "south" : dz === -1 ? "north" : dx === 1 ? "east" : "west";
    if (gd + 2 <= 3) {
      put(x, gd + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gd + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Hanging lantern from the awning above the door, when there is room.
    if (gd + 3 <= 3) put(x, gd + 3, z, "lantern", { hanging: "true" });
  }
}

// Rooftop water tank: 2x2 cluster of iron blocks on the roof deck, if the footprint allows.
const tankCells = [[4, 8], [5, 8], [4, 9], [5, 9]];
if (tankCells.every(([x, z]) => has(x, z) && !edge(x, z))) {
  for (const [x, z] of tankCells) {
    put(x, 12, z, TANK);
    put(x, 13, z, TANK);
  }
}

vox.save(`${DIR}/${ID}.nbt`);
