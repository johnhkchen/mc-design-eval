import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408108";
const W = 9, H = 23, D = 21;

// Footprint: [x, z, ground] per cell. Ground is clamped so the roof stays inside the grid.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x0, z0, gr0] of raw) {
  const x = x0 | 0, z = z0 | 0;
  const g = Math.max(0, Math.min(11, Math.round(gr0)));
  const k = `${x},${z}`;
  G.set(k, Math.max(G.get(k) ?? 0, g));
}
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);

const g3 = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g3.set(x, y, z, id, props);
  else g3.set(x, y, z, id);
};

// Exposed faces of a footprint cell: a face is exposed when the neighbour is absent.
const exposed = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const isPer = (x, z) => exposed(x, z).length > 0;

// Footprint centre (for entrance choice).
let sx = 0, n = 0;
for (const k of G.keys()) { sx += Number(k.split(",")[0]); n++; }
const cx = n ? sx / n : W / 2;

// Entrance: north-facing perimeter cell nearest the centre line, else lowest-z perimeter cell.
let entCands = [...G.keys()].map(k => k.split(",").map(Number))
  .filter(([x, z]) => exposed(x, z).includes("N"));
if (entCands.length === 0) {
  const minZ = Math.min(...[...G.keys()].map(k => Number(k.split(",")[1])));
  entCands = [...G.keys()].map(k => k.split(",").map(Number)).filter(([, z]) => z === minZ);
}
entCands.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const ent = entCands.length ? { x: entCands[0][0], z: entCands[0][1] } : null;
const entKey = ent ? `${ent.x},${ent.z}` : null;

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const FLOOR = "smooth_quartz";

// 1. Foundation, floors, roof slabs, base course, facades.
for (const [key, g] of G) {
  const [x, z] = key.split(",").map(Number);
  const per = isPer(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) set(x, y, z, "stone");

  // Base course (perimeter) / floor (interior) at ground level.
  set(x, g, z, per ? "polished_granite" : "smooth_stone");

  // Storey slabs: between floors at g+5 and roof/parapet at g+10.
  set(x, g + 5, z, FLOOR);
  set(x, g + 10, z, FLOOR);

  if (!per) continue;

  const faces = exposed(x, z);
  const face = faces[0];
  const along = (face === "N" || face === "S") ? x : z;

  // Ground floor shopfront: glass with white piers every third cell.
  const pierG = along % 3 === 0;
  for (let y = g + 1; y <= g + 4; y++) {
    set(x, y, z, pierG ? PIER : GLASS);
  }

  // Upper floor: frame bands at g+6 and g+9, windows with piers every other cell.
  set(x, g + 6, z, PIER);
  set(x, g + 9, z, PIER);
  const pierU = along % 2 === 0;
  for (let y = g + 7; y <= g + 8; y++) {
    set(x, y, z, pierU ? PIER : GLASS);
  }

  // Parapet cap in white concrete for a crisp top edge.
  set(x, g + 10, z, PIER);
}

// 2. Entrance: double glass-panelled door on the north face with a lintel canopy.
if (ent) {
  const g = gAt(ent.x, ent.z);
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  set(ent.x, g + 1, ent.z, "dark_oak_door", doorProps("lower"));
  set(ent.x, g + 2, ent.z, "dark_oak_door", doorProps("upper"));
  // Canopy lintel across the entrance and its neighbours on the north face.
  for (const dx of [-1, 0, 1]) {
    const xx = ent.x + dx;
    if (has(xx, ent.z) && exposed(xx, ent.z).includes("N")) {
      set(xx, g + 3, ent.z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    }
  }
  // Keep the door lintel clean of shop glass above the door.
  set(ent.x, g + 4, ent.z, PIER);
}

// 3. Warm lights: glowstone behind some windows in the interior cell.
for (const [key, g] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!isPer(x, z) || key === entKey) continue;
  const f = exposed(x, z)[0];
  const along = (f === "N" || f === "S") ? x : z;
  let ix = x, iz = z;
  if (f === "N") iz = z + 1;
  else if (f === "S") iz = z - 1;
  else if (f === "W") ix = x + 1;
  else if (f === "E") ix = x - 1;
  if (!has(ix, iz) || isPer(ix, iz)) continue;
  const gi = gAt(ix, iz);
  // Upper floor windows: some lit.
  if ((along + g) % 4 === 1) set(ix, gi + 7, iz, "glowstone");
  // Ground floor shopfront: a few warm lanterns inside.
  if ((along + g) % 5 === 2 && (along % 3 !== 0)) set(ix, gi + 2, iz, "glowstone");
}

// 4. Roof: AC boxes on the interior roof, a lightning rod at a corner.
for (const [key, g] of G) {
  const [x, z] = key.split(",").map(Number);
  if (isPer(x, z)) continue;
  if (x % 3 === 1 && z % 4 === 2) {
    set(x, g + 11, z, "iron_block");
  }
}
const corner = [...G.keys()].map(k => k.split(",").map(Number))
  .sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]))[0];
if (corner) {
  set(corner[0], gAt(corner[0], corner[1]) + 11, corner[1], "lightning_rod");
}

g3.save(`${DIR}/${ID}.nbt`);
