import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0489-7F";
const W = 41, H = 47, D = 24;
const ROOF = 35;      // roof top, about 35 blocks above lowest ground
const STOREY = 5;     // 7 storeys of 5 blocks, built 2006 commercial/office block

// ---- read footprint: [x, z, ground] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
const key = (x, z) => `${x},${z}`;
for (const c of raw) {
  const x = Array.isArray(c) ? c[0] : c.x;
  const z = Array.isArray(c) ? c[1] : c.z;
  let gr = Array.isArray(c) ? c[2] : (c.ground ?? c.g ?? 0);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  gr = Math.max(0, Math.min(ROOF - 1, Math.round(gr)));
  G.set(key(x, z), gr);
}

const inFp = (x, z) => G.has(key(x, z));
const edgeInfo = (x, z) => ({
  missX: !inFp(x - 1, z) || !inFp(x + 1, z),
  missZ: !inFp(x, z - 1) || !inFp(x, z + 1),
});

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false",
});

// ---- main body: every footprint column, foundation up to roof ----
for (const [k, ground] of G) {
  const [x, z] = k.split(",").map(Number);
  const { missX, missZ } = edgeInfo(x, z);
  const edge = missX || missZ;
  const corner = missX && missZ;
  const mullion = missZ ? x % 3 === 0 : z % 3 === 0;
  const entranceZone = missZ && z === 0 && x >= 16 && x <= 24;

  // foundation, solid from y=0 up to the cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone");

  for (let y = ground; y <= ROOF; y++) {
    // roof deck and parapet
    if (y === ROOF) {
      put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
      if (edge) put(x, ROOF + 1, z, "white_concrete");
      continue;
    }

    const s = Math.floor(y / STOREY);
    const yy = y % STOREY;

    // interior: floor slabs only (no interiors)
    if (!edge) {
      if (y === ground || yy === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // ---- facade cells ----
    // base course at the cell's ground
    if (y === ground) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // entrance: stone surround, door on the z=0 face at ground floor
    if (s === 0 && entranceZone && y <= ground + 3 && y <= 4) {
      const doorBay = x >= 18 && x <= 22;
      if (doorBay && (y === ground + 1 || y === ground + 2) && ground + 2 <= 4) {
        put(x, y, z, "dark_oak_door", doorProps(y === ground + 1 ? "lower" : "upper"));
        continue;
      }
      if (x === 17 || x === 23) { put(x, y, z, "smooth_stone"); continue; }
      if (y === ground + 3 || y === 4) { put(x, y, z, "smooth_stone"); continue; }
    }

    if (yy === 0) {
      put(x, y, z, "smooth_quartz");                 // storey line
    } else if (yy === 4) {
      put(x, y, z, "white_concrete");                // spandrel
    } else if (corner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });  // corner columns
    } else if (mullion) {
      put(x, y, z, "white_concrete");                // mullions
    } else {
      // warm lit windows at dusk, placed on the facade plane
      const lit = s >= 1 && yy === 2 && ((x * 5 + z * 7 + s * 3) % 8 === 0);
      put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    }
  }
}

// ---- rooftop plant penthouse, centred on the roof ----
for (let x = 12; x <= 28; x++) {
  for (let z = 7; z <= 16; z++) {
    if (!inFp(x, z)) continue;
    const perimeter = x === 12 || x === 28 || z === 7 || z === 16;
    for (let y = ROOF + 1; y <= 39; y++) {
      if (perimeter) {
        const louver = (y === 37 || y === 38) && (x + z) % 2 === 0;
        put(x, y, z, louver ? "iron_bars" : "light_gray_concrete");
      } else {
        put(x, y, z, "gray_concrete");
      }
    }
    put(x, 40, z, "smooth_stone"); // cap
  }
}
if (inFp(20, 11)) put(20, 41, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
