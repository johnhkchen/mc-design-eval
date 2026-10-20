import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883596";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Ground per cell, normalised so the lowest ground under the footprint is y 0.
const key = (x, z) => `${x},${z}`;
const rawMin = Math.min(...cells.map(([, , gr]) => Math.round(gr)));
const groundOf = new Map();
for (const [x, z, gr] of cells) {
  const v = Math.max(0, Math.min(8, Math.round(gr) - rawMin));
  groundOf.set(key(x, z), v);
}
const has = (x, z) => groundOf.has(key(x, z));
const gAt = (x, z) => groundOf.get(key(x, z));

// Which sides of a cell face outside the footprint.
const faces = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const SLAB = "smooth_stone";

const paneProps = (f) =>
  (f.n || f.s)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: classify perimeter cells and decide bays (glass in odd bays, white mullions in even).
const bayCells = new Map(); // key -> { inward: [x,z] } for glass cells
for (const [kx, gr] of groundOf) {
  const [x, z] = kx.split(",").map(Number);
  const f = faces(x, z);
  const per = f.n || f.s || f.w || f.e;
  if (!per) continue;
  const corner = (f.n || f.s) && (f.w || f.e);
  if (corner) continue;
  const bay = (f.n || f.s) ? x % 2 === 1 : z % 2 === 1;
  if (!bay) continue;
  let inward = null;
  if (f.n) inward = [x, z + 1];
  else if (f.s) inward = [x, z - 1];
  else if (f.w) inward = [x + 1, z];
  else if (f.e) inward = [x - 1, z];
  bayCells.set(kx, { inward });
}

// Pass 2: fill every cell column.
for (const [kx, gr] of groundOf) {
  const [x, z] = kx.split(",").map(Number);
  const f = faces(x, z);
  const per = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.w || f.e);
  const bay = per && !corner && bayCells.has(kx);

  for (let y = 0; y <= 12; y++) {
    // Foundation: solid from y 0 up to this cell's ground.
    if (y < gr) {
      g.set(x, y, z, FOUND);
      continue;
    }

    if (!per) {
      // Interior: floor at ground level, floor slabs at storey lines, deck at y 10.
      if (y === gr) { g.set(x, y, z, SLAB); continue; }
      if (y === 5 || y === 10) { g.set(x, y, z, SLAB); continue; }
      // Roof plant on the deck.
      if (y === 11 && x >= 3 && x <= 5 && z >= 4 && z <= 6) {
        g.set(x, y, z, BAND);
        continue;
      }
      if (y === 12 && x === 4 && z === 5) {
        g.set(x, y, z, WALL);
        continue;
      }
      // Entrance lantern just inside the south door.
      if (y === gr + 1 && x === 4 && z === 11 && gr <= 2) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        continue;
      }
      // Warm light behind an upper-storey window.
      if (y === 7 && bayCells.size && isGlowTarget(x, z)) {
        g.set(x, y, z, "glowstone");
        continue;
      }
      continue; // air
    }

    // Perimeter.
    if (y === 5 || y === 10) { g.set(x, y, z, BAND); continue; }
    if (y === 11) { g.set(x, y, z, WALL); continue; } // parapet

    if (y >= 6 && y <= 9) {
      if (bay) {
        if (y === 6) g.set(x, y, z, BAND);            // sill
        else if (y === 9) g.set(x, y, z, WALL);       // head
        else g.set(x, y, z, GLASS, paneProps(f));     // glazing
      } else {
        g.set(x, y, z, WALL);
      }
      // Glowstone behind glass is placed by the interior pass.
      continue;
    }

    // Ground floor, y < 5 and y >= gr.
    if (y === 4) { g.set(x, y, z, WALL); continue; }   // shopfront header
    if (y === gr) { g.set(x, y, z, BASE); continue; }   // granite base course

    // Entrance door on the south (street) face.
    if (f.s && x === 4 && gr <= 1 && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (bay) g.set(x, y, z, GLASS, paneProps(f));
    else g.set(x, y, z, WALL);
  }
}

function isGlowTarget(x, z) {
  for (const { inward } of bayCells.values()) {
    if (inward && inward[0] === x && inward[1] === z && (x + z) % 2 === 0) return true;
  }
  return false;
}

g.save(`${DIR}/${ID}.nbt`);
