import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075552";
const W = 4, H = 29, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Side-wall windows: panes on x=0 / x=3 faces, running along z
const sideWin = (z) => z >= 2 && z <= 14 && (z % 4 === 2 || z % 4 === 3);
const paneSide = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
// Front/back panes run along x
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Storey bands (offsets above cell ground). Floor slabs at 0,5,9,13,17.
const SLABS = [0, 5, 9, 13, 17];
const UPPER_BANDS = [[6, 8], [10, 12], [14, 16]];

for (const [x, z, gr] of cells) {
  const Y = (k) => gr + k;

  // Foundation under the cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs across the full footprint
  for (const k of SLABS) put(x, Y(k), z, "smooth_stone");

  const front = z === 0;
  const back = z === 15;
  const sideL = x === 0;
  const sideR = x === 3;
  const perim = front || back || sideL || sideR;

  if (perim) {
    for (let k = 1; k <= 18; k++) {
      if (SLABS.includes(k)) {
        // Storey lines and cornice in quartz on the perimeter
        if (k === 17) put(x, Y(k), z, "smooth_quartz");
        else put(x, Y(k), z, "smooth_quartz");
        continue;
      }
      if (k === 18) {
        put(x, Y(k), z, "white_concrete"); // parapet
        continue;
      }

      const inGround = k >= 1 && k <= 4;
      const inUpper = UPPER_BANDS.some(([a, b]) => k >= a && k <= b);

      if (inGround) {
        if (front) {
          if (x === 0 || x === 3) {
            put(x, Y(k), z, "polished_andesite"); // shopfront piers
          } else if (k === 4) {
            put(x, Y(k), z, "red_concrete"); // awning band
          } else if (x === 1 && (k === 1 || k === 2)) {
            put(x, Y(k), z, "oak_door", doorProps(k === 1 ? "lower" : "upper"));
          } else {
            put(x, Y(k), z, "glass"); // shop glazing
          }
        } else if (back) {
          if (k === 1) put(x, Y(k), z, "polished_andesite");
          else if (x === 1 || x === 2) put(x, Y(k), z, "light_blue_stained_glass_pane", paneEW);
          else put(x, Y(k), z, "white_concrete");
        } else {
          // side walls, ground floor
          if (k === 1) put(x, Y(k), z, "polished_andesite"); // base course
          else if (sideWin(z)) put(x, Y(k), z, "light_blue_stained_glass_pane", paneSide);
          else put(x, Y(k), z, "white_concrete");
        }
      } else if (inUpper) {
        if (front || back) {
          if (x === 1 || x === 2) {
            put(x, Y(k), z, "light_blue_stained_glass_pane", paneEW);
          } else {
            put(x, Y(k), z, "white_concrete");
          }
        } else if (sideWin(z)) {
          put(x, Y(k), z, "light_blue_stained_glass_pane", paneSide);
        } else {
          put(x, Y(k), z, "white_concrete");
        }
      }
    }
  }

  // Warm lights just inside the glazing
  if (front && x === 2) put(x, Y(2), 1, "glowstone");
  if (back && x === 1) put(1, Y(7), 14, "shroomlight");
}

// Rooftop plant: water tank on the roof slab, plus a stair housing
for (const [x, z, gr] of cells) {
  const Y = (k) => gr + k;
  if (x >= 1 && x <= 2 && z === 4) {
    put(x, Y(18), 4, "spruce_planks");
    put(x, Y(19), 4, "spruce_planks");
    put(x, Y(20), 4, "spruce_planks");
  }
  if (x >= 1 && x <= 2 && z === 5) {
    put(x, Y(18), 5, "spruce_planks");
    put(x, Y(19), 5, "spruce_planks");
    put(x, Y(20), 5, "spruce_planks");
  }
  if (x >= 1 && x <= 2 && (z === 11 || z === 12)) {
    put(x, Y(18), z, "white_concrete");
    put(x, Y(19), z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
