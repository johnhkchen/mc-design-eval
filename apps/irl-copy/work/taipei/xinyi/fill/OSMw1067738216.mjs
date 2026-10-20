import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1067738216";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 28, H = 47, D = 18;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), gr ?? 0);
}
const list = [...ground.keys()].map(k => k.split(",").map(Number));
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const missing = (x, z) =>
  (!has(x + 1, z) ? 1 : 0) + (!has(x - 1, z) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0) + (!has(x, z - 1) ? 1 : 0);
const isCorner = (x, z) => missing(x, z) >= 2;

// Plinth level: highest ground under the footprint. Everything below it is solid.
const F = Math.max(0, ...list.map(([x, z]) => ground.get(key(x, z))));

// Seven-ish storeys of 5 blocks, roof kept under about 35 blocks above the lowest ground.
const STOREY = 5;
const N = Math.max(4, Math.floor((34 - F) / STOREY));
const T = F + STOREY * N; // roof slab level

// Materials
const FOUND = "stone_bricks";
const FLOOR = "light_gray_concrete";
const FRAME = "white_concrete";
const SPANDREL = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const BAND = "polished_granite";
const ROOF = "gray_concrete";
const PARAPET = "stone_brick_wall";
const PANE_PROPS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Centroid for penthouse and entrance placement
const cx = Math.round(list.reduce((s, [x]) => s + x, 0) / list.length);
const cz = Math.round(list.reduce((s, [, z]) => s + z, 0) / list.length);

// ---- foundation and plinth -------------------------------------------------
for (const [x, z] of list) {
  for (let y = 0; y < F; y++) g.set(x, y, z, FOUND);
}

// ---- storeys ---------------------------------------------------------------
for (let s = 0; s < N; s++) {
  const b = F + STOREY * s; // floor slab level of this storey

  // floor slab across the whole footprint
  for (const [x, z] of list) g.set(x, b, z, FLOOR);

  for (const [x, z] of list) {
    if (!isEdge(x, z)) continue;

    if (isCorner(x, z)) {
      for (let y = b + 1; y <= b + 4; y++) g.set(x, y, z, FRAME);
      continue;
    }

    const mullion = (x + z) % 3 === 0;
    if (mullion) {
      for (let y = b + 1; y <= b + 3; y++) g.set(x, y, z, FRAME);
      g.set(x, b + 4, z, s === 0 ? BAND : SPANDREL);
      continue;
    }

    if (s === 0) {
      // shopfront: glass at street level, granite band above
      g.set(x, b + 1, z, GLASS, PANE_PROPS);
      g.set(x, b + 2, z, GLASS, PANE_PROPS);
      g.set(x, b + 3, z, BAND);
      g.set(x, b + 4, z, BAND);
    } else {
      // office window band with spandrel
      g.set(x, b + 1, z, GLASS, PANE_PROPS);
      g.set(x, b + 2, z, GLASS, PANE_PROPS);
      g.set(x, b + 3, z, GLASS, PANE_PROPS);
      g.set(x, b + 4, z, SPANDREL);
    }
  }

  // warm light behind some glass: glowstone and shroomlight inside the air gap
  if (s % 2 === 0) {
    for (const [x, z] of list) {
      if (isEdge(x, z)) continue;
      const nearEdge = isEdge(x, z - 1) || isEdge(x, z + 1) || isEdge(x - 1, z) || isEdge(x + 1, z);
      if (!nearEdge) continue;
      const pick = (x * 7 + z * 3 + s) % 9;
      if (pick === 0) g.set(x, b + 2, z, "glowstone");
      else if (pick === 4) g.set(x, b + 2, z, "shroomlight");
    }
  }
}

// ---- roof --------------------------------------------------------------
for (const [x, z] of list) {
  g.set(x, T, z, isEdge(x, z) ? FRAME : ROOF); // white cornice ring, grey roof field
  if (isEdge(x, z)) {
    g.set(x, T + 1, z, PARAPET); // parapet on the edge
  }
}

// rooftop penthouse, set back from the edges
const penth = list.filter(([x, z]) =>
  Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 3 &&
  has(x + 2, z) && has(x - 2, z) && has(x, z + 2) && has(x, z - 2)
);
const penthSet = new Set(penth.map(([x, z]) => key(x, z)));
for (const [x, z] of penth) {
  const ring = !penthSet.has(key(x + 1, z)) || !penthSet.has(key(x - 1, z)) ||
               !penthSet.has(key(x, z + 1)) || !penthSet.has(key(x, z - 1));
  if (ring) {
    g.set(x, T + 1, z, FLOOR);
    g.set(x, T + 2, z, GLASS, PANE_PROPS);
    g.set(x, T + 3, z, GLASS, PANE_PROPS);
    g.set(x, T + 4, z, FLOOR);
  }
  g.set(x, T + 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
// lanterns on the penthouse corners for dusk
const corners = [[cx - 5, cz - 3], [cx + 5, cz - 3], [cx - 5, cz + 3], [cx + 5, cz + 3]];
for (const [x, z] of corners) {
  if (penthSet.has(key(x, z))) g.set(x, T + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- entrance on the north (minimum z) face -------------------------------
const minZ = Math.min(...list.map(([, z]) => z));
const entranceCands = list.filter(([x, z]) => z === minZ && !isCorner(x, z));
if (entranceCands.length) {
  entranceCands.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  const [ex, ez] = entranceCands[0];
  const b = F;
  g.set(ex, b + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, b + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ex, b + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);
