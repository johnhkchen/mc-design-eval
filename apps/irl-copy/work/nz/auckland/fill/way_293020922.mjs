// Mt Eden / Eden Terrace, Auckland: a two-storey brick commercial block (c.1920s shopfront over an upper floor)
// with a one-storey rear wing stepping down on the western side. Built on the footprint only: walls are one cell
// thick, the inside is air with a floor slab per storey, and the roof is a flat cap with a brick parapet.
// Tiers come from the lidar roof heights (3x3 median, then main >= 7 blocks, else wing).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020922.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const has = (x, z) => foot.has(key(x, z));

// lidar roof height smoothed by a 3x3 median, then two flat tiers
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = foot.get(key(x + dx, z + dz)); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const cell = new Map();
for (const [x, z, g] of cells) cell.set(key(x, z), { x, z, g, main: median(x, z) >= 7 });
const at = (x, z) => cell.get(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces with no footprint cell beyond them (the outside of the building)
const outerFaces = (c) => Object.keys(DIRS).filter((k) => !has(c.x + DIRS[k][0], c.z + DIRS[k][1]));
// every face that is exposed: outside the footprint, or a step between the main block and the wing
const exposedFaces = (c) => Object.keys(DIRS).filter((k) => {
  const n = at(c.x + DIRS[k][0], c.z + DIRS[k][1]); return !n || n.main !== c.main;
});
const isEdge = (c) => exposedFaces(c).length > 0;
// the cell one step inside from an outer face (behind a window), if it is interior air
const behind = (c, face) => {
  const d = DIRS[face]; const n = at(c.x - d[0], c.z - d[1]);
  return n && !isEdge(n) ? n : null;
};
// position of a cell along its face: x for north/south faces, z for east/west faces
const along = (c, face) => (face === "N" || face === "S" ? c.x : c.z);

// bay rhythm on an outer wall, period 5: brick pier, sash frame, two glass panes, sash frame
const BAY = ["bricks", "white_concrete", "glass", "glass", "white_concrete"];

const B = new Voxels([17, 21, 19]);
const put = (x, y, z, block, state) => B.set(x, y, z, block, state);

// the shopfront runs along the outer east face of the main block; its door sits mid-run
const front = [...cell.values()].filter((c) => c.main && outerFaces(c).includes("E")).sort((a, b) => a.z - b.z);
const doorCell = front[Math.floor(front.length / 2)];

for (const c of cell.values()) {
  const { x, z } = c;
  const edge = isEdge(c);
  const outer = outerFaces(c);
  const corner = outer.length >= 2;
  const face = outer[0];

  // plinth course and foundation, down to the lowest ground under the footprint
  put(x, 0, z, "stone_bricks");

  if (!c.main) {
    // one-storey rear wing: walls y 1..3, flat cap at y 4, brick parapet at y 5
    if (edge) {
      for (let y = 1; y <= 3; y++) {
        const b = corner ? "stone_bricks" : face && y >= 2 ? BAY[along(c, face) % 5] : "bricks";
        put(x, y, z, b);
      }
      put(x, 4, z, "stone_bricks");
      put(x, 5, z, "bricks");
    } else {
      put(x, 4, z, "smooth_stone");
    }
    continue;
  }

  // main block: floor slab at y 4 (string course on the edge), cornice at y 7, parapet at y 8
  if (!edge) {
    put(x, 4, z, "smooth_stone");
    put(x, 7, z, "smooth_stone");
    // rooftop plant room on the roof, a 2x2 box on the interior
    if ((x === 7 || x === 8) && (z === 9 || z === 10)) put(x, 8, z, "light_gray_concrete");
    continue;
  }

  put(x, 4, z, "stone_bricks");
  put(x, 7, z, "stone_bricks");
  put(x, 8, z, "bricks");

  // ground storey: a shopfront on the east face, sash windows on the other outer faces, plain brick on steps
  if (front.includes(c)) {
    const i = front.indexOf(c);
    if (c === doorCell) {
      put(x, 1, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 2, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (corner || i % 4 === 0) {
      put(x, 1, z, "stone_bricks"); put(x, 2, z, "white_concrete");
    } else {
      put(x, 1, z, "glass"); put(x, 2, z, "glass");
      if (i % 4 === 2) { const b = behind(c, "E"); if (b) { put(b.x, 1, b.z, "glowstone"); } }
    }
    put(x, 3, z, "dark_oak_planks");
  } else if (outer.length === 1) {
    put(x, 1, z, "bricks");
    for (let y = 2; y <= 3; y++) put(x, y, z, BAY[along(c, face) % 5]);
  } else {
    for (let y = 1; y <= 3; y++) put(x, y, z, "stone_bricks");
  }

  // upper storey, y 5..6: sash windows on outer faces, quoins at the corners, plain brick on the steps
  if (corner) {
    put(x, 5, z, "stone_bricks"); put(x, 6, z, "stone_bricks");
  } else if (face && !front.includes(c)) {
    const p = along(c, face) % 5;
    const bay = Math.floor(along(c, face) / 5);
    const b = BAY[p];
    put(x, 5, z, b); put(x, 6, z, b);
    if (p === 2 && bay % 3 === 1) {
      const inner = behind(c, face);
      if (inner) { put(inner.x, 5, inner.z, "glowstone"); put(inner.x, 6, inner.z, "shroomlight"); }
    }
  } else if (face && front.includes(c)) {
    put(x, 5, z, "bricks"); put(x, 6, z, "bricks");
  } else {
    put(x, 5, z, "bricks"); put(x, 6, z, "bricks");
  }
}

const result = B.save(`${DIR}/way_293020922.nbt`);
console.log(`way_293020922: ${result.blocks} blocks, ${result.palette} palette entries`);
