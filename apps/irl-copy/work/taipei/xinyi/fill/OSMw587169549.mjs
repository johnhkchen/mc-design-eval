import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169549";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 45, H = 41, D = 16;
const g = new Voxels([W, H, D]);

// Footprint: ground height per cell, clamped so the building keeps at least one storey.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(27, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Roof: deck at y 28, parapet on the outer ring, roof top surface at 29 (about 29 blocks above lowest ground).
const PARAPET_Y = 28;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Exterior face statistics per facing direction (range of the along-face coordinate).
const stats = {};
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  for (const [dx, dz] of DIRS) {
    if (has(x + dx, z + dz)) continue;
    const c = dz !== 0 ? x : z;
    const k = `${dx},${dz}`;
    if (!stats[k]) stats[k] = { min: c, max: c };
    stats[k].min = Math.min(stats[k].min, c);
    stats[k].max = Math.max(stats[k].max, c);
  }
}
// Front (entrance) face: the north-side face if present, otherwise the first exterior face found.
const frontKey = stats["0,-1"] ? "0,-1" : Object.keys(stats)[0];

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation and core: solid from y 0 up to each cell's ground, then solid building mass up to the deck.
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks", {});
  for (let y = gr; y < PARAPET_Y; y++) g.set(x, y, z, "white_concrete", {});
  g.set(x, PARAPET_Y, z, "light_gray_concrete", {});
}

// 2. Facades on every exterior face: base course, floor lines, spandrels, bays of glass and piers,
//    a shopfront with a central entrance, a cornice and a parapet. Air or warm light sits behind the glass.
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  for (const [dx, dz] of DIRS) {
    if (has(x + dx, z + dz)) continue;
    const alongX = dz !== 0;
    const c = alongX ? x : z;
    const k = `${dx},${dz}`;
    const st = stats[k];
    const cc = c - st.min;
    const isFront = k === frontKey;
    const centre = Math.round((st.min + st.max) / 2);
    const innerX = x - dx, innerZ = z - dz;
    const innerOk = has(innerX, innerZ);
    const facing = FACING[k];

    for (let y = gr; y <= PARAPET_Y; y++) {
      const rel = y - gr;
      let id = "air";
      let props = {};
      let isGlass = false;

      if (y === PARAPET_Y) {
        id = "stone_bricks";
      } else if (y >= 26) {
        id = "smooth_quartz"; // cornice course
      } else if (rel % 5 === 0) {
        id = rel === 0 ? "gray_concrete" : "light_gray_concrete"; // base course / floor lines
      } else if (rel % 5 === 4) {
        id = "white_concrete"; // sill / lintel band
      } else if (cc % 3 === 0) {
        id = "white_concrete"; // piers between bays
      } else {
        id = "light_blue_stained_glass_pane";
        props = paneProps(alongX);
        isGlass = true;
      }

      // Entrance on the front face: centre bay of the shopfront.
      if (isFront && rel >= 1 && rel <= 4 && Math.abs(c - centre) <= 1 && y < 26) {
        if (c === centre && (rel === 1 || rel === 2)) {
          const half = rel === 1 ? "lower" : "upper";
          g.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
          isGlass = false;
          continue;
        } else if (c === centre && rel === 4) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          continue;
        } else if (rel <= 3) {
          id = "black_stained_glass_pane";
          props = paneProps(alongX);
          isGlass = true;
        }
      }

      g.set(x, y, z, id, props);

      // Air gap (or warm light) directly behind the glass.
      if (isGlass && innerOk) {
        if (rel === 2 && cc % 9 === 4) g.set(innerX, y, innerZ, "glowstone", {});
        else if (rel === 2 && cc % 9 === 7) g.set(innerX, y, innerZ, "shroomlight", {});
        else g.set(innerX, y, innerZ, "air", {});
      }
    }
  }
}

// 3. Roof deck for interior cells: light concrete with a few planters.
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const exterior = DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
  if (exterior) continue;
  g.set(x, PARAPET_Y, z, (x + z) % 6 === 0 ? "moss_block" : "light_gray_concrete", {});
}

// 4. Roof plant: a central penthouse on the footprint core, and a lightning rod mast.
const xs = [...ground.keys()].map((k) => Number(k.split(",")[0]));
const zs = [...ground.keys()].map((k) => Number(k.split(",")[1]));
const minx = Math.min(...xs), maxx = Math.max(...xs);
const minz = Math.min(...zs), maxz = Math.max(...zs);
const px0 = minx + Math.round((maxx - minx) / 3), px1 = maxx - Math.round((maxx - minx) / 3);
const pz0 = minz + Math.round((maxz - minz) / 3), pz1 = maxz - Math.round((maxz - minz) / 3);

for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    g.set(x, 29, z, "light_gray_concrete", {});
    g.set(x, 30, z, "light_gray_concrete", {});
    g.set(x, 31, z, "smooth_quartz", {});
  }
}

const cx = Math.round((minx + maxx) / 2), cz = Math.round((minz + maxz) / 2);
if (has(cx, cz)) {
  for (let y = 32; y <= 36; y++) {
    g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
