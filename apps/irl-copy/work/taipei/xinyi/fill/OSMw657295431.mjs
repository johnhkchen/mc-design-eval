import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw657295431";
const W = 23, H = 23, D = 41;

// Record: roof ~11 blocks above lowest ground. Reads as a 2-storey mid-century
// concrete block (1960s-70s Taipei), white/light-grey concrete with red fascia,
// ribbon glazing, ground-floor entrance, flat roof with parapet and rooftop units.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);
const inside = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const base = minG + 1; // first building layer above the lowest ground block

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Exposed faces per cell, and the front (largest exposed face).
const info = new Map();
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z, gc] of cells) {
  const exposed = Object.keys(DIRS).filter(
    (d) => !inside(x + DIRS[d][0], z + DIRS[d][1])
  );
  for (const d of exposed) faceCount[d]++;
  info.set(`${x},${z}`, { x, z, gc, exposed, perim: exposed.length > 0, corner: exposed.length >= 2 });
}
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Door: the middle non-corner cell on the front face.
const frontCells = [...info.values()]
  .filter((c) => c.perim && !c.corner && c.exposed.includes(front))
  .sort((a, b) => (front === "north" || front === "south" ? a.x - b.x : a.z - b.z));
const doorKey = frontCells.length ? `${frontCells[Math.floor(frontCells.length / 2)].x},${frontCells[Math.floor(frontCells.length / 2)].z}` : null;

// Window helper: ribbon glazing, piers every third cell along each face.
function faceU(c, d) {
  return d === "north" || d === "south" ? c.x : c.z;
}
function isWindow(c) {
  if (!c.perim || c.corner) return false;
  const d = c.exposed[0];
  return faceU(c, d) % 3 !== 0;
}
function paneProps(d) {
  if (d === "north" || d === "south") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Foundation: solid from y 0 up to each cell's ground.
for (const c of info.values()) {
  for (let y = 0; y <= c.gc; y++) put(c.x, y, c.z, "stone");
}

// Building layers.
for (const c of info.values()) {
  const { x, z, gc, perim, corner } = c;
  const d = c.exposed[0];
  const win = isWindow(c);
  const isDoor = c.perim && !corner && `${x},${z}` === doorKey && c.exposed.includes(front);

  for (let h = 0; h <= 11; h++) {
    const y = base + h;
    if (y <= gc || y >= H) continue;

    if (!perim) {
      // Interior: floor slabs at storey lines and roof slab; air between.
      if (h === 0 || h === 5 || h === 10) put(x, y, z, "smooth_stone");
      else if (h === 11 && x % 5 === 2 && z % 9 === 4) put(x, y, z, "iron_block");
      continue;
    }

    let id = null;
    let props;

    if (h === 0 || h === 1) {
      id = corner ? "light_gray_concrete" : "stone_bricks";
    } else if (h === 2 || h === 3) {
      if (isDoor) {
        id = "dark_oak_door";
        props = {
          facing: front,
          half: h === 2 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (win) {
        id = "light_blue_stained_glass_pane";
        props = paneProps(d);
      } else {
        id = corner ? "light_gray_concrete" : "white_concrete";
      }
    } else if (h === 4) {
      id = "red_concrete";
    } else if (h === 5) {
      id = "light_gray_concrete";
    } else if (h === 6 || h === 9) {
      id = "light_gray_concrete";
    } else if (h === 7 || h === 8) {
      if (win) {
        id = "light_blue_stained_glass_pane";
        props = paneProps(d);
      } else {
        id = corner ? "light_gray_concrete" : "white_concrete";
      }
    } else if (h === 10) {
      id = "smooth_stone";
    } else if (h === 11) {
      id = corner ? "light_gray_concrete" : "white_concrete";
    }

    if (id) put(x, y, z, id, props);
  }
}

// Warm lights behind some windows, on the interior cell just inside the glass.
for (const c of info.values()) {
  if (!isWindow(c)) continue;
  const d = c.exposed[0];
  const u = faceU(c, d);
  if (u % 6 !== 1) continue;
  const [dx, dz] = DIRS[d];
  const ix = c.x - dx, iz = c.z - dz;
  const ic = info.get(`${ix},${iz}`);
  if (!ic || ic.perim) continue;
  put(ix, base + 2, iz, "glowstone");
  put(ix, base + 7, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
