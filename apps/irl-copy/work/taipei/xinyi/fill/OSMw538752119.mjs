import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752119";
const W = 20, D = 22, H = 23;
const ROOF = 11; // lidar record: roof about 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map(cells.map(([x, z, y]) => [key(x, z), y]));
const has = (x, z) => G.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const outward = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x + 1, z)) return "east";
  if (!has(x - 1, z)) return "west";
  return null;
};
const inwardOf = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };
const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const topOf = (gnd) => Math.min(H - 1, Math.max(ROOF, gnd + 6));

// Pass 1: foundations, ground slab, interior floor slabs and roof slab
for (const [x, z, gnd] of cells) {
  const T = topOf(gnd);
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone");
  if (!isEdge(x, z)) {
    g.set(x, gnd, z, "smooth_stone");          // ground floor slab
    g.set(x, gnd + 5, z, "smooth_stone");      // second floor slab
    g.set(x, T - 1, z, "gray_concrete");       // roof slab
    if (x % 7 === 3 && z % 7 === 3 && T + 1 < H) {
      g.set(x, T, z, "light_gray_concrete");   // rooftop AC plant
    }
  }
}

// Pass 2: facade shell, shopfront, windows, door, cornice, parapet, lights
for (const [x, z, gnd] of cells) {
  if (!isEdge(x, z)) continue;
  const T = topOf(gnd);
  const face = outward(x, z) ?? "north";
  const along = (face === "north" || face === "south") ? x : z;
  const pp = paneProps(face);
  const [ix, iz] = inwardOf[face];
  const innerOK = has(x + ix, z + iz) && !isEdge(x + ix, z + iz);
  const doorHere = face === "south" && x === 10;
  const pillar = along % 3 === 0;

  // full wall column
  for (let y = gnd; y <= T - 1; y++) g.set(x, y, z, "white_concrete");
  g.set(x, gnd, z, "polished_andesite");     // base course

  // ground storey: shopfront glazing between pillars
  for (let y = gnd + 1; y <= gnd + 3; y++) {
    if (pillar) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "glass_pane", pp);
  }
  if (doorHere) {
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(x, gnd + 1, z, "oak_door", { ...door, half: "lower" });
    g.set(x, gnd + 2, z, "oak_door", { ...door, half: "upper" });
    g.set(x, gnd + 3, z, "glass_pane", pp);
    g.set(x, gnd + 4, z, "red_concrete");     // entrance sign band
  } else {
    g.set(x, gnd + 4, z, "stone_bricks");     // shopfront lintel
  }

  // storey line
  g.set(x, gnd + 5, z, "stone_bricks");

  // upper storey window grid
  const top2 = Math.min(gnd + 8, T - 2);
  for (let y = gnd + 6; y <= top2; y++) {
    if (pillar) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "glass_pane", pp);
  }

  // cornice and parapet
  g.set(x, T - 1, z, "stone_bricks");
  g.set(x, T, z, "red_terracotta");

  // warm light behind some panes
  if (innerOK && !doorHere && along % 6 === 1) {
    g.set(x + ix, gnd + 2, z + iz, "glowstone");
    if (top2 >= gnd + 7) g.set(x + ix, gnd + 7, z + iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
