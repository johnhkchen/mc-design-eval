import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541459078";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Per-cell ground (third number), clamped so the building stays inside the volume.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}
const gnd = (x, z) => ground.get(`${x},${z}`) ?? 0;

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Levels (absolute, lowest ground = 0):
//  storey 1: y 0..4 (floor slab at ground, lintel at 4)
//  storey 2: y 5..9 (floor line at 5, cornice at 9)
//  roof deck: y 10 (top face at 11), roof plant on top
const ROOF = 10;
const FLOOR2 = 5;
const CORNICE = 9;
const LINTEL = 4;

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = gnd(x, z);
  const facade = x === 0 || x === W - 1;
  const end = z === 0 || z === D - 1;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (!facade && !end) {
      // Interior: air gap, with floor slabs per storey.
      if (y === gr || y === FLOOR2) put(x, y, z, "smooth_stone");
      continue;
    }
    if (end) {
      // Solid end walls with base course and cornice.
      if (y === gr) put(x, y, z, "stone_bricks");
      else if (y === CORNICE) put(x, y, z, "polished_andesite");
      else if (y === FLOOR2) put(x, y, z, "smooth_stone");
      else put(x, y, z, "white_concrete");
      continue;
    }
    // Street / long facades (x = 0 and x = W-1).
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
    if (y === CORNICE) { put(x, y, z, "polished_andesite"); continue; }
    if (y === FLOOR2 || y === LINTEL) { put(x, y, z, "white_concrete"); continue; }
    if (z % 4 === 0) { put(x, y, z, "white_concrete"); continue; } // pilasters
    if (z % 4 === 2) { put(x, y, z, "white_concrete"); continue; } // mullions

    // Ground-floor shopfront / storey 1 glazing.
    if (y < LINTEL) {
      // Entrance on the x = 0 facade at z = 13.
      if (x === 0 && z === 13 && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "west", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      put(x, y, z, "glass");
      continue;
    }
    // Storey 2 windows.
    put(x, y, z, "light_blue_stained_glass");
  }

  // Roof plant box on the x = 1..2, z = 17..19 block.
  if (x >= 1 && x <= 2 && z >= 17 && z <= 19 && gr <= ROOF) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// Warm lights behind the glazing (interior air cells next to the glass).
for (let z = 1; z < D - 1; z++) {
  if (z % 4 === 0 || z % 4 === 2) continue;
  // Storey 1 lanterns, behind the x = 0 and x = 3 glazing.
  for (const x of [1, 2]) {
    const gr = gnd(x === 1 ? 0 : 3, z);
    const ly = gr + 1;
    if (ly <= 3 && z % 8 === (x === 1 ? 1 : 5)) {
      put(x, ly, z, "lantern", { hanging: "false" });
    }
  }
  // Storey 2 shroomlights behind the upper glazing.
  if (z % 8 === 5) {
    put(1, 7, z, "shroomlight");
  }
  if (z % 8 === 1) {
    put(2, 7, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
