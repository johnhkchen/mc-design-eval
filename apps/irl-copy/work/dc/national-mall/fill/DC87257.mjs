import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87257.cells.json`, "utf8"));

const W = 7, H = 29, D = 14;
const MAXY = H - 1;
const g = new Voxels([W, H, D]);

const BRICK = "bricks";
const TRIM = "smooth_quartz";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const COPING = "stone_brick_slab";
const GLASS = "glass_pane";

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const cellMap = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.max(0, Math.round(c[2]));
  let top = Math.round(c[3]);
  top = Math.min(MAXY, Math.max(top, gr + 4));
  cellMap.set(`${x},${z}`, { x, z, gr, top });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const exposure = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isExterior = (x, z) => {
  const e = exposure(x, z);
  return e.n || e.s || e.w || e.e;
};

const lights = [];

for (const cell of cellMap.values()) {
  const { x, z, gr, top } = cell;
  const e = exposure(x, z);
  const exterior = e.n || e.s || e.w || e.e;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  if (!exterior) {
    // Interior cell: floor slabs per storey and a roof deck; air elsewhere.
    put(x, gr, z, FLOOR);
    for (let rel = 4; gr + rel < top - 1; rel += 4) put(x, gr + rel, z, FLOOR);
    put(x, top - 1, z, FLOOR);
    // Roof equipment: mechanical units on the deck.
    if (x === 3 && (z === 4 || z === 9)) put(x, top, z, "iron_block");
    continue;
  }

  const zFace = e.n || e.s;
  const xFace = e.w || e.e;
  const corner = zFace && xFace;
  const doorCell = e.s && x === 3 && z === 13;

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;

    // Roof coping above the cornice.
    if (y === top) {
      put(x, y, z, COPING, { type: "bottom", waterlogged: "false" });
      continue;
    }
    // Cornice band.
    if (y === top - 1) {
      put(x, y, z, TRIM);
      continue;
    }
    // Base course.
    if (rel === 0) {
      put(x, y, z, BASE);
      continue;
    }
    // Corner quoins: alternating stone and quartz blocks for relief.
    if (corner) {
      put(x, y, z, rel % 2 === 0 ? BASE : TRIM);
      continue;
    }
    // Storey band (sill line).
    if (rel % 4 === 0) {
      put(x, y, z, TRIM);
      continue;
    }

    // Window bay classification.
    let win = false;
    if (zFace && x % 2 === 1) win = true;                       // x = 1, 3, 5
    if (xFace && z % 2 === 0 && z >= 2 && z <= 12) win = true;  // even z

    // Entrance on the south face, centre bay.
    if (doorCell && (rel === 1 || rel === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    // Hanging lantern over the door.
    if (doorCell && rel === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    // Flanking piers of the entrance.
    if (e.s && (x === 2 || x === 4) && z === 13 && (rel === 1 || rel === 2 || rel === 3)) {
      put(x, y, z, TRIM);
      continue;
    }

    if (win && (rel % 4 === 1 || rel % 4 === 2)) {
      const paneProps = zFace
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, GLASS, paneProps);
      // Warm light behind some glass, on the first floor of the window.
      if (rel % 4 === 1 && (z + rel) % 3 === 0) {
        let ix = 0, iz = 0;
        if (e.n) iz = 1;
        else if (e.s) iz = -1;
        else if (e.w) ix = 1;
        else if (e.e) ix = -1;
        const tx = x + ix, tz = z + iz;
        if (has(tx, tz) && !isExterior(tx, tz)) lights.push([tx, y, tz]);
      }
      continue;
    }
    if (win && rel % 4 === 3) {
      put(x, y, z, TRIM); // lintel
      continue;
    }
    put(x, y, z, BRICK);
  }
}

// Interior lights placed last so no cell pass overwrites them.
for (const [lx, ly, lz] of lights) put(lx, ly, lz, "shroomlight");

g.save(`${DIR}/DC87257.nbt`);
