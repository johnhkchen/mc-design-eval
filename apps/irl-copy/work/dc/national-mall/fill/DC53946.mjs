// 400 6th St NW (Commercial-Office-Large), a 1970s-style office: a four-storey brick podium with glazed bays, a
// six-storey tower (core A and wing B) stepping up to 18 blocks, a lower notch court on the west, and a double-door
// entrance on the north face. Storeys are 3 blocks: a spandrel row (y % 3 == 2) then two window rows. Windows are
// recessed one block behind the piers, so the facade has real relief; interiors are air except the floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const file = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53946";
const cells = JSON.parse(readFileSync(`${file}.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inFp = (x, z) => raw.has(`${x},${z}`);

// Lidar smoothed into three flat tiers: the podium at 15, the tower core A and wing B at 18. The lidar's 1-2 notch
// (x 12-13, z 12-16) is a street-level court, not part of the massing.
const inA = (x, z) => x >= 15 && x <= 20 && z >= 9 && z <= 16;
const inB = (x, z) => x >= 5 && x <= 20 && z >= 19 && z <= 30;
const top = (x, z) => { const { r } = raw.get(`${x},${z}`); if (r <= 2) return r; return inA(x, z) || inB(x, z) ? 18 : 15; };

const isSlab = (y) => y >= 2 && y % 3 === 2;          // floor and spandrel rows at 2, 5, 8, 11, 14, 17
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];      // N, S, W, E
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || top(x + dx, z + dz) <= y);
const entrance = (x, y, z) => z === 0 && x >= 16 && x <= 19 && (y === 3 || y === 4);
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 19 === 0;   // about one window in nineteen

const g = new Voxels([30, 30, 36]);

for (const [key, { r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const T = top(x, z);
  if (T <= 2) {                                        // street-level court and planter
    for (let y = 0; y < T; y++) g.set(x, y, z, y === 0 ? "smooth_stone" : "moss_block");
    continue;
  }
  for (let y = 0; y < T; y++) {
    if (entrance(x, y, z)) continue;                   // doorway, set below
    if (y < 2) { g.set(x, y, z, "polished_granite"); continue; }     // base course on the foundation
    const e = exposed(x, z, y);
    if (isSlab(y)) { g.set(x, y, z, e.length ? "light_gray_concrete" : "smooth_quartz"); continue; }
    if (!e.length) continue;                           // interior air between the slabs
    const [dx, dz] = e[0];                             // outward normal of the face this cell shows
    const u = dx !== 0 ? z : x;                        // bay coordinate along that face
    if (u % 3 === 0) { g.set(x, y, z, T === 15 ? "bricks" : "smooth_quartz"); continue; }   // pier
    // Window: the outer cell stays air and the glass sits one block back, behind the pier line.
    g.set(x - dx, y, z - dz, lit(x, y, z) ? "glowstone" : "light_blue_stained_glass");
  }
}

// Entrance: quartz portal, double doors on the north face, a hanging lantern in the lobby behind.
for (let y = 3; y <= 4; y++) {
  g.set(16, y, 0, "smooth_quartz"); g.set(19, y, 0, "smooth_quartz");
}
const door = (x, half, hinge) => ({ facing: "south", half, hinge, open: "false", powered: "false" });
g.set(17, 3, 0, "dark_oak_door", door(17, "lower", "left"));
g.set(17, 4, 0, "dark_oak_door", door(17, "upper", "left"));
g.set(18, 3, 0, "dark_oak_door", door(18, "lower", "right"));
g.set(18, 4, 0, "dark_oak_door", door(18, "upper", "right"));
g.set(17, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(18, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: a stair-tower penthouse on core A, mechanical boxes on wing B, and a cooling box on the podium.
for (let x = 17; x <= 18; x++) for (let z = 11; z <= 13; z++) {
  g.set(x, 18, z, "smooth_quartz"); g.set(x, 19, z, "smooth_quartz"); g.set(x, 20, z, "light_gray_concrete");
}
for (const [x0, z0] of [[7, 22], [12, 26]]) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) {
  g.set(x, 18, z, "gray_concrete"); g.set(x, 19, z, "iron_bars");
}
for (let x = 24; x <= 25; x++) for (let z = 5; z <= 6; z++) {
  g.set(x, 15, z, "light_gray_concrete"); g.set(x, 16, z, "iron_bars");
}

const stats = g.save(`${file}.nbt`);
console.log(JSON.stringify(stats));
