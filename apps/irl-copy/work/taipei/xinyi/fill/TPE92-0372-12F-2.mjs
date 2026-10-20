import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0372-12F-2";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 8, H = 81, D = 12;
const g = new Voxels([W, H, D]);

// 2003 Taipei mid-rise: white tiled concrete frame, blue-tinted glazing, quartz cornice,
// penthouse plant box and lightning-rod mast. Roof at 69 blocks (~14 storeys of 5 blocks).
const ROOF = 69;
const STOREY = 5;
const FL = [];
for (let f = ROOF - STOREY; f > 0; f -= STOREY) FL.push(f); // 64 down to 4

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
function faces(x, z) {
  const f = [];
  for (const [n, [dx, dz]] of Object.entries(OUT)) if (!has(x + dx, z + dz)) f.push(n);
  return f;
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [key, gd] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gd >= ROOF) continue;

  const fc = faces(x, z);
  const perim = fc.length > 0;
  const corner = fc.length >= 2;
  const outward = fc[0];

  const L0 = FL.filter((f) => f > gd);
  const L = L0.length ? Math.min(...L0) : ROOF;

  const isPier = () => {
    if (corner) return true;
    if (!outward) return false;
    if (outward === "west" || outward === "east") return z % 3 === 0 || z === 11;
    return x % 3 === 0 || x === 7;
  };
  const pier = perim && isPier();

  // entrance: door on the south face at x=4, with a stone surround at x=3 and x=5
  const doorBay = x === 4 && z === 11 && outward === "south" && L - gd >= 4;
  const surround = z === 11 && outward === "south" && (x === 3 || x === 5) && L - gd >= 4;

  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gd; y++) put(x, y, z, "gray_concrete");

  // ground course
  put(x, gd, z, perim ? "stone_bricks" : "light_gray_concrete");

  for (let y = gd + 1; y < ROOF; y++) {
    // storey floor slabs
    if (FL.includes(y)) {
      put(x, y, z, perim ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (!perim) continue; // interior air

    if (y < L) {
      // podium / shopfront
      if (y === L - 1) {
        put(x, y, z, "polished_andesite");
        continue;
      }
      if (doorBay && (y === gd + 1 || y === gd + 2)) {
        put(x, y, z, "oak_door", doorProps(y === gd + 1 ? "lower" : "upper"));
        // warm light just inside the entrance
        if (y === gd + 1 && has(4, 10) && ground.get("4,10") <= gd) {
          put(4, gd + 1, 10, "lantern", { hanging: "false", waterlogged: "false" });
        }
        continue;
      }
      if (surround) { put(x, y, z, "stone_bricks"); continue; }
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass");
      continue;
    }

    // storey bands above the podium
    let F = L;
    for (const f of FL) if (f < y && f > F) F = f;
    const off = y - F;
    if (off >= 1 && off <= 3) {
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      // warm light behind some windows, in the interior cell
      if (off === 2 && !corner && outward) {
        const idx = outward === "west" || outward === "east" ? z : x;
        if (idx % 6 === 1) {
          const [dx, dz] = OUT[outward];
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz)) {
            const gi = ground.get(`${ix},${iz}`);
            if (faces(ix, iz).length === 0 && y > gi) put(ix, y, iz, "glowstone");
          }
        }
      }
    } else if (off === 4) {
      put(x, y, z, "white_concrete");
    }
  }

  // roof: cornice, parapet, roof slab
  put(x, ROOF, z, perim ? "smooth_quartz" : "light_gray_concrete");
  if (perim) put(x, ROOF + 1, z, "white_concrete");
}

// penthouse plant box on the central setback
const ph = (x, z) => x >= 2 && x <= 5 && z >= 4 && z <= 7 && has(x, z);
for (let x = 2; x <= 5; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!ph(x, z)) continue;
    const ring = x === 2 || x === 5 || z === 4 || z === 7;
    for (let y = ROOF + 1; y <= 73; y++) {
      if (y === 73) put(x, y, z, "smooth_quartz");
      else if (y === 71 || y === 72) put(x, y, z, ring ? "light_blue_stained_glass" : "white_concrete");
      else put(x, y, z, "white_concrete");
    }
  }
}

// mast on the penthouse, up to y=80
if (ph(4, 6)) {
  for (let y = 74; y <= 80; y++) put(4, y, 6, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
