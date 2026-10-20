import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608963";
const W = 13, H = 23, D = 15;

// Two storeys of ~5 blocks, flat roof deck at y=10, parapet at y=11, rooftop plant to y=13.
const STOREY_LINE = 5;
const ROOF_DECK = 10;
const PARAPET = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, g] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(g)));
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exposed faces of a footprint cell: a face exists where the neighbour is outside the footprint.
function exposed(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ dir: "north", dx: 0, dz: -1, t: x });
  if (!has(x, z + 1)) f.push({ dir: "south", dx: 0, dz: 1, t: x });
  if (!has(x - 1, z)) f.push({ dir: "west", dx: -1, dz: 0, t: z });
  if (!has(x + 1, z)) f.push({ dir: "east", dx: 1, dz: 0, t: z });
  return f;
}

// Entrance: the north-facing exposed cell on the minimum-z row, nearest the centre line.
const minZ = Math.min(...cells.map(([, z]) => z));
const northRow = cells.filter(([x, z]) => z === minZ && !has(x, z - 1)).map(([x]) => x);
const cxAll = cells.reduce((s, [x]) => s + x, 0) / cells.length;
let doorX = null;
for (const x of northRow) {
  if (doorX === null || Math.abs(x - cxAll) < Math.abs(doorX - cxAll)) doorX = x;
}

const isDoorCell = (x, z) => x === doorX && z === minZ;

// Pass 1: foundations, floors, walls, roof.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = gnd(x, z);
  const faces = exposed(x, z);
  const perimeter = faces.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior: floor slab, storey slab, roof deck; air between (behind the glass).
    put(x, gr, z, "smooth_stone");
    if (gr < STOREY_LINE) put(x, STOREY_LINE, z, "smooth_stone");
    put(x, ROOF_DECK, z, "smooth_stone");
    continue;
  }

  const pillarCell = faces.length > 1;
  const t = faces[0].t;
  const pillar = pillarCell || t % 3 === 0;
  const door = isDoorCell(x, z);

  for (let y = gr; y <= ROOF_DECK; y++) {
    if (y === gr) {
      put(x, y, z, "polished_andesite"); // base course
    } else if (y <= 4) {
      if (door && y <= gr + 2) {
        const top = y === gr + 2;
        put(x, y, z, "oak_door", {
          facing: "north",
          half: top ? "upper" : "lower",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (door && y === gr + 3) {
        put(x, y, z, "stone_bricks"); // lintel
      } else if (pillar) {
        put(x, y, z, "stone_bricks");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    } else if (y === STOREY_LINE) {
      put(x, y, z, "smooth_quartz"); // storey line
    } else if (y <= 9) {
      put(x, y, z, pillar ? "white_terracotta" : "light_blue_stained_glass");
    } else {
      put(x, y, z, "smooth_quartz"); // cornice
    }
  }

  // Parapet on the perimeter.
  put(x, PARAPET, z, "white_concrete");
  // Roof deck is already set at ROOF_DECK under the cornice.
}

// Pass 2: warm lights just inside some window bays (standing on the floor below).
for (const [x, z] of cells) {
  const gr = gnd(x, z);
  const faces = exposed(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0];
  if (f.t % 3 === 0) continue;
  if (isDoorCell(x, z)) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || exposed(ix, iz).length > 0) continue;
  const gi = gnd(ix, iz);

  // Ground storey lantern.
  if (gi <= 3 && (f.t + z) % 4 === 2) {
    put(ix, gi + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Upper storey shroomlight on the storey floor at y=6.
  if (gi <= STOREY_LINE && (f.t + z) % 4 === 1) {
    put(ix, STOREY_LINE + 1, iz, "shroomlight");
  }
}

// Pass 3: rooftop plant, a 2x2 stone block with a slab cap, near the centre of the roof.
const cxm = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const czm = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let best = null;
for (let a = 0; a < W - 1; a++) {
  for (let b = 0; b < D - 1; b++) {
    const quad = [[a, b], [a + 1, b], [a, b + 1], [a + 1, b + 1]];
    const ok = quad.every(([x, z]) => has(x, z) && exposed(x, z).length === 0 && gnd(x, z) <= ROOF_DECK);
    if (!ok) continue;
    const d = Math.hypot(a + 0.5 - cxm, b + 0.5 - czm);
    if (!best || d < best.d) best = { a, b, d };
  }
}
if (best) {
  for (const [x, z] of [[best.a, best.b], [best.a + 1, best.b], [best.a, best.b + 1], [best.a + 1, best.b + 1]]) {
    put(x, PARAPET, z, "stone_bricks");
    put(x, PARAPET + 1, z, "stone_bricks");
    put(x, PARAPET + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
