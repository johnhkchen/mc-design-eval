import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86649.cells.json`, "utf8"));

const W = 12, H = 20, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  map.set(key(x, z), { g: gr, r: rf });
}

// Flat roof tier: median of lidar roof heights, cells within 1 block snap to it
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const med = Math.round(roofs[Math.floor(roofs.length / 2)]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const faces = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "east", dx: 1, dz: 0, along: "z" },
  { name: "west", dx: -1, dz: 0, along: "z" },
];

// Roof tier per cell
const info = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  let R = Math.round(c[3]);
  if (Math.abs(R - med) <= 1) R = med;
  R = Math.min(R, H - 4);
  R = Math.max(R, gr + 7);
  info.set(key(x, z), { g: gr, R });
}

const exposure = (x, z) => faces.filter((f) => !map.has(key(x + f.dx, z + f.dz)));

// South-facing entrance cell nearest the centre
let doorKey = null;
{
  let best = Infinity;
  for (const c of cells) {
    const [x, z] = c;
    if (exposure(x, z).some((f) => f.name === "south")) {
      const d = Math.abs(x - (W - 1) / 2);
      if (d < best) { best = d; doorKey = key(x, z); }
    }
  }
}

// Is the voxel at y a floor or ceiling slab for an interior cell?
const isFloor = (gr, R, y) =>
  y === gr || y === R - 1 || (y >= gr + 4 && y < R - 1 && (y - (gr + 1)) % 3 === 0);

for (const c of cells) {
  const [x, z] = c;
  const { g: gr, R } = info.get(key(x, z));
  const ex = exposure(x, z);
  const isWall = ex.length > 0;
  const isCorner = ex.length >= 2;

  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isWall) {
    // Interior: ground floor slab, storey slabs, roof deck; air between
    put(x, gr, z, "smooth_stone");
    for (let f = gr + 4; f < R - 1; f += 3) put(x, f, z, "smooth_stone");
    put(x, R - 1, z, "smooth_stone");
    continue;
  }

  // Base course
  put(x, gr, z, "stone_bricks");

  // Brick walls with stone floor bands
  for (let y = gr + 1; y <= R - 1; y++) {
    const band = y === gr + 1 || (y > gr + 1 && (y - (gr + 1)) % 3 === 0);
    put(x, y, z, band ? "smooth_stone" : "bricks");
  }
  // Stone quoins at corners
  if (isCorner) {
    for (let y = gr + 1; y <= R - 1; y++) put(x, y, z, "stone_bricks");
  }

  // Cornice: slab on every wall cell, so the parapet line stays level
  put(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Windows on non-corner wall cells
  if (!isCorner) {
    const face = ex[0];
    const a = face.along === "x" ? x : z;
    if (a % 2 === 1) {
      const alongX = face.along === "x";
      const paneProps = {
        north: alongX ? "true" : "false",
        south: alongX ? "true" : "false",
        east: alongX ? "false" : "true",
        west: alongX ? "false" : "true",
        waterlogged: "false",
      };
      for (let s = 0; ; s++) {
        const f = gr + 1 + 3 * s;
        if (f + 1 > R - 2) break;
        // Two-row window where it fits, otherwise a single-row transom window
        const rows = f + 2 <= R - 2 ? [f + 1, f + 2] : [f + 1];
        for (const yy of rows) put(x, yy, z, "glass_pane", paneProps);

        // Warm light hanging inside behind some windows
        const lr = rows[rows.length - 1];
        if ((a + s) % 4 === 1) {
          const ix = x - face.dx, iz = z - face.dz;
          if (map.has(key(ix, iz)) && exposure(ix, iz).length === 0 && isFloor(gr, R, lr + 1)) {
            put(ix, lr, iz, "lantern", { hanging: "true", waterlogged: "false" });
          }
        }
      }
    }
  }

  // Entrance on the south face, with a stone lintel
  if (key(x, z) === doorKey) {
    put(x, gr + 1, z, "spruce_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "spruce_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    const ix = x, iz = z - 1;
    if (map.has(key(ix, iz)) && exposure(ix, iz).length === 0 && isFloor(gr, R, gr + 4)) {
      put(ix, gr + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Roof plant on the deck near the centre: a solid block with a slab cap
{
  let best = null, bd = Infinity;
  for (const c of cells) {
    const [x, z] = c;
    if (exposure(x, z).length === 0) {
      const d = Math.abs(x - 5.5) + Math.abs(z - 2.5);
      if (d < bd) { bd = d; best = [x, z]; }
    }
  }
  if (best) {
    const [x, z] = best;
    const { R } = info.get(key(x, z));
    put(x, R, z, "stone_bricks");
    put(x, R + 1, z, "stone_bricks");
    if (R + 2 < H) put(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86649.nbt`);
