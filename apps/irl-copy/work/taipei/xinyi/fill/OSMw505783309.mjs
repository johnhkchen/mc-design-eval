import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 小雅名廈: seven-storey 1980s-era mixed-use block, cream tile walls, dark-glass shopfront,
// red awning over the entrance, stone plinth, parapet with cornice, and a rooftop penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw505783309";
const W = 28, H = 47, D = 16;
const STOREY = 5, NSTOREYS = 7;
const ROOF_OFF = STOREY * NSTOREYS; // 35

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const cells = raw.map(([x, z, g]) => [x, z, g - minG]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const isIn = (x, z) => ground.has(key(x, z));

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Materials
const WALL = "white_concrete";
const BAND = "smooth_stone";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";
const PIER = "smooth_quartz";
const GLASS = "cyan_stained_glass_pane";
const AWNING = "red_concrete";
const DOOR = "dark_oak_door";

const g = new Voxels([W, H, D]);

function put(x, y, z, name, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Outward direction for each facade face
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const FACE_ORDER = ["S", "N", "E", "W"];

function facesOf(x, z) {
  const out = [];
  for (const f of ["N", "S", "W", "E"]) {
    const [dx, dz] = OUT[f];
    if (!isIn(x + dx, z + dz)) out.push(f);
  }
  return out;
}

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pick the entrance: a single-face cell on the south (street) face, nearest the centre.
function pickDoor() {
  const cands = [];
  for (const [x, z] of cells) {
    const f = facesOf(x, z);
    if (f.length !== 1) continue;
    cands.push({ x, z, face: f[0] });
  }
  for (const pref of FACE_ORDER) {
    const list = cands.filter((c) => c.face === pref);
    if (list.length) {
      const along = (c) => (pref === "N" || pref === "S" ? c.x : c.z);
      const mid = pref === "N" || pref === "S" ? (minX + maxX) / 2 : (minZ + maxZ) / 2;
      list.sort((a, b) => Math.abs(along(a) - mid) - Math.abs(along(b) - mid));
      return list[0];
    }
  }
  return null;
}
const door = pickDoor();

// 1. Foundations and interior floor slabs
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, FOUND);
  if (facesOf(x, z).length) continue;
  for (let k = 0; k < NSTOREYS; k++) put(x, gy + STOREY * k, z, SLAB);
  put(x, gy + ROOF_OFF, z, SLAB);
}

// 2. Facades
for (const [x, z, gy] of cells) {
  const faces = facesOf(x, z);
  if (!faces.length) continue;
  const corner = faces.length > 1;
  const face = faces.find((f) => f === "S") || faces[0];
  const along = face === "N" || face === "S" ? x - minX : z - minZ;
  const alongMax = face === "N" || face === "S" ? maxX - minX : maxZ - minZ;
  const isPier = corner || along % 3 === 0 || along === 0 || along === alongMax;
  const [ix, iz] = [x + INWARD[face][0], z + INWARD[face][1]];
  const innerIsRoom = isIn(ix, iz) && facesOf(ix, iz).length === 0;
  const isDoor = door && door.x === x && door.z === z;

  for (let k = 0; k < NSTOREYS; k++) {
    const b = gy + STOREY * k;
    // storey line
    put(x, b, z, k === 0 ? BASE : BAND);

    if (k === 0) {
      // shopfront: glazing, piers, door, red awning
      put(x, b + 4, z, corner ? WALL : AWNING);
      if (isDoor) {
        const facing = { N: "north", S: "south", E: "east", W: "west" }[face];
        put(x, b + 1, z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, b + 2, z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, b + 3, z, GLASS, paneProps(face));
      } else if (isPier) {
        put(x, b + 1, z, PIER);
        put(x, b + 2, z, PIER);
        put(x, b + 3, z, PIER);
      } else {
        put(x, b + 1, z, GLASS, paneProps(face));
        put(x, b + 2, z, GLASS, paneProps(face));
        put(x, b + 3, z, GLASS, paneProps(face));
      }
      if (innerIsRoom && !isDoor && (x + z) % 4 === 0) {
        put(ix, b + 1, iz, "glowstone");
      }
    } else {
      // upper storeys: sill and lintel courses, window pairs between piers
      put(x, b + 1, z, WALL);
      put(x, b + 4, z, WALL);
      if (isPier) {
        put(x, b + 2, z, PIER);
        put(x, b + 3, z, PIER);
      } else {
        put(x, b + 2, z, GLASS, paneProps(face));
        put(x, b + 3, z, GLASS, paneProps(face));
        if (innerIsRoom && (x + z + k) % 4 === 0) {
          put(ix, b + 1, iz, "glowstone");
        }
      }
    }
  }

  // Roof: cornice, parapet, cap
  const R = gy + ROOF_OFF;
  put(x, R, z, BAND);
  put(x, R + 1, z, WALL);
  put(x, R + 2, z, WALL);
  put(x, R + 3, z, BAND);
  if (corner) put(x, R + 4, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// 3. Rooftop penthouse and mast on interior cells near the centre
for (const [x, z, gy] of cells) {
  if (facesOf(x, z).length) continue;
  const R = gy + ROOF_OFF;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2) {
    for (let y = R + 1; y <= R + 3; y++) put(x, y, z, SLAB);
  }
}
const mastCell = cells.find(([x, z]) => x === cx && z === cz) || cells[0];
{
  const [x, z, gy] = mastCell;
  const R = gy + ROOF_OFF;
  for (let y = R + 4; y <= R + 6; y++) put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
