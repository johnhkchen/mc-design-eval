import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0029-3F-2";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 18 footprint, roof at y 59 (parapet cap), penthouse + mast to y 70
const W = 11, H = 71, D = 18;
const g = new Voxels([W, H, D]);

const ROOF_Y = 58;      // roof deck
const CAP_Y = 59;       // parapet cap
const GROUND_TOP = 9;   // ground storey top (shopfront / lobby height)
const CLAMP_MAX = 58;

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);
const has = (x, z) => cellMap.has(key(x, z));

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Per-cell exposed faces
function faceInfo(x, z) {
  const faces = [];
  if (!has(x, z - 1)) faces.push({ dir: "N", idx: x, inx: x, inz: z + 1 });
  if (!has(x, z + 1)) faces.push({ dir: "S", idx: x, inx: x, inz: z - 1 });
  if (!has(x - 1, z)) faces.push({ dir: "W", idx: z, inx: x + 1, inz: z });
  if (!has(x + 1, z)) faces.push({ dir: "E", idx: z, inx: x - 1, inz: z });
  return faces;
}

const isEdgeCell = (x, z) => faceInfo(x, z).length > 0;

// Building columns
for (const [x, z, grRaw] of cells) {
  const ground = Math.max(0, Math.min(CLAMP_MAX, Math.round(grRaw)));
  const faces = faceInfo(x, z);
  const edge = faces.length > 0;
  const pierCell = faces.length >= 2 || faces.some((f) => f.idx % 3 === 0);
  const southEntrance = faces.some((f) => f.dir === "S" && f.idx === 5);

  // foundation up to ground
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");

  for (let y = ground; y <= CLAMP_MAX; y++) {
    if (y < GROUND_TOP) {
      // ground storey / lobby
      if (y === ground) {
        if (edge) set(x, y, z, "stone_bricks");        // base course
        else set(x, y, z, "smooth_stone");             // lobby floor
        continue;
      }
      if (!edge) continue;                              // open lobby air

      if (southEntrance) {
        if (y === ground + 1) {
          set(x, y, z, "oak_door", {
            facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (y === ground + 2) {
          set(x, y, z, "oak_door", {
            facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (y === ground + 3) {
          set(x, y, z, "light_blue_stained_glass_pane");  // transom
          continue;
        }
      }

      if (pierCell) set(x, y, z, "white_concrete");
      else set(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }

    // storeys above ground: lines at 9,14,19,...,54
    const j = (y - GROUND_TOP) % 5;

    if (j === 0) {
      set(x, y, z, "light_gray_concrete");              // floor slab / band
      continue;
    }
    if (y === ROOF_Y) {
      if (edge) set(x, y, z, "white_concrete");         // top spandrel
      else set(x, y, z, "light_gray_concrete");         // roof deck over interior
      continue;
    }
    if (!edge) continue;                                // air behind glass

    if (j === 4) {
      set(x, y, z, "white_concrete");                   // spandrel
      continue;
    }
    // j 1..3: window zone
    if (pierCell) {
      set(x, y, z, "white_concrete");
    } else {
      set(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // Parapet cap on edges
  if (edge) set(x, CAP_Y, z, "light_gray_concrete");
}

// Warm lights behind some windows, and lobby lantern by the entrance
for (const [x, z, grRaw] of cells) {
  const faces = faceInfo(x, z);
  if (!faces.length) continue;
  const ground = Math.max(0, Math.min(CLAMP_MAX, Math.round(grRaw)));
  for (const f of faces) {
    if (f.idx % 3 === 0) continue;
    if (!has(f.inx, f.inz) || isEdgeCell(f.inx, f.inz)) continue;
    for (let k = 0; k < 9; k++) {
      const b = GROUND_TOP + 5 * k;
      if (b + 2 > CLAMP_MAX) break;
      if (b + 2 < ground) continue;
      if ((f.idx + k) % 4 === 0) {
        set(f.inx, b + 2, f.inz, "glowstone");
      }
    }
    if (f.dir === "S" && f.idx === 5 && ground + 1 < GROUND_TOP) {
      set(f.inx, ground + 3, f.inz, "lantern");
    }
  }
}

// Rooftop penthouse (interior cells, x 3..7, z 5..12)
for (let x = 3; x <= 7; x++) {
  for (let z = 5; z <= 12; z++) {
    if (!has(x, z) || isEdgeCell(x, z)) continue;
    for (let y = CAP_Y; y <= 62; y++) set(x, y, z, "white_concrete");
    set(x, 63, z, "light_gray_concrete");
  }
}

// Mast on penthouse
if (has(5, 8) && !isEdgeCell(5, 8)) {
  for (let y = 64; y <= 69; y++) set(5, y, 8, "iron_bars");
  set(5, 70, 8, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
