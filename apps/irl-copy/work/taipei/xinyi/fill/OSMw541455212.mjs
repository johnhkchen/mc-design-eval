import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455212";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 23, D = 14;
const vox = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height (y of the cell's base)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const exterior = (x, z) =>
  !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Never place anything below the cell's own ground (foundation owns that space)
function put(x, y, z, id, props) {
  if (!has(x, z)) return;
  if (y < 0 || y >= H) return;
  if (y < G(x, z)) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// Which street-facing side a shell cell belongs to, and its position along it
function faceOf(x, z) {
  if (x === 0) return { face: "W", t: z };
  if (x === W - 1) return { face: "E", t: z };
  if (z === 0) return { face: "N", t: x };
  return { face: "S", t: x };
}

// Facade block for an exterior cell at height y (ground base gr).
// Storey lines: floor slab y=5, deck/cornice y=10, parapet y=11.
// Upper storey windows at y=6..9 (glass at 7..8). Ground shopfront at gr+1..4.
function facade(x, z, y, gr) {
  const { face, t } = faceOf(x, z);
  const long = face === "W" || face === "E";
  const len = long ? D : W;
  const bay = t > 0 && t < len - 1 && t % 4 !== 0; // window bay, mullions every 4th block

  if (y === 5 || y === 10) return { id: "smooth_quartz" };     // string course / cornice
  if (y === 11) return { id: "white_concrete" };               // parapet

  if (y >= 6 && y <= 9) {
    if (bay && (y === 7 || y === 8)) return { id: "glass" };
    return { id: "white_concrete" };
  }

  if (y > gr && y <= 4) {
    if (face === "W" && t === 6 && y <= gr + 2) {
      return {
        id: "oak_door",
        props: {
          facing: "west",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      };
    }
    if (face === "W" && y === 4) return { id: "red_concrete" }; // shop sign band
    const pillar = face === "W" && (t === 5 || t === 7);
    if (bay && !pillar && y <= gr + 3) return { id: "glass" };
    return { id: "white_concrete" };
  }

  return null;
}

for (const [x, z, gr] of cells) {
  const ext = exterior(x, z);

  // 1. Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");

  // 2. Base course (exterior) / ground floor slab (interior)
  put(x, gr, z, ext ? "polished_andesite" : "smooth_stone");

  // 3. Storeys, floor slabs, deck and parapet
  for (let y = gr + 1; y <= 11; y++) {
    if (ext) {
      const b = facade(x, z, y, gr);
      if (b) put(x, y, z, b.id, b.props);
    } else if (y === 5 || y === 10) {
      put(x, y, z, "smooth_stone"); // floor slab / roof deck
    }
  }

  // 4. Warm light behind some upper-storey windows (inside the air gap)
  if (ext) {
    const { face, t } = faceOf(x, z);
    const long = face === "W" || face === "E";
    const len = long ? D : W;
    const bay = t > 0 && t < len - 1 && t % 4 !== 0;
    if (bay && t % 8 === 2) {
      let ix = x, iz = z;
      if (face === "W") ix = x + 1;
      else if (face === "E") ix = x - 1;
      else if (face === "N") iz = z + 1;
      else iz = z - 1;
      if (has(ix, iz) && !exterior(ix, iz) && 7 >= G(ix, iz)) {
        put(ix, 7, iz, "glowstone");
      }
    }
  }
}

// 5. Roof equipment: a Taipei-style water tank on the deck, and a lightning rod
for (const [x, z] of [[1, 4], [2, 4], [1, 5], [2, 5]]) {
  for (let y = 11; y <= 13; y++) put(x, y, z, "iron_block");
}
put(2, 11, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);
