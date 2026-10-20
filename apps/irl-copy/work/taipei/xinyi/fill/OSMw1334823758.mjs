import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334823758";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 19, D = 6;
const ROOF_Y = 5;      // roof slab
const PARAPET_Y = 6;   // parapet top, roof reads ~7 blocks above lowest ground
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [xr, zr, grRaw] of cells) {
  const x = Math.round(xr), z = Math.round(zr), gr = Math.max(0, Math.round(grRaw));
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const frontEdge = z === 0;
  const backEdge = z === D - 1;
  const sideEdge = x === 0 || x === W - 1;
  const edge = frontEdge || backEdge || sideEdge;
  const corner = (frontEdge || backEdge) && sideEdge;

  // foundation down to the cell's own ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slab on each cell, plinth course on the perimeter
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // storey body: r = height above this cell's floor (1..4 inside a 5-block storey)
  for (let y = gr + 1; y <= PARAPET_Y; y++) {
    const r = y - gr;

    if (y === ROOF_Y) {
      put(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (y === PARAPET_Y) {
      if (edge) put(x, y, z, "light_gray_concrete");
      else if (x === 1 && (z === 3 || z === 4)) put(x, y, z, "iron_block");   // rooftop AC units
      continue;
    }
    if (!edge) continue; // interior stays air behind the glass

    // storey line at r = 4 across the whole perimeter
    if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; }

    // corner pilasters
    if (corner) { put(x, y, z, "light_gray_concrete"); continue; }

    if (frontEdge) {
      if (r === 3) { put(x, y, z, "green_concrete"); continue; }          // shopfront sign band
      if (x === 2) {                                                       // entrance door
        if (r === 1) { put(x, y, z, "dark_oak_door", DOOR("lower")); continue; }
        if (r === 2) { put(x, y, z, "dark_oak_door", DOOR("upper")); continue; }
      }
      if (x === 1 && (r === 1 || r === 2)) {                               // shop glass
        put(x, y, z, "glass_pane", GLASS_EW);
        continue;
      }
      put(x, y, z, "white_concrete");
      continue;
    }

    if (backEdge) {
      if (x === 1 || x === 2) {
        put(x, y, z, r <= 3 ? "glass_pane" : "light_gray_concrete", r <= 3 ? GLASS_EW : undefined);
      } else {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    if (sideEdge) {
      if ((z === 2 || z === 3) && r <= 3) put(x, y, z, "glass_pane", GLASS_NS);
      else put(x, y, z, "white_concrete");
    }
  }
}

// warm light behind the shop glass (interior side of the front window)
put(1, 2, 1, "glowstone");
put(1, 2, 4, "shroomlight");

g.save(`${DIR}/${ID}.nbt`);
