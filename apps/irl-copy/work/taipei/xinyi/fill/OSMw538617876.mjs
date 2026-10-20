import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617876";
const W = 6, H = 23, D = 12;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const vox = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!ground.has(`${x},${z}`)) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR_L = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_U = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const front = z === 0;
  const back = z === D - 1;
  const westF = x === 0;
  const eastF = x === W - 1;
  const per = front || back || westF || eastF;
  const xFace = (westF || eastF) && !front && !back;

  // Foundation and base course
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  if (g < ROOF) put(x, g, z, per ? "stone_bricks" : "smooth_stone");

  // Ground storey: shopfront on the street (z = 0), glazed side bays
  for (let y = g + 1; y <= 4; y++) {
    if (!per) continue;
    if (y === 4) {
      put(x, y, z, front ? "red_concrete" : "smooth_stone");
      continue;
    }
    if (front) {
      if (x === 0 || x === W - 1) {
        put(x, y, z, "white_terracotta");
      } else if (x === 2) {
        if (y === g + 1) put(x, y, z, "iron_door", DOOR_L);
        else if (y === g + 2) put(x, y, z, "iron_door", DOOR_U);
        else put(x, y, z, "white_terracotta");
      } else {
        put(x, y, z, "glass_pane", PANE_EW);
      }
    } else if (xFace) {
      if ([2, 3, 4, 7, 8, 9].includes(z)) put(x, y, z, "glass_pane", PANE_NS);
      else put(x, y, z, "white_terracotta");
    } else {
      put(x, y, z, "white_terracotta");
    }
  }

  // Storey line between floors
  if (5 > g) put(x, 5, z, "smooth_stone");

  // Upper storey: window grid with cream piers, sills and lintels
  for (let y = 6; y <= 10; y++) {
    if (y <= g || !per) continue;
    if (y === 6 || y === 10) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    let glass = false;
    if (front || back) {
      glass = x >= 1 && x <= 4;
    } else if (xFace) {
      glass = [1, 2, 4, 5, 7, 8, 10].includes(z);
    }
    if (glass) {
      put(x, y, z, "glass_pane", xFace ? PANE_NS : PANE_EW);
      // Warm light set back behind some windows, leaving an air gap at the glass
      if (y === 8) {
        if (front && x === 2) put(x, y, 2, "glowstone");
        if (back && x === 2) put(x, y, D - 3, "glowstone");
        if (westF && [2, 8].includes(z)) put(2, y, z, "glowstone");
        if (eastF && [2, 8].includes(z)) put(W - 3, y, z, "glowstone");
      }
    } else {
      put(x, y, z, "white_terracotta");
    }
  }

  // Roof deck and parapet
  if (ROOF > g) put(x, ROOF, z, "smooth_stone");
  if (per && ROOF > g) {
    put(x, 12, z, "smooth_stone");
    put(x, 13, z, "white_terracotta");
  }

  // Rooftop water tank
  if (x >= 2 && x <= 3 && z >= 4 && z <= 7 && ROOF > g) {
    for (let y = 12; y <= 14; y++) put(x, y, z, "white_concrete");
    put(x, 15, z, "iron_block");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
