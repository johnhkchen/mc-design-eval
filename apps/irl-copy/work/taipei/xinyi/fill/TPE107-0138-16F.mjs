import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE107-0138-16F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 42 x 21 footprint, roof ~78 above lowest ground, 5-block storeys, ~16 floors (podium 3 + tower 12 + plant).
const W = 42, H = 90, D = 21;
const PODIUM_TOP = 15;   // podium terrace slab (storey line 3)
const ROOF = 75;         // tower roof slab (storey line 15)
const CROWN = 77;        // top of parapet
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Footprint: key "x,z" -> ground height (integer)
const G = new Map();
for (const c of cells) G.set(`${c[0]},${c[1]}`, Math.round(c[2]));
const has = (x, z) => G.has(`${x},${z}`);
// Tower is set back 4 blocks from every footprint edge
const inTower = (x, z) => has(x, z) && x >= 4 && x <= 37 && z >= 4 && z <= 16;

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const tw = inTower(x, z);
  const topY = tw ? CROWN : 16;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= topY; y++) {
    // Podium cells use podium outline; tower cells use tower outline above the podium
    const nb = (y >= PODIUM_TOP && tw) ? inTower : has;
    const N = !nb(x, z - 1), S = !nb(x, z + 1);
    const Wf = !nb(x - 1, z), E = !nb(x + 1, z);
    const nFaces = [N, S, Wf, E].filter(Boolean).length;
    const ext = nFaces > 0;

    // Main entrance on the north face, centred (x 20..22)
    if (ext && N && z === 0 && x >= 20 && x <= 22 && y <= gr + 3) {
      if (x === 21 && y <= gr + 1) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (x === 21 && y === gr + 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // Interior: floor slabs at storey lines and at ground level only (air gap otherwise)
    if (!ext) {
      if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Base course
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }

    // Podium terrace guard parapet
    if (!tw && y === 16) { put(x, y, z, "white_concrete"); continue; }

    // Tower parapet and cap
    if (tw && y === 76) { put(x, y, z, "white_concrete"); continue; }
    if (tw && y === 77) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Storey line: spandrel / floor edge (also the cornice at the roof line)
    if (y % 5 === 0) { put(x, y, z, "light_gray_concrete"); continue; }

    const p = (N || S) ? x : z;             // position along the face
    const corner = nFaces >= 2;
    const r = y % 5;                         // row within storey
    const k = Math.floor(y / 5);             // storey index

    // Mullions every 3 blocks, corner columns, and head band below the next floor line
    if (corner || p % 3 === 0 || r === 4) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Vision glass: clear shopfront glass at ground, blue-green curtain wall above
    put(x, y, z, k === 0 ? "glass" : "light_blue_stained_glass");

    // Some windows lit from inside (glowstone just behind the glass)
    if (k >= 1 && r === 2 && ((k * 5 + p) % 11 === 3)) {
      const [ix, iz] = N ? [x, z + 1] : S ? [x, z - 1] : Wf ? [x + 1, z] : [x - 1, z];
      if (nb(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Roof plant room on the tower roof, with a grille top and a short mast
for (let x = 14; x <= 27; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!inTower(x, z)) continue;
    for (let y = 76; y <= 77; y++) put(x, y, z, "light_gray_concrete");
    put(x, 78, z, "iron_bars");
  }
}
for (let y = 79; y <= 83; y++) put(21, y, 10, "iron_bars");
put(21, 84, 10, "shroomlight");

g.save(`${DIR}/${ID}.nbt`);
