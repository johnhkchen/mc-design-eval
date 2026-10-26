import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86639 - 1400 L St NW, Commercial-Office-Large
// 1970s-80s downtown office: stone base, white concrete frame and mullions,
// tinted blue glass bands, light stone spandrels, corbelled parapet,
// entrance on the street (min-z) face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86639";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 30, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.round(gr);
  let roof = Math.round(rf);
  if (roof <= ground) roof = ground + 1;
  map.set(key(x, z), { g: ground, r: roof });
}
const has = (x, z) => map.has(key(x, z));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const minG = Math.min(...[...map.values()].map(c => c.g));
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Entrance: street-facing (min z) perimeter cell nearest the middle of the front.
let door = null;
{
  const zs = [...map.keys()].map(k => Number(k.split(",")[1]));
  const zMin = Math.min(...zs);
  const xs = [...map.keys()].filter(k => Number(k.split(",")[1]) === zMin).map(k => Number(k.split(",")[0]));
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  let best = null;
  for (const x of xs) {
    if (x === Math.min(...xs) || x === Math.max(...xs)) continue; // keep corners as piers
    if (!best || Math.abs(x - mid) < Math.abs(best - mid)) best = x;
  }
  if (best === null) best = Math.round(mid);
  door = { x: best, z: zMin };
}

for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.g;
  const per = perim(x, z);
  const isXEdge = (x === 0 || x === W - 1);
  const isZEdge = (z === 0 || z === D - 1);
  const corner = isXEdge && isZEdge;
  const top = Math.min(Math.max(c.r, gr + 3), H - 3);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - minG;
    const band = rel % 3;
    const floor = Math.floor(rel / 3);

    if (!per) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Corbelled parapet: stone cap with a white concrete course beneath
    if (y === top - 1) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top - 2) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Corner piers run full height
    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    const mull = isXEdge ? (z % 2 === 0) : (x % 2 === 0);

    if (floor === 0) {
      // Ground storey: stone base, entrance, shopfront
      if (band === 0) {
        g.set(x, y, z, "polished_granite");
        continue;
      }
      if (x === door.x && z === door.z) {
        if (band === 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        continue;
      }
      // Stone lintel over the entrance, lit lantern beside it
      if (band === 2 && z === door.z && Math.abs(x - door.x) === 1) {
        g.set(x, y, z, "white_concrete");
        continue;
      }
      if (mull) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", PANE);
      }
      continue;
    }

    // Upper storeys: light stone spandrel at the bottom of each storey
    if (band === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (mull) {
      g.set(x, y, z, "white_concrete");
    } else if (band === 2 && ((x * 3 + z * 5 + floor * 7) % 9 === 0)) {
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", PANE);
    }
  }

  // Roof equipment on interior roof cells
  if (!per && x % 4 === 2 && z % 3 === 1 && top + 1 < H) {
    g.set(x, top, z, "smooth_stone");
    g.set(x, top + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance lanterns on the street face, set in the ground-storey mullion line
if (map.has(key(door.x, door.z))) {
  const gy = map.get(key(door.x, door.z)).g;
  const lanternY = minG + 3;
  if (lanternY < H && lanternY > gy) {
    // lantern hung on the lintel row beside the door, only where a wall cell exists
    for (const dx of [-1, 1]) {
      const lx = door.x + dx;
      if (has(lx, door.z) && lanternY - 1 >= 0) {
        g.set(lx, lanternY - 1, door.z, "white_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
