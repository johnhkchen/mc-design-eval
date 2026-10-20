import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343858";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 7;
const g = new Voxels([W, H, D]);

// Low-rise commercial block, c. 1980s-90s: two storeys, white tiled wall,
// granite-grey base and cornice, dark glazing with warm glow at dusk.
const minG = Math.min(...cells.map(c => c[2]));
const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(c => key(c[0], c[1])));
const ground = new Map(cells.map(c => [key(c[0], c[1]), c[2] - minG]));

const exposedFaces = (x, z) => {
  const f = [];
  if (!has.has(key(x, z - 1))) f.push("N");
  if (!has.has(key(x, z + 1))) f.push("S");
  if (!has.has(key(x - 1, z))) f.push("W");
  if (!has.has(key(x + 1, z))) f.push("E");
  return f;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [k, B] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const exposed = faces.length > 0;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab, storey slab, roof slab (full coverage, no air under tiers).
  put(x, B, z, "smooth_stone");
  put(x, B + 5, z, exposed ? "smooth_stone" : "white_concrete");
  put(x, B + 10, z, exposed ? "smooth_stone" : "gray_concrete");

  if (!exposed) {
    // Interior: air gaps between slabs, with roof plant on a few cells.
    if (B + 11 < H && ((x === 9 && z === 3) || (x === 16 && z === 3) || (x === 20 && z === 4))) {
      put(x, B + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade: window bays on exposed faces; piers at every third bay.
  const alongOf = f => (f === "N" || f === "S" ? x : z);
  const allWindow = faces.every(f => alongOf(f) % 3 !== 0);
  const isGlassCell = allWindow;

  // Ground floor shopfront (y B+1..B+3)
  for (let y = B + 1; y <= B + 3; y++) {
    put(x, y, z, isGlassCell ? "glass" : "white_concrete");
  }
  // Cornice band over shopfront and string course at storey line
  put(x, B + 4, z, "smooth_stone");
  put(x, B + 5, z, "smooth_stone");

  // Upper storey windows (y B+6..B+9)
  for (let y = B + 6; y <= B + 9; y++) {
    let id = isGlassCell ? "light_blue_stained_glass" : "white_concrete";
    if (isGlassCell && y === B + 7 && alongOf(faces[0]) % 6 === 1) id = "glowstone";
    put(x, y, z, id);
  }

  // Cornice and parapet
  put(x, B + 10, z, "smooth_stone");
  put(x, B + 11, z, "white_concrete");
}

// Entrance on the street (N, z=0) face, with a hanging lantern under the cornice.
const doorX = has.has(key(13, 0)) ? 13 : [...has].map(s => s.split(",").map(Number)).filter(([x, z]) => z === 0)[0]?.[0];
if (doorX !== undefined && ground.has(key(doorX, 0))) {
  const B = ground.get(key(doorX, 0));
  put(doorX, B + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, B + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, B + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
