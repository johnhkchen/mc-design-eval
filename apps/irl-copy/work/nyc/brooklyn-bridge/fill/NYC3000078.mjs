import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000078.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000078.nbt";

const W = 16, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;

// facing = inward direction (the way a person outside would face to enter)
const DIRS = [
  { dx: -1, dz: 0, facing: "east" },
  { dx: 1, dz: 0, facing: "west" },
  { dx: 0, dz: -1, facing: "south" },
  { dx: 0, dz: 1, facing: "north" },
];

// Footprint cells -> ground and building top
const info = new Map();
for (const c of JSON.parse(readFileSync(CELLS, "utf8"))) {
  const [x, z, gr, roof] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.round(gr));
  const top = Math.min(H - 3, Math.max(ground + 8, Math.round(roof)));
  info.set(key(x, z), { x, z, ground, top });
}

const has = (x, z) => info.has(key(x, z));
const exposed = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const cellsArr = [...info.values()];

// Along-wall position of a cell for a given exposed face
const alongOf = (d, x, z) => (d.dx !== 0 ? z : x);

// 4-block bay module: 0 and 3 are piers, 1 and 2 are window cells
const isPier = (a) => a % 4 === 0 || a % 4 === 3;
const isWindow = (a) => a % 4 === 1 || a % 4 === 2;

// Floor slab levels: ground floor base, then every 2 blocks upward
function floorsFor(ground, top) {
  const F = [ground];
  let n = ground + 3;
  while (n <= top - 1) {
    F.push(n);
    n += 2;
  }
  return F;
}

// 1. Foundation, shell, floor slabs, cornice and roof slab
for (const c of cellsArr) {
  const { x, z, ground, top } = c;
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");
  const F = floorsFor(ground, top);
  const ex = exposed(x, z);
  const perim = ex.length > 0;
  const pier = perim && isPier(alongOf(ex[0], x, z));
  for (let y = ground; y < top; y++) {
    if (y === top - 1) {
      put(x, y, z, perim ? "smooth_stone" : "stone");
      continue;
    }
    if (F.includes(y)) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (perim) put(x, y, z, pier ? "stone_bricks" : "bricks");
  }
}

// 2. Entrance: the exposed face with the most cells, door at its middle
const counts = DIRS.map(() => []);
for (const c of cellsArr) {
  for (const d of exposed(c.x, c.z)) counts[DIRS.indexOf(d)].push(c);
}
let best = 0;
counts.forEach((a, i) => {
  if (a.length > counts[best].length) best = i;
});
const dir = DIRS[best];
const doorList = counts[best]
  .slice()
  .sort((a, b) => alongOf(dir, a.x, a.z) - alongOf(dir, b.x, b.z));
const door = doorList[Math.floor(doorList.length / 2)];

const doorState = { facing: dir.facing, hinge: "left", open: "false", powered: "false" };
put(door.x, door.ground, door.z, "dark_oak_door", { ...doorState, half: "lower" });
put(door.x, door.ground + 1, door.z, "dark_oak_door", { ...doorState, half: "upper" });
// stone lintel over the door
put(door.x, door.ground + 2, door.z, "smooth_stone");

// 3. Windows (glass panes in the wall plane) and warm light behind some of them
const paneProps = (dx) =>
  dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const c of cellsArr) {
  const { x, z, ground, top } = c;
  const F = floorsFor(ground, top);
  for (const d of exposed(x, z)) {
    const along = alongOf(d, x, z);
    if (!isWindow(along)) continue;
    // the cell just inside this wall
    const inX = x - d.dx;
    const inZ = z - d.dz;
    const inner = has(inX, inZ) && exposed(inX, inZ).length === 0 ? info.get(key(inX, inZ)) : null;

    for (let i = 0; i < F.length; i++) {
      const r = F[i] + 1;
      const ceil = i + 1 < F.length ? F[i + 1] : top - 1;
      if (r >= ceil) continue;
      // keep the door opening clear on the ground storey
      if (i === 0 && x === door.x && z === door.z) continue;
      put(x, r, z, "glass_pane", paneProps(d.dx));
      if (inner && i > 0 && r < inner.top - 1 && (x * 5 + z * 3 + i) % 3 === 0) {
        put(inner.x, r, inner.z, "glowstone");
      }
    }
  }
}

// 4. Roof: a few brick chimneys on interior roof cells, capped with a slab
for (const c of cellsArr) {
  if (exposed(c.x, c.z).length) continue;
  if ((c.x * 3 + c.z * 5) % 11 !== 0) continue;
  put(c.x, c.top, c.z, "bricks");
  put(c.x, c.top + 1, c.z, "bricks");
  put(c.x, c.top + 2, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
