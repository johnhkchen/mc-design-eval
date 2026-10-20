import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block, two storeys, tiled white walls,
// glass shopfronts, stone base and cornice, flat roof with parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833593";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const grounds = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => grounds.has(key(x, z));

// Outward directions: [face, dx, dz, along-wall axis]
const FACES = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];

const outwardFaces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));
const isPerimeter = (x, z) => outwardFaces(x, z).length > 0;

const paneProps = (along) => ({
  north: along === "z" ? "true" : "false",
  south: along === "z" ? "true" : "false",
  east: along === "x" ? "true" : "false",
  west: along === "x" ? "true" : "false",
  waterlogged: "false",
});

// Pick entrance on the south face near the middle of its run.
const southCells = cells.filter(([x, z]) => !has(x, z + 1)).map(([x, z, gr]) => ({ x, z, gr }));
let entrance = null;
if (southCells.length) {
  const xs = southCells.map((c) => c.x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  entrance = southCells.reduce((best, c) => (Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best));
}

// Pass 1: foundations, base course, floor slab, roof.
for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.min(gr, 9));
  const perim = isPerimeter(x, z);

  // Solid foundation from y0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  // Base course at the cell's ground.
  put(x, gg, z, perim ? "stone_bricks" : "smooth_stone");

  // Storey slab at y=5 (only where it is above ground).
  if (gg <= 5) put(x, 5, z, perim ? "smooth_stone" : "light_gray_concrete");

  // Roof: parapet ring on the perimeter, gray deck inside.
  put(x, 10, z, perim ? "white_concrete" : "light_gray_concrete");
}

// Pass 2: perimeter walls, windows, piers, cornice.
for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.min(gr, 9));
  for (const face of outwardFaces(x, z)) {
    const u = face.along === "x" ? x : z;
    const props = paneProps(face.along);
    for (let y = gg + 1; y <= 9; y++) {
      if (y === 5) {
        put(x, y, z, "smooth_stone");
      } else if (y === 9) {
        put(x, y, z, "light_gray_concrete");
      } else if (u % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", props);
      }
    }
  }
}

// Pass 3: entrance on the south face, with glass door and lintel.
if (entrance && entrance.gr + 2 <= 4) {
  const gg = Math.max(0, Math.min(entrance.gr, 9));
  const { x, z } = entrance;
  put(x, gg + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gg + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gg + 3, z, "light_gray_concrete");
}

// Pass 4: warm light behind some glass, placed on the inside cell.
for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.min(gr, 9));
  for (const face of outwardFaces(x, z)) {
    const u = face.along === "x" ? x : z;
    if (u % 3 === 0) continue;
    for (const y of [2, 3, 7, 8]) {
      if (y <= gg) continue;
      if ((u * 5 + y * 3 + (face.dx + face.dz + 2) * 2) % 7 !== 0) continue;
      const ix = x - face.dx, iz = z - face.dz;
      if (has(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Pass 5: roof equipment (a few condenser units) on interior roof cells.
for (const [x, z, gr] of cells) {
  if (isPerimeter(x, z)) continue;
  if (x % 5 === 2 && z % 6 === 2) {
    put(x, 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
