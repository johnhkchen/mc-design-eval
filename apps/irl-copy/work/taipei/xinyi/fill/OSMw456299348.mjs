import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s commercial block, two storeys over a stone plinth:
// cream quartz walls with pillar bays, glazed ground-floor shopfront and
// upper-storey windows, a central entrance, a cornice and parapet,
// and rooftop plant. Interior is air with floor slabs per storey.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456299348";
const W = 20, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const c of cells) ground.set(`${c[0]},${c[1]}`, c[2]);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

// Outward faces per footprint cell
const faceOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push([0, -1]);
  if (!has(x, z + 1)) f.push([0, 1]);
  if (!has(x - 1, z)) f.push([-1, 0]);
  if (!has(x + 1, z)) f.push([1, 0]);
  return f;
};
const isPerim = (x, z) => faceOf(x, z).length > 0;

const DOOR_FACING = { "0,-1": "south", "0,1": "north", "-1,0": "east", "1,0": "west" };

// Pass 1: foundations, floors, storey slabs, roof, parapet, walls
for (const [x, z] of ground.keys().toArray?.().map(k => k.split(",").map(Number)) ??
     [...ground.keys()].map(k => k.split(",").map(Number))) {
  const G = gr(x, z);
  const faces = faceOf(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;

  // Foundation from y 0 up to ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  // Ground-floor slab
  g.set(x, G, z, "smooth_stone");
  // Storey slab at +5 and roof slab at +10
  if (G + 5 < H) g.set(x, G + 5, z, "smooth_stone");
  if (G + 10 < H) g.set(x, G + 10, z, "smooth_stone");

  if (!perim) {
    // Roof plant on the roof slab
    if (G + 11 < H && (x * 3 + z * 5) % 11 === 0) {
      g.set(x, G + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Parapet cap
  if (G + 11 < H) g.set(x, G + 11, z, "smooth_quartz");

  // Facade pattern
  const [dx, dz] = faces[0];
  const along = dx !== 0 ? z : x;
  const pier = corner || along % 3 === 0;
  const mat = pier ? "quartz_pillar" : "smooth_quartz";

  // Base course
  g.set(x, G + 1, z, pier ? "quartz_pillar" : "polished_andesite");
  // Ground storey: shopfront glass
  for (let y = G + 2; y <= G + 4; y++) {
    g.set(x, y, z, pier ? "quartz_pillar" : "light_blue_stained_glass");
  }
  // Upper storey: sill, glass, head
  g.set(x, G + 6, z, mat);
  g.set(x, G + 7, z, pier ? "quartz_pillar" : "light_blue_stained_glass");
  g.set(x, G + 8, z, pier ? "quartz_pillar" : "light_blue_stained_glass");
  g.set(x, G + 9, z, mat);
  // Cornice band
  g.set(x, G + 10, z, "smooth_stone");

  // Warm light just inside some windows
  if (!pier && along % 2 === 0) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      const IG = gr(ix, iz);
      g.set(ix, IG + 3, iz, "glowstone");
      g.set(ix, IG + 7, iz, "glowstone");
    }
  }
}

// Pass 2: entrance on the face with the most exterior cells
const counts = new Map();
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  for (const f of faceOf(x, z)) {
    const k = f.join(",");
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
}
let frontKey = null, best = -1;
for (const [k, n] of counts) if (n > best) { best = n; frontKey = k; }
const [fdx, fdz] = frontKey.split(",").map(Number);

const frontCells = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => faceOf(x, z).some(([a, b]) => a === fdx && b === fdz))
  .sort((p, q) => (fdx !== 0 ? p[1] - q[1] : p[0] - q[0]));

if (frontCells.length) {
  const [dx0, dz0] = [fdx, fdz];
  const [ex, ez] = frontCells[Math.floor(frontCells.length / 2)];
  const EG = gr(ex, ez);
  const facing = DOOR_FACING[frontKey];
  g.set(ex, EG + 1, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, EG + 2, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lanterns-style warm glow inside the entrance
  const ix = ex - dx0, iz = ez - dz0;
  if (has(ix, iz) && !isPerim(ix, iz)) {
    g.set(ix, gr(ix, iz) + 3, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
