import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw372954655";
const W = 24, H = 23, D = 67;

// Record: 2-storey cream-tiled mid-rise (1980s Xinyi-era shophouse block),
// stone plinth, brown tile fascia, shopfront ground floor, roof about 11 above lowest ground.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => cells.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// outward face of a perimeter cell (z-faces take priority at corners)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// entrance: centre of the lowest-z row of the footprint, three cells wide
let minZ = Infinity;
for (const k of cells.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
const row = [...cells.keys()].map(k => k.split(",").map(Number)).filter(([, z]) => z === minZ);
const cx = row.length ? row.reduce((s, [x]) => s + x, 0) / row.length : W / 2;
const cxR = Math.round(cx);
const entranceCells = new Set(row.filter(([x]) => Math.abs(x - cxR) <= 1).map(([x]) => `${x},${minZ}`));
const surroundCells = new Set(row.filter(([x]) => Math.abs(x - cxR) === 2).map(([x]) => `${x},${minZ}`));

const FACE_CODE = { north: 0, south: 1, east: 2, west: 3 };

for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);

  // plinth: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // ground floor slab
  put(x, gr, z, "smooth_stone");

  const face = faceOf(x, z);

  if (!face) {
    // interior: floor slab at storey line and roof deck, air elsewhere
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    continue;
  }

  const zFace = face === "north" || face === "south";
  const t = zFace ? x : z;
  const corner = zFace
    ? (!has(x - 1, z) || !has(x + 1, z))
    : (!has(x, z - 1) || !has(x, z + 1));
  const isEntranceRow = face === "north" && z === minZ;
  const isEntrance = isEntranceRow && entranceCells.has(`${x},${z}`);
  const isSurround = isEntranceRow && surroundCells.has(`${x},${z}`);
  const pier = corner || isSurround || t % 3 === 0;
  const bay = Math.floor(t / 3);
  const lit = ((bay * 5 + FACE_CODE[face]) % 4) === 0;
  const paneProps = zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let k = 1; k <= 11; k++) {
    const y = gr + k;
    let id = null, props = null;

    switch (k) {
      case 1: // base course
        id = "polished_andesite"; break;
      case 2:
      case 3: // shopfront / entrance
        if (isEntrance) {
          if (x === cxR) {
            // glazed entrance door, lantern above on the threshold line
            id = "tinted_glass";
          } else if (k === 3) {
            put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
            continue;
          } else {
            continue; // open air beside the door
          }
          break;
        }
        if (pier) id = "smooth_quartz";
        else if (lit) id = "glowstone";
        else { id = "light_blue_stained_glass_pane"; props = paneProps; }
        break;
      case 4: // fascia band (solid lintel over the entrance)
        id = "brown_terracotta"; break;
      case 5: // storey line / floor slab
        id = "smooth_stone"; break;
      case 6: // sill
        id = "smooth_quartz"; break;
      case 7:
      case 8: // upper windows
        if (pier) id = "smooth_quartz";
        else if (lit) id = "glowstone";
        else { id = "light_blue_stained_glass_pane"; props = paneProps; }
        break;
      case 9: // head
        id = "white_terracotta"; break;
      case 10: // cornice
        id = "polished_andesite"; break;
      case 11: // parapet
        id = "white_terracotta"; break;
    }
    if (id) put(x, y, z, id, props);
  }
}

// roof plant: a small mechanical penthouse on the interior, set back from the parapet
for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  if (!faceOf(x, z)) {
    if (x >= 5 && x <= 9 && z >= Math.round(D * 0.35) && z <= Math.round(D * 0.35) + 6) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
