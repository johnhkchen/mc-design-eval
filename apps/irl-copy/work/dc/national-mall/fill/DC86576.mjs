import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86576.cells.json`, "utf8"));

const W = 14, H = 27, D = 22;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> { gr: ground, ro: roof top }
const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const [x, z, gr, ro] of cells) {
  cellMap.set(key(x, z), {
    gr: Math.max(0, Math.round(gr)),
    ro: Math.min(16, Math.max(4, Math.round(ro))),
  });
}
const has = (x, z) => cellMap.has(key(x, z));

// 1920s Classical Revival office block in buff limestone (calcite), stone-brick base,
// four storeys of 4 blocks (floor line / two-high window band / spandrel),
// stone-brick cornice, calcite parapet, and one set-back central penthouse.
const FRONT_Z = D - 1;
const ENTRANCE_X = 6;

// Penthouse footprint (interior only): set back from the facade on all sides
const PH = { x0: 4, x1: 9, z0: 6, z1: 15, h: 2 };
const inPenthouse = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;

for (const [x, z] of [...cellMap.keys()].map(k => k.split(",").map(Number))) {
  const { gr, ro } = cellMap.get(key(x, z));

  const missing = {
    xp: !has(x + 1, z),
    xm: !has(x - 1, z),
    zp: !has(x, z + 1),
    zm: !has(x, z - 1),
  };
  const perim = missing.xp || missing.xm || missing.zp || missing.zm;
  const corner = (missing.xp || missing.xm) && (missing.zp || missing.zm);
  const xFace = (missing.xp || missing.xm) && !(missing.zp || missing.zm);
  const zFace = (missing.zp || missing.zm) && !(missing.xp || missing.xm);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Base course / ground floor slab
  g.set(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // Storeys
  for (let y = gr + 1; y <= ro - 2; y++) {
    const rel = y - gr;
    const band = rel % 4;

    if (!perim) {
      if (band === 0) {
        g.set(x, y, z, "smooth_stone");
      } else if (band === 2 && x % 3 === 1 && z % 3 === 1) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    if (y === ro - 2) {
      g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    if (band === 0 || band === 3 || corner) {
      g.set(x, y, z, "calcite");
      continue;
    }

    // Entrance door on the south face, flanked by a solid pilaster
    if (zFace && missing.zp && x === ENTRANCE_X && z === FRONT_Z && rel <= 2) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (zFace && missing.zp && x === ENTRANCE_X + 1 && rel <= 2) {
      g.set(x, y, z, "calcite");
      continue;
    }

    // Window bays alternate with pilasters
    if ((x + z) % 2 === 1) {
      const alongX = xFace;
      g.set(x, y, z, "glass_pane", {
        north: alongX ? "true" : "false",
        south: alongX ? "true" : "false",
        east: alongX ? "false" : "true",
        west: alongX ? "false" : "true",
        waterlogged: "false",
      });
    } else {
      g.set(x, y, z, "calcite");
    }
  }

  // Roof deck and parapet
  const roofTop = ro - 1;
  g.set(x, roofTop, z, perim ? "calcite" : "smooth_stone");

  // Central penthouse: one clean set-back mass on the roof deck
  if (!perim && inPenthouse(x, z)) {
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let h = 0; h < PH.h; h++) {
      const y = ro + h;
      if (y > H - 2) break;
      g.set(x, y, z, edge ? "calcite" : "air");
      if (edge && h === PH.h - 1 && (x + z) % 2 === 0) {
        // Small lit window in the penthouse wall
        g.set(x, y, z, "glass_pane", {
          north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
        });
      }
    }
    // Penthouse cap
    const capY = ro + PH.h;
    g.set(x, capY, z, edge ? "stone_brick_slab" : "stone_brick_slab",
      edge ? { type: "top", waterlogged: "false" } : { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86576.nbt`);
