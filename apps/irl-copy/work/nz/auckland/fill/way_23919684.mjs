// A 1960s reinforced-concrete office block on the slope below Mt Eden: a five-storey body with a sixth-storey tower
// stepping up from its middle (lidar: body roof ~22 blocks, tower ~26). White concrete piers and spandrels frame
// tinted glazing on a 3-block bay, a stone plinth at the street, a cornice and parapet at each roof tier, plant on
// the roofs. Everything sits on a solid core; each storey is a floor line, two window rows (glass, a 1-block air gap
// behind it with a lantern on the floor line now and then), and a spandrel.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23919684.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 115, D = 69, H = 39;
const TOWER_ROOF = 26, BODY_ROOF = 22, TOWER_MIN_LIDAR = 24, TOWER_MIN_CELLS = 40;  // lidar roofs 21-23 read as the body tier, 24-26 as the tower

const idx = (x, z) => z * W + x;
const inside = new Uint8Array(W * D);
const ground = new Int16Array(W * D);      // smoothed over the footprint (3x3 mean): the lidar's per-cell ground is noisy
const top = new Int16Array(W * D);         // flat roof tier
const raw = new Map();
for (const [x, z, g, r] of cells) { inside[idx(x, z)] = 1; raw.set(idx(x, z), g); top[idx(x, z)] = r >= TOWER_MIN_LIDAR ? TOWER_ROOF : BODY_ROOF; }
// lidar specks: a tower tier is one mass; 4-connected clumps under TOWER_MIN_CELLS cells are noise, and stay body
{
  const seen = new Uint8Array(W * D);
  for (const [x0, z0] of cells) {
    const s = idx(x0, z0); if (seen[s] || top[s] !== TOWER_ROOF) continue;
    const comp = [], stack = [s]; seen[s] = 1;
    while (stack.length) {
      const i = stack.pop(); comp.push(i);
      const x = i % W, z = Math.floor(i / W);
      for (const [xx, zz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
        if (xx < 0 || zz < 0 || xx >= W || zz >= D) continue;
        const j = idx(xx, zz); if (seen[j] || !inside[j] || top[j] !== TOWER_ROOF) continue;
        seen[j] = 1; stack.push(j);
      }
    }
    if (comp.length < TOWER_MIN_CELLS) for (const i of comp) top[i] = BODY_ROOF;
  }
}
for (const [x, z] of cells) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= D || !inside[idx(xx, zz)]) continue;
    s += raw.get(idx(xx, zz)); n++;
  }
  ground[idx(x, z)] = Math.round(s / n);
}
const ins = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inside[idx(x, z)] === 1;
const T = (x, z) => top[idx(x, z)];
const G = (x, z) => ground[idx(x, z)];
const NB = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];

// a neighbour is open to the air at height y when it is off the footprint or stands below y above its own roof
const open = (x, z, y) => !ins(x, z) || y >= T(x, z);
const faces = (x, z, y) => NB.filter(({ dx, dz }) => open(x + dx, z + dz, y));
const ring = (x, z, y) => ins(x, z) && y >= G(x, z) && y < T(x, z) && faces(x, z, y).length > 0;

// the 1-block-deep facade ring of the cells that stand at y: glass, piers, spandrels, floor lines, cornice, parapet
function facade(x, z, y) {
  const top_ = T(x, z), fs = faces(x, z, y);
  if (y === 0) return "stone_bricks";                     // street plinth
  if (y === top_ - 2) return "smooth_stone";             // cornice
  if (y === top_ - 1) return "white_concrete";           // parapet cap
  const m = y % 4;
  if (m === 0) return "smooth_stone";                    // floor line
  if (m === 3) return "white_concrete";                  // spandrel
  const corner = fs.some((f) => f.dx !== 0) && fs.some((f) => f.dz !== 0);
  const pier = corner || fs.some((f) => (f.dz !== 0 ? x % 3 === 0 : z % 3 === 0));   // a pier every third column on each face
  return pier ? "white_concrete" : "light_blue_stained_glass_pane";
}
const isGlass = (x, z, y) => ring(x, z, y) && facade(x, z, y).includes("glass");

