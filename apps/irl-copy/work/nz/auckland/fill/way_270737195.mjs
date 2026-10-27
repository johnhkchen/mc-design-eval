// Way 270737195: a three-storey stripped-classical commercial block (c.1930s), render-plaster over a stone plinth,
// with a flat roof, a parapet, and a lower wing on the cells the lidar reads at 10 blocks. The footprint and the
// roof heights come from the cells file; the floors sit on absolute rows (slabs at 3, 6, 9, 12), so every storey
// stands on the one below and the downhill side shows its plinth as an extra storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_270737195.cells.json`, "utf8"));
const g = new Voxels([32, 26, 28]);

const DATUM = 3;                       // ground-floor slab row; the foundation is solid below it
const FLOORS = [3, 6, 9];              // string courses and floor slabs (a wing's roof slab is 9)
const GLASS_ROWS = [4, 5, 7, 8, 10, 11];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the footprint: one record per cell, with the lidar's ground and roof (main = 12+, wing = lower roof, smoothed to 10)
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { x, z, ground, main: roof >= 12, key: `${x},${z}` });
const at = (x, z) => F.get(`${x},${z}`);
const outward = (c) => DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
const along = (dx) => (dx ? [[0, 1, "south"], [0, -1, "north"]] : [[1, 0, "east"], [-1, 0, "west"]]);

const list = [...F.values()].map((c) => ({ ...c, out: outward(c) }));
const facade = (c) => outward(c).length > 0;

// the main entrance: the front-most single-face main cell on the south-west side of the block
const door = list
  .filter((c) => c.main && c.out.length === 1 && (c.out[0][0] === -1 || c.out[0][1] === 1))
  .sort((a, b) => (b.x + b.z) - (a.x + a.z))[0];
const doorKey = door?.key;

// pass 1: foundation, plinth, floors, walls (facade) and air behind the glass (interior)
for (const c of list) {
  const top = c.main ? 14 : 10;
  const f = facade(c);
  for (let y = 0; y < DATUM; y++) g.set(c.x, y, c.z, f && y === 2 ? "polished_andesite" : "stone_bricks");
  for (let y = DATUM; y < top; y++) {
    const floor = FLOORS.includes(y) || (c.main && y === 12);
    if (floor) {
      const block = f ? (y === 12 ? "stone_bricks" : "polished_andesite") : "smooth_stone";
      g.set(c.x, y, c.z, block);
      continue;
    }
    if (!f) continue;                                    // interior: air, so the glass has an air gap behind it
    const corner = c.out.length > 1;
    if (y === 13 && c.main) {                            // parapet: a low wall, quoins at the corners
      g.set(c.x, y, c.z, corner ? "stone_bricks" : "stone_brick_wall");
      continue;
    }
    if (!GLASS_ROWS.includes(y)) continue;
    if (corner) { g.set(c.x, y, c.z, "stone_bricks"); continue; }
    if (c.key === doorKey) {                             // entrance: a door in the ground-storey glass
      if (y === 4 || y === 5) {
        const facing = FACING[c.out[0].join(",")];
        g.set(c.x, y, c.z, "dark_oak_door", { facing, half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      }
      continue;
    }
    if ((c.x + c.z) % 4 === 0) { g.set(c.x, y, c.z, "white_concrete"); continue; }   // pier between bays
    const st = { north: "false", south: "false", east: "false", west: "false" };
    for (const [ax, az, name] of along(c.out[0][0])) if (at(c.x + ax, c.z + az)) st[name] = "true";
    g.set(c.x, y, c.z, "glass_pane", st);
  }
}

// pass 2: warm lights in the room behind some windows (on a floor slab, so they stand), and the chimney stacks
const lightRows = { 4: "glowstone", 7: "glowstone", 10: "shroomlight" };
for (const c of list) {
  if (!facade(c) || c.out.length !== 1) continue;
  for (const y of Object.keys(lightRows).map(Number)) {
    if (y >= (c.main ? 14 : 10) || (c.x + c.z) % 4 === 0 || c.key === doorKey) continue;
    if ((c.x * 7 + c.z * 13 + y) % 6 !== 0) continue;
    const [dx, dz] = c.out[0];
    const inner = at(c.x - dx, c.z - dz);
    if (!inner || facade(inner)) continue;
    g.set(inner.x, y, inner.z, lightRows[y]);
  }
}
// roof: a solid plant room in the middle of the main block, and two brick stacks
const roofTop = list.filter((c) => c.main && !facade(c));
const plant = roofTop.filter((c) => c.x >= 13 && c.x <= 16 && c.z >= 10 && c.z <= 12);
for (const c of plant) for (let y = 13; y <= 14; y++) g.set(c.x, y, c.z, "white_concrete");
for (const c of plant) g.set(c.x, 15, c.z, "smooth_stone");
for (const [x, z] of [[20, 14], [10, 9]]) {
  const c = at(x, z);
  if (!c || !c.main || facade(c)) continue;
  for (let y = 13; y <= 15; y++) g.set(x, y, z, "bricks");
}

const out = `${HERE}/way_270737195.nbt`;
const info = g.save(out);
console.log(`saved ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
