import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office/retail block, c. 1985-1995: six storeys of white
// concrete with aluminium-framed glass bays, a glazed shopfront at grade,
// a light-grey floor-slab band per storey, a quartz parapet and rooftop
// water tank and plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109125";
const W = 13, H = 43, D = 24;
const ROOF = 31;            // lidar roof height above lowest ground
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function missingSides(x, z) {
  return Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);
}

// Facade description for a footprint cell, or null if interior.
function facadeInfo(x, z) {
  const m = missingSides(x, z);
  if (!m.length) return null;
  const ns = m.some((d) => d === "north" || d === "south");
  const ew = m.some((d) => d === "east" || d === "west");
  const corner = ns && ew;
  const out = ns
    ? m.find((d) => d === "north" || d === "south")
    : m.find((d) => d === "east" || d === "west");
  return {
    corner,
    alongX: ns && !ew,          // face runs along x (north/south face)
    index: ns && !ew ? x : z,   // position along that face
    out,                        // outward direction
  };
}

function paneProps(f) {
  return f.alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const facadeCache = new Map();
const facadeOf = (x, z) => {
  const k = key(x, z);
  if (!facadeCache.has(k)) facadeCache.set(k, facadeInfo(x, z));
  return facadeCache.get(k);
};

// ---- Pass 1: foundations, storeys, roof -------------------------------
for (const [x, z, gr] of cells) {
  const f = facadeOf(x, z);
  const base = Math.max(0, Math.min(gr, ROOF));

  // Plinth at grade and foundation fill up to the cell's ground.
  for (let y = 0; y <= Math.max(base - 1, 0); y++) {
    g.set(x, y, z, "stone_bricks");
  }

  // Body from the cell's ground up to the roof.
  for (let y = Math.max(base, 1); y <= ROOF; y++) {
    if (y === ROOF) {
      g.set(x, y, z, f ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    const L = 1 + STOREY * Math.floor((y - 1) / STOREY); // storey slab line
    const r = y - L;                                       // 0 = slab, 1..3 = glazing, 4 = spandrel

    if (r === 0) {
      g.set(x, y, z, "light_gray_concrete"); // floor slab, interior and facade
      continue;
    }
    if (!f) continue; // interior air gap

    if (f.corner || r === 4) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (f.index % 3 === 0) {
      g.set(x, y, z, "white_concrete"); // mullion
      continue;
    }
    if (L === 1) {
      g.set(x, y, z, "light_blue_stained_glass"); // shopfront glazing
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(f));
    }
  }
}

// ---- Pass 2: entrance on the lowest-ground street facade cell ---------
{
  const cand = cells
    .map(([x, z, gr]) => ({ x, z, gr, f: facadeOf(x, z) }))
    .filter((c) => c.f && !c.f.corner && c.f.index % 3 !== 0)
    .sort((a, b) => a.gr - b.gr || a.x - b.x || a.z - b.z);

  if (cand.length) {
    const { x, z, gr, f } = cand[0];
    const lower = Math.max(gr, 2);
    const facing = f.out;
    g.set(x, lower, z, "oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, lower + 1, z, "oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Lintel over the entrance.
    g.set(x, 5, z, "smooth_quartz");
  }
}

// ---- Pass 3: warm lights in some upper-floor windows ------------------
for (const [x, z, gr] of cells) {
  const f = facadeOf(x, z);
  if (!f || f.corner) continue;
  if (f.index % 3 === 0) continue;
  for (let y = 7; y <= ROOF - 1; y++) {
    const L = 1 + STOREY * Math.floor((y - 1) / STOREY);
    const r = y - L;
    if (r < 1 || r > 3) continue;
    if ((x * 7 + z * 13 + y * 3) % 9 !== 0) continue;
    const [dx, dz] = DIRS[{ north: "south", south: "north", east: "west", west: "east" }[f.out]];
    const ix = x + dx, iz = z + dz;
    if (!has(ix, iz) || facadeOf(ix, iz)) continue;
    if (y < (ground.get(key(ix, iz)) ?? 0)) continue;
    g.set(ix, y, iz, "shroomlight");
  }
}

// ---- Pass 4: rooftop water tank and plant room ------------------------
function interiorCell(x, z) {
  return has(x, z) && !facadeOf(x, z);
}

let tank = null;
{
  let best = null;
  let bestD = Infinity;
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  for (const [x, z] of cells) {
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++)
      for (let dz = -1; dz <= 1 && ok; dz++)
        if (!interiorCell(x + dx, z + dz)) ok = false;
    if (!ok) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bestD) { bestD = d; best = { x, z }; }
  }
  if (!best) {
    // Fallback: any fully footprinted 3x3.
    for (const [x, z] of cells) {
      let ok = true;
      for (let dx = -1; dx <= 1 && ok; dx++)
        for (let dz = -1; dz <= 1 && ok; dz++)
          if (!has(x + dx, z + dz)) ok = false;
      if (ok) { best = { x, z }; break; }
    }
  }
  tank = best;
}

if (tank) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let y = ROOF + 1; y <= ROOF + 4; y++) {
        g.set(tank.x + dx, y, tank.z + dz, "smooth_stone");
      }
    }
  }
  // Tank cap, steel banding.
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      g.set(tank.x + dx, ROOF + 5, tank.z + dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (dx === 0 || dz === 0) g.set(tank.x + dx, ROOF + 2, tank.z + dz, "iron_block");
}

// Plant room: 2x2, clear of the tank and its margin.
{
  const near = (x, z) =>
    tank && Math.abs(x - tank.x) <= 2 && Math.abs(z - tank.z) <= 2;
  let spot = null;
  for (const [x, z] of cells) {
    const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => [x + dx, z + dz]);
    if (quad.some(([qx, qz]) => !interiorCell(qx, qz) || near(qx, qz))) continue;
    spot = { x, z };
    break;
  }
  if (spot) {
    for (let dx = 0; dx <= 1; dx++)
      for (let dz = 0; dz <= 1; dz++)
        for (let y = ROOF + 1; y <= ROOF + 3; y++)
          g.set(spot.x + dx, y, spot.z + dz, "light_gray_concrete");
    for (let dx = 0; dx <= 1; dx++)
      for (let dz = 0; dz <= 1; dz++)
        g.set(spot.x + dx, ROOF + 4, spot.z + dz, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
