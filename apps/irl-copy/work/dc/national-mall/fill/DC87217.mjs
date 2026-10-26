import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87217.cells.json`, "utf8"));

// 19 x 11 footprint: early-20th-century Neoclassical limestone office block.
// Granite base, stone cornice, recessed glass entrance on the street face (z = 0),
// 3-block storeys, one flat main roof with a setback penthouse.
const W = 19, H = 31, D = 11;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map(c => c[2]));
const key = (x, z) => `${x},${z}`;
const C = new Map();

// Pass 1: massing from lidar, quantised to 3-block storeys.
for (const c of cells) {
  const x = c[0], z = c[1];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.round(c[2] - minG);
  const rf = Math.round(c[3] - minG);
  const rel = Math.max(0, rf - gr);
  const tops = Math.min(27, gr + Math.min(24, Math.max(6, Math.round(rel / 3) * 3)));
  C.set(key(x, z), { x, z, gr, top: tops, per: false });
}

// Pass 1b: snap the roof to clean flat tiers. Cells within 3 blocks of the dominant
// roof level take that level; only genuine setbacks keep their own height.
const tally = new Map();
for (const cell of C.values()) tally.set(cell.top, (tally.get(cell.top) || 0) + 1);
const mainTop = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
for (const cell of C.values()) {
  if (Math.abs(cell.top - mainTop) <= 3) cell.top = mainTop;
}

// Pass 2: perimeter flags.
for (const cell of C.values()) {
  const { x, z } = cell;
  cell.per = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !C.has(key(x + dx, z + dz)));
}

const DOOR_X = 9;

// Pass 3: build.
for (const cell of C.values()) {
  const { x, z, gr, top } = cell;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const onX = z === 0 || z === D - 1;     // facade runs along x
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const idx = onX ? x : z;
  const inward = onX ? (z === 0 ? 1 : -1) : (x === 0 ? 1 : -1);

  if (cell.per) {
    for (let y = gr; y <= top; y++) {
      const r = y - gr;
      const street = z === 0;

      // Street entrance: recessed door with lanterns either side.
      if (street && x === DOOR_X && r <= 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: r === 0 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (street && (x === 8 || x === 10) && r === 2) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        continue;
      }
      if (street && x >= 6 && x <= 12 && (r === 1 || r === 2)) {
        g.set(x, y, z, "glass");
        continue;
      }
      // Entrance pilasters carry a stone lintel over the door.
      if (street && x >= 7 && x <= 11 && r === 3) {
        g.set(x, y, z, "smooth_stone");
        continue;
      }

      let blk, props;
      if (y === top) {
        blk = "calcite";                                  // parapet
      } else if (r === 0) {
        blk = "polished_granite";                         // base course
      } else if (y === top - 1) {
        blk = "smooth_stone";                             // cornice
      } else if (r % 3 === 0) {
        blk = "smooth_stone";                             // storey band
      } else if (corner || idx % 2 === 0) {
        blk = "calcite";                                  // pier
      } else {
        blk = "glass_pane";
        props = onX
          ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      }
      g.set(x, y, z, blk, props);

      // Warm light behind a few windows.
      if (blk === "glass_pane" && r === 1 && ((x * 3 + z * 5) % 7 === 0)) {
        const ix = onX ? x : x + inward;
        const iz = onX ? z + inward : z;
        const inner = C.get(key(ix, iz));
        if (inner && !inner.per) g.set(ix, y, iz, "glowstone");
      }
    }
  } else {
    // Interior: floor slabs per storey, roof deck, air elsewhere.
    for (let y = gr; y <= top - 1; y++) {
      const r = y - gr;
      if (y === top - 1 || r === 0 || (r % 3 === 0 && r > 0)) g.set(x, y, z, "smooth_stone");
    }
  }
}

// Pass 4: setback mechanical penthouse on the main roof.
const penTop = mainTop;
if (penTop <= 24) {
  let all = true;
  for (let xx = 6; xx <= 12; xx++) for (let zz = 3; zz <= 7; zz++) if (!C.has(key(xx, zz))) all = false;
  if (all) {
    for (let x = 6; x <= 12; x++) for (let z = 3; z <= 7; z++) {
      const ring = x === 6 || x === 12 || z === 3 || z === 7;
      for (let y = penTop; y <= penTop + 1; y++) {
        if (ring) g.set(x, y, z, "smooth_quartz");
        else if (z === 5 && (x === 8 || x === 10)) {
          g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
        }
      }
      g.set(x, penTop + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/DC87217.nbt`);
