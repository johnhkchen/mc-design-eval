import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (1980s-90s Xinyi street frontage):
// stone-brick plinth, white concrete walls, quartz storey lines and pilasters,
// ground-floor shopfront with a recessed entrance, upper-floor ribbon windows
// with spandrels, a parapet, and a roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540892898";
const W = 18, H = 23, D = 15;

const R = 10;          // roof deck layer
const STOREY = 5;      // storey line (second floor deck)
const PARAPET = 11;    // parapet course on perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g = Math.min(Math.max(0, Math.round(gRaw)), 4);
  cellMap.set(key(x, z), g);
}

// Outward normals of a footprint cell (sides with no neighbour in the footprint).
function normals(x, z) {
  const n = [];
  if (!cellMap.has(key(x, z - 1))) n.push([0, -1]);
  if (!cellMap.has(key(x, z + 1))) n.push([0, 1]);
  if (!cellMap.has(key(x - 1, z))) n.push([-1, 0]);
  if (!cellMap.has(key(x + 1, z))) n.push([1, 0]);
  return n;
}

function facingName(dx, dz) {
  if (dz === -1) return "north";
  if (dz === 1) return "south";
  if (dx === -1) return "west";
  return "east";
}

// Entrance: middle of the north (street) facade, single-normal cells only.
const doorCands = [];
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  const n = normals(x, z);
  if (n.length === 1 && n[0][0] === 0 && n[0][1] === -1) doorCands.push({ x, z });
}
doorCands.sort((a, b) => a.x - b.x);
const entranceKey = doorCands.length
  ? key(doorCands[Math.floor(doorCands.length / 2)].x, doorCands[Math.floor(doorCands.length / 2)].z)
  : null;

const g = new Voxels([W, H, D]);

const glassProps = (dz, extra = {}) => {
  // pane connects along the wall it sits in
  const alongX = dz !== 0;
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
    ...extra,
  };
};

for (const [k, gr] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const n = normals(x, z);
  const perim = n.length > 0;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air elsewhere (no interiors modelled).
    g.set(x, gr, z, "smooth_stone");
    g.set(x, STOREY, z, "light_gray_concrete");
    g.set(x, R, z, "light_gray_concrete");
    continue;
  }

  const corner = n.length > 1;
  const [dx, dz] = n[0];
  const face = facingName(dx, dz);
  const idx = dz !== 0 ? x : z; // position along the facade

  g.set(x, gr, z, "polished_andesite"); // base course

  const pillar = corner || idx % 3 === 0;

  for (let y = gr + 1; y <= PARAPET; y++) {
    // Entrance doors
    if (k === entranceKey && (y === gr + 1 || y === gr + 2) && gr + 2 <= 4) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: face, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    let b = null;
    if (y === PARAPET) {
      b = { id: "white_concrete" };
    } else if (y === R || y === STOREY) {
      b = { id: "smooth_quartz" };
    } else if (y <= 4) {
      // ground storey shopfront
      if (y === 4 || pillar) b = { id: "smooth_quartz" };
      else b = { id: "glass_pane", props: glassProps(dz) };
    } else if (y === 6) {
      b = pillar ? { id: "smooth_quartz" } : { id: "light_gray_concrete" };
    } else if (y === 9) {
      b = pillar ? { id: "smooth_quartz" } : { id: "white_concrete" };
    } else {
      // upper storey window (y 7-8)
      if (pillar) b = { id: "smooth_quartz" };
      else b = { id: "light_blue_stained_glass_pane", props: glassProps(dz) };
    }

    if (b) g.set(x, y, z, b.id, b.props);
  }

  // Warm light behind some upper-floor windows.
  if (!corner && idx % 6 === 2) {
    const ix = x - dx, iz = z - dz;
    const ik = key(ix, iz);
    if (cellMap.has(ik) && normals(ix, iz).length === 0) {
      g.set(ix, 7, iz, "glowstone");
    }
  }
}

// Roof plant: a small box on the deck, set in from the parapet.
for (let x = 6; x <= 10; x++) {
  for (let z = 5; z <= 8; z++) {
    const k = key(x, z);
    if (!cellMap.has(k) || normals(x, z).length > 0) continue;
    g.set(x, PARAPET, z, "gray_concrete");
    if (x >= 7 && x <= 9 && z >= 6 && z <= 7) {
      g.set(x, PARAPET + 1, z, "iron_bars", {
        north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
      });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
