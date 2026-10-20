import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001524";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 20, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(c => [key(c[0], c[1]), c]));
const has = (x, z) => cellMap.has(key(x, z));
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => { if (inB(x, y, z)) g.set(x, y, z, id, p); };

// Missing neighbour = exterior face. -z is the street (north) side.
const SIDES = {
  N: { dx: 0, dz: -1, paneAxis: "ew" },
  S: { dx: 0, dz: 1, paneAxis: "ew" },
  W: { dx: -1, dz: 0, paneAxis: "ns" },
  E: { dx: 1, dz: 0, paneAxis: "ns" },
};
const sidesOf = (x, z) => Object.keys(SIDES).filter(s => !has(x + SIDES[s].dx, z + SIDES[s].dz));

// Lidar smoothing: one flat roof tier, per-cell ground for foundations.
const groundsRaw = cells.map(c => Math.round(c[2]));
const roofsRaw = cells.map(c => c[3]);
const gMin = Math.min(...groundsRaw);
const meanRoof = roofsRaw.reduce((a, b) => a + b, 0) / roofsRaw.length;
const R = Math.min(H - 2, Math.max(gMin + 6, Math.round(meanRoof)));
const b = gMin;

// Window rhythm: first along-facade index on each side, so every facade is counted from its own start.
const faceMin = {};
for (const c of cells) {
  for (const s of sidesOf(c[0], c[1])) {
    const along = (s === "N" || s === "S") ? c[0] : c[1];
    faceMin[s] = Math.min(faceMin[s] ?? Infinity, along);
  }
}

// Pass 1: solid masses, foundations, quoins, string courses, cornice, parapet, roof.
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.max(0, Math.min(R - 2, Math.round(c[2])));
  const ext = sidesOf(x, z);
  const perim = ext.length > 0;
  const corner = ext.length >= 2;

  for (let y = 0; y < R; y++) {
    if (y < gr) put(x, y, z, "stone_bricks");
    else if (corner && y >= b) put(x, y, z, "stone_bricks");   // stone quoins
    else put(x, y, z, "bricks");
  }

  if (perim) {
    put(x, b, z, "stone_bricks");                             // base course
    for (let k = 1; ; k++) {                                   // string courses every storey
      const fy = b + 2 * k;
      if (fy >= R - 1) break;
      put(x, fy, z, "polished_andesite");
    }
    put(x, R - 1, z, "polished_andesite");                     // cornice
    put(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet cap
  } else {
    put(x, R, z, "stone");                                     // tar roof deck
  }
}

// Pass 2: windows with recessed glass, air gap, warm light behind some panes.
for (const c of cells) {
  const x = c[0], z = c[1];
  const ext = sidesOf(x, z);
  if (ext.length !== 1) continue;
  const side = SIDES[ext[0]];
  const along = (ext[0] === "N" || ext[0] === "S") ? x : z;
  if ((along - faceMin[ext[0]]) % 2 !== 1) continue;

  const gr = Math.max(0, Math.min(R - 2, Math.round(c[2])));
  const pane = side.paneAxis === "ew"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let k = 0; ; k++) {
    const wy = b + 2 * k + 1;
    if (wy >= R - 1) break;
    if (wy < gr) continue;

    put(x, wy, z, "glass_pane", pane);

    const ix = x - side.dx, iz = z - side.dz;
    if (has(ix, iz)) {
      const lit = ((x + z + k) % 3 === 0);
      put(ix, wy, iz, lit ? "glowstone" : "air");
    }
  }
}

// Pass 3: entrance on the street face, nearest the middle of the frontage.
const northCells = cells.filter(c => sidesOf(c[0], c[1]).includes("N"));
if (northCells.length) {
  const mid = (W - 1) / 2;
  northCells.sort((a, b2) => Math.abs(a[0] - mid) - Math.abs(b2[0] - mid));
  const [dx, dz, dgr0] = northCells[0];
  const dy = Math.max(0, Math.min(R - 5, Math.round(dgr0)));

  // Door
  put(dx, dy, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dy + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

  // Stone lintel over the doorway, spanning the neighbouring face cells
  for (const ox of [-1, 0, 1]) {
    if (has(dx + ox, dz) && sidesOf(dx + ox, dz).includes("N")) {
      put(dx + ox, dy + 2, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // Hanging lantern under the lintel, beside the door
  for (const ox of [1, -1]) {
    if (has(dx + ox, dz) && sidesOf(dx + ox, dz).includes("N")) {
      put(dx + ox, dy + 1, dz, "lantern", { hanging: "true", waterlogged: "false" });
      break;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
