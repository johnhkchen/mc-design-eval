import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Late-1980s Xinyi-style commercial block: five storeys of pale tiled cladding,
// grey concrete sill and spandrel bands, glazed bays on a 3-block mullion rhythm,
// a stone base with a shopfront ground floor, a parapet cornice and a rooftop penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245233";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 34, H = 38, D = 16;
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);

const ROOF = 25;   // roof slab level (top of fifth storey)
const TOP = 27;    // parapet cap level

function faces(x, z) {
  return { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
}

for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const perim = f.N || f.S || f.W || f.E;
  const corner = (f.N || f.S) && (f.W || f.E);

  // Which facade this cell belongs to, its position along it, and the inward direction
  let u, face, inward;
  if (f.N || f.S) {
    u = x;
    face = f.N ? "n" : "s";
    inward = f.N ? [0, 1] : [0, -1];
  } else {
    u = z;
    face = f.W ? "w" : "e";
    inward = f.W ? [1, 0] : [-1, 0];
  }

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    if (y === ROOF) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y > ROOF) {
      if (perim) {
        if (y === TOP) g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
        else g.set(x, y, z, "smooth_quartz");
      }
      continue;
    }

    const k = Math.floor(y / 5);
    const ly = y % 5;

    if (!perim) {
      // Interior: only a floor slab per storey, otherwise air
      if (ly === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter facade
    if (ly === 0) {
      g.set(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (ly === 4) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // ly 1..3: mullions or glazing
    if (corner || u % 3 === 0) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Entrance on the south face, ground storey
    if (k === 0 && face === "s" && u === 16 && (ly === 1 || ly === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: ly === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    g.set(x, y, z, "light_blue_stained_glass");

    // Warm light behind some upper-storey glazing, in the air gap inside
    if (k >= 1 && ly === 2 && (u + k) % 4 === 0) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz)) g.set(ix, y, iz, "shroomlight");
    }
  }
}

// Rooftop penthouse on the interior core
for (let x = 13; x <= 20; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    const edge = x === 13 || x === 20 || z === 5 || z === 10;
    if (edge) {
      g.set(x, 26, z, "smooth_quartz");
      g.set(x, 28, z, "smooth_quartz");
      if ((x + z) % 3 === 0) g.set(x, 27, z, "white_concrete");
      else g.set(x, 27, z, "light_blue_stained_glass");
    }
    g.set(x, 29, z, "light_gray_concrete");
  }
}

// Plant and AC units on the roof
for (let x = 3; x <= 5; x++) {
  for (let z = 3; z <= 4; z++) {
    if (!has(x, z)) continue;
    g.set(x, 26, z, "iron_block");
    g.set(x, 27, z, "iron_block");
  }
}

// Antenna on the penthouse
if (has(16, 7)) {
  for (let y = 30; y <= 32; y++) g.set(16, y, 7, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
