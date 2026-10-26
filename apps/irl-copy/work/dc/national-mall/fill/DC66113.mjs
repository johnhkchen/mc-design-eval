import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1200 K St NW: 1980s Class A office block. Precast/quartz-toned concrete
// piers, tinted glass spandrel-to-spandrel, polished granite plinth, and a
// setback roofline that follows the lidar. Storey pitch 3 blocks.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC66113";
const W = 30, H = 33, D = 19;
const PITCH = 3;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  const ground = Math.max(0, Math.floor(gr));
  let roof = Math.floor(rf);
  roof = Math.max(roof, ground + PITCH * 2);
  roof = Math.min(roof, H - 5);
  info.set(key(x, z), { x, z, ground, roof });
}

// Ring distance from the footprint edge (1 = facade, 2 = air gap, 3+ = core).
const ring = new Map();
const queue = [];
for (const { x, z } of info.values()) {
  const edge = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz]) => !info.has(key(x+dx, z+dz)));
  if (edge) { ring.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = ring.get(key(x, z));
  for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const k = key(x+dx, z+dz);
    if (info.has(k) && !ring.has(k)) { ring.set(k, d + 1); queue.push([x+dx, z+dz]); }
  }
}

const GLASS = "light_blue_stained_glass_pane";
const SPAND = "white_concrete";
const BASE = "polished_granite";
const CAP = "smooth_quartz";
const PIER = "quartz_pillar";
const CORE = "smooth_quartz";
const FOUND = "stone_bricks";
const PLANT = "quartz_block";

// Main entrance: centre bay of the -Z (street) face.
const ENT_X0 = 12, ENT_X1 = 16;

for (const { x, z, ground, roof } of info.values()) {
  const rg = ring.get(key(x, z)) ?? 99;
  const top = roof - 1;

  // Foundation up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  const west = !info.has(key(x-1, z));
  const east = !info.has(key(x+1, z));
  const north = !info.has(key(x, z-1));
  const south = !info.has(key(x, z+1));
  const outZ = north ? -1 : (south ? 1 : 0);
  const outX = west ? -1 : (east ? 1 : 0);
  const onZFace = outZ !== 0 && outX === 0; // runs along X
  const onXFace = outX !== 0 && outZ === 0; // runs along Z
  // Vertical piers every 6 blocks, plus corners, project as fins.
  const pier = rg === 1 && (
    (onZFace && x % 6 === 0) ||
    (onXFace && z % 6 === 0) ||
    (outX !== 0 && outZ !== 0)
  );
  const streetEntry = outZ === -1 && x >= ENT_X0 && x <= ENT_X1;

  for (let y = ground; y <= top; y++) {
    const h = y - ground;
    const isTop = y === top;

    if (rg >= 3) {
      g.set(x, y, z, isTop ? CAP : CORE);
      continue;
    }

    if (rg === 2) {
      // Air gap behind the curtain wall; floor slabs per storey.
      if (isTop) { g.set(x, y, z, CAP); continue; }
      if (h === 0 || h % PITCH === 0) { g.set(x, y, z, h === 0 ? BASE : SPAND); continue; }
      // Warm lights seen through the glass.
      if (h % PITCH === 2 && (x * 3 + z * 5 + h) % 11 === 0) {
        g.set(x, y, z, (x + z) % 2 ? "glowstone" : "shroomlight");
        continue;
      }
      continue;
    }

    // Facade ring (rg === 1)
    if (isTop) { g.set(x, y, z, CAP); continue; }
    if (h === 0) { g.set(x, y, z, BASE); continue; }

    // Entrance: recessed doors and a lit vestibule.
    if (streetEntry && h <= 2) {
      if (h === 1 && x !== ENT_X0 && x !== ENT_X1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (h === 2 && x !== ENT_X0 && x !== ENT_X1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, PIER, { axis: "y" });
      }
      continue;
    }

    if (h % PITCH === 0) { g.set(x, y, z, SPAND); continue; }

    if (pier) {
      g.set(x, y, z, PIER, { axis: "y" });
      continue;
    }

    // Ground-floor shopfront glass, then upper curtain wall.
    if (h <= 2 && outZ === -1) {
      g.set(x, y, z, GLASS, onZFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      continue;
    }
    g.set(x, y, z, GLASS, onZFace
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  }

  // Lanterns in the vestibule ceiling.
  if (rg === 2 && ground + 2 < H && north && x >= ENT_X0 && x <= ENT_X1 && x % 2 === 0) {
    g.set(x, ground + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Rooftop plant on the core, light-toned to avoid dark blotches.
  if (rg >= 3 && (x * 5 + z * 3) % 13 === 0 && x > 4 && x < 25 && top + 2 < H) {
    g.set(x, top + 1, z, PLANT);
    g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance canopy: stone slab over the door bays, carried by the piers.
for (const c of info.values()) {
  const { x, z, ground } = c;
  const north = !info.has(key(x, z-1));
  if (north && x >= ENT_X0 - 1 && x <= ENT_X1 + 1 && ground + 3 < H) {
    g.set(x, ground + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