// entrance: the street-level ring cell nearest the footprint's middle, on the lowest ground
let door = null;
{
  let cx = 0, cz = 0, n = 0; for (const [x, z] of cells) { cx += x; cz += z; n++; }
  cx /= n; cz /= n;
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!ring(x, z, 1) || !isGlass(x, z, 1)) continue;
    const f = faces(x, z, 1); if (f.length !== 1) continue;             // a plain wall, not a corner
    const score = G(x, z) * 1000 + Math.hypot(x - cx, z - cz);
    if (score < best) { best = score; door = { x, z, dx: f[0].dx, dz: f[0].dz }; }
  }
}
const facing = (dx, dz) => (dz === -1 ? "north" : dz === 1 ? "south" : dx === -1 ? "west" : "east");

// overrides: door, canopy over the door, lantern in the vestibule, roof plant
const over = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
if (door) {
  const { x, z, dx, dz } = door, f = facing(dx, dz);
  const tx = dz !== 0 ? 1 : 0, tz = dx !== 0 ? 1 : 0;   // along the face
  over.set(K(x, 1, z), { block: "iron_door", state: { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" } });
  over.set(K(x, 2, z), { block: "iron_door", state: { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" } });
  for (const s of [-1, 1]) {                             // canopy: a stone band over the door, bearing on the piers either side
    const cx_ = x + s * tx, cz_ = z + s * tz;
    if (ring(cx_, cz_, 3)) over.set(K(cx_, 3, cz_), { block: "smooth_stone" });
  }
  over.set(K(x, 3, z), { block: "smooth_stone" });
  const ix = x - dx, iz = z - dz;                        // the vestibule behind the door: air, with a hanging lantern
  if (ins(ix, iz)) { over.set(K(ix, 1, iz), null); over.set(K(ix, 2, iz), { block: "lantern", state: { hanging: "true", waterlogged: "false" } }); }
}

// roof plant: boxes of iron-block units on the roof deck (body tier at y 21, tower tier at y 25), inside the parapet
function plantBox(cx, cz, w, d, y, tier) {
  const x0 = Math.round(cx - w / 2), z0 = Math.round(cz - d / 2);
  for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) {
    if (!ins(x, z) || T(x, z) !== tier || ring(x, z, y) || G(x, z) > y) return;   // all or nothing: a box never hangs off the parapet
  }
  for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) over.set(K(x, y, z), { block: "iron_block" });
}
{
  const bodyCells = cells.filter(([x, z]) => T(x, z) === BODY_ROOF), towerCells = cells.filter(([x, z]) => T(x, z) === TOWER_ROOF);
  const mean = (a) => [a.reduce((s, [x]) => s + x, 0) / a.length, a.reduce((s, [, z]) => s + z, 0) / a.length];
  const [bx, bz] = mean(bodyCells), [tx, tz] = mean(towerCells);
  plantBox(bx - 6, bz - 4, 8, 5, BODY_ROOF - 1, BODY_ROOF);
  plantBox(bx + 9, bz + 6, 5, 4, BODY_ROOF - 1, BODY_ROOF);
  plantBox(tx, tz, 4, 4, TOWER_ROOF - 1, TOWER_ROOF);
}

// the block at (x, y, z), or null for air
function block(x, z, y) {
  const o = over.get(K(x, y, z)); if (o !== undefined) return o;
  if (!ins(x, z) || y >= T(x, z)) return null;
  if (y < G(x, z)) return { block: "stone_bricks" };                              // foundation: the uphill side stands on solid
  if (ring(x, z, y)) return { block: facade(x, z, y) };
  const top_ = T(x, z), m = y % 4;
  if (y === top_ - 2) return { block: "stone" };                                 // roof deck inside the parapet
  if (y === top_ - 1) return null;                                                 // roof air, plant on top
  if ((m === 1 || m === 2) && faces(x, z, y).length === 0 && NB.some(({ dx, dz }) => isGlass(x + dx, z + dz, y))) {
    if (m === 1 && y >= 4 && (x * 31 + z * 17 + Math.floor(y / 4) * 7) % 13 === 0) return { block: "lantern", state: { hanging: "false", waterlogged: "false" } };
    return null;                                                                  // the air gap behind glass
  }
  return { block: "light_gray_concrete" };                                       // core
}

const g = new Voxels([W, H, D]);
let placed = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!ins(x, z)) continue;
  for (let y = 0; y < TOWER_ROOF; y++) {
    const b = block(x, z, y);
    if (!b) continue;
    g.set(x, y, z, b.block, b.state); placed++;
  }
}
const info = g.save(`${DIR}/way_23919684.nbt`);
console.log(JSON.stringify({ cells: cells.length, placed, door, ...info }));
