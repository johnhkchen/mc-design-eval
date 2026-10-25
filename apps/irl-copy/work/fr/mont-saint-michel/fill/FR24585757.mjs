import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR24585757";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
const k = (x, z) => `${x},${z}`;
for (const [x, z, gr, rf] of cells) cellMap.set(k(x, z), { g: gr, r: rf });
const has = (x, z) => cellMap.has(k(x, z));

// Smooth the lidar roof into one clean tier (the median), kept within +-1 per cell
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const TIER = Math.min(H - 4, Math.max(medRoof, 9)); // roof deck top (about 11 blocks)

let zMax = -1;
for (const [, z] of cells) zMax = Math.max(zMax, z);
const doorXs = cells.filter(([, z]) => z === zMax).map(([x]) => x).sort((a, b) => a - b);
const doorX = doorXs.length ? doorXs[Math.floor(doorXs.length / 2)] : -1;

// Stone mix: mostly dressed stone, some cracked and mossy for age
const wallMat = (x, y, z) => {
  const h = (x * 7 + y * 13 + z * 5) % 11;
  if (y < 3 && h < 4) return "mossy_stone_bricks";
  if (h === 3 || h === 8) return "cracked_stone_bricks";
  return "stone_bricks";
};

for (const [x, z, gr] of cells) {
  const grd = gr;
  const r = TIER;

  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  const per = edgeN || edgeS || edgeW || edgeE;
  const corner = per && ((edgeN || edgeS) && (edgeW || edgeE));

  // Foundation: rubble from y 0 up to this cell's ground
  for (let y = 0; y < grd; y++) g.set(x, y, z, "stone");

  // Walls and roof deck
  for (let y = grd; y < r; y++) {
    if (per) {
      if (y < grd + 2) {
        g.set(x, y, z, corner ? "polished_andesite" : "stone");
      } else if (y === r - 2) {
        // Cornice course: a slightly different stone so the top band reads
        g.set(x, y, z, "chiseled_stone_bricks");
      } else {
        g.set(x, y, z, corner && y % 2 === 0 ? "polished_andesite" : wallMat(x, y, z));
      }
    } else {
      if (y === r - 1) g.set(x, y, z, "stone_bricks");
      else if (y === grd + 5 && grd + 5 < r - 1) {
        g.set(x, y, z, "stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
  // Roof deck covers the whole footprint
  g.set(x, r - 1, z, "stone_bricks");

  // Crenellations: merlons standing on the deck, alternating with open gaps
  if (per && (x + z) % 2 === 0) {
    g.set(x, r, z, "stone_brick_wall", {
      north: edgeN ? "low" : "none",
      south: edgeS ? "low" : "none",
      east: edgeE ? "low" : "none",
      west: edgeW ? "low" : "none",
      up: "true",
      waterlogged: "false",
    });
  }

  // Two rows of window slits per storey
  if (per) {
    const rows = [grd + 1, grd + 2, grd + 3, grd + 6, grd + 7];
    for (const y of rows) {
      if (y >= r - 3) continue;
      if (corner) continue;
      if (((x + z) % 4) !== 2) continue;
      if (z === zMax && x === doorX && y <= grd + 1) continue;
      const onNS = edgeN || edgeS;
      g.set(x, y, z, "glass_pane", {
        north: onNS ? "false" : "true",
        south: onNS ? "false" : "true",
        east: onNS ? "true" : "false",
        west: onNS ? "true" : "false",
        waterlogged: "false",
      });
      // Warm light just inside selected slits
      if ((y === grd + 2 || y === grd + 7) && (x + z) % 8 === 2) {
        let dx = 0, dz = 0;
        if (edgeN) dz = 1;
        else if (edgeS) dz = -1;
        else if (edgeW) dx = 1;
        else if (edgeE) dx = -1;
        const ix = x + dx, iz = z + dz;
        if (ix >= 0 && ix < W && iz >= 0 && iz < D && has(ix, iz)) {
          g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
  }

  // Entrance: door on the south face, framed by a stone lintel above
  if (per && edgeS && z === zMax && x === doorX) {
    g.set(x, grd, z, "spruce_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, grd + 1, z, "spruce_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, grd + 2, z, "chiseled_stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
