import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Champlain (Orme) Building, 1424 K St NW: early-20th-century commercial office block.
// Brick body, calcite trim, smooth stone floor bands and cornice, glass-pane window bays,
// a central entrance on each street face with a lantern hood, corner pilasters,
// setback tiers quantised to storeys, and a small rooftop mechanical box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86606.cells.json`, "utf8"));

const W = 7, H = 29, D = 20;
const STOREY = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr0, rf0] = c;
  const gr = Math.round(gr0);
  const rf = Math.round(rf0);
  // Quantise the lidar roof into whole storeys, at least two storeys tall, kept under the sheet.
  const tiers = Math.max(2, Math.round((rf - gr) / STOREY));
  const top = Math.min(gr + tiers * STOREY, H - 4);
  cellMap.set(key(x, z), { gr, top: Math.max(gr + 2, top) });
}
const has = (x, z) => cellMap.has(key(x, z));
const topOf = (x, z) => (cellMap.has(key(x, z)) ? cellMap.get(key(x, z)).top : -1);
const clampY = (v) => Math.max(0, Math.min(H - 1, v));

const dirs = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const facing = { N: "north", S: "south", W: "west", E: "east" };

// A face is exposed at height y if there is no footprint neighbour, or the neighbour's
// roof is at or below y (so this wall stands above the neighbour as a visible party wall).
function faces(x, z, y) {
  const f = [];
  for (const F of ["N", "S", "W", "E"]) {
    const [dx, dz] = dirs[F];
    const t = topOf(x + dx, z + dz);
    if (t < 0 || t <= y) f.push(F);
  }
  return f;
}

let maxTop = 0;
for (const [, v] of cellMap) if (v.top > maxTop) maxTop = v.top;

// Pass 1: foundations, floor slabs, cornice, walls, pilasters and openings.
for (const [k, v] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const { gr, top } = v;

  for (let y = 0; y < gr; y++) g.set(x, clampY(y), z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const m = rel % STOREY;
    const ext = faces(x, z, y);
    const isExt = ext.length > 0;

    // Cornice: a double course at the top of every tier.
    if (y === top - 1) {
      g.set(x, y, z, isExt ? "calcite" : "smooth_stone");
      continue;
    }
    if (y === top - 2 && isExt) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    // Floor slab / spandrel band at every storey line, interior included.
    if (m === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!isExt) continue;

    const corner = ext.length >= 2 && (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
    if (corner) {
      g.set(x, y, z, "calcite");
      continue;
    }

    if (m === 3) {
      g.set(x, y, z, "calcite");
      continue;
    }

    // Window rows (m = 1 or 2) on the primary exposed face.
    const F = ext[0];
    const isNS = F === "N" || F === "S";
    const along = isNS ? x : z;
    const len = isNS ? W : D;
    const mid = Math.floor(len / 2);
    const storey = Math.floor(rel / STOREY);
    const windowBay = along % 2 === 1 && along > 0 && along < len - 1;
    const doorBay = storey === 0 && along === mid && (F === "N" || F === "S" || F === "W" || F === "E");

    if (doorBay) {
      g.set(x, y, z, "oak_door", {
        facing: facing[F],
        half: m === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (windowBay) {
      const props = isNS
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", props);
    } else {
      g.set(x, y, z, "calcite");
    }
  }
}

// Pass 2: parapets on the outer boundary, entrance hoods, and lanterns behind windows.
for (const [k, v] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const { gr, top } = v;

  // Parapet and cap where the roof edge is exposed.
  if (faces(x, z, top).length > 0) {
    if (top < H - 2) g.set(x, top, z, "bricks");
    if (top + 1 < H) g.set(x, top + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // Entrance hood: a hanging lantern under the storey slab above each door.
  for (const F of ["N", "S", "W", "E"]) {
    const [dx, dz] = dirs[F];
    if (topOf(x + dx, z + dz) >= 0) continue;
    const isNS = F === "N" || F === "S";
    const along = isNS ? x : z;
    const len = isNS ? W : D;
    if (along === Math.floor(len / 2) && top > gr + STOREY + 2) {
      g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // Lanterns in interior air directly behind some window bays.
  for (let rel = 1; rel < top - gr; rel++) {
    if (rel % STOREY !== 1) continue;
    const y = gr + rel;
    const ext = faces(x, z, y);
    if (ext.length === 0) continue;
    const F = ext[0];
    const isNS = F === "N" || F === "S";
    const along = isNS ? x : z;
    const len = isNS ? W : D;
    const storey = Math.floor(rel / STOREY);
    const windowBay = along % 2 === 1 && along > 0 && along < len - 1;
    if (!windowBay || (along + storey) % 3 !== 0) continue;
    const [dx, dz] = dirs[F];
    const ix = x - dx, iz = z - dz; // one block inward from the wall
    if (!has(ix, iz)) continue;
    const ti = topOf(ix, iz);
    if (ti <= y + 1) continue;
    if (faces(ix, iz, y).length > 0) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop mechanical box on the tallest tier, where the footprint covers it.
for (const [k, v] of cellMap) {
  if (v.top !== maxTop) continue;
  const [x, z] = k.split(",").map(Number);
  if (x < 2 || x > 4 || z < 7 || z > 12) continue;
  if (maxTop + 2 < H) {
    g.set(x, maxTop, z, "bricks");
    g.set(x, maxTop + 1, z, "bricks");
    g.set(x, maxTop + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86606.nbt`);
