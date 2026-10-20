import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw539951874";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Record: 18 x 12 footprint, roof ~11 above lowest ground. Read as a two-storey
// 1980s-90s Taipei commercial block: stone base, quartz-tile walls, tinted
// aluminium-framed glazing, a shopfront with a central door on the street (z=0)
// side, a coping parapet, a roof penthouse and a rooftop water tank.
const W = 18, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const FRONT_Z = 0;      // street side
const BACK_Z = D - 1;
const DOOR_X = 8;

for (const [x, z, gr] of cells) {
  const edgeW = !has(x - 1, z) || !has(x + 1, z);
  const edgeN = !has(x, z - 1) || !has(x, z + 1);
  const perimeter = edgeW || edgeN;
  const front = z === FRONT_Z;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Slabs: ground floor, storey-2 floor, roof. Solid across all cells so
  // nothing hangs; interior air is left between them.
  put(x, gr, z, perimeter ? "polished_granite" : "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, "smooth_stone");

  if (perimeter) {
    // Along-wall index for bay rhythm.
    const t = (z === FRONT_Z || z === BACK_Z) ? x : z;
    const pillar = corner || (t % 3 === 0);
    const interiorFace = { x: 0, z: 0 };
    if (z === FRONT_Z) interiorFace.z = 1;
    else if (z === BACK_Z) interiorFace.z = -1;
    else if (x === 0) interiorFace.x = 1;
    else if (x === W - 1) interiorFace.x = -1;

    for (let h = 1; h <= 10; h++) {
      const y = gr + h;
      let block = "smooth_quartz";
      if (pillar) block = "stone_bricks";

      // Storey 1 glazing (non-front sides) at h2..3; front shopfront h1..3.
      if (!pillar) {
        if (front && h >= 1 && h <= 3 && !(x === DOOR_X)) block = "light_blue_stained_glass";
        if (!front && h >= 2 && h <= 3) block = "light_blue_stained_glass";
        // Storey 2 glazing h7..8 on every face.
        if (h >= 7 && h <= 8) block = "light_blue_stained_glass";
      }

      // Door at the centre of the street front.
      if (front && x === DOOR_X && (h === 1 || h === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: h === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      // Transom/lintel above door.
      if (front && x === DOOR_X && h === 3) block = "dark_oak_planks";

      // Storey-2 sill and lintel bands read as frames around glazing.
      if (!pillar && (h === 6 || h === 9)) block = "stone_bricks";

      put(x, y, z, block);
    }

    // Shopfront canopy band over the street front.
    if (front && x >= 6 && x <= 10 && x !== DOOR_X) {
      put(x, gr + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }

    // Coping on the parapet.
    put(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    // Warm lights inside, behind some storey-2 windows.
    if (!pillar && !corner && (t % 6 === 2) && (interiorFace.x || interiorFace.z)) {
      const ix = x + interiorFace.x, iz = z + interiorFace.z;
      if (has(ix, iz)) {
        put(ix, gr + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// Roof penthouse on the back half (x 3..6, z 7..9).
for (let x = 3; x <= 6; x++) {
  for (let z = 7; z <= 9; z++) {
    if (!has(x, z)) continue;
    const gr = ground.get(`${x},${z}`);
    const edge = x === 3 || x === 6 || z === 7 || z === 9;
    for (let h = 11; h <= 12; h++) {
      if (edge) {
        const glassy = h === 11 && (z === 9 || x === 6) && !((x + z) % 2);
        put(x, gr + h, z, glassy ? "light_blue_stained_glass" : "smooth_quartz");
      }
    }
    put(x, gr + 13, z, "smooth_stone");
  }
}

// Rooftop water tank (x 12..13, z 2..3) with a cap.
for (let x = 12; x <= 13; x++) {
  for (let z = 2; z <= 3; z++) {
    if (!has(x, z)) continue;
    const gr = ground.get(`${x},${z}`);
    for (let h = 11; h <= 12; h++) put(x, gr + h, z, "iron_block");
    put(x, gr + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
