import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538752112: 18 x 17 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, c.1980s-90s Taipei commercial block: a stone plinth,
// a glazed shopfront with an iron-framed entrance, one upper storey of
// pilastered windows, a white cornice and parapet, and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752112";
const W = 18, H = 23, D = 17;
const ROOF = 11;     // roof sits this many blocks above the lowest ground
const STOREY = 5;    // storey line at L + 5

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const L = Math.min(...G.values());

const g = new Voxels([W, H, D]);
function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
}

const FACES = [["west", -1, 0], ["east", 1, 0], ["north", 0, -1], ["south", 0, 1]];
function outward(x, z) {
  for (const [name, dx, dz] of FACES) if (!has(x + dx, z + dz)) return { name, dx, dz };
  return null;
}

// Pick the entrance: a south-facing (else north-facing) edge cell nearest the footprint's mean x.
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let doorKey = null;
for (const want of ["south", "north"]) {
  const cand = cells
    .map(([x, z]) => ({ x, z, o: outward(x, z) }))
    .filter(c => c.o && c.o.name === want && G.get(`${c.x},${c.z}`) <= L + 1)
    .sort((a, b) => Math.abs(a.x - meanX) - Math.abs(b.x - meanX) || a.x - b.x);
  if (cand.length) { doorKey = `${cand[0].x},${cand[0].z}`; break; }
}

// Pass 1: foundation, walls, floors, roof, parapet, plant.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = G.get(`${x},${z}`);
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const o = outward(x, z);
  if (o) {
    const c = o.name === "west" || o.name === "east" ? z : x;
    const isDoor = `${x},${z}` === doorKey;
    for (let y = gr; y <= L + ROOF - 1; y++) {
      const rel = y - L;
      let b;
      if (rel === 0) b = "stone_bricks";                       // plinth course
      else if (rel <= 3) {
        if (isDoor && rel === 3) b = "white_concrete";          // lintel over door
        else if (c % 3 === 0) b = "polished_andesite";          // pilaster
        else b = "light_blue_stained_glass";                    // shopfront glass
      }
      else if (rel === 4) b = "white_concrete";                 // transom
      else if (rel === 5) b = "smooth_stone";                   // storey line
      else if (rel === 6) b = "white_concrete";                 // spandrel
      else if (rel <= 9) b = c % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
      else b = "quartz_block";                                  // cornice at rel 10
      put(x, y, z, b);
    }
    // Parapet over the wall.
    put(x, L + ROOF, z, "white_concrete");
    put(x, L + ROOF + 1, z, "white_concrete");
  } else {
    // Interior: no interior fit-out, just a floor slab per storey and the roof deck.
    if (L + STOREY >= gr) put(x, L + STOREY, z, "smooth_stone");
    put(x, L + ROOF, z, "smooth_stone");
    if (x % 8 === 4 && z % 8 === 4) {
      // Rooftop plant units.
      put(x, L + ROOF + 1, z, "light_gray_concrete");
      put(x, L + ROOF + 2, z, "light_gray_concrete");
    }
  }
}

// Pass 2: entrance door (iron frame, two halves).
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  const o = outward(dx, dz);
  put(dx, L + 1, dz, "iron_door", { facing: o.name, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, L + 2, dz, "iron_door", { facing: o.name, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 3: warm lights in some upper windows, standing on the storey slab behind the glass.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = G.get(`${x},${z}`);
  const o = outward(x, z);
  if (!o) continue;
  const c = o.name === "west" || o.name === "east" ? z : x;
  if (c % 6 !== 2) continue;
  const ix = x - o.dx, iz = z - o.dz;
  if (!has(ix, iz) || outward(ix, iz)) continue;
  if (G.get(`${ix},${iz}`) > L + STOREY) continue;
  put(ix, L + STOREY + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
