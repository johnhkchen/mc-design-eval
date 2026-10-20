import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district office tower, Taipei: 1990s-2000s glass-and-concrete mid-rise.
// 15 storeys: a 3-storey shopfronted podium, a 9-storey glass shaft with
// a setback, a 3-storey crown with a second setback, and a roof plant room.
// Floors sit on absolute levels (y = 0 is the lowest ground), so every tier
// rests on the one below and foundations fill down to each cell's ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650499";
const W = 26, H = 86, D = 29;

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x, z, Math.round(gr)]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const inFp = (x, z) => ground.has(key(x, z));

// Edge distance: 0 on the footprint perimeter, growing inward (multi-source BFS).
const distMap = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (N4.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
    distMap.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = distMap.get(key(x, z));
  for (const [dx, dz] of N4) {
    const nx = x + dx, nz = z + dz, k = key(nx, nz);
    if (inFp(nx, nz) && !distMap.has(k)) {
      distMap.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dist = (x, z) => distMap.get(key(x, z)) ?? -1;
const inS = (k, x, z) => inFp(x, z) && dist(x, z) >= k;
const outsOf = (x, z, k) => N4.filter(([dx, dz]) => !inS(k, x + dx, z + dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Tiers: inset k from the footprint edge, from y0 up to y1 (absolute).
const TIERS = [
  { k: 0, y0: 0,  y1: 15, shop: true, glass: "light_blue_stained_glass_pane", cornice: true },  // podium
  { k: 2, y0: 15, y1: 60, glass: "cyan_stained_glass_pane", cornice: true },                    // shaft
  { k: 5, y0: 60, y1: 74, glass: "light_blue_stained_glass_pane", cornice: true },              // crown
  { k: 9, y0: 74, y1: 80, solid: true },                                                        // roof plant
];

function facade(x, y, z, t, outs, gr) {
  const [ox, oz] = outs[0];
  const corner = outs.length > 1;
  const alongX = oz !== 0;               // face runs east-west
  const along = alongX ? x : z;
  const r = (y - t.y0) % 5;              // row within storey: 0 = floor line
  const pane = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const mullion = corner || along % 3 === 0;

  if (t.cornice && y === t.y1 - 1) return put(x, y, z, "polished_andesite");

  if (t.shop && y < 5) {                 // shopfront ground storey
    if (y === gr) return put(x, y, z, "polished_granite");
    if (mullion) return put(x, y, z, "gray_concrete");
    return put(x, y, z, "glass_pane", pane);
  }

  if (t.solid) return put(x, y, z, r === 0 ? "white_concrete" : "light_gray_concrete");

  if (r === 0) return put(x, y, z, "white_concrete");     // spandrel / storey line
  if (mullion) return put(x, y, z, "light_gray_concrete"); // frame

  put(x, y, z, t.glass, pane);
  // Warm light a block behind some panes (air gap stays between them).
  if (r === 2 && (x * 31 + y * 17 + z * 13) % 7 === 0) {
    const ix = x - ox, iz = z - oz;
    if (inS(t.k + 1, ix, iz)) put(ix, y, iz, "glowstone");
  }
}

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Tier walls, floors and interior air.
for (const t of TIERS) {
  for (const [x, z, gr] of cells) {
    if (dist(x, z) < t.k) continue;
    const outs = outsOf(x, z, t.k);
    for (let y = Math.max(gr, t.y0); y < t.y1; y++) {
      if (outs.length) facade(x, y, z, t, outs, gr);
      else if ((y - t.y0) % 5 === 0) put(x, y, z, "gray_concrete"); // floor slab
    }
  }
}

// 3. Setback terraces, roof slabs and parapets.
TIERS.forEach((t, i) => {
  const next = TIERS[i + 1];
  for (const [x, z] of cells) {
    if (dist(x, z) < t.k) continue;
    const inNext = next ? dist(x, z) >= next.k : false;
    if (inNext) continue;
    put(x, t.y1, z, "smooth_stone");                         // roof / terrace surface
    if (outsOf(x, z, t.k).length) put(x, t.y1 + 1, z, "light_gray_concrete"); // parapet
  }
});

// 4. Entrance on the south (or north) podium face: a wider lintel canopy,
//    the door itself, and two lanterns flanking it at eye level.
{
  let cand = cells.filter(([x, z]) => dist(x, z) === 0 && !inFp(x, z + 1));
  let facing = "south";
  if (!cand.length) {
    cand = cells.filter(([x, z]) => dist(x, z) === 0 && !inFp(x, z - 1));
    facing = "north";
  }
  if (cand.length) {
    const mx = cand.reduce((s, c) => s + c[0], 0) / cand.length;
    const [dx, dz, dgr] = cand.reduce((a, b) => (Math.abs(b[0] - mx) < Math.abs(a[0] - mx) ? b : a));

    // Canopy: lintel across the entrance bay, wider than the door.
    for (const ax of [dx - 2, dx - 1, dx, dx + 1, dx + 2]) {
      if (inFp(ax, dz) && dist(ax, dz) === 0) {
        put(ax, dgr + 2, dz, "light_gray_concrete");
      }
    }
    // Flanking lanterns on the shopfront row, standing on the granite base.
    for (const ax of [dx - 2, dx + 2]) {
      if (inFp(ax, dz) && dist(ax, dz) === 0) {
        put(ax, dgr + 1, dz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }

    const doorProps = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
    put(dx, dgr, dz, "dark_oak_door", doorProps("lower"));
    put(dx, dgr + 1, dz, "dark_oak_door", doorProps("upper"));
  }
}

// 5. Roof mast on the plant room, centred.
{
  const top = cells.filter(([x, z]) => dist(x, z) >= 9);
  if (top.length) {
    const cx = top.reduce((s, c) => s + c[0], 0) / top.length;
    const cz = top.reduce((s, c) => s + c[1], 0) / top.length;
    const [mx, mz] = top.reduce((a, b) =>
      Math.hypot(b[0] - cx, b[1] - cz) < Math.hypot(a[0] - cx, a[1] - cz) ? b : a);
    for (let y = 81; y <= 84; y++) {
      put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
