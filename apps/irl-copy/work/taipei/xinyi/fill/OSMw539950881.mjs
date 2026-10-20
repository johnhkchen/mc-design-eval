import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950881";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 14;
const ROOF = 11;      // roof deck level (about 11 blocks above lowest ground)
const PARAPET = 12;   // parapet course sits on the deck
const SPANDREL_LEVELS = [5, 10];

const vox = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
for (const [x, z, gr] of cells) {
  groundMap.set(key(x, z), Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => groundMap.has(key(x, z));
const groundAt = (x, z) => groundMap.get(key(x, z));
const maxX = Math.max(...cells.map((c) => c[0]));
const maxZ = Math.max(...cells.map((c) => c[1]));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Pass 1: foundations, ground floor slab, storey slab, roof deck on every footprint cell.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = groundAt(x, z);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");        // foundation to lowest ground
  put(x, G, z, "smooth_stone");                                    // ground floor slab
  if (G < 5) put(x, 5, z, "smooth_stone");                         // first/second storey slab
  if (G < ROOF) put(x, ROOF, z, "smooth_stone");                   // roof deck
}

// Pass 2: perimeter walls, parapet, lights, entrance, roof equipment.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = groundAt(x, z);
  const fN = !has(x, z - 1);
  const fS = !has(x, z + 1);
  const fW = !has(x - 1, z);
  const fE = !has(x + 1, z);
  const perimeter = fN || fS || fW || fE;

  if (!perimeter) {
    // Interior cell: roof equipment on two units only.
    if ((x === 2 && z === 5) || (x === 4 && z === 8)) {
      if (ROOF < PARAPET) {
        put(x, PARAPET, z, "light_gray_concrete");
        put(x, PARAPET + 1, z, "iron_block");
      }
    }
    continue;
  }

  // Choose the dominant face: street-facing N/S preferred on corners.
  let face, s, inX, inZ;
  if (fN)      { face = "N"; s = x; inX = 0;  inZ = 1; }
  else if (fS) { face = "S"; s = x; inX = 0;  inZ = -1; }
  else if (fW) { face = "W"; s = z; inX = 1;  inZ = 0; }
  else         { face = "E"; s = z; inX = -1; inZ = 0; }

  const maxS = (face === "N" || face === "S") ? maxX : maxZ;
  const pillar = s % 3 === 0 || s === maxS;

  for (let y = G; y <= 10; y++) {
    let id;
    const spandrel = SPANDREL_LEVELS.includes(y);
    const entrance = face === "N" && s === 3 && y > G && y <= G + 3 && !spandrel;

    if (y === G) id = "stone_bricks";                 // base course
    else if (spandrel) id = "light_gray_concrete";    // storey lines and cornice
    else if (entrance) id = "glass";                  // glazed entrance
    else if (pillar) id = "white_concrete";           // window bay piers
    else id = "light_blue_stained_glass_pane";        // glazing

    put(x, y, z, id);

    // Warm light just behind some windows (glowstone inside the air gap).
    if (id === "light_blue_stained_glass_pane" && y > G && has(x + inX, z + inZ)) {
      const lit = (s % 6 === 1 && y === 8) || (s % 6 === 4 && y === 3);
      if (lit) put(x + inX, y, z + inZ, "glowstone");
    }
  }

  // Lantern hung inside the entrance.
  if (face === "N" && s === 3 && has(3, z + 1) && G + 3 < ROOF) {
    put(3, G + 3, z + 1, "lantern", { hanging: "true" });
  }

  // Parapet course with bottom slab cap around the roof edge.
  if (PARAPET < H - 1) {
    put(x, PARAPET, z, "white_concrete");
    put(x, PARAPET + 1, z, "smooth_stone_slab", { type: "bottom" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
