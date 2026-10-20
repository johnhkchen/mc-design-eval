import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1079113.cells.json`, "utf8"));

const W = 8, H = 24, D = 8;
const g = new Voxels([W, H, D]);

// ---- footprint map: key "x,z" -> { gr, top } ----
const map = new Map();
for (const [x, z, gr0, roof0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(H - 4, Math.round(gr0)));
  let top = Math.min(H - 1, Math.round(roof0));
  top = Math.max(top, gr + 4);
  map.set(`${x},${z}`, { gr, top: Math.min(top, H - 1) });
}
const has = (x, z) => map.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z));

// Global storey lines: ground storey ceiling Gs, then every 2 blocks.
let Gs = 0;
for (const { gr } of map.values()) Gs = Math.max(Gs, gr + 2);

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassPaneProps = (face) =>
  (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// ---- pass 1: structure per cell ----
for (const [key, { gr, top }] of map) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // Interior: floor slabs on storey lines, roof deck, air elsewhere (room behind glass).
    for (let L = Gs; L <= top - 2; L += 2) {
      if (L >= gr) set(x, L, z, "smooth_stone");
    }
    set(x, top - 1, z, "smooth_stone");

    // Roof equipment: a small stair-stepped bulkhead on one interior roof cell.
    if (x === 5 && z === 2 && top + 1 < H) {
      set(x, top, z, "stone_bricks");
      set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter: pick the primary outward face.
  let face;
  if (!has(x, z - 1)) face = "N";
  else if (!has(x, z + 1)) face = "S";
  else if (!has(x - 1, z)) face = "W";
  else face = "E";
  const idx = (face === "N" || face === "S") ? x : z;

  const isPier = idx === 0 || idx === 7 || idx % 2 === 0;
  const isWindow = !isPier;
  const isDoor = face === "S" && idx === 3;

  for (let y = gr; y <= top - 1; y++) {
    if (y === top - 1) {
      // Cornice cap: half slab so the parapet reads as a separate course.
      set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (y === top - 2) {
      // Cornice band under the cap.
      set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === gr) {
      // Base course, door lower half
      if (isDoor) {
        set(x, y, z, "oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else {
        set(x, y, z, "stone_bricks");
      }
      continue;
    }
    if (y < Gs) {
      // Ground storey shopfront
      if (isDoor && y === gr + 1) {
        set(x, y, z, "oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (isWindow) {
        set(x, y, z, "glass");
        if (idx === 3 && y === gr + 1) {
          const [dx, dz] = inward[face];
          if (has(x + dx, z + dz) && !isPerim(x + dx, z + dz)) {
            set(x + dx, y, z + dz, "glowstone");
          }
        }
      } else {
        set(x, y, z, "polished_deepslate");
      }
      continue;
    }
    // Upper storeys: belt course on each storey line, brick between,
    // window row one block above each line.
    const rel = (y - Gs) % 2;
    if (rel === 0) {
      // Storey belt course: stone band reads clearly from the air.
      set(x, y, z, "stone_bricks");
    } else if (isWindow && y <= top - 2) {
      set(x, y, z, "glass_pane", glassPaneProps(face));
      const storey = Math.floor((y - Gs) / 2);
      if (idx === 3 && storey % 2 === 0) {
        const [dx, dz] = inward[face];
        if (has(x + dx, z + dz) && !isPerim(x + dx, z + dz)) {
          set(x + dx, y, z + dz, "shroomlight");
        }
      }
    } else {
      set(x, y, z, "bricks");
    }
  }
}

// Entrance lintel: a stone band over the door opening on the south face.
for (const [key, { gr }] of map) {
  const [x, z] = key.split(",").map(Number);
  if (z === D - 1 && x === 3 && isPerim(x, z)) {
    const ly = gr + 2;
    if (ly < Gs) set(x, ly, z, "stone_bricks");
  }
}

g.save(`${DIR}/NYC1079113.nbt`);
