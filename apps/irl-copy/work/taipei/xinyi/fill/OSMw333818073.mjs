import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw333818073";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 75, H = 23, D = 36;
const ROOF_Y = 10;      // roof deck (interior) and cornice course
const PARAPET_Y = 11;   // top of the perimeter parapet (about 11 blocks above lowest ground)
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const exposures = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
const alongT = (d, x, z) => (d === "north" || d === "south" ? x : z);

// ---- helpers ----------------------------------------------------------------
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = face =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- pass 1: find the front (most exposed single-face cells) ---------------
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cells) {
  const ex = exposures(x, z);
  if (ex.length === 1) faceCount[ex[0]]++;
}
const front = Object.keys(faceCount).reduce((a, b) => (faceCount[b] > faceCount[a] ? b : a));

const frontTs = [];
for (const [x, z] of cells) {
  const ex = exposures(x, z);
  if (ex.length === 1 && ex[0] === front) frontTs.push(alongT(front, x, z));
}
const tMin = Math.min(...frontTs);
const tMax = Math.max(...frontTs);
const tCenter = Math.round((tMin + tMax) / 2);

let entranceCell = null;

// ---- pass 2: build every footprint column -----------------------------------
const WINDOW_ROWS = new Set([1, 2, 3, 6, 7, 8]);

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(H - 1, Math.round(gr0)));

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposures(x, z);
  const ring = ex.length > 0;

  if (!ring) {
    // interior: floor slabs and roof deck only, air between (no interiors)
    for (const y of [4, 9]) if (y >= gr) put(x, y, z, "smooth_stone");
    if (gr <= ROOF_Y) put(x, ROOF_Y, z, "stone");
    continue;
  }

  const face = ex.length === 1 ? ex[0] : null;     // single exposed face, else corner
  const t = alongT(face ?? ex[0], x, z);
  const isFrontFace = face === front;
  const dOff = isFrontFace ? Math.abs(t - tCenter) : 99;
  const inEntrance = isFrontFace && dOff <= 3;
  const isPier = face ? ((t - tMin) % 4 === 0) : true;

  if (isFrontFace && t === tCenter) entranceCell = { x, z, face };

  const topY = Math.min(PARAPET_Y, H - 1);
  for (let y = gr; y <= topY; y++) {
    // entrance zone on the front face: recessed-looking dark surround, stone lintel
    if (inEntrance && y >= 1 && y <= 4) {
      if (y === 4) { put(x, y, z, "stone_bricks"); continue; }          // lintel
      if (dOff === 0) {
        if (y <= 2) {
          put(x, y, z, "iron_door", {
            facing: front,
            half: y === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
      } else if (dOff <= 2) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      } else {
        put(x, y, z, "stone_bricks");                                     // jamb pillar
      }
      continue;
    }

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }            // base course
    if (y === 4 || y === 9) { put(x, y, z, "light_gray_concrete"); continue; } // storey lines
    if (y === 10) { put(x, y, z, "light_gray_concrete"); continue; }     // cornice
    if (y === PARAPET_Y) { put(x, y, z, "light_gray_concrete"); continue; }   // parapet

    if (WINDOW_ROWS.has(y) && face && !isPier) {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      // warm light behind some panes (air gap behind glass otherwise)
      const [dx, dz] = DIRS[face];
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && exposures(ix, iz).length === 0 && y >= (ground.get(`${ix},${iz}`) ?? 0)) {
        if (((x * 5 + z * 3 + y) % 7) === 0) put(ix, y, iz, "glowstone");
      }
      continue;
    }

    // pilaster piers give the facade a vertical rhythm; corners stay white
    if (face && isPier) { put(x, y, z, "light_gray_concrete"); continue; }
    put(x, y, z, "white_concrete");
  }
}

// ---- roof: a few plant boxes and the flagpole --------------------------------
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(H - 1, Math.round(gr0)));
  if (exposures(x, z).length > 0) continue;
  if (gr > ROOF_Y) continue;
  if ((x % 12 === 6) && (z % 9 === 4)) {
    put(x, PARAPET_Y, z, "smooth_stone");
    put(x, PARAPET_Y + 1, z, "smooth_stone");
  }
}

if (entranceCell) {
  const [dx, dz] = DIRS[front];
  const px = entranceCell.x - dx * 4;
  const pz = entranceCell.z - dz * 4;
  if (has(px, pz) && exposures(px, pz).length === 0) {
    for (let y = PARAPET_Y; y <= PARAPET_Y + 5; y++) put(px, y, pz, "iron_bars");
    put(px, PARAPET_Y + 6, pz, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
