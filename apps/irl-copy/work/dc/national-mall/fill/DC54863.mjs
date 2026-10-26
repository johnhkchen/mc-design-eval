import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC54863 - 1200 G St NW, Commercial-Office-Large
// 1960s-70s downtown office block: precast concrete piers and spandrels,
// light bronze-tinted glass bands with stone frames, a smooth-stone base course,
// a plain parapet and a rooftop plant core. Downhill cells carry their
// foundation down to y 0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC54863";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 31, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { g: Math.max(0, Math.round(gr)), r: Math.round(roof) });
}
const inMap = (x, z) => map.has(key(x, z));
const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

// Entrance: the middle exterior cell on the north (lowest z) edge.
let entX = null, entZ = null;
{
  const northEdge = cells.filter(([x, z]) => !inMap(x, z - 1));
  if (northEdge.length) {
    const xs = northEdge.map(c => c[0]).sort((a, b) => a - b);
    entX = xs[Math.floor(xs.length / 2)];
    entZ = northEdge.find(c => c[0] === entX)[1];
  }
}

for (const [x, z] of cells) {
  const { g: base, r } = map.get(key(x, z));
  const top = Math.min(H - 4, Math.max(base + 6, r));

  const edgeN = !inMap(x, z - 1);
  const edgeS = !inMap(x, z + 1);
  const edgeW = !inMap(x - 1, z);
  const edgeE = !inMap(x + 1, z);
  const ext = edgeN || edgeS || edgeW || edgeE;
  const corner = (edgeN || edgeS) && (edgeW || edgeE);

  // Foundation from y 0 to ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // Shell, storeys, floors.
  for (let y = base; y < top; y++) {
    const rel = y - base;

    if (rel === 0) {
      g.set(x, y, z, ext ? "smooth_stone" : "polished_andesite");
      continue;
    }
    if (rel < 3) {
      if (ext) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const storeyRel = (rel - 3) % 3;
    if (storeyRel === 0) {
      // Spandrel band and floor slab (solid for exterior and interior).
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (!ext) continue; // air gap behind glass

    // Window rows on the facade: stone-framed bronze-tinted glass between piers.
    const idx = (edgeN || edgeS) ? x : z;
    const pier = corner || (idx % 3 === 0);
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (storeyRel === 1) {
      g.set(x, y, z, "light_blue_stained_glass");
      // Rare warm light behind a pane, mid-storey, in the interior air gap.
      if ((x * 7 + y * 3 + z * 5) % 17 === 0) {
        let ix = x, iz = z;
        if (edgeN) iz = z + 1;
        else if (edgeS) iz = z - 1;
        else if (edgeW) ix = x + 1;
        else if (edgeE) ix = x - 1;
        if (inMap(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      // Sill and head frame above and below the glass.
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Roof slab on interior, parapet and cornice on exterior.
  if (top < H) {
    if (ext) {
      g.set(x, top, z, "light_gray_concrete");
      if (top + 1 < H) {
        g.set(x, top + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    } else {
      g.set(x, top, z, "smooth_stone");
    }
  }
}

// Rooftop plant core: three solid blocks, with a lantern on its top.
{
  const cx0 = Math.floor(W * 0.3), cx1 = Math.ceil(W * 0.7);
  const cz0 = Math.floor(D * 0.3), cz1 = Math.ceil(D * 0.7);
  const cxm = Math.floor((cx0 + cx1) / 2), czm = Math.floor((cz0 + cz1) / 2);
  for (let x = cx0; x <= cx1; x++) {
    for (let z = cz0; z <= cz1; z++) {
      if (!inMap(x, z)) continue;
      const edge = x === cx0 || x === cx1 || z === cz0 || z === cz1;
      const { g: base, r } = map.get(key(x, z));
      const top = Math.min(H - 4, Math.max(base + 6, r));
      // Plant walls and roof: k = 0 slab level, k = 1..2 walls/core.
      for (let k = 1; k <= 2; k++) {
        const y = top + k;
        if (!inside(x, y, z)) continue;
        if (edge) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, k === 1 ? "smooth_stone" : "air");
      }
      // Solid core top so the lantern sits on a real block.
      if (!edge) {
        const y = top + 2;
        if (inside(x, y, z)) g.set(x, y, z, "stone_bricks");
      }
      if (x === cxm && z === czm) {
        const y = top + 3;
        if (inside(x, y, z)) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// Main entrance: stone surround, two-high door on the north face.
if (entX !== null && entZ !== null) {
  const base = map.get(key(entX, entZ)).g;
  for (const dx of [-1, 1]) {
    const x = entX + dx;
    if (inMap(x, entZ)) {
      g.set(x, base + 1, entZ, "stone_bricks");
      g.set(x, base + 2, entZ, "stone_bricks");
    }
  }
  g.set(entX, base + 1, entZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(entX, base + 2, entZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Head over the door: stone brick lintel above the door in the spandrel row.
  g.set(entX, base + 3, entZ, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
