import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Imperial Gardens Apartments: a 1970s concrete-frame apartment slab. Eleven storeys of 4 blocks on a stone base,
// glazed bays between light-grey pilasters, storey bands of white concrete, two recessed entrances under a canopy,
// warm lights behind some glass, and a roof plant room. The lidar roof is 57 on every cell, so the massing is one flat
// tier: the articulation carries it, and a downhill cell's lower storeys show as extra windows on the base.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260083817.cells.json", "utf8"));

const [X, Y, Z] = [80, 69, 44];
const g = new Voxels([X, Y, Z]);
const DATUM = 10;   // the ground-floor slab; every storey slab sits at y % 4 == 2 (10, 14, ... 50)
const ROOF = 54;    // the roof deck; parapet 55-56, top surface 57 (the lidar roof)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(key(x, z), { x, z, ground, roof, missing: [], ring: 2 });
const at = (x, z) => C.get(key(x, z));
for (const c of C.values()) c.missing = DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
for (const c of C.values()) c.ring = c.missing.length ? 0 : 2;                                  // 0 facade, 1 behind it, 2 deeper
for (const c of C.values()) if (c.ring === 2 && DIRS.some(([dx, dz]) => at(c.x + dx, c.z + dz)?.ring === 0)) c.ring = 1;

// The lowest storey slab that sits on or above the cell's ground; solid base below it (foundation + plinth)
const lowSlab = (ground) => { let L = DATUM; while (L - 4 >= ground) L -= 4; while (L < ground) L += 4; return L; };
const isCorner = (c) => c.ring === 0 && c.missing.length >= 2;
const uOf = (c) => (c.missing[0][0] !== 0 ? c.z : c.x);                                        // position along its face
const faceKey = (c) => c.missing[0].join(",");
const h = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Massing, storeys, facade
for (const c of C.values()) {
  const L = lowSlab(c.ground);
  for (let y = 0; y < L; y++) g.set(c.x, y, c.z, "stone_bricks");
  const corner = isCorner(c), u = c.ring === 0 && !corner ? uOf(c) : 0;
  for (let y = L; y <= ROOF; y++) {
    if (y % 4 === 2) {                                                                          // slab row: storey line or deck
      let b = "light_gray_concrete";
      if (c.ring === 0 && y < ROOF) b = y <= DATUM ? "stone_bricks" : "white_concrete";
      g.set(c.x, y, c.z, b); continue;
    }
    if (c.ring !== 0) {                                                                         // air behind the glass; columns on an 8-block grid
      if (c.x % 8 === 0 && c.z % 8 === 0) g.set(c.x, y, c.z, "light_gray_concrete");
      continue;
    }
    g.set(c.x, y, c.z, corner || u % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
  }
  if (c.ring === 0) { g.set(c.x, 55, c.z, "smooth_stone"); g.set(c.x, 56, c.z, "white_concrete"); }
}

// Warm light behind some glass: glowstone or a standing lantern on the storey slab, on the cell behind the pane
for (const c of C.values()) {
  if (c.ring !== 0 || c.missing.length !== 1) continue;
  const inner = at(c.x - c.missing[0][0], c.z - c.missing[0][1]);
  if (!inner || inner.ring === 0 || uOf(c) % 4 === 0 || (inner.x % 8 === 0 && inner.z % 8 === 0)) continue;
  for (let y = lowSlab(c.ground) + 1; y <= 51; y += 4) {
    const r = h(c.x, y, c.z) % 9;
    if (r === 0) g.set(inner.x, y, inner.z, "glowstone");
    else if (r === 1) g.set(inner.x, y, inner.z, "lantern");
  }
}

// Two entrances on the two longest street-side faces (ground 7-10), each a double iron door under a canopy on
// two pillars, with a hanging lantern in the lobby behind
const faces = new Map();
for (const c of C.values()) {
  if (c.ring !== 0 || c.missing.length !== 1 || c.ground < 7 || c.ground > 10) continue;
  const k = faceKey(c); if (!faces.has(k)) faces.set(k, []);
  faces.get(k).push(c);
}
const byU = (list) => new Map(list.map((c) => [uOf(c), c]));
const main = [...faces.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 2);
for (const [, list] of main) {
  const us = list.map(uOf).sort((a, b) => a - b);
  const doorU = us[Math.floor(us.length / 2)];
  const row = byU(list);
  const [dx, dz] = list[0].missing[0];
  const facing = FACING[`${-dx},${-dz}`];
  const door = [row.get(doorU), row.get(doorU + 1)];
  if (!door[0] || !door[1]) continue;
  for (const c of door) {
    g.set(c.x, 11, c.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(c.x, 12, c.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  for (let u = doorU - 1; u <= doorU + 2; u++) {
    const c = row.get(u); if (!c) continue;
    g.set(c.x, 13, c.z, "smooth_stone");
    const inner = at(c.x - dx, c.z - dz); if (!inner) continue;
    g.set(inner.x, 13, inner.z, "smooth_stone");
    if (u === doorU - 1 || u === doorU + 2) { g.set(inner.x, 11, inner.z, "light_gray_concrete"); g.set(inner.x, 12, inner.z, "light_gray_concrete"); }
  }
  const lobby = at(door[0].x - dx, door[0].z - dz);
  if (lobby && lobby.ring !== 0) g.set(lobby.x, 12, lobby.z, "lantern", { hanging: "true" });
}

// Roof: a plant room set back from the edge, with lanterns on its corners (no fringe along the stepped parapet)
const dist = new Map(), queue = [];
for (const c of C.values()) if (c.ring === 0) { dist.set(key(c.x, c.z), 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && !dist.has(key(n.x, n.z))) { dist.set(key(n.x, n.z), d + 1); queue.push(n); } }
}
const plant = [...C.values()].filter((c) => dist.get(key(c.x, c.z)) >= 5 && Math.abs(c.x - 40) <= 9 && Math.abs(c.z - 22) <= 5);
for (const c of plant) { g.set(c.x, 55, c.z, "light_gray_concrete"); g.set(c.x, 56, c.z, "light_gray_concrete"); g.set(c.x, 57, c.z, "smooth_stone"); }
for (const c of plant) {
  const corner = [[-9, -5], [9, -5], [-9, 5], [9, 5]].some(([ox, oz]) => c.x === 40 + ox && c.z === 22 + oz);
  if (corner) g.set(c.x, 58, c.z, "lantern");
}

// Support check: a block stands on a block below it, or (a floor slab spanning between its level's walls and columns)
// on a block beside it at the same height; lanterns hang or stand. Anything else is floating.
const solid = (x, y, z) => { const b = g.get(x, y, z); return !!b && b.block !== "minecraft:lantern"; };
const floating = [];
for (const c of C.values()) for (let y = 1; y < Y; y++) {
  const b = g.get(c.x, y, c.z);
  if (!b || b.block === "minecraft:lantern" || solid(c.x, y - 1, c.z)) continue;
  if (DIRS.some(([dx, dz]) => solid(c.x + dx, y, c.z + dz))) continue;
  floating.push([c.x, y, c.z, b.block]);
}
if (floating.length) console.error(`unsupported: ${floating.length}`, floating.slice(0, 8));

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260083817.nbt");
console.log(`way_260083817: ${stats.blocks} blocks, ${stats.palette} palette entries`);
