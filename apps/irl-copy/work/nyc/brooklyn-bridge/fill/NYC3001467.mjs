import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001467";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 18, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));
const inBounds = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Flat roof tier: median lidar roof, applied to every cell within one block of it.
const roofVals = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const R = Math.min(H - 4, Math.max(4, roofVals[Math.floor(roofVals.length / 2)]));

const isExterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const isFront = (x, z) => !has(x, z - 1);

// Inward direction for a given exterior cell (toward the building's interior).
const inward = (x, z) => {
  if (!has(x, z - 1)) return [0, 1];
  if (!has(x, z + 1)) return [0, -1];
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x + 1, z)) return [-1, 0];
  return null;
};

// Entrance: street-face cell nearest the middle, ground-floor storey.
const frontCells = cells.filter(([x, z]) => isFront(x, z)).map(([x, z, gr]) => [x, z, gr]);
frontCells.sort((a, b) => Math.abs(a[0] - 2) - Math.abs(b[0] - 2));
const entrance = frontCells[0] || null;

for (const [x, z, groundRaw, roofRaw] of cells) {
  const ground = Math.max(0, Math.round(groundRaw));
  let roof = Math.round(roofRaw);
  if (Math.abs(roof - R) <= 1) roof = R;
  roof = Math.min(H - 3, Math.max(ground + 4, roof));
  const ext = isExterior(x, z);
  const corner = ext && isCorner(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  // Solid masonry from ground to the top tier.
  for (let y = ground; y <= roof - 1; y++) {
    if (y === ground && ext) put(x, y, z, "smooth_stone");          // base course
    else if (y === roof - 1) {
      if (ext) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // parapet
      else put(x, y, z, "stone");                                    // tar roof
    }
    else if (y === roof - 2 && ext) put(x, y, z, "stone_bricks");    // cornice band
    else put(x, y, z, "bricks");
  }

  if (!ext) continue;

  // Storey string courses and window recesses on exterior faces.
  for (let k = 0; ; k++) {
    const winY = ground + 1 + 2 * k;
    const lineY = winY + 1;
    if (lineY >= roof - 2) break;
    put(x, lineY, z, "smooth_stone");

    const isEntrance = entrance && x === entrance[0] && z === entrance[1] && k === 0;
    const winHere = !corner && (x + z) % 2 === 1 && !isEntrance;
    if (winHere) {
      put(x, winY, z, "glass_pane");
      const d = inward(x, z);
      if (d && has(x + d[0], z + d[1])) {
        // Air gap behind the glass, with a warm light deeper in some bays.
        put(x + d[0], winY, z + d[1], "air");
        if ((x + z) % 4 === 1) {
          put(x + 2 * d[0], winY, z + 2 * d[1], k === 0 ? "shroomlight" : "glowstone");
        }
      }
    }
  }
}

// Entrance: oak door with a stone lintel above.
if (entrance) {
  const [ex, ez, egr] = entrance;
  const e0 = Math.max(0, Math.round(egr));
  put(ex, e0 + 1, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, e0 + 2, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, e0 + 3, ez, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// One brick chimney on an interior cell, rising from the flat roof tier.
const interior = cells.find(([x, z]) => !isExterior(x, z));
if (interior) {
  const [cx, cz] = interior;
  for (let y = R; y <= R + 1; y++) put(cx, y, cz, "bricks");
  put(cx, R + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
