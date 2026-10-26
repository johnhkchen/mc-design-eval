import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86667";
const W = 22, H = 31, D = 29;
const STOREY = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellMap = new Map();
for (const [x, z, ground, roof] of cells) {
  const g = Math.round(ground);
  // storeys from lidar roof, smoothed into clean 3-block tiers (parapet takes 1 block)
  let n = Math.round((roof - g - 1) / STOREY);
  n = Math.max(2, n);
  n = Math.min(n, Math.floor((27 - g) / STOREY));
  cellMap.set(`${x},${z}`, { g, n, deck: g + STOREY * n });
}

const has = (x, z) => cellMap.has(`${x},${z}`);
const cellAt = (x, z) => cellMap.get(`${x},${z}`);
const bay = (x) => x >= 3 && x <= 18 && x % 3 === 0;   // window bays on front/back faces

let zMin = Infinity, zMax = -Infinity;
for (const [x, z] of cells) { zMin = Math.min(zMin, z); zMax = Math.max(zMax, z); }

const g3 = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g3.set(x, y, z, id, props);
  else g3.set(x, y, z, id);
};

for (const [key, c] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const { g, n, deck } = c;

  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const edge = front || back || west || east;
  const facade = front || back;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");

  if (edge) {
    // walls, storey by storey, up to the cornice below the deck
    for (let y = g; y <= deck - 1; y++) {
      const r = y - g;
      const s = Math.floor(r / STOREY);
      const k = r % STOREY;

      if (r === 0) { set(x, y, z, "stone_bricks"); continue; }          // base course
      if (y === deck - 1) { set(x, y, z, "smooth_stone"); continue; }    // cornice
      if (front && s === 0 && x === 10 && (r === 1 || r === 2)) {         // entrance door
        set(x, y, z, "spruce_door", {
          facing: "north", half: r === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (front && s === 0 && x === 11 && (k === 1 || k === 2)) {         // entrance surround
        set(x, y, z, "stone_bricks"); continue;
      }
      if (k === 0) { set(x, y, z, "smooth_stone"); continue; }           // storey string course / sill

      if (facade) {
        if (k === 1) {
          if (bay(x)) set(x, y, z, s === 0 ? "oak_planks" : "glass_pane"); // boarded shopfronts / windows
          else set(x, y, z, "bricks");
        } else { // k === 2
          set(x, y, z, bay(x) ? "smooth_stone" : "bricks");               // lintels / pillars
        }
      } else {
        set(x, y, z, "bricks");                                           // blank party walls
      }
    }
    // parapet and capstone
    set(x, deck, z, "bricks");
    set(x, deck + 1, z, "smooth_stone");
  } else {
    // interior: floor slabs per storey, roof deck at the top
    for (let s = 1; s <= n; s++) {
      const y = g + STOREY * s;
      set(x, y, z, s === n ? "gray_concrete" : "stone");
    }
    // solid backing two cells behind each facade: a one-block air gap sits behind the glass
    if (z === zMin + 2 || z === zMax - 2) {
      for (let y = g; y <= deck - 1; y++) set(x, y, z, "stone_bricks");
    }
  }
}

// warm lights standing on interior floors behind a few upper-storey windows
for (const x of [6, 15]) {
  for (const s of [1, 3]) {
    const c = cellAt(x, 1);
    if (!c || !has(x, 0)) continue;
    if (s >= c.n) continue;
    set(x, c.g + STOREY * s + 1, 1, "glowstone");
  }
}

// roof plant: a small penthouse on the interior of the upper roof
for (let x = 8; x <= 13; x++) {
  for (let z = 10; z <= 18; z++) {
    const c = cellAt(x, z);
    if (!c) continue;
    const perim = x === 8 || x === 13 || z === 10 || z === 18;
    const d = c.deck;
    if (d + 3 >= H) continue;
    set(x, d + 1, z, perim ? "stone_bricks" : "air");
    set(x, d + 2, z, perim ? "glass_pane" : "air");
    set(x, d + 3, z, "smooth_stone");
  }
}

g3.save(`${DIR}/${ID}.nbt`);
