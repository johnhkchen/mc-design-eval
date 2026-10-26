import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87267.cells.json`, "utf8"));

// Decatur House (1818, Federal style): red brick walls, pale stone trim,
// stone foundation, two storeys over a stone plinth, cornice and flat roof,
// dark-wood entrance door on the street (north) face.
const W = 7, D = 7, H = 18;
const g = new Voxels([W, H, D]);

const BRICK = "bricks";
const TRIM = "quartz_block";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";

for (const c of cells) {
  const [x, z, grRaw, rrRaw] = c;
  const gl = Math.round(grRaw);
  // Roof value is height above y0 (blocks 0..roof-1 are solid), so top course is roof-1.
  const t = Math.max(Math.round(rrRaw) - 1, gl + 5);
  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gl; y++) g.set(x, y, z, BASE);

  if (!perimeter) {
    // Interior: air, with floor slabs per storey and a flat roof slab.
    g.set(x, gl + 1, z, FLOOR);
    g.set(x, gl + 3, z, FLOOR);
    g.set(x, t, z, FLOOR);
    // Warm light just inside the ground-floor windows.
    if (z === 1 && (x === 2 || x === 4)) g.set(x, gl + 2, z, "glowstone");
    if (z === D - 2 && (x === 2 || x === 4)) g.set(x, gl + 2, z, "glowstone");
    if (x === 1 && (z === 2 || z === 4)) g.set(x, gl + 2, z, "glowstone");
    if (x === W - 2 && (z === 2 || z === 4)) g.set(x, gl + 2, z, "glowstone");
    continue;
  }

  // Perimeter walls, gl+1 .. t-1.
  const onFrontOrBack = z === 0 || z === D - 1;
  const i = onFrontOrBack ? x : z;
  const isCorner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const isBay = i === 1 || i === 2 || i === 4 || i === 5;
  const isFront = z === 0;
  const isDoor = isFront && x === 3;

  for (let y = gl + 1; y <= t - 1; y++) {
    if (isCorner) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    else g.set(x, y, z, BRICK);
  }

  if (!isCorner && isBay) {
    // Ground-storey windows (two rows), upper-storey windows above the belt course.
    g.set(x, gl + 1, z, GLASS);
    g.set(x, gl + 2, z, GLASS);
    for (let y = gl + 4; y <= t - 1; y++) g.set(x, y, z, GLASS);
  }

  // String course between storeys.
  if (gl + 3 <= t - 1) g.set(x, gl + 3, z, TRIM);

  // Entrance: dark-wood door in the central pier of the street face, with a marble lintel.
  if (isDoor) {
    g.set(x, gl + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gl + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gl + 3, z, TRIM);
  }

  // Cornice: half-block lip on the wall top, flat roof behind it.
  g.set(x, t, z, "quartz_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/DC87267.nbt`);
