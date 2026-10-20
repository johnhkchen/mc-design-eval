import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807573";
const W = 28, H = 23, D = 15;

// Footprint: [x, z, ground] per cell.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const base = Math.min(...ground.values());
const frontZ = Math.max(...[...ground.keys()].map(k => Number(k.split(",")[1])));
const cx = 13; // entrance column on the front (max-z) face

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const missingX = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z);
const missingZ = (x, z) => !inFp(x, z - 1) || !inFp(x, z + 1);
const perim = (x, z) => missingX(x, z) || missingZ(x, z);
const isPier = (x, z) => {
  const mx = missingX(x, z), mz = missingZ(x, z);
  if (mx && mz) return true;                 // corners
  const along = mz ? x : z;                  // wall runs along x when missing in z
  return along % 4 === 0;
};
const isEntrance = (x, z) => z === frontZ && x === cx && missingZ(x, z);

const cells2 = [...ground.keys()].map(k => k.split(",").map(Number));

// 1. Foundation, plinth and floor slabs.
for (const [x, z] of cells2) {
  const gy = gAt(x, z);
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  put(x, base, z, perim(x, z) ? "polished_granite" : "smooth_stone");
  put(x, base + 5, z, "smooth_stone");   // first/second floor slab
  put(x, base + 10, z, "smooth_stone");  // roof deck
}

// 2. Perimeter walls: piers, shopfront, window bands, cornice.
for (const [x, z] of cells2) {
  if (!perim(x, z)) continue;
  const pier = isPier(x, z);
  const entr = isEntrance(x, z);

  // Ground floor (base+1..base+4)
  for (let y = base + 1; y <= base + 3; y++) {
    if (pier) put(x, y, z, "white_concrete");
    else if (entr && y <= base + 2) {
      if (y === base + 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else put(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
  }
  put(x, base + 4, z, pier ? "white_concrete" : (entr ? "black_concrete" : "light_gray_concrete"));

  // Upper floor (base+6..base+9)
  put(x, base + 6, z, pier ? "white_concrete" : "light_gray_concrete");
  for (let y = base + 7; y <= base + 8; y++) {
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
  }
  put(x, base + 9, z, pier ? "white_concrete" : "light_gray_concrete");

  // Parapet cornice band and cap
  put(x, base + 10, z, "smooth_stone");
  put(x, base + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Warm lights behind some windows (interior cell just inside the glass).
for (const [x, z] of cells2) {
  if (!perim(x, z) || isPier(x, z) || isEntrance(x, z)) continue;
  const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .find(([ix, iz]) => inFp(ix, iz) && !perim(ix, iz));
  if (!inward) continue;
  const [ix, iz] = inward;
  const h = (x * 3 + z * 5) % 4;
  if (h === 0) put(ix, base + 6, iz, "glowstone");              // upper floor
  else if (h === 2) put(ix, base + 4, iz, "lantern", { hanging: "true", waterlogged: "false" }); // ground floor
}

// 4. Roof equipment: water tank box and stair/lift penthouse.
const box = (x0, x1, z0, z1, y0, y1, id, roofId) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!inFp(x, z)) continue;
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      for (let y = y0; y <= y1; y++) {
        if (edge) put(x, y, z, id);
      }
      if (roofId) put(x, y1 + 1, z, roofId, roofId === "smooth_stone_slab" ? { type: "bottom", waterlogged: "false" } : undefined);
    }
};
// Water tank (cells 3..6 x 3..6), tank walls base+11..base+12, cap at base+13.
box(3, 6, 3, 6, base + 11, base + 12, "smooth_stone", "smooth_stone_slab");
// Stair/lift penthouse (cells 20..23 x 5..9), walls base+11..base+14, cap at base+15.
box(20, 23, 5, 9, base + 11, base + 14, "stone_bricks", "smooth_stone_slab");
// Penthouse door on its front face toward the street.
for (let x = 21; x <= 22; x++) {
  if (inFp(x, 9)) {
    put(x, base + 11, 9, "air");
  }
}
if (inFp(21, 9)) put(21, base + 11, 9, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
if (inFp(21, 9)) put(21, base + 12, 9, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Aerial beacon on the penthouse for roof read at distance.
if (inFp(21, 7)) {
  put(21, base + 16, 7, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
