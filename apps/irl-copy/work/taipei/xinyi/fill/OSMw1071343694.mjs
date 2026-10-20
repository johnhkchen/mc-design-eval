import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343694";
const W = 30, H = 23, D = 38;

// Record: roof about 11 blocks above lowest ground, two storeys of ~5 blocks
// with a parapet. Era: mid-to-late 20th century Taipei commercial block.
// Materials: pale concrete frame, quartz pilasters, red tile signboard band
// and parapet, stone base, glazed shopfronts with warm interior light.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DIRS = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
];
const outward = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Door: on the south face, nearest to the middle of the width.
let doorX = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const o = outward(x, z);
    if (!o.some((d) => d.f === "south")) continue;
    const dist = Math.abs(x - Math.floor(W / 2));
    if (dist < best) { best = dist; doorX = x; }
  }
}

// Pass 1: foundation, floors, roof, parapet, interior air and roof plant.
for (const [x, z, gr] of cells) {
  const o = outward(x, z);
  const perim = o.length > 0;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone");           // foundation
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");        // base course / ground floor slab
  put(x, gr + 5, z, perim ? "smooth_quartz" : "smooth_stone");   // storey-2 floor slab and storey line
  put(x, gr + 10, z, perim ? "smooth_quartz" : "light_gray_concrete"); // roof slab / cornice

  if (perim) {
    put(x, gr + 11, z, "red_terracotta");                        // tiled parapet cap
  } else if ((x * 3 + z * 5) % 11 === 0 && gr + 11 < H) {
    put(x, gr + 11, z, "light_gray_concrete");                   // roof air-conditioning plant
  }
}

// Pass 2: facades on perimeter cells.
for (const [x, z, gr] of cells) {
  const o = outward(x, z);
  if (o.length === 0) continue;

  // Primary facing: prefer north/south so door and sign band read from the street.
  const primary = o.find((d) => d.f === "south") || o.find((d) => d.f === "north") || o[0];
  const along = primary.dx !== 0 ? z : x;
  const pillar = o.length > 1 || along % 4 === 0;

  const isDoor = primary.f === "south" && x === doorX && z === D - 1 - 0 && true;
  const doorHere = primary.f === "south" && x === doorX;

  if (pillar) {
    for (let y = gr + 1; y <= gr + 9; y++) {
      if (y === gr + 5) continue;
      put(x, y, z, "smooth_quartz");
    }
  } else {
    // Storey 1: shopfront glazing with a red signboard band above.
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass_pane");
    put(x, gr + 4, z, "red_terracotta");
    // Storey 2: window band with a white spandrel above.
    for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "glass_pane");
    put(x, gr + 9, z, "white_concrete");
  }

  // Plain wall cells between pillars and windows (spandrel rows on pillar faces).
  if (pillar) {
    put(x, gr + 4, z, "red_terracotta");
  }

  // Entrance on the south face.
  if (doorHere) {
    const f = "south";
    put(x, gr + 1, z, "oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true" });
  }

  // Warm light: glowstone just inside some windows, on both storeys.
  if (!pillar && along % 8 === 2) {
    const ix = x - primary.dx;
    const iz = z - primary.dz;
    if (has(ix, iz) && outward(ix, iz).length === 0) {
      put(ix, gr + 2, iz, "glowstone");
      put(ix, gr + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
