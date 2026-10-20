import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3378528";
const W = 12, H = 29, D = 9;

// 51 Furman Street, 1938: red-brick Moderne commercial block. Granite base,
// calcite storey bands, a continuous steel-sash ribbon with brick piers,
// a centre entrance on the z=0 street face, a stone parapet and a flat roof
// with a single plant bulkhead.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const row of cells) {
  const [x, z, gr, roof] = row;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.min(20, Math.round(gr)));
  // Quantise lidar roof to whole storeys (2 blocks) above this cell's ground.
  const rawRoof = Math.round(roof);
  const storeys = Math.max(2, Math.round((rawRoof - ground) / 2));
  map.set(key(x, z), { x, z, ground, rq: ground + 2 * storeys });
}

// Smooth into flat tiers: the main roof is the 75th percentile of the
// quantised heights; anything above it is trimmed to it, lower wings keep theirs.
const rqs = [...map.values()].map(c => c.rq).sort((a, b) => a - b);
const mainRoof = Math.min(H - 3, rqs[Math.floor(0.75 * (rqs.length - 1))] || rqs[rqs.length - 1]);
for (const c of map.values()) {
  c.R = Math.min(c.rq, mainRoof);
  if (c.R < c.ground + 4) c.R = c.ground + 4;
}

const inFp = (x, z) => map.has(key(x, z));
const perim = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Classify a perimeter cell: which face it is on and whether it is a window bay.
const faceOf = (x, z) => {
  const xf = (x === 0 || x === W - 1) && z > 0 && z < D - 1;
  const zf = (z === 0 || z === D - 1) && x > 0 && x < W - 1;
  // Ribbon windows with brick piers every third cell (corners never windows).
  const bay = (xf && z % 3 !== 0) || (zf && x % 3 !== 0);
  return { xf, zf, bay };
};

// Pass 1: foundation, storeys, ribbon windows, entrance, roof.
for (const c of map.values()) {
  const { x, z, ground: gr, R } = c;
  const p = perim(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= R; y++) {
    const rel = y - gr;

    // Roof top: parapet on the edge, bulkhead in the middle of the main roof.
    if (y === R) {
      if (p) put(x, y, z, "stone_brick_wall");
      continue;
    }

    // Granite base course on the street wall; slab inside.
    if (rel === 0) {
      put(x, y, z, p ? "polished_granite" : "smooth_stone");
      continue;
    }

    // Roof deck inside, calcite cornice on the edge.
    if (y === R - 1) {
      put(x, y, z, p ? "calcite" : "smooth_stone");
      continue;
    }

    // Storey lines: ground-floor head at rel 3, then every 2 blocks.
    const slab = rel === 3 || (rel > 3 && rel % 2 === 1);
    if (slab) {
      put(x, y, z, p ? "calcite" : "smooth_stone");
      continue;
    }

    if (!p) continue; // interior air gap behind the glass

    const { xf, zf, bay } = faceOf(x, z);

    // Entrance on the street face: door at x=5, granite surround at x=4 and x=6.
    if (zf && z === 0 && rel <= 2) {
      if (x === 5) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (x === 4 || x === 6) {
        put(x, y, z, "polished_granite");
        continue;
      }
    }

    if (!bay) {
      put(x, y, z, "bricks");
      continue;
    }

    put(x, y, z, "glass_pane", xf ? GLASS_X : GLASS_Z);
  }
}

// Plant bulkhead: one clean block in the middle of the main roof.
for (const c of map.values()) {
  const { x, z, R } = c;
  if (R !== mainRoof) continue;
  if (x >= 4 && x <= 7 && z >= 3 && z <= 5 && !perim(x, z)) {
    put(x, R, z, "stone_bricks");
    put(x, R + 1, z, "stone_bricks");
  }
}

// Pass 2: a few warm lights just inside the windows.
for (const c of map.values()) {
  const { x, z, ground: gr, R } = c;
  if (!perim(x, z)) continue;
  const { xf, zf, bay } = faceOf(x, z);
  if (!bay) continue;

  let ix = x, iz = z;
  if (xf) ix = x === 0 ? 1 : W - 2;
  else if (zf) iz = z === 0 ? 1 : D - 2;
  if (!inFp(ix, iz) || perim(ix, iz)) continue;

  for (let y = gr + 1; y < R - 1; y++) {
    const rel = y - gr;
    const slab = rel === 3 || (rel > 3 && rel % 2 === 1);
    if (slab) continue;
    if (zf && z === 0 && (x === 4 || x === 5 || x === 6)) continue;
    if ((x + z + y) % 5 === 0) put(ix, y, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
