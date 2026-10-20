import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329414.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329414.nbt";

const W = 12, H = 17, D = 7;
const raw = JSON.parse(readFileSync(CELLS, "utf8"));

// Footprint cells: key "x,z" -> { g: ground, r: lidar roof height }
const cells = new Map();
for (const c of raw) {
  const x = c[0], z = c[1];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(x + "," + z, {
    g: Math.max(0, Math.min(H - 6, Math.round(c[2]))),
    r: Math.round(c[3]),
  });
}
const has = (x, z) => cells.has(x + "," + z);

// Smooth the lidar roof into one flat parapet height (median), never below the
// local ground + 3 so every cell carries at least one storey.
const rs = [...cells.values()].map((c) => c.r).sort((a, b) => a - b);
const R = Math.min(H - 4, rs[Math.floor(rs.length / 2)]);

const g3 = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g3.set(x, y, z, b, p);
  else g3.set(x, y, z, b);
};

// Exterior face of a footprint cell (first missing neighbour); null if interior.
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
};
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const paneProps = (horiz) =>
  horiz
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const wallProps = { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" };

for (const [key, { g, r }] of cells) {
  const [x, z] = key.split(",").map(Number);
  const top = Math.max(R, g + 3);     // roof/cornice row
  const n = top - g;
  const S = Math.floor((n - 1) / 2);  // number of 2-block storeys
  const f = faceOf(x, z);
  const ext = !!f;

  // Foundation: granite plinth up to ground, polished base course at ground.
  for (let y = 0; y < g; y++) put(x, y, z, "granite");
  put(x, g, z, "polished_granite");

  // Interior floor slabs for upper storeys (no interiors, just slabs).
  for (let k = 1; k < S; k++) put(x, g + 1 + 2 * k, z, "smooth_stone");

  // Cornice / roof deck and parapet.
  put(x, top, z, ext ? "stone_bricks" : "smooth_stone");
  if (ext) put(x, top + 1, z, "stone_brick_wall", wallProps);

  // Odd leftover row under the cornice reads as a stone frieze.
  if (ext && (n - 1) % 2 === 1) put(x, top - 1, z, "stone_bricks");

  if (!ext) continue;

  const horiz = f === "N" || f === "S";
  const idx = horiz ? x : z;
  const len = horiz ? W : D;
  const pier = idx === 0 || idx === len - 1 || idx % 2 === 0;
  const pp = paneProps(horiz);

  for (let k = 0; k < S; k++) {
    const yb = g + 1 + 2 * k;
    // Lower row
    if (k === 0) {
      put(x, yb, z, pier ? "stone_bricks" : "glass");          // shopfront
    } else {
      put(x, yb, z, "stone_bricks");                            // sill / spandrel band
    }
    // Upper row
    const yt = yb + 1;
    if (k === 0) {
      if (pier) put(x, yt, z, "stone_bricks");
      else put(x, yt, z, "glass_pane", pp);                    // transom glass
    } else {
      if (pier) put(x, yt, z, "bricks");
      else {
        put(x, yt, z, "glass_pane", pp);
        // Warm light: glowstone on the interior cell behind some windows.
        if (idx % 6 === 1) {
          const [dx, dz] = inward[f];
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && !faceOf(ix, iz)) put(ix, yt, iz, "glowstone");
        }
      }
    }
  }
}

// Entrance on the north (low z, Manhattan side) face, centred on that face.
// Keep each candidate's own (x, z) so the lookup always matches a real cell.
const northCells = [];
for (const key of cells.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (faceOf(x, z) === "N") northCells.push([x, z]);
}
if (northCells.length) {
  northCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const [doorX, dz0] = northCells[Math.floor(northCells.length / 2)];
  const cell = cells.get(doorX + "," + dz0);
  const g = cell.g;
  put(doorX, g + 1, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, g + 2, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy over the entrance bay.
  for (let xx = doorX - 1; xx <= doorX + 1; xx++) {
    if (has(xx, dz0)) put(xx, g + 3, dz0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Brick chimney on the back (high z) row, using a real back-face cell.
const backCells = [];
for (const key of cells.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (faceOf(x, z) === "S") backCells.push([x, z]);
}
if (backCells.length) {
  backCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const [cx, cz] = backCells[Math.min(2, backCells.length - 1)];
  const cellC = cells.get(cx + "," + cz);
  const topC = Math.max(R, cellC.g + 3);
  put(cx, topC + 1, cz, "bricks");
  put(cx, topC + 2, cz, "bricks");
  put(cx, topC + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g3.save(OUT);
