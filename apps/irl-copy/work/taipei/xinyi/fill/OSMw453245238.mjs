import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245238";
const W = 70, H = 76, D = 18;
const ROOF_Y = 64;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: key "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const FRAME = "light_gray_concrete";
const SPAND = "white_concrete";
const ROOFC = "light_gray_concrete";
const CANOPY = "smooth_stone";
const LIGHT = "glowstone";

// pass 1: envelope and floors, per footprint cell
for (const [x, z, gr] of cells) {
  const G = Math.round(gr);
  const facade = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const longFace = z === 0 || z === D - 1;
  const southFace = z === D - 1;

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, FOUND);

  // storeys: floors at absolute multiples of 5, windows between, spandrel at +4
  for (let y = G; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) { g.set(x, y, z, ROOFC); continue; }

    if (y > 60) {
      // parapet band above top storey
      if (facade) g.set(x, y, z, SPAND);
      continue;
    }

    const k = Math.floor(y / 5);
    const o = y - 5 * k;

    if (o === 0) {
      // floor slab (also at y=0 is foundation, skipped by y>=G rule)
      if (y > 0) g.set(x, y, z, SLAB);
      continue;
    }

    if (!facade) continue; // interior: air gap, floor slab only

    if (longFace) {
      if (o === 4) {
        g.set(x, y, z, SPAND);
        continue;
      }
      // window band o = 1..3
      const isGround = k === 0;
      const mullion = x % 3 === 0;
      if (isGround && southFace && x >= 33 && x <= 37) {
        // entrance: glazed doorway, recessed lobby
        g.set(x, y, z, "tinted_glass");
      } else if (isGround && o === 1 && !mullion) {
        g.set(x, y, z, "tinted_glass"); // shopfront glass base
      } else {
        g.set(x, y, z, mullion ? FRAME : GLASS);
      }
      // warm light behind some windows (interior air cell next to facade)
      const inner = z === 0 ? 1 : D - 2;
      if (o === 2 && !mullion && ((x * 7 + k * 3) % 5 === 0) && has(x, inner)) {
        g.set(x, y, inner, LIGHT);
      }
    } else {
      // end walls: white concrete with a central glazed strip
      if (o === 4) { g.set(x, y, z, SPAND); continue; }
      const strip = z >= 7 && z <= 10;
      g.set(x, y, z, strip ? GLASS : SPAND);
    }
  }
}

// pass 2: entrance canopy and lobby light on the south street face
for (let x = 32; x <= 38; x++) {
  if (has(x, D - 1) && ground.get(`${x},${D - 1}`) < 5) {
    g.set(x, 4, D - 1, CANOPY);
  }
}
if (has(35, D - 2)) g.set(35, 2, D - 2, "shroomlight");

// pass 3: roof penthouse with louvred walls and a mast
for (let x = 27; x <= 42; x++) {
  for (let z = 5; z <= 12; z++) {
    if (!has(x, z)) continue;
    const edge = x === 27 || x === 42 || z === 5 || z === 12;
    for (let y = 65; y <= 66; y++) {
      if (edge) g.set(x, y, z, (y === 65 && x % 2 === 0) ? "iron_bars" : SPAND);
    }
    g.set(x, 67, z, ROOFC);
  }
}
if (has(35, 8)) {
  for (let y = 68; y <= 73; y++) g.set(35, y, 8, "iron_bars");
  g.set(35, 74, 8, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
