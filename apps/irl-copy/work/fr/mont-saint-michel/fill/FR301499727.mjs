import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499727";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 26, D = 10;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup and building-wide massing numbers
const cellMap = new Map();
let roofSum = 0, gzMax = 0;
for (const [x, z, ground, roof] of cells) {
  cellMap.set(`${x},${z}`, { ground, roof });
  roofSum += roof;
  gzMax = Math.max(gzMax, ground);
}
const roofMean = cells.length ? roofSum / cells.length : 14;
const TOP = Math.max(12, Math.min(20, Math.round(roofMean)));
const EAVE = Math.max(TOP - 4, gzMax + 10); // wall top (exclusive)

const WALL = "granite";
const PLINTH = "polished_granite";
const PIER = "stone_bricks";
const FRAME = "dark_oak_planks";
const CORNICE = "chiseled_stone_bricks";
const FLOOR = "smooth_stone";

// ---------- per-cell foundation, floors, walls ----------
for (const [x, z, gz] of cells) {
  const has = (dx, dz) => cellMap.has(`${x + dx},${z + dz}`);
  const edgeW = !has(-1, 0), edgeE = !has(1, 0);
  const edgeN = !has(0, -1), edgeS = !has(0, 1);
  const perim = edgeW || edgeE || edgeN || edgeS;

  // foundation up to ground, plinth at ground level
  for (let y = 0; y < gz; y++) put(x, y, z, "stone_bricks");
  put(x, gz, z, FLOOR);

  // first-floor slab (interior)
  put(x, gz + 5, z, FLOOR);

  if (!perim) continue;

  // facade: west (x=0) is the shopfront; inward offset is the full 2-block gap
  let along, inward;
  if (edgeW) { along = z; inward = [2, 0]; }
  else if (edgeE) { along = z; inward = [-2, 0]; }
  else if (edgeN) { along = x; inward = [0, 2]; }
  else { along = x; inward = [0, -2]; }
  const frontW = edgeW;
  const isPostCol = along % 3 === 0;

  for (let y = gz + 1; y < EAVE; y++) {
    if (y === EAVE - 1) {
      put(x, y, z, CORNICE);                       // cornice / parapet
    } else if (y === gz + 5) {
      put(x, y, z, PIER);                          // storey band
    } else if (y < gz + 5) {
      // ground floor (commercial)
      if (frontW) {
        if (isPostCol || edgeN || edgeS) {
          put(x, y, z, PIER);
        } else if (z === 4 && y === gz + 1) {
          put(x, y, z, "spruce_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (z === 4 && y === gz + 2) {
          put(x, y, z, "spruce_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (y === gz + 4) {
          // striped red & white awning band over the shopfront
          put(x, y, z, (z % 2 === 0) ? "red_wool" : "white_wool");
        } else {
          put(x, y, z, "glass_pane");
          if (y === gz + 2 && (z === 2 || z === 7)) {
            put(x + inward[0], y, z, "glowstone"); // two-block air gap behind the glass
          }
        }
      } else {
        // other ground-floor walls: granite with plinth course and windows
        if (isPostCol) put(x, y, z, PIER);
        else if (y === gz + 1) put(x, y, z, PLINTH);
        else if (y === gz + 2 || y === gz + 3) put(x, y, z, "glass_pane");
        else put(x, y, z, WALL);
      }
    } else {
      // upper storey: timber frame with glass bays
      if (isPostCol) {
        put(x, y, z, FRAME);
      } else if (y <= EAVE - 2) {
        put(x, y, z, "glass_pane");
        if (y === gz + 7 && along % 3 === 1 && !frontW) {
          const lx = x + inward[0], lz = z + inward[1];
          if (cellMap.has(`${lx},${lz}`)) put(lx, y, lz, "glowstone");
        }
      } else {
        put(x, y, z, WALL);
      }
    }
  }
}

// ---------- pitched roof along z (ridge runs north-south) ----------
const stairRoof = "deepslate_tile_stairs";
const slabRoof = "deepslate_tile_slab";
const fillRoof = "stone_bricks";

for (let z = 0; z < D; z++) {
  for (let x = 0; x < W; x++) {
    if (!cellMap.has(`${x},${z}`)) continue;
    for (let k = 0; k < 3; k++) {
      // left slope x=0..2 rising east
      const xl = k;
      for (let y = EAVE; y < EAVE + xl; y++) put(xl, y, z, fillRoof);
      put(xl, EAVE + xl, z, stairRoof, { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
      // right slope x=3..5 rising west
      const xr = 5 - k;
      for (let y = EAVE; y < EAVE + k; y++) put(xr, y, z, fillRoof);
      put(xr, EAVE + k, z, stairRoof, { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
    }
    if (x === 2 || x === 3) {
      put(x, EAVE + 3, z, slabRoof, { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
