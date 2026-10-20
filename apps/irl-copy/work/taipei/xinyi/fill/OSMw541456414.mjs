import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456414";
const W = 17, H = 23, D = 10;

// Footprint: [x, z, ground] per cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Missing neighbours of a footprint cell: n = z-1, s = z+1, w = x-1, e = x+1.
function faceList(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("n");
  if (!inside(x, z + 1)) f.push("s");
  if (!inside(x - 1, z)) f.push("w");
  if (!inside(x + 1, z)) f.push("e");
  return f;
}

// Ground-floor slab level: one level above the highest ground under the footprint,
// so every storey is flat and every cell is supported below it.
const maxG = Math.max(...cells.map((c) => c[2]));
const B = maxG + 1;
const ROOF_SLAB = B + 10;
const PARAPET = B + 11;
if (PARAPET >= H) throw new Error(`Parapet at y=${PARAPET} exceeds grid height ${H}`);

// Door: middle of the south (z+1) street-facing wall, non-corner cells only.
const southCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => {
    const f = faceList(x, z);
    return f.length === 1 && f[0] === "s";
  })
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;

// Foundation, floor slabs and roof deck.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < B; y++) {
    g.set(x, y, z, y <= gr ? "stone" : "stone_bricks");
  }
  for (const f of [B, B + 5, ROOF_SLAB]) {
    g.set(x, f, z, "smooth_stone");
  }
}

// Facade, corners, parapet, doors and warm lights.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const faces = faceList(x, z);
  if (faces.length === 0) {
    // Interior: rooftop equipment and lanterns on the roof deck.
    if (x % 4 === 2 && z % 3 === 1) {
      g.set(x, PARAPET, z, "iron_block");
    } else if (x % 5 === 2 && z % 4 === 1) {
      g.set(x, PARAPET, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    continue;
  }

  // Corner pillar.
  if (faces.length >= 2) {
    for (let y = B + 1; y <= B + 9; y++) g.set(x, y, z, "white_concrete");
    g.set(x, PARAPET, z, "smooth_quartz");
    g.set(x, B + 10, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  const face = faces[0];
  const along = face === "n" || face === "s" ? x : z;
  const bay = along % 3 === 1; // window bay; every third cell is a pier
  const glassProps = (face === "n" || face === "s")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  const isDoor = face === "s" && x === doorX;

  // Ground storey (B+1 plinth, B+2..B+3 shopfront, B+4 lintel).
  if (isDoor) {
    const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
    g.set(x, B + 1, z, "dark_oak_door", { ...dp, half: "lower" });
    g.set(x, B + 2, z, "dark_oak_door", { ...dp, half: "upper" });
    g.set(x, B + 3, z, "smooth_quartz");
  } else {
    g.set(x, B + 1, z, "stone_bricks");
    for (const y of [B + 2, B + 3]) {
      if (bay) g.set(x, y, z, "glass_pane", glassProps);
      else g.set(x, y, z, "white_concrete");
    }
  }
  g.set(x, B + 4, z, "smooth_quartz");

  // Belt course at the top of storey one.
  g.set(x, B + 5, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Upper storey (B+6 spandrel, B+7..B+8 windows, B+9 lintel).
  g.set(x, B + 6, z, "smooth_quartz");
  for (const y of [B + 7, B + 8]) {
    if (bay) g.set(x, y, z, "glass_pane", glassProps);
    else g.set(x, y, z, "white_concrete");
  }
  g.set(x, B + 9, z, "smooth_quartz");

  // Cornice and parapet.
  g.set(x, B + 10, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, PARAPET, z, "smooth_quartz");

  // Warm light behind some windows: glowstone on the floor just inside the glass.
  if (bay && !isDoor && along % 6 === 1) {
    const ix = face === "w" ? x + 1 : face === "e" ? x - 1 : x;
    const iz = face === "n" ? z + 1 : face === "s" ? z - 1 : z;
    if (inside(ix, iz) && faceList(ix, iz).length === 0) {
      g.set(ix, B + 1, iz, "glowstone");
      g.set(ix, B + 6, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
