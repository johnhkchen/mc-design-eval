import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401868";
const W = 19, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const has = (x, z) => G.has(key(x, z));

const L0 = Math.min(...G.values());   // lowest ground under the footprint
const TOP = L0 + 11;                  // parapet top, about 11 blocks above lowest ground

const place = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// exposure of a footprint cell to each side
const expo = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => { const e = expo(x, z); return e.N || e.S || e.W || e.E; };

// entrance: median x of the cells on the lowest-z (north) edge
const zMin = Math.min(...cells.map(c => c[1]));
const edgeXs = cells.filter(c => c[1] === zMin).map(c => c[0]).sort((a, b) => a - b);
const doorX = edgeXs[Math.floor(edgeXs.length / 2)];
const doorZ = zMin;

const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. foundations, base course, interior floor slabs and walls
for (const [x, z, gr] of cells) {
  const e = expo(x, z);
  const perim = e.N || e.S || e.W || e.E;
  const axisZ = e.N || e.S;   // wall runs along x
  const axisX = e.W || e.E;   // wall runs along z
  const corner = axisZ && axisX;
  const idx = axisZ ? x : z;

  // foundation up to the cell's ground
  for (let y = 0; y < gr; y++) place(x, y, z, "stone_bricks");

  // base course / floor slab at the ground
  place(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  if (!perim) {
    // interior: floor slabs at storey lines and roof slab, air in between (no interiors)
    if (L0 + 5 > gr) place(x, L0 + 5, z, "light_gray_concrete");
    if (L0 + 10 > gr) place(x, L0 + 10, z, "gray_concrete");
    continue;
  }

  const isDoorCell = (x === doorX && z === doorZ);

  for (let y = gr + 1; y <= TOP; y++) {
    // entrance
    if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      place(x, y, z, "oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoorCell && y === gr + 3) { place(x, y, z, "smooth_stone"); continue; }

    const mullion = corner || (idx % 3 === 0);

    if (y <= L0 + 3) {
      // shopfront band
      if (mullion) place(x, y, z, "white_concrete");
      else place(x, y, z, "glass_pane", paneProps(axisZ));
    } else if (y === L0 + 4) {
      place(x, y, z, "red_terracotta");          // shop fascia
    } else if (y === L0 + 5) {
      place(x, y, z, "light_gray_concrete");     // storey line
    } else if (y <= L0 + 8) {
      // upper storey windows
      if (mullion) place(x, y, z, "white_concrete");
      else place(x, y, z, "glass_pane", paneProps(axisZ));
    } else if (y === L0 + 9) {
      place(x, y, z, "white_concrete");          // lintel band
    } else if (y === L0 + 10) {
      place(x, y, z, "light_gray_concrete");     // cornice
    } else {
      place(x, y, z, "white_concrete");          // parapet
    }
  }
}

// 2. interior floor slabs at the ground for interior cells already set; roof slab on perimeter cornice
//    is the cornice itself, interior roof slab already placed at L0+10

// 3. warm lights: lamps just inside some upper-storey windows, lantern inside the entrance
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const e = expo(x, z);
  const idx = (e.N || e.S) ? x : z;
  if (idx % 3 !== 1) continue;
  let ix = x, iz = z;
  if (e.N) iz = z + 1;
  else if (e.S) iz = z - 1;
  else if (e.W) ix = x + 1;
  else if (e.E) ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  place(ix, L0 + 6, iz, "glowstone");
}
if (has(doorX, doorZ + 1) && !isPerim(doorX, doorZ + 1)) {
  place(doorX, doorZ + 1 >= 0 ? (cells.find(c => c[0] === doorX && c[1] === doorZ)[2] + 1) : 0, doorZ + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// 4. roof equipment: a water tank and an AC unit on interior roof cells near the centre
const interior = cells.filter(([x, z]) => !isPerim(x, z));
if (interior.length) {
  const cxm = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const czm = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  const sorted = [...interior].sort((a, b) =>
    Math.hypot(a[0] - cxm, a[1] - czm) - Math.hypot(b[0] - cxm, b[1] - czm));
  const [tx, tz] = sorted[0];
  for (const [x, z] of interior) {
    if (Math.abs(x - tx) <= 1 && Math.abs(z - tz) <= 1 && (x === tx || z === tz)) {
      place(x, TOP, z, "light_gray_concrete");
      place(x, TOP + 1, z, "light_gray_concrete");
    }
  }
  if (sorted[1]) {
    const [ax, az] = sorted[sorted.length - 1];
    place(ax, TOP, az, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
