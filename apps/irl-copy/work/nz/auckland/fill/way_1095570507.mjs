// A two-storey brick shop-house with a cream quartz cornice, the kind of 1920s commercial building that fills the
// Newton and Eden Terrace shopping streets. Footprint 10 x 9 from the cells file; lidar roof at 11 blocks above y 0,
// so the top block is y 10 (cornice and roof deck) and the roof surface is at 11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095570507.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([10, 24, 9]);

const ROOF = Math.max(...cells.map((c) => c[3]));   // lidar roof height above y 0: 11
const TOP = ROOF - 1;                               // the highest block of the building
const FLOOR2 = 6;                                   // storey line and first-floor slab
const onFootprint = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // z- is north, z+ south
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !onFootprint(x + DIRS[d][0], z + DIRS[d][1]));
const isWall = (x, z) => exposed(x, z).length > 0;
const bay = (x, z) => (x + z) % 2 === 1;             // window bays alternate along every facade

const paneState = (ex) => (ex[0] === "N" || ex[0] === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// 1. Foundation and base course: solid from y 0 up to each cell's ground, then a stone-brick plinth at y 1 everywhere,
//    so the ground floor sits on one level (y 2) and nothing floats on the slope.
for (const [x, z, ground] of cells) {
  for (let y = 0; y <= ground; y++) g.set(x, y, z, y === 0 ? "stone" : "stone_bricks");
  g.set(x, 1, z, "stone_bricks");
}

// 2. Interior: a floor slab per storey and a roof deck; the rest is air (the glass has an air gap behind it).
for (const [x, z] of cells) {
  if (isWall(x, z)) continue;
  g.set(x, FLOOR2, z, "oak_planks");
  g.set(x, TOP, z, "smooth_stone");
}

// 3. Walls, one block thick, on the perimeter cells. Storey 1 is a shopfront on the south faces with a dark fascia;
//    storey 2 has bays of windows with quartz lintels; quartz string courses at the storey lines; the cornice closes
//    the top. (No quoins: on the staircased outline most wall cells have two open faces, so a corner rule swallows the
//    brick.)
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const shop = ex.includes("S");
  const bayWin = bay(x, z);

  for (let y = 2; y <= TOP; y++) {
    if (y <= 4) {
      if (shop) g.set(x, y, z, "glass_pane", paneState(ex));
      else if (bayWin && y >= 3) g.set(x, y, z, "glass_pane", paneState(ex));
      else g.set(x, y, z, "bricks");
    } else if (y === 5) {
      g.set(x, y, z, shop ? "dark_oak_planks" : "smooth_quartz");
    } else if (y === FLOOR2) {
      g.set(x, y, z, "smooth_quartz");
    } else if (y <= 8) {
      g.set(x, y, z, bayWin ? "glass_pane" : "bricks", bayWin ? paneState(ex) : undefined);
    } else if (y === 9) {
      g.set(x, y, z, bayWin ? "smooth_quartz" : "bricks");
    } else {
      g.set(x, y, z, "smooth_quartz");   // cornice
    }
  }
}

// 4. The shop door, in the middle of the south frontage: a dark oak door at y 2-3, a glass transom above it, and a
//    half-block step out front (a bottom slab), so the 1-block rise from the street to the floor is walkable.
const door = cells.find(([x, z]) => exposed(x, z).join() === "S");
if (door) {
  const [x, z] = door;
  g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, 4, z, "glass_pane", paneState(["S"]));
  g.set(x, 1, z + 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  // canopy over the shopfront, cantilevered from the fascia on the front cells
  for (const [sx, sz] of cells) {
    if (sz === z && exposed(sx, sz).join() === "S") g.set(sx, 5, sz + 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  // a lantern inside, behind the shopfront glass
  g.set(x, 2, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// 5. Warm light: lanterns on the ground floor, glowstone behind some upper windows (interior cell inward of the bay).
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (!ex.length || ex.length > 1 || !bay(x, z) || ex.includes("S")) continue;
  const [dx, dz] = DIRS[ex[0]];
  const ix = x - dx, iz = z - dz;
  if (!onFootprint(ix, iz) || isWall(ix, iz)) continue;
  if ((x * 3 + z) % 4 === 0) g.set(ix, 7, iz, "glowstone");
  else if ((x * 3 + z) % 4 === 2) g.set(ix, 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

const info = g.save(`${DIR}/way_1095570507.nbt`);
console.log(`way_1095570507: ${info.blocks} blocks, palette ${info.palette}`);
