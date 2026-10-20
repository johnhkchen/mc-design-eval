import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329409";
const W = 19, H = 29, D = 17;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: "x,z" -> ground (rounded)
const cells = new Map();
let Gb = Infinity;
for (const [x, z, gr] of raw) {
  const g = Math.round(gr);
  cells.set(`${x},${z}`, g);
  Gb = Math.min(Gb, g);
}
const has = (x, z) => cells.has(`${x},${z}`);
const gOf = (x, z) => cells.get(`${x},${z}`);

// Lidar roof: smooth to one flat roof height (median)
const rs = raw.map(c => Math.round(c[3])).sort((a, b) => a - b);
const T0 = rs[rs.length >> 1];
const topOf = (g) => Math.min(H - 7, Math.max(T0, g + 4));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const BRICK = "bricks";
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, ground slab, floor slabs per storey, roof deck
for (const [x, z, gr] of raw) {
  const gg = Math.round(gr);
  const T = topOf(gg);
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");
  put(x, gg, z, "smooth_stone");
  for (let y = gg + 1; y < T; y++) {
    if ((y - Gb) % 2 === 0) put(x, y, z, "smooth_stone");
  }
  put(x, T - 1, z, "stone");
}

// Entrance geometry: pick the lowest-z edge, centred
const minZ = Math.min(...raw.map(c => c[1]));
const edgeXs = raw.filter(c => c[1] === minZ).map(c => c[0]);
const cxEdge = edgeXs.length ? edgeXs.reduce((s, v) => s + v, 0) / edgeXs.length : W / 2;
const doorX = edgeXs.length
  ? edgeXs.reduce((best, v) => (Math.abs(v - cxEdge) < Math.abs(best - cxEdge) ? v : best), edgeXs[0])
  : W >> 1;

// Pass 2: perimeter walls, windows, cornice, storefront, lights
for (const [x, z, gr] of raw) {
  const gg = Math.round(gr);
  const T = topOf(gg);
  const faces = [];
  if (!has(x, z - 1)) faces.push({ a: x, inx: 0, inz: 1, pane: paneNS, edge: "N" });
  if (!has(x, z + 1)) faces.push({ a: x, inx: 0, inz: -1, pane: paneNS, edge: "S" });
  if (!has(x - 1, z)) faces.push({ a: z, inx: 1, inz: 0, pane: paneEW, edge: "W" });
  if (!has(x + 1, z)) faces.push({ a: z, inx: -1, inz: 0, pane: paneEW, edge: "E" });

  for (const f of faces) {
    for (let y = gg; y < T; y++) {
      let b = BRICK, p;
      let isWin = false;
      const onStreet = f.edge === "N" && Math.abs(x - doorX) <= 2;

      if (y === T - 1) b = "stone_brick_slab", p = { type: "bottom", waterlogged: "false" };
      else if (y === T - 2) b = "stone_bricks";                       // cornice course
      else if (y === Gb) b = "stone_bricks";                          // base course
      else if (y === Gb + 1 && f.edge === "N" && onStreet) {          // storefront glass band
        b = "glass";
      }
      else if ((y - Gb) % 2 === 0) b = "smooth_stone";                // storey string course
      else {
        if (f.a % 3 === 1) { b = "glass_pane"; p = f.pane; isWin = true; }
        else b = BRICK;                                               // piers
      }
      put(x, y, z, b, p);

      // warm light behind some windows, inside the room
      if (isWin && f.a % 6 === 1) {
        const nx = x + f.inx, nz = z + f.inz;
        if (has(nx, nz) && gOf(nx, nz) < y && y < T - 2) {
          put(nx, y, nz, "glowstone");
        }
      }
    }
  }
}

// Entrance: centred door, stone surround, canopy slab over it
{
  const cand = raw.find(c => c[1] === minZ && c[0] === doorX);
  if (cand) {
    const [dx, dz, gr] = cand;
    const gg = Math.round(gr);
    const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
    put(dx, gg, dz, "oak_door", doorProps("lower"));
    put(dx, gg + 1, dz, "oak_door", doorProps("upper"));
    // stone surround and canopy across the storefront head
    for (const ox of [-1, 1]) {
      if (has(dx + ox, dz)) {
        put(dx + ox, gg, dz, "stone_bricks");
      }
    }
    for (let ox = -2; ox <= 2; ox++) {
      if (has(dx + ox, dz)) {
        put(dx + ox, gg + 2, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
      }
    }
  }
}

// Rooftop water tank on a lower 3x3 plinth, if the footprint allows it
{
  const cx = W >> 1, cz = (D >> 1);
  let ok = true;
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) if (!has(x, z)) ok = false;
  if (ok) {
    let Tm = 0;
    for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) Tm = Math.max(Tm, topOf(gOf(x, z)));
    const base = Tm + 2;
    for (let x = cx - 1; x <= cx + 1; x++) {
      for (let z = cz - 1; z <= cz + 1; z++) {
        const T = topOf(gOf(x, z));
        for (let y = T; y < base; y++) put(x, y, z, "stone_bricks");
        for (let y = base; y < base + 2; y++) put(x, y, z, "spruce_planks");
        put(x, base + 2, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
