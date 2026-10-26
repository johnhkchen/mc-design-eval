import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC55566";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 31, D = 9;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;

// Footprint lookup
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => map.has(key(x, z));

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const outsOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const FACE = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

// Entrance on the z=0 face, nearest the centre line
let entrance = null;
{
  const front = cells
    .filter(([x, z]) => outsOf(x, z).some(([dx, dz]) => dx === 0 && dz === -1))
    .map(([x, z]) => [x, z]);
  if (front.length) {
    const cx = Math.floor(W / 2);
    front.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
    entrance = front[0];
  }
}

// Storey-quantised roof tier per cell: clean flat tiers instead of lidar noise
const tierOf = (gr, rf) => {
  const k = Math.max(1, Math.round((rf - gr) / 4));
  return gr + 4 * k;
};

for (const [x, z, gr0, rf0] of cells) {
  const gr = clamp(Math.round(gr0), 0, H - 5);
  const top = clamp(tierOf(gr, Math.round(rf0)), gr + 4, H - 2);
  const outs = outsOf(x, z);
  const per = outs.length > 0;
  const corner = outs.length > 1;

  // Foundation from y0 to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Along-face index and inward direction (single-face cells)
  let along = 0, inx = 0, inz = 0;
  if (per && !corner) {
    const [ox, oz] = outs[0];
    along = ox !== 0 ? z : x;
    inx = -ox;
    inz = -oz;
  }
  const inwardCell = per && !corner && has(x + inx, z + inz) &&
    outsOf(x + inx, z + inz).length === 0;

  // Entrance and its flanking surround
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z;
  const nearEntrance = entrance && per && !corner && !isEntrance &&
    Math.abs(x - entrance[0]) === 1 && z === entrance[1];

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const s = Math.floor(rel / 4);

    // Parapet cap and cornice band
    if (y === top - 1) {
      if (per) g.set(x, y, z, "bricks");
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top - 2 && per) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Floor bands (string courses on the face, solid slabs inside)
    if (rel % 4 === 0) {
      g.set(x, y, z, per ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Interior: air gap, no rooms
    if (!per) continue;

    const row = rel % 4; // 1,2 glazing; 3 spandrel

    // Entrance door, lintel and stone portal
    if (isEntrance && !corner) {
      if (row === 1 || row === 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: FACE[`${outs[0][0]},${outs[0][1]}`] ?? "north",
          half: row === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (nearEntrance && (row === 1 || row === 2 || row === 3)) {
      g.set(x, y, z, row === 3 ? "smooth_quartz" : "stone_bricks");
      continue;
    }

    // Corners and spandrels stay solid brick, with a stone sill line
    if (corner || row === 3) {
      g.set(x, y, z, "bricks");
      continue;
    }

    // Window bays on alternate piers
    if (along % 2 === 1) {
      g.set(x, y, z, "glass_pane");
      // Warm light in the air gap behind some panes
      if (row === 2 && inwardCell && (along + s) % 3 === 0) {
        g.set(x + inx, y, z + inz, "glowstone");
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Roof plant: two small mechanical units, not one monolith
  const plant =
    (x >= 3 && x <= 4 && z >= 2 && z <= 3) ||
    (x >= 10 && x <= 11 && z >= 5 && z <= 6);
  if (!per && plant && top + 2 <= H) {
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
