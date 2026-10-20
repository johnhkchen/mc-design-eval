import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial/office block, c. 1990s Taipei: five storeys on a 5-block module,
// white tiled and concrete spandrels, pale glass window grid, shopfront at street level,
// quartz cornice and parapet, a central mechanical penthouse with an antenna mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011437";
const W = 22, H = 38, D = 16;
const ROOF = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const isPerim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Which face a perimeter cell sits on, and its column index along that face.
function facade(x, z) {
  const mz = !has(x, z - 1) || !has(x, z + 1); // wall faces z, runs along x
  const mx = !has(x - 1, z) || !has(x + 1, z); // wall faces x, runs along z
  if (mz && mx) return { corner: true, alongX: true, col: x };
  if (mz) return { corner: false, alongX: true, col: x };
  return { corner: false, alongX: false, col: z };
}

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Choose the street entrance: front (z-min) edge, non-mullion column nearest the middle.
let door = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (!isPerim(x, z)) continue;
    if (has(x, z - 1)) continue; // must be an exterior north-facing wall
    const f = facade(x, z);
    if (f.corner || f.col % 3 === 0) continue;
    const d = Math.abs(x - W / 2);
    if (d < best) { best = d; door = { x, z, gr }; }
  }
}

// 1. Foundation, floor slabs, walls, windows, and warm lights.
for (const [x, z, gr] of cells) {
  const per = isPerim(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const levels = [gr, ...[6, 11, 16, 21].filter((l) => l > gr)];
  for (const L of levels) {
    if (L >= ROOF) continue;
    let id = per ? "smooth_quartz" : "light_gray_concrete";
    if (per && L === gr) id = "polished_andesite"; // base course
    put(x, L, z, id);
  }

  if (!per) continue;

  const f = facade(x, z);
  for (let i = 0; i < levels.length; i++) {
    const base = levels[i];
    const next = i + 1 < levels.length ? levels[i + 1] : ROOF;
    const top = next - 1;
    for (let y = base + 1; y <= top; y++) {
      const r = y - base;
      const isWin = r <= 3 && y < top;
      const mullion = f.corner || f.col % 3 === 0;
      if (isWin && !mullion) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(f.alongX));
        // Warm light just inside the glass, in some windows.
        if (r === 2 && ((f.col + base) % 4 === 0)) {
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dx, dz] of dirs) {
            const nx = x + dx, nz = z + dz;
            if (has(nx, nz) && !isPerim(nx, nz)) {
              put(nx, y, nz, "glowstone");
              break;
            }
          }
        }
      } else if (mullion && isWin) {
        put(x, y, z, i === 0 ? "polished_andesite" : "white_concrete");
      } else {
        put(x, y, z, "white_concrete"); // spandrel / storey band
      }
    }
  }
}

// 2. Entrance door on the street face, standing on the ground storey's floor.
if (door) {
  const facing = "north";
  put(door.x, door.gr + 1, door.z, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, door.gr + 2, door.z, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// 3. Roof deck, cornice, parapet.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const per = isPerim(x, z);
  put(x, ROOF, z, per ? "smooth_quartz" : "light_gray_concrete");
  if (per) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 4. Roof plant boxes.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const inA = x >= 2 && x <= 4 && z >= 2 && z <= 3;
  const inB = x >= 17 && x <= 18 && z >= 11 && z <= 12;
  if ((inA || inB) && has(x, z) && !isPerim(x, z)) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }
}

// 5. Central mechanical penthouse with glass band and antenna.
const inPH = (x, z) => x >= 7 && x <= 14 && z >= 4 && z <= 11 && has(x, z);
const phPerim = (x, z) =>
  inPH(x, z) && (!inPH(x - 1, z) || !inPH(x + 1, z) || !inPH(x, z - 1) || !inPH(x, z + 1));
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inPH(x, z)) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    if (phPerim(x, z)) {
      put(x, ROOF + 2, z, "light_blue_stained_glass_pane", {
        north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
      });
      put(x, ROOF + 3, z, "light_gray_concrete");
    }
    put(x, ROOF + 4, z, "smooth_quartz");
  }
}
if (inPH(10, 7)) {
  for (let y = ROOF + 5; y <= ROOF + 8; y++) {
    put(10, y, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
