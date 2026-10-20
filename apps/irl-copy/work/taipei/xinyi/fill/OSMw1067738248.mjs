import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Late-20th-century Xinyi commercial block: four storeys, pale quartz-clad
// facade with tinted glazing, shopfront ground floor, plant room on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738248";
const W = 18, H = 33, D = 24;
const ROOF = 20;   // roof deck (top slab of the fourth storey)
const PARAPET = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE = { east: "true", west: "true", north: "true", south: "true", waterlogged: "false" };

// Entrance: front (lowest z) perimeter cell nearest the middle of the width.
let entrance = null;
{
  const front = cells.filter(([x, z]) => perim(x, z));
  const minZ = Math.min(...front.map(([, z]) => z));
  const cand = front.filter(([, z]) => z === minZ);
  if (cand.length) {
    cand.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
    entrance = cand[0];
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const isPerim = perim(x, z);

  if (!isPerim) {
    // Interior: solid ground storey up to slab s, then air storeys with floor slabs.
    const s = Math.max(5, 5 * Math.ceil(gr / 5));
    for (let y = gr; y <= ROOF; y++) {
      if (y <= s) put(x, y, z, "light_gray_concrete");
      else if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
      else if (y === ROOF) put(x, y, z, "gray_concrete");
      else if ((y - 1) % 5 === 0 && (x * 7 + z * 3) % 9 === 0) {
        // Warm glow just inside the glass at the start of an upper storey.
        put(x, y, z, "glowstone");
      }
    }
    // Roof plant room on the roof deck, central cells only.
    if (x >= 6 && x <= 11 && z >= 8 && z <= 15) {
      for (let y = PARAPET; y <= 23; y++) {
        const edge = x === 6 || x === 11 || z === 8 || z === 15;
        if (y === 22 && edge) put(x, y, z, "iron_bars");
        else put(x, y, z, "light_gray_concrete");
      }
    }
    continue;
  }

  // Perimeter facade column from grade to parapet.
  for (let y = gr; y <= PARAPET; y++) {
    const bay = (x + z) % 3 === 0; // mullion
    const isEntrance = entrance && entrance[0] === x && entrance[1] === z;

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
    if (y === PARAPET) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }
    if (y % 5 === 0) { put(x, y, z, "white_concrete"); continue; }

    // Entrance: door opening and canopy.
    if (isEntrance && y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isEntrance && y === gr + 2) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isEntrance && y === gr + 3) { put(x, y, z, "red_concrete"); continue; }

    if (y === 4) { put(x, y, z, "white_concrete"); continue; } // ground storey header

    // Ground-floor shopfront glazing.
    if (y > gr && y <= 3) {
      if (bay) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", PANE);
      continue;
    }

    const r = y % 5;
    if (r === 1) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }      // header band
    // Window zone (r = 2, 3)
    if (bay) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", PANE);
  }
}

// Central antenna on the plant room.
if (has(8, 11)) {
  put(8, 24, 11, "lightning_rod");
  put(8, 25, 11, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
