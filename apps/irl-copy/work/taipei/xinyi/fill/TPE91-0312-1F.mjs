import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0312-1F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 57, H = 19, D = 23;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, gr));
const has = (x, z) => G.has(`${x},${z}`);

const DIRS = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: 1, dz: 0, f: "east" },
  { dx: -1, dz: 0, f: "west" },
];

const along = (f, x, z) => (f === "north" || f === "south" ? x : z);

// Entrance: middle of the longest street-facing (north/south) face
const faceS = { north: [], south: [], east: [], west: [] };
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (const d of DIRS) {
    if (!has(x + d.dx, z + d.dz)) faceS[d.f].push(along(d.f, x, z));
  }
}
const longFaces = ["north", "south"].filter(f => faceS[f].length > 0);
const entranceFace = longFaces.length
  ? longFaces.sort((a, b) => faceS[b].length - faceS[a].length)[0]
  : "south";
const sorted = [...faceS[entranceFace]].sort((a, b) => a - b);
const entranceS = sorted.length ? sorted[Math.floor(sorted.length / 2)] : -1;

// Plant room footprint on the roof (centre of the plan), kept on interior cells only
const plantRoom = (x, z) => x >= 20 && x <= 34 && z >= 7 && z <= 15;

for (const [x, z, gr0] of cells) {
  const G0 = Math.max(0, gr0);

  // Foundation: solid stone from y0 up to this cell's ground
  for (let y = 0; y < G0; y++) put(x, y, z, "stone_bricks");

  const outs = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  const edge = outs.length > 0;

  if (!edge) {
    // Interior: floor slab, light roof plane, one deliberate plant room
    put(x, G0, z, "smooth_stone");
    put(x, G0 + 5, z, "light_gray_concrete");
    if (plantRoom(x, z)) {
      const pr = (x === 20 || x === 34 || z === 7 || z === 15);
      put(x, G0 + 6, z, pr ? "stone_bricks" : "light_blue_stained_glass");
    }
    continue;
  }

  // Edge cell: base course, storeys, cornice, parapet
  put(x, G0, z, "stone_bricks");
  const primary = outs[0];
  const s = along(primary.f, x, z);

  let isEntrance = false;
  for (const d of outs) {
    if (d.f === entranceFace && along(d.f, x, z) === entranceS) isEntrance = true;
  }

  // Pilaster bays every 6 blocks along the wall, plain panels between
  const isPilaster = s % 6 === 0;
  const wallBlock = isPilaster ? "smooth_stone" : "white_concrete";

  // Ground floor shopfront (G0+1, G0+2)
  if (isEntrance) {
    const facing = entranceFace;
    put(x, G0 + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, G0 + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  } else if (isPilaster) {
    put(x, G0 + 1, z, "smooth_stone");
    put(x, G0 + 2, z, "smooth_stone");
  } else {
    put(x, G0 + 1, z, "light_blue_stained_glass");
    // Warm light behind every third glass bay
    if (s % 3 === 1 && (s % 9) === 4) put(x, G0 + 2, z, "shroomlight");
    else put(x, G0 + 2, z, "light_blue_stained_glass");
  }

  // Lintel / spandrel band (G0+3): warm glowstone lintel over the entrance
  if (isEntrance) put(x, G0 + 3, z, "glowstone");
  else put(x, G0 + 3, z, wallBlock);

  // Cornice (G0+4): smooth stone line the full perimeter
  put(x, G0 + 4, z, "smooth_stone");

  // Parapet to roof level (G0+5) and bottom-half cap slab (G0+6)
  put(x, G0 + 5, z, "smooth_stone");
  put(x, G0 + 6, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
