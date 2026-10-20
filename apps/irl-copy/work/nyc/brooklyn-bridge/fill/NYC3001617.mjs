import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001617.cells.json`, "utf8"));

const W = 19, H = 40, D = 17;
const g = new Voxels([W, H, D]);

// 1987 commercial/office block: tan brick spandrels, light-gray precast piers,
// blue-tinted glass bands, granite base, stone cornice, rooftop mechanical box.
const M = {
  foundation: "stone_bricks",
  base: "polished_granite",
  spandrel: "bricks",
  slab: "light_gray_concrete",
  pier: "light_gray_concrete",
  glass: "light_blue_stained_glass",
  lit: "glowstone",
  cornice: "smooth_stone",
  mech: "light_gray_concrete",
  mechCap: "smooth_stone",
};

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(key(x, z), {
    ground: Math.max(0, Math.min(H - 10, Math.round(gr))),
    roofRaw: rf,
  });
}
const inside = (x, z) => raw.has(key(x, z));

// Smooth the lidar roof: average over the 3x3 footprint neighbourhood,
// then quantise to 4-block (two-storey) tiers so setbacks read cleanly.
const map = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const q = raw.get(key(x + dx, z + dz));
      if (q) { sum += q.roofRaw; n++; }
    }
  }
  const avg = sum / n;
  let roof = 4 * Math.round(avg / 4);
  roof = Math.max(c.ground + 4, Math.min(H - 5, roof));
  map.set(k, { ground: c.ground, roof });
}

function faces(x, z) {
  return {
    w: !inside(x - 1, z),
    e: !inside(x + 1, z),
    n: !inside(x, z - 1),
    s: !inside(x, z + 1),
  };
}

// Pass 1: foundation, base course, storeys, cornice.
for (const [x, z] of raw.keys().map ? [...raw.keys()].map(k => k.split(",").map(Number)) : []) {
  const { ground, roof } = map.get(key(x, z));
  const f = faces(x, z);
  const ext = f.w || f.e || f.n || f.s;
  const cornerX = f.w || f.e;
  const cornerZ = f.n || f.s;
  let piers = false;
  if (cornerX && cornerZ) piers = true;
  else if (f.w || f.e) piers = z % 3 === 0;
  else if (f.n || f.s) piers = x % 3 === 0;

  for (let y = 0; y < roof; y++) {
    if (y < ground) { g.set(x, y, z, M.foundation); continue; }
    if (y === ground) { g.set(x, y, z, M.base); continue; }
    if (y === roof - 1) { g.set(x, y, z, M.cornice); continue; }
    if (y % 2 === 0) {
      g.set(x, y, z, ext ? M.spandrel : M.slab);
      continue;
    }
    if (ext) {
      if (piers) {
        g.set(x, y, z, M.pier);
      } else {
        const lit = ((x * 7 + z * 3 + y) % 11) === 0;
        g.set(x, y, z, lit ? M.lit : M.glass);
      }
    }
  }
}

// Pass 2: rooftop mechanical penthouse on the central plateau.
for (let x = 6; x <= 12; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!inside(x, z)) continue;
    const { roof } = map.get(key(x, z));
    if (roof + 3 >= H) continue;
    g.set(x, roof, z, M.mech);
    g.set(x, roof + 1, z, M.mech);
    if (x >= 7 && x <= 11 && z >= 6 && z <= 10) {
      g.set(x, roof + 2, z, M.mechCap);
    }
  }
}

// Pass 3: entrance on the north (lowest-z) face, nearest the middle.
{
  const mid = Math.floor(W / 2);
  let door = null;
  for (const k of raw.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!inside(x, z - 1)) {
      if (!door || Math.abs(x - mid) < Math.abs(door[0] - mid)) door = [x, z];
    }
  }
  if (door) {
    const [dx, dz] = door;
    const { ground } = map.get(key(dx, dz));
    g.set(dx, ground + 1, dz, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(dx, ground + 2, dz, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

g.save(`${DIR}/NYC3001617.nbt`);
