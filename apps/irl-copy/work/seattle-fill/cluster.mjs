// Seattle Center south plaza cluster: one raised amphitheatre-plaza (SEA1270141931) and six open kiosk pavilions.
// Writes <id>.nbt for each id beside this script. Footprint cells come from the space-needle manifest.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill";
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const byId = new Map(manifest.buildings.map((b) => [b.id, b]));
const HEIGHT = 4, HMAX = HEIGHT + 6;
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// Edge distance inside a footprint: 1 for cells with an outside 4-neighbour, rising inward.
function edgeDistance(inF, cells) {
  const d = new Map(), q = [];
  for (const [x, z] of cells) {
    if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) { d.set(`${x},${z}`, 1); q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], dv = d.get(`${x},${z}`);
    for (const [dx, dz] of DIRS) {
      const k = `${x + dx},${z + dz}`;
      if (inF(x + dx, z + dz) && !d.has(k)) { d.set(k, dv + 1); q.push([x + dx, z + dz]); }
    }
  }
  return (x, z) => d.get(`${x},${z}`) ?? 0;
}

// Facing toward the neighbour with the smaller edge distance (the low side of a seat step).
function outwardFacing(x, z, dist) {
  const dv = dist(x, z);
  for (const [dx, dz, name] of DIRS) if (dist(x + dx, z + dz) === dv - 1) return name;
  return "south";
}

function build(id, box, fn) {
  const [x0, z0, x1, z1] = box;
  const b = byId.get(id);
  for (const [x, z] of b.footprint) if (x < x0 || x > x1 || z < z0 || z > z1) throw new Error(`${id}: cell ${x},${z} outside box`);
  const cells = b.footprint.map(([x, z]) => [x - x0, z - z0]);
  const set = new Set(cells.map(([x, z]) => `${x},${z}`));
  const inF = (x, z) => set.has(`${x},${z}`);
  const W = x1 - x0 + 1, D = z1 - z0 + 1;
  const dist = edgeDistance(inF, cells);
  const g = new Voxels([W, HMAX, D]);
  const bb = { x0: Math.min(...cells.map((c) => c[0])), x1: Math.max(...cells.map((c) => c[0])), z0: Math.min(...cells.map((c) => c[1])), z1: Math.max(...cells.map((c) => c[1])) };
  fn({ g, inF, cells, dist, bb, W, D });
  g.save(`${DIR}/${id}.nbt`);
  return { id, size: [W, HMAX, D], cells: cells.length, blocks: g.count() };
}

