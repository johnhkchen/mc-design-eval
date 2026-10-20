import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw381755216.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw381755216.nbt";

const W = 102, H = 33, D = 91;
const ROOF = 21;                 // roof deck / cornice top, above lowest ground
const SLABS = [5, 10, 15, 20];   // floor lines: four storeys of ~5 blocks
const GLASS_PANE = "light_blue_stained_glass_pane";
const STOREY_LO = [6, 11, 16];   // first row of each upper window zone

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
const list = [];
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const k = x + "," + z;
  if (ground.has(k)) continue;
  ground.set(k, Math.max(0, Math.min(Math.round(gr), ROOF - 1)));
  list.push([x, z]);
}
const has = (x, z) => ground.has(x + "," + z);
const gnd = (x, z) => ground.get(x + "," + z);

// outward facing of an edge cell (null = interior)
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
// one step inward from an edge
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const paneProps = (dir) =>
  dir === "north" || dir === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// entrance: centre of the north facade
const northXs = list.filter(([x, z]) => outward(x, z) === "north").map(([x]) => x);
const doorX = northXs.length ? Math.round((Math.min(...northXs) + Math.max(...northXs)) / 2) : -1;

// 1. foundation: solid from y 0 up to each cell's ground
for (const [x, z] of list) {
  const gc = gnd(x, z);
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
}

// 2. interior: ground floor, floor slabs per storey, roof deck (air gap behind glass)
for (const [x, z] of list) {
  if (outward(x, z)) continue;
  const gc = gnd(x, z);
  g.set(x, gc, z, "smooth_stone");
  for (const s of SLABS) g.set(x, s, z, "light_gray_concrete");
  g.set(x, ROOF, z, "smooth_stone");
}

// 3. facade: base course, darker piers, light spandrels, window sills and heads,
//    framed entrance, warm lights behind windows
const lights = [];
for (const [x, z] of list) {
  const dir = outward(x, z);
  if (!dir) continue;
  const gc = gnd(x, z);
  const t = dir === "north" || dir === "south" ? x : z;
  const isDoorCol = dir === "north" && x === doorX;
  const isDoorSide = dir === "north" && (x === doorX - 1 || x === doorX + 1);

  for (let y = gc; y <= ROOF; y++) {
    let b = null, props;

    if (y === ROOF) {
      b = "white_concrete";                                   // cornice cap
    } else if (y === ROOF - 1) {
      b = "stone_bricks";                                     // cornice band (shadow line)
    } else if (SLABS.includes(y)) {
      b = "white_concrete";                                   // storey line
    } else if (y === gc) {
      b = "stone_bricks";                                     // base course
    } else if (y <= 4 && gc <= 3 && isDoorCol && (y === gc + 1 || y === gc + 2)) {
      b = "dark_oak_door";                                    // entrance door
      props = {
        facing: "north",
        half: y === gc + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      };
    } else if (y === gc + 3 && gc <= 3 && isDoorCol) {
      b = "stone_bricks";                                     // entrance lintel
    } else if (y <= 4 && gc <= 3 && isDoorSide && (y === gc + 1 || y === gc + 2)) {
      b = "stone_bricks";                                     // entrance jambs
    } else if (t % 4 === 0) {
      b = "stone_bricks";                                     // dark pier, reads as a fin
    } else {
      // window bay: sill at bottom row, head at top row, glass between
      const zone = STOREY_LO.find((lo) => y >= lo - 1 && y <= lo + 3);
      const isSill = zone !== undefined && y === zone - 1;
      const isHead = zone !== undefined && y === zone + 3;
      if (isSill || isHead) {
        b = "white_concrete";
      } else if (y === gc + 0 || (y <= 4 && y >= gc + 1 && (y === gc + 1))) {
        b = GLASS_PANE;                                       // shopfront glass
        props = paneProps(dir);
      } else {
        b = GLASS_PANE;
        props = paneProps(dir);
      }
    }

    g.set(x, y, z, b, props);
  }

  // warm light behind windows, a bit more frequent for dusk
  for (const lo of STOREY_LO) {
    const y = lo + 1;
    if (y < gc || y > ROOF) continue;
    if (t % 6 === 2 || (t % 6 === 4 && y % 2 === 0)) {
      const [ix, iz] = INWARD[dir];
      if (has(x + ix, z + iz) && !outward(x + ix, z + iz)) {
        lights.push([x + ix, y, z + iz, (t + y) % 4 === 0 ? "shroomlight" : "glowstone"]);
      }
    }
  }
}
for (const [x, y, z, b] of lights) g.set(x, y, z, b);

// 4. rooftop: a stepped plant block and cooling towers on the roof deck
for (const [x, z] of list) {
  if (outward(x, z)) continue;
  // plant room, two tiers
  if (x >= 28 && x <= 52 && z >= 28 && z <= 46) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
  if (x >= 34 && x <= 46 && z >= 34 && z <= 40) {
    g.set(x, ROOF + 3, z, "stone_bricks");
    g.set(x, ROOF + 4, z, "stone_bricks");
  }
  // cooling towers
  if (x >= 60 && x <= 66 && z >= 20 && z <= 26) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "iron_block");
  }
}

g.save(OUT);
