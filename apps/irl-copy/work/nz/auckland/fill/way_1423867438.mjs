// A 1930s brick-and-plaster commercial block: a 22-block core (four storeys over a stone plinth) stepping down
// through an 18 and a 14 tier to a 4-block lean-to. Stone plinth, brick walls, white plaster string courses and
// cornice, glass panes in bays, a canopied door on the longest face, warm lights behind some glass, a plant box.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1423867438.cells.json`, "utf8"));
const vox = new Voxels([17, 35, 15]);

// lidar roof heights snapped to flat setback tiers (the noise goes); G is the ground, R the top surface
const tier = (r) => (r >= 20 ? 22 : r >= 16 ? 18 : r >= 12 ? 14 : 4);
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { x, z, G: ground, R: tier(roof) });
const at = (x, z) => foot.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const ALONG = { north: [1, 0], south: [1, 0], east: [0, 1], west: [0, 1] };

// storey floors on a 4-block grid from the cell's ground; a floor is kept only if two rows of band remain under the top
function floorsOf(G, R) {
  const f = new Set([G]);
  for (let y = 4; y < R - 2; y += 4) f.add(y);
  return [...f].sort((a, b) => a - b);
}

// ring cells stand on the outside (a missing neighbour) or at a setback (a neighbour on another tier); the rest is air between floors.
// A ring cell's outer faces are the missing neighbours and the lower neighbours (a setback shows its face above the lower roof).
for (const c of foot.values()) {
  c.missing = []; c.step = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) c.missing.push(d); else if (n.R < c.R) c.step.push(d);
  }
  c.ring = c.missing.length + c.step.length > 0;
  const outer = [...c.missing, ...c.step];
  c.face = outer.length === 1 ? outer[0] : null;   // one outer face gets windows; corners are piers
}

// a pane's arms run along its face, so it joins the piers and panes beside it
const paneState = (face) => {
  const ew = face === "north" || face === "south";
  return { north: ew ? "false" : "true", south: ew ? "false" : "true", east: ew ? "true" : "false", west: ew ? "true" : "false", waterlogged: "false" };
};
const alongOf = (c) => (c.face === "north" || c.face === "south" ? c.x : c.z);

// the straight run of same-face, same-ground outer cells through c
const runOf = (c) => {
  const [ax, az] = ALONG[c.face];
  const walk = (s) => {
    const out = [];
    for (let k = 1; ; k++) {
      const n = at(c.x + ax * s * k, c.z + az * s * k);
      if (!n || n.face !== c.face || n.G !== c.G) break;
      out.push(n);
    }
    return out;
  };
  return [...walk(-1).reverse(), c, ...walk(1)];
};

// the building
for (const c of foot.values()) {
  const { x, z, G, R, ring, face } = c;
  const fl = floorsOf(G, R), top = R - 1;
  for (let y = 0; y < G; y++) vox.set(x, y, z, "stone_bricks");                     // foundation under the ground
  for (let y = G; y < R; y++) {
    if (y === top) { vox.set(x, y, z, ring ? "smooth_stone" : "gray_concrete"); continue; }   // coping / roof
    if (fl.includes(y)) { vox.set(x, y, z, ring && y === G ? "stone_bricks" : "smooth_stone"); continue; }  // base course / floor slab
    if (!ring) continue;                                                                // air between floors
    const N = fl.find((f) => f > y) ?? top;
    if (y === N - 1) { vox.set(x, y, z, "white_concrete"); continue; }                 // string course / cornice
    if (face && alongOf(c) % 3 !== 0) {
      vox.set(x, y, z, "glass_pane", paneState(face));
      // a warm light in the room behind some windows (the inward neighbour, if it is interior air)
      const [dx, dz] = DIRS[face], inward = at(x - dx, z - dz);
      const band = fl.filter((f) => f < y).length;
      if (inward && !inward.ring && (alongOf(c) + y + band) % 9 === 0) {
        vox.set(x - dx, y, z - dz, band === 1 ? "glowstone" : "shroomlight");
      }
    } else vox.set(x, y, z, "bricks");                                                  // piers
  }
}

// the entrance: a canopied door on the longest run of ground-level windows (ground band rows G+1 and G+2)
const doorable = [...foot.values()].filter((c) => c.face && c.ring && (c.G === 0 || c.G === 4) && alongOf(c) % 3 !== 0);
let best = null;
for (const c of doorable) {
  const run = runOf(c);
  if (!best || run.length > best.run.length) best = { c, run };
}
if (best) {
  const { run } = best;
  const eligible = run.filter((n) => n.face && alongOf(n) % 3 !== 0);
  const door = eligible[Math.floor(eligible.length / 2)];
  const idx = run.indexOf(door);
  for (const n of run.slice(Math.max(0, idx - 1), idx + 2)) vox.set(n.x, n.G + 3, n.z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  const facing = OPP[door.face];
  vox.set(door.x, door.G + 1, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(door.x, door.G + 2, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// roof plant: a 2x2x2 light-grey box on the flat roof of the top tier, nearest the middle of the block
const roofable = [...foot.values()].filter((c) => c.R === 22 && !c.ring
  && [[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.R === 22 && !n.ring; }));
roofable.sort((a, b) => Math.hypot(a.x - 8, a.z - 7) - Math.hypot(b.x - 8, b.z - 7));
if (roofable[0]) {
  const { x, z } = roofable[0];
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let y = 22; y < 24; y++) vox.set(x + dx, y, z + dz, "light_gray_concrete");
}

vox.save(`${DIR}/way_1423867438.nbt`);
