import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459507";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Palette: white tiled 1990s commercial block, blue-tinted glazing, black frames, quartz storey lines.
const PIER = "white_concrete";
const BASE = "stone_bricks";
const FND = "stone";
const LINE = "smooth_quartz";
const FRAME = "black_concrete";
const GLS = "light_blue_stained_glass_pane";
const SLAB = "light_gray_concrete";
const ROOF = "smooth_stone";
const SIGN = "red_terracotta";
const MECH = "light_gray_concrete";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function place(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which exterior face a perimeter cell belongs to (z faces take corners).
function faceOf(x, z) {
  if (!has(x, z)) return null;
  if (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z)) {
    if (!has(x, z - 1)) return "N";   // street face, z = 0
    if (!has(x, z + 1)) return "S";
    if (!has(x - 1, z)) return "W";
    return "E";
  }
  return null;
}

function glassProps(f) {
  return (f === "N" || f === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Returns [blockId, props?] for a perimeter cell at storey-relative height yr (0 = ground slab).
function facade(f, x, z, yr) {
  const street = f === "N";
  const along = f === "N" || f === "S";
  const u = along ? x : z;
  const n = along ? W : D;

  if (yr === 0) return [BASE];
  if (yr === 5 || yr === 10) return [LINE];
  if (yr === 11) return [PIER];
  if (u === 0 || u === n - 1) return [PIER];

  if (street) {
    if (yr === 4) return u === 3
      ? ["lantern", { hanging: "true", waterlogged: "false" }]
      : [SIGN];
    if (yr <= 3) {
      if (u === 3 && yr <= 2) {
        return ["dark_oak_door", {
          facing: "north",
          half: yr === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        }];
      }
      return [GLS, glassProps(f)];
    }
    if (yr === 9) return [FRAME];
    // upper storey on street face: mullions at u=3,4
    if (u === 3 || u === 4) return [FRAME];
    return [GLS, glassProps(f)];
  }

  // Non-street faces: piers every third bay.
  if (u % 3 === 0) return [PIER];
  if (yr === 4 || yr === 9) return [FRAME];
  return [GLS, glassProps(f)];
}

// Pass 1: foundations, floors, facades, roof deck.
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const gr = gnd(x, z);

  for (let y = 0; y < gr; y++) place(x, y, z, FND);

  const f = faceOf(x, z);
  if (!f) {
    place(x, gr, z, SLAB);
    place(x, gr + 5, z, SLAB);
    place(x, gr + 10, z, ROOF);
  } else {
    for (let yr = 0; yr <= 11; yr++) {
      const [id, props] = facade(f, x, z, yr);
      place(x, gr + yr, z, id, props);
    }
  }
}

// Pass 2: warm glowstone just inside some upper-storey windows (dusk glow).
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const f = faceOf(x, z);
  if (!f) continue;
  const along = f === "N" || f === "S";
  const u = along ? x : z;
  if (u % 6 !== 1) continue;
  const [ix, iz] = f === "N" ? [x, z + 1]
    : f === "S" ? [x, z - 1]
    : f === "W" ? [x + 1, z]
    : [x - 1, z];
  if (!has(ix, iz) || faceOf(ix, iz)) continue;
  const yg = gnd(ix, iz) + 7;
  place(ix, yg, iz, "glowstone");
}

// Pass 3: roof plant on the roof deck of the top storey (two-cell box plus a lightning-rod mast).
for (const [x, z] of [[2, 10], [3, 10], [2, 11], [3, 11]]) {
  if (!has(x, z) || faceOf(x, z)) continue;
  place(x, gnd(x, z) + 11, z, MECH);
}
if (has(5, 13) && !faceOf(5, 13)) {
  const gr = gnd(5, 13);
  for (let y = 11; y <= 14; y++) {
    place(5, gr + y, 13, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
