import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0197-11F: 2003 Xinyi office/mixed-use slab, 11 storeys (~5 blocks each),
// roof at y 54 above the lowest ground. Glass and white precast concrete curtain wall
// with light-grey spandrels, polished granite base, lobby on the north face.

const W = 36, H = 66, D = 25;
const ROOF = 54;

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0197-11F.cells.json", "utf8")
);

const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const S = (x, y, z, b, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const facadeOf = (x, z) => ({
  n: !has(x, z - 1), // outward -z
  s: !has(x, z + 1), // outward +z
  w: !has(x - 1, z), // outward -x
  e: !has(x + 1, z), // outward +x
});
const isFacade = (x, z) => {
  const f = facadeOf(x, z);
  return f.n || f.s || f.w || f.e;
};

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const f = facadeOf(x, z);
  const facade = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.w || f.e);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // Walls, slabs and articulation from ground up to the roof
  for (let y = gr; y < ROOF; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (!facade) {
      // interior: air gap, floor slab at each storey line
      if (r === 0) S(x, y, z, "light_gray_concrete");
      continue;
    }

    if (corner) {
      S(x, y, z, r === 0 && k === 0 ? "polished_granite" : "white_concrete");
      continue;
    }

    // Facade orientation: outward normal, along-axis index, inward offset
    let along, dx, dz, paneProps;
    if (f.n) { along = x; dx = 0; dz = 1; paneProps = paneNS; }
    else if (f.s) { along = x; dx = 0; dz = -1; paneProps = paneNS; }
    else if (f.w) { along = z; dx = 1; dz = 0; paneProps = paneEW; }
    else { along = z; dx = -1; dz = 0; paneProps = paneEW; }

    const mullion = along % 3 === 0;
    const entranceZone = f.n && k === 0 && x >= 16 && x <= 19;

    if (entranceZone) {
      if (x === 18 && r === 0) {
        S(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (x === 18 && r === 1) {
        S(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (r === 4) {
        S(x, y, z, "light_gray_concrete"); // canopy lintel over the entrance
      } else if (r === 0) {
        S(x, y, z, "polished_granite");
      } else if (r === 3 && (x === 16 || x === 19)) {
        S(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); // lit under the canopy
      } else {
        S(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Cornice course under the parapet
    if (y === ROOF - 1) {
      S(x, y, z, "smooth_stone");
      continue;
    }

    if (r === 0) {
      S(x, y, z, k === 0 ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (r === 4) {
      S(x, y, z, "light_gray_concrete");
      continue;
    }

    // r = 1..3: glazing band with white mullions every 3 blocks
    if (mullion) {
      S(x, y, z, "white_concrete");
    } else {
      S(x, y, z, "light_blue_stained_glass_pane", paneProps);
      // warm light behind some panes, in the interior cell just inside the facade
      if (r === 2 && (along + k * 2) % 5 === 0) {
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !isFacade(ix, iz)) S(ix, y, iz, "glowstone");
      }
    }
  }

  // Parapet and roof slab
  if (facade) {
    S(x, 55, z, "white_concrete");
    S(x, 56, z, "white_concrete");
  }
  if (gr <= ROOF) S(x, ROOF, z, "light_gray_concrete");
}

// Roof plant room, centred on the roof
for (let x = 12; x <= 23; x++) {
  for (let z = 9; z <= 15; z++) {
    if (!has(x, z)) continue;
    const edge = x === 12 || x === 23 || z === 9 || z === 15;
    for (let y = 55; y <= 58; y++) {
      if (y === 58) S(x, y, z, "light_gray_concrete");
      else if (edge) {
        const louver = (y === 56 || y === 57) && (x + z) % 2 === 0;
        if (louver) S(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
        else S(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// Mast on the plant room
if (has(17, 12)) {
  for (let y = 59; y <= 61; y++) {
    S(17, y, 12, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0197-11F.nbt");
