// Tower Hill Apartments: a 1980s precast-concrete apartment block on a stone podium, 16 storeys of 4 blocks
// (about 1.2 blocks a metre), a central lift and stair core rising above the roof, glazed bays with white piers,
// a lobby entrance on the lowest street face. Hollow: the facade is a shell, each storey a floor slab over air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_489564823.cells.json`, "utf8"));
const W = 59, D = 43, H = 81;

// footprint cells keyed "x,z": the lowest ground under the cell (its foundation top) and the lidar roof above y 0
const GROUND = new Map(), ROOF = new Map();
for (const [x, z, g, r] of cells) { GROUND.set(`${x},${z}`, g); ROOF.set(`${x},${z}`, r); }
const inside = (x, z) => GROUND.has(`${x},${z}`);
const ground = (x, z) => GROUND.get(`${x},${z}`);

// lidar noise: the median roof within 2 cells, then snapped to four clean tiers (podium, mid, setback, tower)
function median(x, z) {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) v.push(ROOF.get(`${x + dx},${z + dz}`));
  v.sort((a, b) => a - b); return v[v.length >> 1];
}
const TIERS = [[14, 12], [30, 24], [48, 40], [58, 52], [Infinity, 64]];
const TOP = new Map();
for (const [k] of GROUND) {
  const [x, z] = k.split(",").map(Number);
  const s = median(x, z);
  TOP.set(k, TIERS.find(([max]) => s <= max)[1]);
}

// the lift and stair core: a rectangle at the tower's centre, solid from the ground to 68 (a penthouse above the roof)
let sx = 0, sz = 0, nt = 0;
for (const [k, t] of TOP) if (t === 64) { const [x, z] = k.split(",").map(Number); sx += x; sz += z; nt++; }
const cx = Math.round(sx / nt), cz = Math.round(sz / nt);
const core = (x, z) => x >= cx - 3 && x <= cx + 2 && z >= cz - 4 && z <= cz + 3 && TOP.get(`${x},${z}`) === 64;
const topOf = (x, z) => (core(x, z) ? 68 : TOP.get(`${x},${z}`));
const solid = (x, y, z) => inside(x, z) && y >= 0 && y < topOf(x, z);
const shell = (x, y, z) => solid(x, y, z) && (!solid(x + 1, y, z) || !solid(x - 1, y, z) || !solid(x, y, z + 1) || !solid(x, y, z - 1));

// the outward faces of a shell cell: [dx, dz, name]
const FACES = [[0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"]];
const exposed = (x, y, z) => FACES.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const TANGENT = { south: [1, 0], north: [1, 0], east: [0, 1], west: [0, 1] };

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (inside(x, z) && y >= 0 && y < H) g.set(x, y, z, block, state); };

// one storey = 4 rows: floor band, two glass rows between piers, spandrel; the podium (y < 12) is stone
function facade(x, y, z, face) {
  const along = face[0] ? z : x;                     // position along the wall, for the pier rhythm
  const podium = y < 12;
  const pier = podium ? "stone_bricks" : "white_concrete";
  const band = podium ? "stone_bricks" : "light_gray_concrete";
  const row = y % 4;
  if (row === 0) return band;
  if (row === 3) return pier;
  const bay = y < 4 ? 6 : 4;                         // the ground storey is shopfront: wider glass
  return along % bay === 0 ? pier : "light_blue_stained_glass";
}

// entrance: the lowest street-level wall cell on a face, away from the corners
const entrance = (() => {
  let best = null;
  for (const [k, gr] of GROUND) {
    const [x, z] = k.split(",").map(Number);
    const exp = exposed(x, gr, z);
    if (exp.length !== 1) continue;
    const [dx, dz, name] = exp[0];
    const along = dz ? x : z, mid = dz ? (W - 1) / 2 : (D - 1) / 2;
    const score = gr * 100 + Math.abs(along - mid);
    if (!best || score < best.score) best = { score, x, z, e: gr, dx, dz, name };
  }
  return best;
})();

// the solid volume: foundation, shell (facade), interior floor slabs, core
for (const k of GROUND.keys()) {
  const [x, z] = k.split(",").map(Number);
  const top = topOf(x, z), gr = ground(x, z);
  for (let y = 0; y < top; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }
    if (core(x, z)) { put(x, y, z, "light_gray_concrete"); continue; }
    if (shell(x, y, z)) {
      if (y === top - 1) { put(x, y, z, "stone_bricks"); continue; }      // cornice
      const face = exposed(x, y, z)[0];
      put(x, y, z, facade(x, y, z, face));
      // warm light: some glass rows get a glowstone just inside, in the interior air
      if (y % 4 !== 0 && y % 4 !== 3 && facade(x, y, z, face) === "light_blue_stained_glass" && (x * 31 + z * 17 + y * 7) % 11 === 0) {
        const ix = x - face[0], iz = z - face[1];
        if (solid(ix, y, iz) && !shell(ix, y, iz) && !core(ix, iz)) put(ix, y, iz, "glowstone");
      }
      continue;
    }
    if (y === top - 1) put(x, y, z, "light_gray_concrete");              // roof membrane
    else if (y % 4 === 0) put(x, y, z, "light_gray_concrete");           // floor slab per storey
  }
  // a coping course on the outer edge of every roof
  if (!core(x, z) && shell(x, top - 1, z)) put(x, top, z, "white_concrete");
}

// the entrance bay: glazed sides, a transom, the door, a stone canopy and a hanging lantern in the lobby
if (entrance) {
  const { x, z, e, dx, dz, name } = entrance;
  const [tx, tz] = TANGENT[name];
  const at = (k, y, inward = 0) => [x + tx * k - dx * inward, y, z + tz * k - dz * inward];
  for (const k of [-2, -1, 0, 1, 2]) for (const inward of [0, 1]) {
    if (inward === 1 && Math.abs(k) > 1) continue;
    const [ax, ay, az] = at(k, e + 3, inward);
    put(ax, ay, az, "stone_bricks");
  }
  for (const k of [-1, 1]) for (const y of [e, e + 1, e + 2]) { const [ax, ay, az] = at(k, y); put(ax, ay, az, "light_blue_stained_glass"); }
  put(x, e + 2, z, "light_blue_stained_glass");
  const [hx, hy, hz] = at(0, e + 2, 1);
  put(hx, hy, hz, "lantern", { hanging: "true" });
  const door = { facing: name, hinge: "left", open: "false", powered: "false" };
  put(x, e, z, "iron_door", { ...door, half: "lower" });
  put(x, e + 1, z, "iron_door", { ...door, half: "upper" });
}

// roof: a podium garden of moss and azaleas, and the air-conditioning plant on the tower
for (const k of GROUND.keys()) {
  const [x, z] = k.split(",").map(Number);
  const top = topOf(x, z);
  if (top === 12 && !shell(x, 11, z) && x % 5 === 1 && z % 4 === 1) { put(x, 11, z, "moss_block"); put(x, 12, z, "azalea"); }
  if (top === 64 && !core(x, z) && !shell(x, 63, z) && x % 7 === 2 && z % 6 === 2) {
    put(x, 64, z, "iron_block"); put(x, 65, z, "iron_block");
  }
}

const info = g.save(`${DIR}/way_489564823.nbt`);
console.log("saved", info, "entrance", entrance && { x: entrance.x, z: entrance.z, e: entrance.e, face: entrance.name }, "core", { cx, cz });
