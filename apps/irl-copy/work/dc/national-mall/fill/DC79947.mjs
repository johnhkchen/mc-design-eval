import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79947.cells.json`, "utf8"));

const W = 20, H = 32, D = 24;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const cm = new Map();
for (const [x, z, gr, rf] of cells) cm.set(`${x},${z}`, { g: gr, r: rf });
const has = (x, z) => cm.has(`${x},${z}`);

// ---- massing: common floor datum and flat storey count ----------------
// Stone-clad Beaux-Arts office block on Pennsylvania Ave: 3-block storeys,
// rusticated base, pale limestone piers and spandrels, glazed bays,
// a flat roof with a stepped parapet and a central penthouse core.
const fb = Math.max(...cells.map(c => c[2]));          // floor datum = highest ground under footprint
const nMax = Math.min(7, Math.floor((26 - fb) / 3));    // leave room for penthouse + parapet below H
const raws = cells.map(c => Math.round((c[3] - fb) / 3)).sort((a, b) => a - b);
const nAll = Math.min(nMax, Math.max(2, raws[Math.floor(raws.length / 2)]));
const T = fb + 3 * nAll;                                // roof level (top of walls)

// penthouse core: 2 blocks tall on the roof, only if there is headroom
const PH_H = 2;
const hasPenthouse = T + PH_H + 1 < H;

const inRect = (x, z, x0, x1, z0, z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

// ---- per-cell build -----------------------------------------------------
for (const [x, z, gr] of cells) {
  // outward faces (neighbour missing from footprint)
  const faces = [];
  if (!has(x - 1, z)) faces.push({ ox: -1, oz: 0 });
  if (!has(x + 1, z)) faces.push({ ox: 1, oz: 0 });
  if (!has(x, z - 1)) faces.push({ ox: 0, oz: -1 });
  if (!has(x, z + 1)) faces.push({ ox: 0, oz: 1 });
  const edge = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces[0];

  // foundation and plinth: solid from y0 up to the common datum
  for (let y = 0; y < fb; y++) g.set(x, y, z, "polished_andesite");

  // ---- storeys ----
  for (let y = fb; y < T; y++) {
    const s = Math.floor((y - fb) / 3);
    const o = (y - fb) % 3;

    if (!edge) {
      // interior: floor slabs and roof deck only (air behind glass)
      if (o === 0) g.set(x, y, z, "smooth_stone");
      if (y === T - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // ---- perimeter ----
    if (o === 0) {
      // rusticated base course on the ground storey, pale spandrels above
      g.set(x, y, z, s === 0 ? "stone_bricks" : "calcite");
      continue;
    }

    const idx = face && face.ox !== 0 ? z : x;
    const alongX = face && face.oz !== 0;          // face runs east-west (north/south faces)

    // Main entrance, centred on the north (z=0) face: stone surround,
    // double doors, lintel band above the door
    const onNorth = !corner && face && face.oz === -1;
    if (onNorth && s === 0 && x >= 8 && x <= 11) {
      if (o === 1 || o === 2) {
        if (x === 9 || x === 10) {
          const hinge = x === 9 ? "left" : "right";
          g.set(x, fb + 1, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge, open: "false", powered: "false"
          });
          g.set(x, fb + 2, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge, open: "false", powered: "false"
          });
        } else {
          g.set(x, y, z, "polished_andesite");   // door jambs
        }
      }
      continue;
    }
    if (onNorth && s === 1 && x >= 8 && x <= 11 && o === 0) {
      // lintel course over the entrance (sits on the door jamb band)
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Window band (o = 1, 2): piers at corners and every second bay
    if (corner || idx % 2 === 0) {
      g.set(x, y, z, "calcite");
    } else {
      const alongZ = face && face.ox !== 0; // pane runs north-south on east/west faces
      g.set(x, y, z, "glass_pane", alongZ
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

      // warm light behind some glass, in the room just inside
      if (o === 1 && (idx + s) % 4 === 1 && face) {
        const ix = x - face.ox, iz = z - face.oz;
        if (has(ix, iz)) g.set(ix, y, iz, "shroomlight");
      }
    }
  }

  // ---- roof: stepped parapet on the perimeter, penthouse core on the roof ----
  if (edge) {
    const pier = corner || (face && (face.ox !== 0 ? z : x) % 2 === 0);
    if (pier) {
      g.set(x, T, z, "smooth_stone");
    } else {
      g.set(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  } else if (hasPenthouse && inRect(x, z, 7, 12, 9, 14)) {
    // penthouse: calcite walls, glazed core, flat cap
    const pe = x === 7 || x === 12 || z === 9 || z === 14;
    for (let k = 0; k < PH_H; k++) {
      const yy = T + k;
      if (pe) {
        g.set(x, yy, z, "calcite");
      } else if (k === 0) {
        g.set(x, yy, z, "smooth_stone");
      }
    }
    g.set(x, T + PH_H, z, "smooth_stone");
  }
}

g.save(`${DIR}/DC79947.nbt`);
