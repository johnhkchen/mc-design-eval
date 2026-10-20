import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1077416.cells.json`, "utf8"));

const W = 33, H = 46, D = 34;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();

for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 12, Math.round(gr)));
  const roof = Math.min(Math.max(Math.round(rf), ground + 6), H - 6);
  map.set(key(x, z), { x, z, ground, roof, side: null, a: 0 });
}
const has = (x, z) => map.has(key(x, z));

const DIRS = {
  N: { dx: 0, dz: -1, inX: 0, inZ: 1 },
  S: { dx: 0, dz: 1, inX: 0, inZ: -1 },
  W: { dx: -1, dz: 0, inX: 1, inZ: 0 },
  E: { dx: 1, dz: 0, inX: -1, inZ: 0 },
};
const ORDER = ["N", "S", "W", "E"];

for (const c of map.values()) {
  for (const d of ORDER) {
    const dir = DIRS[d];
    if (!has(c.x + dir.dx, c.z + dir.dz)) {
      c.side = d;
      c.a = (d === "N" || d === "S") ? c.x : c.z;
      break;
    }
  }
}

// Facade: brick spandrels, stone piers, dark-framed glass, granite shopfront base.
function facadeBlock(c, y) {
  const rel = y - c.ground;
  if (rel < 0) return null;
  if (rel === 0) return "polished_granite";
  if (rel <= 2) return c.a % 3 === 0 ? "stone_bricks" : "glass";
  if (rel === 3) return "stone_bricks";
  const k = (rel - 4) % 2;
  if (k === 0) return "bricks";                       // brick spandrel, no grey striping
  return c.a % 3 === 0 ? "stone_bricks" : "glass";    // grey piers, glazed bays
}

// Pass 1: foundations, massing, facades, parapets, roof surface.
for (const c of map.values()) {
  const { x, z, ground, roof, side } = c;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < roof; y++) g.set(x, y, z, "bricks");
  if (!side) g.set(x, roof - 1, z, "smooth_stone");
  if (side) {
    for (let y = ground; y < roof; y++) {
      const b = facadeBlock(c, y);
      if (b) g.set(x, y, z, b);
    }
    g.set(x, roof, z, "stone_bricks");        // parapet
    g.set(x, roof - 1, z, "smooth_stone");    // cornice course
  }
}

// Pass 2: lit windows (glowstone on the inward cell behind the glass).
for (const c of map.values()) {
  if (!c.side) continue;
  const d = DIRS[c.side];
  if (!has(c.x + d.inX, c.z + d.inZ)) continue;
  for (let y = c.ground + 1; y < c.roof - 1; y++) {
    const rel = y - c.ground;
    const isWindow = (rel >= 1 && rel <= 2) || (rel >= 5 && (rel - 4) % 2 === 1);
    if (!isWindow || c.a % 3 === 0) continue;
    if ((c.a * 5 + rel * 3 + c.x + c.z) % 7 === 0) {
      g.set(c.x + d.inX, y, c.z + d.inZ, "glowstone");
    }
  }
}

// Pass 3: entrance on the street face, framed in granite with a lintel.
{
  const faceOf = (s) => [...map.values()].filter(c => c.side === s).sort((p, q) => p.x - q.x);
  let face = "N", facing = "south";
  let list = faceOf("N");
  if (!list.length) { face = "S"; facing = "north"; list = faceOf("S"); }
  if (list.length) {
    const door = list[Math.floor(list.length / 2)];
    const y0 = door.ground;
    // Granite surround on the piers either side of the door.
    for (const dx of [-1, 1]) {
      const nx = door.x + (face === "N" || face === "S" ? dx : 0);
      const nz = door.z + (face === "W" || face === "E" ? dx : 0);
      const n = map.get(key(nx, nz));
      if (n && n.side === face) {
        for (let y = y0; y <= y0 + 2; y++) g.set(nx, y, nz, "polished_granite");
      }
    }
    // Door, glazed transom and granite lintel.
    g.set(door.x, y0, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    g.set(door.x, y0 + 1, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    g.set(door.x, y0 + 2, door.z, "glass");
    g.set(door.x, y0 + 3, door.z, "polished_granite");
  }
}

// Pass 4: roof penthouse with glazed band and capping course.
for (const c of map.values()) {
  if (c.side) continue;
  if (c.x < 11 || c.x > 21 || c.z < 11 || c.z > 22) continue;
  const top = c.roof + 2;
  if (top >= H) continue;
  const perimeter = c.x === 11 || c.x === 21 || c.z === 11 || c.z === 22;
  for (let y = c.roof; y <= top; y++) {
    if (y === top) {
      g.set(c.x, y, c.z, "stone_bricks");
    } else if (perimeter) {
      const isWin = (y === c.roof + 1) && ((c.x + c.z) % 3 !== 0);
      g.set(c.x, y, c.z, isWin ? "glass" : "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/NYC1077416.nbt`);
