import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${dir}/NYC1079112.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const W = 9, H = 26, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raws = new Map();
for (const [x, z, gr, roof] of cells) {
  raws.set(key(x, z), { gr: Math.round(gr), roof: Math.round(roof) });
}

// Smooth lidar noise: median over the 3x3 neighbourhood present in the footprint
function median(vals) {
  const s = [...vals].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
const cellMap = new Map();
for (const [x, z] of [...raws.keys()].map(k => k.split(",").map(Number))) {
  const gs = [], rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = raws.get(key(x + dx, z + dz));
    if (c) { gs.push(c.gr); rs.push(c.roof); }
  }
  const self = raws.get(key(x, z));
  // Ground: keep the lowest-ground base flat-ish; roof: snap to whole storeys (even heights)
  const gr = Math.round(median(gs));
  let roof = Math.round(median(rs));
  roof = Math.min(roof, H - 4);
  roof = Math.max(roof, gr + 6);
  cellMap.set(key(x, z), { gr, roof: Math.min(roof, H - 4) });
}

const isCell = (x, z) => cellMap.has(key(x, z));
const isPerim = (x, z) => {
  if (!isCell(x, z)) return false;
  return !isCell(x, z - 1) || !isCell(x, z + 1) || !isCell(x - 1, z) || !isCell(x + 1, z);
};

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const faces = {
  n: { dx: 0, dz: -1, ix: 0, iz: 1, facing: "north" },
  s: { dx: 0, dz: 1, ix: 0, iz: -1, facing: "south" },
  w: { dx: -1, dz: 0, ix: 1, iz: 0, facing: "west" },
  e: { dx: 1, dz: 0, ix: -1, iz: 0, facing: "east" },
};

// Pass 1: solid shell and foundations
for (const [k, { gr, roof }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const floors = [];
  for (let f = gr + 3; f <= roof - 4; f += 2) floors.push(f);

  if (!isPerim(x, z)) {
    // Interior: floor slabs and roof deck only; air otherwise
    put(x, gr, z, "smooth_stone");
    floors.forEach(f => put(x, f, z, "smooth_stone"));
    put(x, roof - 1, z, "smooth_stone");
    continue;
  }

  // Exterior: brick walls, granite base, stone cornice, parapet
  for (let y = gr; y <= roof - 3; y++) put(x, y, z, "bricks");
  put(x, gr, z, "polished_granite");
  put(x, roof - 2, z, "stone_bricks");
  put(x, roof - 1, z, "stone_brick_wall");
  floors.forEach(f => put(x, f, z, "smooth_stone"));
}

// Pass 2: facade articulation, entrance, lights
for (const [k, { gr, roof }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;

  const floors = [];
  for (let f = gr + 3; f <= roof - 4; f += 2) floors.push(f);

  for (const [name, F] of Object.entries(faces)) {
    if (isCell(x + F.dx, z + F.dz)) continue; // not exposed
    const idx = F.dz !== 0 ? x : z;
    const bay = idx % 2 === 1;
    const inX = x + F.ix, inZ = z + F.iz;
    const canLight = isCell(inX, inZ) && !isPerim(inX, inZ);

    // Ground floor: entrance on the street (n) face, shopfront glass elsewhere
    if (name === "n" && x === 4) {
      // Granite jambs and lintel around the door
      put(x - 1, gr + 1, z, "polished_granite");
      put(x - 1, gr + 2, z, "polished_granite");
      put(x + 1, gr + 1, z, "polished_granite");
      put(x + 1, gr + 2, z, "polished_granite");
      put(x, gr + 1, z, "oak_door", { facing: F.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: F.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (bay) {
      put(x, gr + 1, z, "glass_pane");
      put(x, gr + 2, z, "glass_pane");
      if (canLight && (idx + gr) % 3 === 0) put(inX, gr + 1, inZ, "glowstone");
    } else {
      // Pier: stone-brick pilaster on the ground floor
      put(x, gr + 1, z, "stone_bricks");
      put(x, gr + 2, z, "stone_bricks");
    }

    // Upper storeys: window row per storey, stone piers between
    floors.forEach((f, si) => {
      if (bay) {
        put(x, f + 1, z, "glass_pane");
        if (canLight && (idx + si) % 3 === 0) put(inX, f + 1, inZ, "glowstone");
      } else {
        put(x, f + 1, z, "stone_bricks");
      }
    });
  }
}

// Roof chimney on a roof-level interior cell
for (const [k, { roof }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (x === 2 && z === 5 && !isPerim(x, z)) {
    put(x, roof, z, "bricks");
    put(x, roof + 1, z, "bricks");
    put(x, roof + 2, z, "stone_brick_slab");
  }
}

g.save(`${dir}/NYC1079112.nbt`);
