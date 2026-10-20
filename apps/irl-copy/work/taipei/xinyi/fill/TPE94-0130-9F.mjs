import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE94-0130-9F: 2005 Xinyi-district mid-rise, 9 storeys (5 blocks each, roof slab at y 45).
// Light tiled concrete frame, blue glazing in a 3-block pier rhythm with alternating bay tones,
// a quartz base course with cyan shopfront glass, a framed entrance under a dark canopy,
// a parapet, and a central roof penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0130-9F";
const W = 26, D = 108, H = 57;
const ROOF_Y = 45;
const PARAPET_TOP = 47;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  return f;
}

const PANE_X_FACE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z_FACE = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: foundations, floor slabs, facades, parapet, penthouse.
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const edge = fs.length > 0;

  let along = 0, maxAlong = 0, paneProps = null, inward = [0, 0];
  if (edge) {
    if (fs.includes("w") || fs.includes("e")) {
      along = z; maxAlong = D - 1; paneProps = PANE_X_FACE;
      inward = fs.includes("w") ? [1, 0] : [-1, 0];
    } else {
      along = x; maxAlong = W - 1; paneProps = PANE_Z_FACE;
      inward = fs.includes("n") ? [0, 1] : [0, -1];
    }
  }

  for (let y = gc; y <= ROOF_Y; y++) {
    const slab = y % 5 === 0 || y === gc;
    if (slab) {
      g.set(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (!edge) continue;

    const pier = along % 3 === 0 || along === 0 || along === maxAlong;
    const bay = Math.floor(along / 3);
    const baseCourse = y < gc + 5;

    if (baseCourse) {
      // Quartz base course with cyan shopfront glass between piers.
      g.set(x, y, z, pier ? "smooth_quartz" : "cyan_stained_glass");
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      // Alternate glass tone by bay for a visible rhythm.
      const pane = bay % 2 === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
      g.set(x, y, z, pane, paneProps);
      if (y % 5 === 2 && along % 6 === 1) {
        const ix = x + inward[0], iz = z + inward[1];
        if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    }
  }

  if (edge) {
    for (let y = ROOF_Y + 1; y <= PARAPET_TOP; y++) g.set(x, y, z, "white_concrete");
  } else if (x >= 9 && x <= 16 && z >= 45 && z <= 62) {
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) g.set(x, y, z, "light_gray_concrete");
  }
}

// Pass 2: framed entrance on the east face, dark canopy, posts, lantern.
if (has(25, 54)) {
  const gc = gr(25, 54);
  // Quartz door surround, two blocks either side, up to the canopy line.
  for (const zz of [52, 53, 55, 56]) {
    if (!has(25, zz)) continue;
    const c = gr(25, zz);
    for (let y = c + 1; y <= c + 3; y++) g.set(25, y, zz, "smooth_quartz");
  }
  g.set(25, gc + 1, 54, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(25, gc + 2, 54, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(25, gc + 3, 54, "smooth_quartz");
}

// Dark canopy over the entrance, cantilevered from two posts.
for (let z = 51; z <= 57; z++) {
  for (let x = 23; x <= 25; x++) {
    if (!has(x, z)) continue;
    g.set(x, gr(x, z) + 3, z, "black_concrete");
  }
}

for (const z of [51, 57]) {
  if (!has(23, z)) continue;
  const gc = gr(23, z);
  for (let y = gc; y <= gc + 2; y++) g.set(23, y, z, "black_concrete");
}

if (has(24, 54)) {
  g.set(24, gr(24, 54) + 2, 54, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
