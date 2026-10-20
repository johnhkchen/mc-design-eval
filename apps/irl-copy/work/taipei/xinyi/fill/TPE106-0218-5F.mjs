import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE106-0218-5F: 2017 mid-rise commercial block in Xinyi, Taipei.
// Five storeys of 5 blocks on a flat roof. White-concrete frame with projecting
// mullions, glazing recessed one block behind the frame, granite plinth, shopfront
// ground storey with a central recessed entrance and lintel.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE106-0218-5F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 38, D = 6;
const g = new Voxels([W, H, D]);

const has = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const minG = Math.min(...cells.map((c) => c[2]));
const T = minG + 26; // flat roof level, absolute y

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

for (const [x, z, gc] of cells) {
  const isEnd = !has(x - 1, z) || !has(x + 1, z);
  const front = z === 0;
  const back = z === D - 1;
  const facade = front || back;
  // Depth: street-side frame at z=0, glazing at z=1; back frame at z=5, glazing at z=4.
  const frameZ = front ? 0 : D - 1;
  const frameZ2 = front ? 1 : D - 2;   // second frame layer (fins)
  const glassZ = front ? 1 : D - 2;
  const lampZ = front ? 2 : D - 3;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Floor rows: slab every 5 blocks, counted down from the roof.
  const floors = [];
  for (let f = T - 5; f > gc; f -= 5) floors.push(f);
  floors.sort((a, b) => a - b);
  const rows = [gc, ...floors, T];

  // Plinth / base course at ground.
  put(x, gc, z, facade ? "polished_granite" : "smooth_stone");

  // Floor slabs at each storey line: light grey throughout, spandrel on facades.
  for (let i = 1; i < rows.length - 1; i++) {
    put(x, rows[i], z, "light_gray_concrete");
  }

  // Window bands.
  for (let i = 0; i < rows.length - 1; i++) {
    const lo = rows[i];
    const hi = rows[i + 1];
    const ground = i === 0;

    if (isEnd) {
      // End cells: solid bearing wall, no glazing.
      for (let y = lo + 1; y <= hi - 1; y++) {
        for (let fz = 0; fz < D; fz++) put(x, y, fz, "white_concrete");
      }
      continue;
    }

    for (let y = lo + 1; y <= hi - 1; y++) {
      const mullion = x % 3 === 0;
      if (mullion) {
        // Projecting fin: two blocks deep on the facade, so the grid reads in relief.
        put(x, y, frameZ, "white_concrete");
        put(x, y, frameZ2, "white_concrete");
      } else {
        // Recessed glazing one block behind the frame.
        put(x, y, glassZ, ground ? "glass" : "light_blue_stained_glass");
        // Warm lamps just behind the glass, in some bays.
        if ((x + i * 2) % 7 === 3 && y === lo + 2) {
          put(x, y, lampZ, "glowstone");
        }
      }
    }

    // Storey soffit line over the glazing so the recess has a head.
    if (!ground) {
      for (let fz = 0; fz < D; fz++) {
        if (fz === 0 || fz === D - 1) put(x, hi, fz, "light_gray_concrete");
      }
    }
  }

  // Central entrance on the street front: recessed door, lintel and canopy.
  if (x === 13 && front) {
    const lo = rows[0];
    const hi = rows[1];
    if (hi - lo - 1 >= 3) {
      put(x, lo + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, lo + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      // Lintel and canopy band over the recess.
      for (const cx of [12, 13, 14]) {
        put(cx, lo + 3, 0, "white_concrete");
        put(cx, lo + 3, 1, "white_concrete");
      }
      put(12, lo + 2, 0, "stone_bricks");
      put(14, lo + 2, 0, "stone_bricks");
      put(13, lo + 3, 2, "lantern", { hanging: "true" });
    }
  }

  // Roof: cap slab; parapet on the facades.
  for (let fz = 0; fz < D; fz++) {
    put(x, T, fz, facade && (fz === 0 || fz === D - 1) ? "white_concrete" : "light_gray_concrete");
  }
  if (facade) put(x, T + 1, z, "white_concrete");

  // Roof plant: a central service block with a small cupola.
  if (x >= 11 && x <= 15) {
    for (const rz of [2, 3]) put(x, T + 1, rz, "light_gray_concrete");
  }
  if (x >= 12 && x <= 14) {
    for (const rz of [2, 3]) put(x, T + 2, rz, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