// ---- SEA1270141931: raised amphitheatre plaza --------------------------------------------------
function plaza({ g, inF, cells, dist, bb }) {
  const cxr = Math.round((bb.x0 + bb.x1) / 2), czr = Math.round((bb.z0 + bb.z1) / 2);
  const onPath = (x, z) => Math.abs(x - cxr) <= 1 || Math.abs(z - czr) <= 1;
  for (const [x, z] of cells) {
    const d = dist(x, z);
    g.set(x, 0, z, "stone_bricks");
    if (d === 1) {
      // rim wall: low kerb with a coping, linked to neighbouring rim cells
      const conn = (dx, dz) => (inF(x + dx, z + dz) && dist(x + dx, z + dz) === 1 ? "low" : "none");
      g.set(x, 1, z, "stone_brick_wall", { east: conn(1, 0), north: conn(0, -1), south: conn(0, 1), west: conn(-1, 0), up: "true", waterlogged: "false" });
      if ((x + z) % 6 === 0) { // lamp post on the rim: cobble wall stub with an end rod
        g.set(x, 2, z, "cobblestone_wall", { east: "none", north: "none", south: "none", west: "none", up: "true", waterlogged: "false" });
        g.set(x, 3, z, "end_rod", { facing: "up" });
      }
    } else if (d === 2) {
      g.set(x, 1, z, "stone_brick_stairs", { facing: outwardFacing(x, z, dist), half: "bottom", shape: "straight", waterlogged: "false" });
    } else if (d === 3) {
      g.set(x, 1, z, "stone_bricks");
      g.set(x, 2, z, "stone_brick_stairs", { facing: outwardFacing(x, z, dist), half: "bottom", shape: "straight", waterlogged: "false" });
    } else {
      g.set(x, 1, z, "stone_bricks");
      g.set(x, 2, z, "stone_bricks");
      g.set(x, 3, z, (x * 7 + z * 3) % 5 === 0 ? "grass_block" : "moss_block");
    }
  }
  // paved cross path through the flat centre (three wide)
  for (const [x, z] of cells) if (dist(x, z) >= 4 && onPath(x, z)) g.set(x, 3, z, "light_gray_concrete");
  // planter boxes: stone-brick trough, azalea in the middle
  for (const [ox, oz] of [[-7, -4], [5, -4], [-7, 4], [5, 4]]) {
    const row = [0, 1, 2].map((i) => [cxr + ox + i, czr + oz]);
    if (!row.every(([x, z]) => inF(x, z) && dist(x, z) >= 5 && !onPath(x, z))) continue;
    row.forEach(([x, z], i) => {
      g.set(x, 4, z, "stone_bricks");
      if (i === 1) g.set(x, 5, z, "flowering_azalea_leaves", { persistent: "true" });
    });
  }
  // round fountain at the centre: stone drum, shallow water basin, copper spire
  for (const [x, z] of cells) {
    const dx = x - cxr, dz = z - czr, r2 = dx * dx + dz * dz, d = dist(x, z);
    if (d < 4) continue;
    if (r2 === 0) {
      g.set(x, 3, z, "stone_bricks");
      g.set(x, 4, z, "exposed_copper"); g.set(x, 5, z, "exposed_copper");
      g.set(x, 6, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    } else if (r2 <= 2) {
      g.set(x, 3, z, "stone_bricks");
      g.set(x, 4, z, "water", { level: "0" });
    } else if (r2 <= 5) {
      g.set(x, 4, z, "stone_bricks"); g.set(x, 5, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// ---- kiosk pavilions: one family, two with a striped canopy -----------------------------------
function pavilion({ striped }) {
  return ({ g, inF, cells, dist, bb }) => {
    const R = { x0: bb.x0 + 1, x1: bb.x1 - 1, z0: bb.z0 + 1, z1: bb.z1 - 1 };
    for (const [x, z] of cells) {
      g.set(x, 0, z, "stone_bricks");
      g.set(x, 1, z, "smooth_stone");
      const eave = dist(x, z) === 1;
      if (striped) g.set(x, 4, z, (x - bb.x0) % 2 === 0 ? "red_wool" : "white_wool");
      else if (!eave) g.set(x, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
    // eaves: upper-half dark oak stairs on the footprint edge, sloping out to the outside neighbour
    if (!striped) for (const [x, z] of cells) {
      if (dist(x, z) !== 1) continue;
      const out = DIRS.find(([dx, dz]) => !inF(x + dx, z + dz));
      g.set(x, 4, z, "dark_oak_stairs", { facing: out[2], half: "top", shape: "straight", waterlogged: "false" });
    }
    // four corner posts on the footprint nearest each inset corner
    const corners = [[R.x0, R.z0], [R.x1, R.z0], [R.x0, R.z1], [R.x1, R.z1]];
    for (const [cx, cz] of corners) {
      const cand = cells.filter(([x, z]) => x >= R.x0 && x <= R.x1 && z >= R.z0 && z <= R.z1);
      cand.sort((a, b) => Math.abs(a[0] - cx) + Math.abs(a[1] - cz) - (Math.abs(b[0] - cx) + Math.abs(b[1] - cz)));
      const [px, pz] = cand[0];
      g.set(px, 2, pz, "stripped_spruce_log", { axis: "y" });
      g.set(px, 3, pz, "stripped_spruce_log", { axis: "y" });
    }
    // counter along the front row, a barrel behind it, hanging lanterns under the roof
    const counterZ = R.z0 + 1;
    for (let x = R.x0 + 1; x <= R.x1 - 1; x++) {
      if (!inF(x, counterZ)) continue;
      g.set(x, 2, counterZ, "spruce_planks");
      g.set(x, 3, counterZ, "spruce_slab", { type: "bottom", waterlogged: "false" });
    }
    if (inF(R.x1 - 1, R.z0)) g.set(R.x1 - 1, 2, R.z0, "barrel", { facing: "up", open: "false" });
    for (const [x, z] of [[R.x0 + 1, R.z1 - 1], [R.x1 - 1, R.z1 - 1]]) {
      if (z !== counterZ && inF(x, z)) g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  };
}

const SPECS = [
  ["SEA1270141931", [211, 359, 247, 394], plaza],
  ["SEA1270141932", [209, 365, 218, 372], pavilion({ striped: false })],
  ["SEA1270141933", [216, 360, 224, 367], pavilion({ striped: true })],
  ["SEA1270141935", [244, 381, 252, 389], pavilion({ striped: false })],
  ["SEA1270141936", [229, 393, 237, 401], pavilion({ striped: false })],
  ["SEA1270141937", [210, 391, 217, 398], pavilion({ striped: true })],
  ["SEA1270141938", [204, 383, 212, 392], pavilion({ striped: false })],
];
for (const [id, box, fn] of SPECS) console.log(JSON.stringify(build(id, box, fn)));
