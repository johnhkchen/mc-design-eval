import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC79892";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 26, H = 29, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const raw = new Map();
for (const c of cells) {
  raw.set(key(c[0], c[1]), { gr: Math.round(c[2]), roof: c[3] });
}
const inside = (x, z) => raw.has(key(x, z));

// Smooth lidar noise: median roof height over each 3x3 neighbourhood,
// then quantise to whole 3-block office storeys above the cell's own ground.
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const map = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const n = raw.get(key(x + dx, z + dz));
      if (n) near.push(n.roof);
    }
  }
  const roofMed = median(near);
  let nStor = Math.round((roofMed - v.gr) / 3);
  nStor = Math.max(2, Math.min(6, nStor));
  let top = v.gr + 3 * nStor;
  if (top > H - 3) top = H - 3;
  map.set(k, { g: v.gr, t: top });
}

// Street face: minimum-z row of the footprint.
let minZ = Infinity;
for (const c of cells) minZ = Math.min(minZ, c[1]);
const entranceX = [12, 13];

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [k, { g: gr, t: T }] of map) {
  const [x, z] = k.split(",").map(Number);
  const edge = !(inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1));
  const isFront = edge && z === minZ;
  const bay = x + z; // position along any facade

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const r = y - gr;

    // Roof cornice lip on the top course.
    if (y === T - 1) {
      if (edge) set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      else set(x, y, z, "smooth_stone");
      continue;
    }

    if (!edge) {
      if (r === 0) set(x, y, z, "polished_granite");
      else if (r % 3 === 0) set(x, y, z, "white_concrete");
      continue;
    }

    // Facade cells.
    if (r === 0) {
      set(x, y, z, "polished_granite"); // base course
      continue;
    }
    if (r % 3 === 0) {
      // Spandrel band, with a tighter course directly under the top lip.
      set(x, y, z, "white_concrete");
      continue;
    }

    // Entrance: doors flanked by granite jambs on the street face.
    if (isFront && (r === 1 || r === 2)) {
      if (entranceX.includes(x)) {
        const hinge = x === entranceX[0] ? "left" : "right";
        set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge,
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (x === entranceX[0] - 1 || x === entranceX[1] + 1) {
        set(x, y, z, "polished_granite");
        continue;
      }
    }

    // Piers every eighth bay give the facade vertical rhythm.
    if (bay % 8 === 0) {
      set(x, y, z, "stone_bricks");
    } else if (bay % 2 === 0) {
      set(x, y, z, "light_gray_concrete"); // mullion
    } else if ((x * 5 + y * 3) % 29 === 0 && r > 1) {
      set(x, y, z, "glowstone"); // occasional warm lit office
    } else {
      set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Roof plant: a penthouse block centred on the roof, standing on the cap.
  if (!edge && x >= 9 && x <= 16 && z >= 5 && z <= 11 && T + 2 <= H) {
    set(x, T, z, "light_gray_concrete");
    set(x, T + 1, z, "smooth_stone");
  }
}

// Granite lintel above the entrance.
for (const x of entranceX) {
  if (inside(x, minZ)) {
    const { g: gr, t: T } = map.get(key(x, minZ));
    if (gr + 3 < T - 1) set(x, gr + 3, minZ, "polished_granite");
  }
}

g.save(`${DIR}/${ID}.nbt`);
