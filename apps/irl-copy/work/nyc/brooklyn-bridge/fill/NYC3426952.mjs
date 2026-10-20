import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3426952.cells.json`, "utf8"));

const W = 19, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellOf = new Map();
for (const [x, z, gr, roof] of cells) {
  cellOf.set(key(x, z), { ground: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => cellOf.has(key(x, z));
const faceOf = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
};
const edge = (x, z) => faceOf(x, z).length > 0;
const inwardOf = (x, z, face) => {
  if (face === "W") return [x + 1, z];
  if (face === "E") return [x - 1, z];
  if (face === "N") return [x, z + 1];
  return [x, z - 1];
};

// One roof level for the whole block (lidar median, absolute above y0),
// so the lidar noise becomes one clean flat tier. Each cell gets as many
// storeys as fit between its own ground and that roof (downhill shows more).
const roofs = [...cellOf.values()].map(c => c.roof).sort((a, b) => a - b);
const roofLevel = roofs[Math.floor(roofs.length / 2)];
const S = new Map();
for (const [k, c] of cellOf) {
  let s = Math.floor((roofLevel - c.ground) / 2);
  s = Math.max(2, Math.min(8, s));
  s = Math.min(s, Math.floor((H - 4 - c.ground) / 2));
  S.set(k, s);
}

// Main massing: plain foundation, storeys, roof deck.
for (const [k, c] of cellOf) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.ground;
  const s = S.get(k);
  const faces = faceOf(x, z);
  const per = faces.length > 0;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (!per) {
    for (let kk = 0; kk < 2 * s; kk += 2) g.set(x, gr + kk, z, "smooth_stone");
  } else {
    const corner = faces.length >= 2;
    const f = faces[0];
    const idx = (f === "W" || f === "E") ? z : x;
    // Two glass bays, then one brick pier: reads as windows at a glance.
    const win = !corner && idx % 3 !== 0;
    for (let kk = 0; kk < 2 * s; kk++) {
      const y = gr + kk;
      let b;
      if (kk === 0) b = "polished_andesite";
      else if (kk === 1) b = win ? "glass_pane" : "bricks";
      else if (kk === 2 * s - 1) b = "stone_bricks";          // cornice band
      else if (kk % 2 === 0) b = win ? "stone_bricks" : "bricks"; // sill / spandrel
      else b = win ? "glass_pane" : "bricks";
      g.set(x, y, z, b);

      // Warm light in some upper windows, inside the room behind the glass.
      if (win && kk % 2 === 1 && kk >= 3 && kk < 2 * s - 1 && ((x * 5 + z * 3 + kk) % 4 === 0)) {
        const [ix, iz] = inwardOf(x, z, f);
        const ic = cellOf.get(key(ix, iz));
        if (ic && !edge(ix, iz)) {
          const is = S.get(key(ix, iz));
          if (kk < 2 * is) g.set(ix, ic.ground + kk, iz, "glowstone");
        }
      }
    }
  }
  // Roof row: coping on the walls, deck over the interior.
  g.set(x, gr + 2 * s, z, per ? "stone_bricks" : "smooth_stone");
}

// Entrance on the north (street) face, near the centre: stone surround,
// iron doors, and a canopy over the step.
let door = null;
const north = [];
const any = [];
for (const [k] of cellOf) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z);
  if (f.length === 1 && f[0] === "N") north.push([x, z]);
  if (f.length === 1) any.push([x, z, f[0]]);
}
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
if (north.length) {
  north.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  door = { x: north[0][0], z: north[0][1], face: "N" };
} else if (any.length) {
  any.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
  door = { x: any[0][0], z: any[0][1], face: any[0][2] };
}
if (door) {
  const gr = cellOf.get(key(door.x, door.z)).ground;
  const facing = { W: "west", E: "east", N: "north", S: "south" }[door.face];
  const lat = (door.face === "N" || door.face === "S");
  // Stone surround on the lateral cells at ground and first floor.
  for (let t = -1; t <= 1; t += 2) {
    const lx = lat ? door.x + t : door.x;
    const lz = lat ? door.z : door.z + t;
    const lc = cellOf.get(key(lx, lz));
    if (lc && lc.ground === gr) {
      g.set(lx, gr + 1, lz, "stone_bricks");
      g.set(lx, gr + 2, lz, "stone_bricks");
    }
  }
  g.set(door.x, gr + 1, door.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, gr + 2, door.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy on the door cell and both lateral cells, on the same ground only.
  for (let t = -1; t <= 1; t++) {
    const lx = lat ? door.x + t : door.x;
    const lz = lat ? door.z : door.z + t;
    const lc = cellOf.get(key(lx, lz));
    if (lc && lc.ground === gr) g.set(lx, gr + 3, lz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Setback penthouse on the roof, centred on the footprint.
const r = (Math.max(...xs) - Math.min(...xs)) >= 14 ? 3 : 2;
const region = [];
for (const [k] of cellOf) {
  const [x, z] = k.split(",").map(Number);
  if (Math.abs(x - cx) <= r && Math.abs(z - cz) <= r && !edge(x, z)) region.push([x, z]);
}
if (region.length) {
  let yc = 0;
  for (const [x, z] of region) yc = Math.max(yc, cellOf.get(key(x, z)).ground + 2 * S.get(key(x, z)));
  yc += 1;
  for (const [x, z] of region) {
    const c = cellOf.get(key(x, z));
    const top = c.ground + 2 * S.get(key(x, z));
    for (let y = top + 1; y < yc; y++) g.set(x, y, z, "smooth_stone");
    const dx = x - cx, dz = z - cz;
    const bnd = Math.abs(dx) === r || Math.abs(dz) === r;
    if (bnd) {
      g.set(x, yc, z, "stone_bricks");
      g.set(x, yc + 1, z, (dx + dz) % 2 === 0 ? "glass_pane" : "bricks");
    } else {
      g.set(x, yc, z, "smooth_stone");
    }
    g.set(x, yc + 2, z, "smooth_stone");
  }
}

g.save(`${DIR}/NYC3426952.nbt`);
