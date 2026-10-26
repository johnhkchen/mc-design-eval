import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Notre-Dame, 1900 residential block: 7 storeys of pale Paris limestone (calcite walls, stone-brick quoins and
// plinth), a dark slate mansard with dormers, and a stepped roof that follows the lidar's 33 / 31 / 30 tiers.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937486.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..38

const DATUM = 2;                       // the street floor, absolute y, shared by every cell so storey lines align
const STOREY = [2, 7, 11, 15, 19, 23]; // floor lines: RDC, then 4-block upper floors
const ATTIC = 27;                      // mansard starts above the fifth floor (7 storeys in all: RDC, 5 floors, attic)
const DOOR = { x: 0, z: 12 };          // west (street) facade, on a pier so the door replaces stone, not a window

// per-cell record: ground, top layer (the last solid layer), perimeter flag
const rec = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) {
  // lidar roof tiers, smoothed: main block 33 (top layer 32), front end 30 (layer 29), rear wing 31 (layer 30)
  const T = z <= 0 ? 29 : z >= 29 ? 30 : 32;
  rec.set(key(x, z), { x, z, ground, T, roof });
}
const inFoot = (x, z) => rec.has(key(x, z));
// exposed face: a neighbour outside the footprint, or a lower tier next door (a step in the roof)
const faces = (c) => {
  const out = [];
  for (const [dx, dz, name] of [[-1, 0, "W"], [1, 0, "E"], [0, -1, "N"], [0, 1, "S"]]) {
    const n = rec.get(key(c.x + dx, c.z + dz));
    if (!n || n.T < c.T) out.push({ dx, dz, name });
  }
  return out;
};
for (const c of rec.values()) { c.faces = faces(c); c.perim = c.faces.length > 0; }

const B = new Map();                               // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => B.get(`${x},${y},${z}`);
const STONE = "calcite", QUOIN = "stone_bricks", TRIM = "smooth_stone", SLATE = "deepslate_tiles", PANE = "glass_pane";

for (const c of rec.values()) {
  const { x, z, T } = c;
  // plinth: solid stone up to the datum under every cell, so the downhill side carries its extra storeys
  for (let y = 0; y < DATUM; y++) put(x, y, z, QUOIN);
  // roof: stone cornice on the walls, dark slate cap inside
  if (c.perim) put(x, T, z, QUOIN); else put(x, T, z, SLATE);
  if (!c.perim) {
    for (const f of STOREY) if (f < T) put(x, f, z, TRIM);   // interior floor slabs, one per storey: no air under a floor
    continue;
  }
  const corner = c.faces.length >= 2;
  const f0 = c.faces[0];
  const p = f0 && (f0.dx !== 0 ? z : x);                    // position along the facade
  for (let y = DATUM; y < T; y++) {
    let block = null;
    if (corner) block = QUOIN;                                // quoins: stone-brick corner columns
    else if (y < ATTIC) {
      if (y === DATUM) block = QUOIN;                         // base course
      else if (y === 6 || y === 10 || y === 14 || y === 18 || y === 22 || y === 26) block = TRIM;   // lintels
      else if (STOREY.includes(y)) block = TRIM;             // sills and string courses
      else block = (p % 3 === 0) ? STONE : PANE;             // piers and window bays, 2-wide panes
    } else if (y === ATTIC) block = TRIM;                    // mansard string course
    else block = (y <= ATTIC + 2 && p % 3 === 1) ? PANE : SLATE;  // dormers in the slate
    if (c.x === DOOR.x && c.z === DOOR.z && (y === 2 || y === 3)) block = "door";
    if (c.x === DOOR.x && c.z === DOOR.z && y >= 4 && y <= 5) block = STONE;
    if (block === "door") put(x, y, z, "dark_oak_door", { facing: "east", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else put(x, y, z, block === PANE ? PANE : block);
  }
  // interior floor slab below the datum for cells whose ground is lower: already covered by the plinth
}

// glass panes: connect to their neighbours like the vanilla pane, to panes and to full solid blocks
const SOLID = new Set([STONE, QUOIN, TRIM, SLATE, "glowstone"]);
for (const [k, v] of B) {
  if (v.block !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => { const n = get(x + dx, y, z + dz); return n && (n.block === PANE || SOLID.has(n.block)); };
  v.state = { north: String(!!side(0, -1)), south: String(!!side(0, 1)), east: String(!!side(1, 0)), west: String(!!side(-1, 0)), waterlogged: "false" };
}

// warm light behind some upper-floor windows (glowstone in the room behind the pane; interiors stay air)
let lights = 0;
for (const c of rec.values()) {
  if (!c.perim || c.faces.length !== 1 || c.T <= ATTIC) continue;
  const f = c.faces[0], p = f.dx !== 0 ? c.z : c.x;
  for (const floor of STOREY.slice(1)) {
    const y = floor + 1;
    if (y >= ATTIC || get(c.x, y, c.z)?.block !== PANE) continue;
    if ((p + floor) % 5 !== 0) continue;
    const ix = c.x - f.dx, iz = c.z - f.dz;
    if (!inFoot(ix, iz) || rec.get(key(ix, iz)).perim) continue;
    put(ix, y, iz, "glowstone"); lights++;
  }
}

// roof equipment: brick chimney stacks standing on the slate cap, interior cells only
const chimneys = [];
for (const z of [6, 16, 26, 34]) {
  for (const x of [3, 4, 5, 6, 2, 7]) {
    const c = rec.get(key(x, z));
    if (!c || c.perim || c.T !== 32) continue;
    for (let y = 33; y <= 35; y++) put(x, y, z, "bricks");
    put(x, 36, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    chimneys.push([x, z]); break;
  }
}

const g = new Voxels([10, 49, 39]);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937486.nbt");
console.log(JSON.stringify({ ...stats, lights, chimneys }));
