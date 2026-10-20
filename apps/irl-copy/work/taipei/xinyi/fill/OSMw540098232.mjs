import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098232";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exp = (x, z) => ({
  E: !has(x + 1, z),
  W: !has(x - 1, z),
  N: !has(x, z - 1),
  S: !has(x, z + 1),
});

// Entrance: middle of the north-facing exposed cells (lowest z edge)
const northXs = cells
  .filter(([x, z]) => exp(x, z).N)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  // Keep the whole building (base + 12) inside the volume
  const base = Math.max(0, Math.min(gr, H - 12));
  const e = exp(x, z);
  const perim = e.E || e.W || e.N || e.S;
  // Bay index along the facade: x on north/south faces, z on east/west faces
  const k = (e.N || e.S) ? x : z;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground-floor deck / base course
  put(x, base, z, perim ? "stone_bricks" : "light_gray_concrete");

  // Floor slabs at storey lines and the roof deck
  if (!perim) {
    put(x, base + 5, z, "light_gray_concrete");
    put(x, base + 10, z, "light_gray_concrete");
    // Plant screen on the roof, centre of the plan
    if (x >= 2 && x <= 4 && z >= 8 && z <= 13) put(x, base + 11, z, "gray_concrete");
    continue;
  }

  // Perimeter: cornice bands at storey lines, roof edge
  put(x, base + 5, z, "smooth_stone");
  put(x, base + 10, z, "smooth_stone");
  put(x, base + 11, z, "white_concrete"); // parapet

  // Ground floor shopfront: glass bays between stone piers, lintel above
  for (let y = base + 1; y <= base + 3; y++) {
    put(x, y, z, k % 3 === 0 ? "stone_bricks" : "glass_pane");
  }
  put(x, base + 4, z, "white_concrete"); // lintel

  // Upper storey: glass bays between white piers
  for (let y = base + 6; y <= base + 9; y++) {
    put(x, y, z, k % 3 === 0 ? "white_concrete" : "glass_pane");
  }

  // Warm light behind glass: place a light in the interior cell next to the bay
  const inner =
    e.E ? [x - 1, z] :
    e.W ? [x + 1, z] :
    e.N ? [x, z + 1] :
    [x, z - 1];
  if (has(inner[0], inner[1])) {
    if (k % 6 === 4 && k % 3 !== 0) put(inner[0], base + 7, inner[1], "shroomlight");
    if (k % 6 === 2 && k % 3 !== 0) put(inner[0], base + 2, inner[1], "glowstone");
  }

  // Main entrance on the north face
  if (e.N && x === entranceX) {
    put(x, base + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, base + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, base + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
