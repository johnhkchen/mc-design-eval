import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020166";
const W = 48, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint and ground lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// levels: ground floor sits at the lowest ground; roof about 11 above it
const minG = Math.min(...cells.map((c) => c[2]));
const L0 = minG;              // ground-floor level
const ROOF = L0 + 11;         // roof deck (top of two storeys + cornice)
const PAR = ROOF + 1;         // parapet course
const hasParapet = PAR < H;
const hasPenthouse = ROOF + 2 < H;

// exterior faces
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const faces = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));
const sCoord = (dir, x, z) => (dir === "north" || dir === "south" ? x : z);

// principal street frontage = face direction with the most exposed cells
const counts = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cells) for (const [n] of faces(x, z)) counts[n]++;
let front = "south";
for (const k of Object.keys(counts)) if (counts[k] > counts[front]) front = k;

// entrance centre along the front facade (median of exposed cells)
const frontS = [];
for (const [x, z] of cells) {
  const f = faces(x, z).find(([n]) => n === front);
  if (f) frontS.push(sCoord(front, x, z));
}
frontS.sort((a, b) => a - b);
const s0 = frontS.length ? frontS[Math.floor(frontS.length / 2)] : 0;

const dirName = { north: "north", south: "south", west: "west", east: "east" };
const opposite = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// facade material for an exterior cell at height y
function facadeBlock(y, s, corner) {
  const r = y - L0;
  const pier = corner || s % 3 === 0;
  if (r === 0) return "polished_granite";             // base course
  if (r >= 1 && r <= 3) return pier ? "smooth_quartz" : "glass_pane"; // shopfront / ground glazing
  if (r === 4) return "smooth_quartz";                // storey line
  if (r === 5) return "white_concrete";               // upper spandrel
  if (r >= 6 && r <= 8) return pier ? "white_concrete" : "glass_pane"; // upper windows
  if (r === 9) return "white_concrete";
  if (r === 10) return "smooth_quartz";               // cornice
  return "white_concrete";
}

// entrance overrides on the front facade
function entranceBlock(x, z, y, dir) {
  const s = sCoord(dir, x, z);
  if (dir !== front || Math.abs(s - s0) > 1) return null;
  const r = y - L0;
  if (r === 1 || r === 2) {
    if (s === s0) {
      const [dx, dz] = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] }[dir];
      return {
        id: "dark_oak_door",
        st: { facing: dirName[dir], half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
      };
    }
    return { id: "glass" };
  }
  if (r === 3) return { id: "light_gray_concrete" }; // canopy/lintel
  return null;
}

// 1) main fill
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const gr = gAt(x, z);
    const fs = faces(x, z);
    const ext = fs.length > 0;
    const corner = fs.length > 1;

    for (let y = 0; y < ROOF; y++) {
      if (y < gr) {
        g.set(x, y, z, "stone_bricks");               // foundation to ground
        continue;
      }
      if (ext) {
        const [dir] = fs[0];
        const s = sCoord(dir, x, z);
        const ent = entranceBlock(x, z, y, dir);
        if (ent) {
          g.set(x, y, z, ent.id, ent.st);
        } else {
          g.set(x, y, z, facadeBlock(y, s, corner));
        }
      } else {
        // interior: floor slabs only, air otherwise
        if (y === gr || y === L0 + 5) g.set(x, y, z, "smooth_stone");
      }
    }

    // roof deck
    g.set(x, ROOF, z, "light_gray_concrete");

    // parapet on exterior cells
    if (ext && hasParapet) g.set(x, PAR, z, "smooth_quartz");
  }
}

// 2) warm lights behind some upper windows (inside, air gap behind glass)
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const [dir] = fs[0];
  const s = sCoord(dir, x, z);
  if (s % 3 === 0 || s % 6 !== 1) continue;
  const y = L0 + 7;
  if (y < gr) continue;
  const [ox, oz] = opposite[dir];
  const ix = x + ox, iz = z + oz;
  if (!has(ix, iz)) continue;
  if (faces(ix, iz).length > 0) continue;
  if (y < gAt(ix, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// 3) roof penthouse / plant room on the roof deck (interior cells only)
if (hasPenthouse) {
  for (let x = 19; x <= 28; x++) {
    for (let z = 9; z <= 14; z++) {
      if (!has(x, z)) continue;
      if (faces(x, z).length > 0) continue;
      g.set(x, ROOF + 1, z, "light_gray_concrete");
      g.set(x, ROOF + 2, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
