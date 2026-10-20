import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const id = "NYC1001284";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 6, H = 26, D = 8;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, {
    gr: Math.round(gr),
    rf: Math.min(Math.round(rf), H - 5),
  });
}
const has = (x, z) => map.has(`${x},${z}`);
const at = (x, z) => map.get(`${x},${z}`);
const allCells = [...map.keys()].map((k) => k.split(",").map(Number));

function exposedFaces(x, z) {
  return {
    zMinus: !has(x, z - 1),
    zPlus: !has(x, z + 1),
    xMinus: !has(x - 1, z),
    xPlus: !has(x + 1, z),
  };
}
const isExterior = (x, z) => {
  const f = exposedFaces(x, z);
  return f.zMinus || f.zPlus || f.xMinus || f.xPlus;
};

// 1. Foundation: stone from y 0 up to each cell's ground.
for (const [x, z] of allCells) {
  const c = at(x, z);
  for (let y = 0; y < c.gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Shell: brick facade, smooth stone floor slabs on every interior storey line,
//    a stone belt course on the exterior at each storey line, roof deck at rf-1.
for (const [x, z] of allCells) {
  const c = at(x, z);
  const ext = isExterior(x, z);
  for (let y = c.gr; y <= c.rf - 1; y++) {
    const rel = y - c.gr;
    if (y === c.rf - 1) {
      g.set(x, y, z, "smooth_stone");
    } else if (ext) {
      g.set(x, y, z, rel % 2 === 0 ? "stone_bricks" : "bricks");
    } else if (rel % 2 === 0) {
      g.set(x, y, z, "smooth_stone");
    }
  }
}

// 3. Windows: glass panes in the upper block of each storey on exposed faces,
//    skipping corners and the shopfront row. Standing lanterns on the interior
//    floor slab give warm light visible through the glass.
for (const [x, z] of allCells) {
  const c = at(x, z);
  if (!isExterior(x, z)) continue;
  const f = exposedFaces(x, z);

  const faces = [];
  if (f.zMinus) faces.push({ along: x, len: W, ix: x, iz: z + 1 });
  if (f.zPlus) faces.push({ along: x, len: W, ix: x, iz: z - 1 });
  if (f.xMinus) faces.push({ along: z, len: D, ix: x + 1, iz: z });
  if (f.xPlus) faces.push({ along: z, len: D, ix: x - 1, iz: z });

  for (const face of faces) {
    if (face.along < 1 || face.along > face.len - 2) continue;
    for (let y = c.gr + 1; y <= c.rf - 3; y += 2) {
      const s = Math.floor((y - c.gr) / 2);
      g.set(x, y, z, "glass_pane");
      // Lantern standing on the interior floor slab, behind every third window.
      if (has(face.ix, face.iz) && (face.along + s) % 3 === 0) {
        g.set(face.ix, y, face.iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// 4. Ground floor shopfront on the street face (low z): polished base course
//    at grade, with a door set in the middle.
for (const [x, z] of allCells) {
  const c = at(x, z);
  const f = exposedFaces(x, z);
  if (!f.zMinus) continue;
  if (x < 1 || x > W - 2) continue;
  g.set(x, c.gr, z, "polished_andesite");
}

const doorX = 2;
if (has(doorX, 0)) {
  const c = at(doorX, 0);
  g.set(doorX, c.gr, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false",
  });
  g.set(doorX, c.gr + 1, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false",
  });
  // Stone surround either side of the door, and a small canopy over it.
  for (const dx of [doorX - 1, doorX + 1]) {
    if (has(dx, 0)) g.set(dx, c.gr + 2, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  if (has(doorX, 0) && c.gr + 2 < c.rf - 2) {
    g.set(doorX, c.gr + 2, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// 5. Cornice and parapet on the perimeter.
for (const [x, z] of allCells) {
  const c = at(x, z);
  if (!isExterior(x, z)) continue;
  g.set(x, c.rf - 2, z, "stone_bricks");
  g.set(x, c.rf - 1, z, "stone_bricks");
  g.set(x, c.rf, z, "stone_bricks");
}

// 6. Roof equipment: a small stair bulkhead near the roof centre, only if the
//    whole 2x2 footprint exists.
const bulkCells = [[2, 3], [3, 3], [2, 4], [3, 4]];
if (bulkCells.every(([x, z]) => has(x, z))) {
  const top = Math.max(...bulkCells.map(([x, z]) => at(x, z).rf));
  for (const [x, z] of bulkCells) {
    g.set(x, top, z, "stone_bricks");
    g.set(x, top + 1, z, "stone_bricks");
    g.set(x, top + 2, z, "smooth_stone");
  }
  g.set(2, top + 1, 3, "glass_pane");
  g.set(2, top + 1, 4, "glass_pane");
}

g.save(`${dir}/${id}.nbt`);
