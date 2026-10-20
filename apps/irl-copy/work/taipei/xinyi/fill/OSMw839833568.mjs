import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1980s Xinyi-district commercial block: two storeys over a stone plinth,
// white tiled concrete piers, grey-framed windows, a ground-floor shopfront
// with a red fascia sign, and a white parapet. Roof top sits 11 blocks above
// the lowest ground (storey height 5, parapet at ground+10).

const W = 16, H = 23, D = 24;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw839833568.cells.json`, "utf8"));

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const edge = fN || fS || fW || fE;
  const corner = (fN || fS) && (fW || fE);

  if (!edge) {
    // Interior: floor slabs per storey and a roof deck, air between.
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // Warm lights behind the windows of the first inward bays.
    const alongInt = x + z;
    if (alongInt % 6 === 1) put(x, gr + 2, z, "glowstone");
    if (alongInt % 6 === 4) put(x, gr + 7, z, "shroomlight");
    continue;
  }

  // Edge cell: plinth, storey lines, parapet.
  put(x, gr, z, "stone_bricks");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "white_concrete");

  // Primary outward face decides the wall pattern.
  let face = fN ? "N" : fS ? "S" : fW ? "W" : "E";
  const alongNS = face === "N" || face === "S";
  const along = alongNS ? x : z;
  const bay = along % 3 === 1;
  const frontN = face === "N" && !corner;

  if (corner) {
    for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    continue;
  }

  const paneProps = alongNS ? paneNS : paneEW;

  // Ground storey (y gr+1..gr+4).
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (!bay) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (frontN) {
      // Shopfront: full-height glass, lintel band above.
      if (y === gr + 4) put(x, y, z, "red_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    } else {
      if (y === gr + 1) put(x, y, z, "light_gray_concrete");
      else if (y === gr + 4) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    }
  }

  // Upper storey (y gr+6..gr+9).
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (!bay) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (y === gr + 6 || y === gr + 9) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "glass_pane", paneProps);
  }

  // Entrance on the street (north) face: two-leaf door under a canopy.
  if (frontN && x >= 6 && x <= 9) {
    put(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    if (x === 7 || x === 8) {
      const hinge = x === 7 ? "left" : "right";
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
    }
  }

  // Lights behind some windows (inward cell, interior side).
  let ix = x, iz = z;
  if (face === "N") iz = z + 1;
  else if (face === "S") iz = z - 1;
  else if (face === "W") ix = x + 1;
  else ix = x - 1;
  if (bay && has(ix, iz) && ground.get(key(ix, iz)) !== undefined) {
    const innerEdge = !has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz);
    if (!innerEdge) {
      if (frontN && along % 6 === 1) put(ix, gr + 2, iz, "glowstone");
      if (!frontN && along % 6 === 4) put(ix, gr + 7, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/OSMw839833568.nbt`);
