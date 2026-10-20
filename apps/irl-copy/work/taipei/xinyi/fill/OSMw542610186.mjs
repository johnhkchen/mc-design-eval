import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Decided here: a 2-storey reinforced-concrete commercial block
// of the 1980s-90s Taipei type. Cream ceramic-tile facade, light-grey concrete
// piers, dark shopfront at street level, tinted glazing, a dark-oak entrance with
// a canopy on the street face, a parapet, and rooftop condenser units.
// Lidar roof ~11 above lowest ground: storey line at 5, roof deck at 10, parapet on top.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610186";
const W = 33, D = 15, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
let minG = Infinity;
for (const c of cells) minG = Math.min(minG, c[2]);

const ground = new Map();
const list = [];
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.round(gr - minG));
  list.push([x, z]);
}

const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const S1 = 5;       // storey line (first floor slab), above lowest ground
const DECK = 10;    // roof deck layer for a flat-roofed 2-storey block

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};
const TF = (b) => (b ? "true" : "false");

// Pane connections: connect to neighbouring facade cells so the grid reads as a wall.
const paneProps = (x, z) => ({
  north: TF(has(x, z - 1) && isEdge(x, z - 1)),
  south: TF(has(x, z + 1) && isEdge(x, z + 1)),
  east: TF(has(x + 1, z) && isEdge(x + 1, z)),
  west: TF(has(x - 1, z) && isEdge(x - 1, z)),
  waterlogged: "false",
});

// Entrance: the street face is the lowest-z row; door sits nearest the footprint's mean x.
const minZ = Math.min(...list.map(([, z]) => z));
const meanX = list.reduce((s, [x]) => s + x, 0) / list.length;
const front = list.filter(([, z]) => z === minZ).sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
const door = front.length ? front[0] : null;

for (const [x, z] of list) {
  const gr = ground.get(key(x, z));
  const edge = isEdge(x, z);
  const R = Math.max(DECK, gr + 1);          // roof deck layer
  const groundStorey = S1 > gr;              // a ground storey exists on this cell

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground surface / base course.
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // Storey line slab (floor of storey 2), every cell, if it sits within the body.
  if (S1 > gr && S1 < R) {
    put(x, S1, z, edge ? "smooth_quartz" : "smooth_stone");
  }

  // Facade and interior body between ground and deck.
  for (let y = gr + 1; y < R; y++) {
    if (y === S1) continue;
    if (!edge) continue; // interior stays air behind the glass

    const inGround = groundStorey && y < S1;
    const lintelG = inGround && y === S1 - 1;
    const topRow = y === R - 1;

    if (lintelG || topRow) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    const isPier = (x + z) % 3 === 0;
    if (isPier) {
      put(x, y, z, inGround ? "black_concrete" : "light_gray_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
    }
  }

  // Deck layer (roof surface) and parapet on the edge.
  put(x, R, z, edge ? "smooth_quartz" : "smooth_stone");
  if (edge) put(x, R + 1, z, "stone_bricks");
}

// Entrance door and canopy on the street face.
if (door) {
  const [dx, dz] = door;
  const gr = ground.get(key(dx, dz));
  if (gr + 2 < S1 - 1) {
    const doorProps = (half) => ({
      facing: "north", half, hinge: "left", open: "false", powered: "false", waterlogged: "false",
    });
    put(dx, gr + 1, dz, "dark_oak_door", doorProps("lower"));
    put(dx, gr + 2, dz, "dark_oak_door", doorProps("upper"));
    // Canopy ledge above the door, across the entrance bay.
    if (gr + 3 < S1 - 1) {
      for (const ox of [-1, 0, 1]) {
        const cx = dx + ox;
        if (has(cx, dz) && isEdge(cx, dz)) {
          put(cx, gr + 3, dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
        }
      }
    }
    // Shopfront glazing beside the entrance bay.
    for (const ox of [-2, 2]) {
      const cx = dx + ox;
      if (has(cx, dz) && isEdge(cx, dz) && (cx + dz) % 3 !== 0) {
        put(cx, gr + 1, dz, "light_blue_stained_glass_pane", paneProps(cx, dz));
        put(cx, gr + 2, dz, "light_blue_stained_glass_pane", paneProps(cx, dz));
      }
    }
  }
}

// Warm light behind glass: glowstone and shroomlight on interior cells, in both storeys.
for (const [x, z] of list) {
  if (isEdge(x, z)) continue;
  const gr = ground.get(key(x, z));
  const R = Math.max(DECK, gr + 1);
  const lightY = [gr + 2, S1 + 2];
  for (const y of lightY) {
    if (y <= gr || y >= R || y === S1) continue;
    if ((x * 3 + z * 5) % 11 === 0) put(x, y, z, "glowstone");
    else if ((x + 2 * z) % 13 === 0 && y > S1) put(x, y, z, "shroomlight");
  }
}

// Rooftop condenser units and a small plant room on the deck, kept low.
for (const [x, z] of list) {
  if (isEdge(x, z)) continue;
  const gr = ground.get(key(x, z));
  const R = Math.max(DECK, gr + 1);
  if (x % 7 === 3 && z % 5 === 2) {
    put(x, R + 1, z, "gray_concrete");
  }
  if (x >= 13 && x <= 19 && z >= 5 && z <= 9 && (x + z) % 4 === 0) {
    put(x, R + 1, z, "light_gray_concrete");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
