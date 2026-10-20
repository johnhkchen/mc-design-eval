import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891056";
const W = 21, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// Bounds-checked setter; props optional
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Classify a footprint cell: interior, corner, front/back wall, or side wall
function classify(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  if (!n && !s && !w && !e) return { type: "interior" };
  if ((n || s) && (w || e)) return { type: "corner" };
  if (n || s) return { type: "front", out: n ? "north" : "south", coord: x - minX };
  return { type: "side", out: w ? "west" : "east", coord: z - minZ };
}

// Window pattern: glass in two bays out of three, piers between; no windows at corners
function isWindow(c) {
  if (c.type === "front" || c.type === "side") return c.coord % 3 !== 0;
  return false;
}

// Inward neighbour offset for a facade cell
function inward(c) {
  switch (c.out) {
    case "north": return [0, 1];
    case "south": return [0, -1];
    case "west": return [1, 0];
    case "east": return [-1, 0];
  }
  return [0, 0];
}

const classified = cells.map(([x, z, gr]) => ({ x, z, gr, c: classify(x, z) }));

// Pass 1: foundation, floors, walls, storey bands, cornice, parapet
for (const { x, z, gr, c } of classified) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (c.type === "interior") {
    put(x, gr, z, "smooth_stone");          // ground floor slab
    put(x, gr + 5, z, "smooth_stone");      // second floor slab
    put(x, gr + 10, z, "light_gray_concrete"); // roof slab
    continue;
  }

  // Perimeter cell: full facade column
  const win = isWindow(c);
  const front = c.type === "front" && c.out === "north";

  put(x, gr, z, "stone_bricks");            // base course
  put(x, gr + 1, z, "stone_bricks");        // plinth

  // Ground floor: shopfront glass with piers
  if (win) {
    put(x, gr + 2, z, "light_blue_stained_glass");
    put(x, gr + 3, z, "light_blue_stained_glass");
  } else {
    put(x, gr + 2, z, "white_terracotta");
    put(x, gr + 3, z, "white_terracotta");
  }
  // Fascia / awning band
  put(x, gr + 4, z, front ? "green_concrete" : "white_terracotta");

  // Storey line between floors
  put(x, gr + 5, z, "smooth_quartz");

  // Second storey: framed window band
  if (win) {
    put(x, gr + 6, z, "white_concrete");
    put(x, gr + 7, z, "light_blue_stained_glass");
    put(x, gr + 8, z, "light_blue_stained_glass");
    put(x, gr + 9, z, "white_concrete");
  } else {
    put(x, gr + 6, z, "white_terracotta");
    put(x, gr + 7, z, "white_terracotta");
    put(x, gr + 8, z, "white_terracotta");
    put(x, gr + 9, z, "white_terracotta");
  }

  // Cornice and parapet
  put(x, gr + 10, z, "smooth_quartz");
  put(x, gr + 11, z, "white_concrete");
}

// Pass 2: warm lights behind some glass (interior cell just inside the glass)
for (const { x, z, gr, c } of classified) {
  if (c.type !== "front" && c.type !== "side") continue;
  if (!isWindow(c)) continue;
  if ((x + z) % 4 !== 0) continue;
  const [dx, dz] = inward(c);
  const ix = x + dx, iz = z + dz;
  const inner = classify(ix, iz);
  if (inner.type !== "interior") continue;
  put(ix, gr + 2, iz, "shroomlight");
  if ((x + z) % 8 === 0) put(ix, gr + 7, iz, "glowstone");
}

// Pass 3: entrance door on the north front, nearest the centre
{
  const fronts = classified
    .filter(({ c }) => c.type === "front" && c.out === "north")
    .sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
  const pick = fronts[0] ?? classified.find(({ c }) => c.type !== "interior");
  if (pick) {
    const { x, z, gr } = pick;
    const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "oak_door", { ...doorProps, half: "lower" });
    put(x, gr + 2, z, "oak_door", { ...doorProps, half: "upper" });
    // Small canopy over the entrance, one block out is outside the footprint so keep it in the fascia band
    put(x, gr + 4, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

// Pass 4: roof equipment and a central mast
for (const { x, z, gr, c } of classified) {
  if (c.type !== "interior") continue;
  if (x % 5 === 2 && z % 4 === 1) {
    put(x, gr + 11, z, "iron_block");
  }
}
{
  const interior = classified
    .filter(({ c }) => c.type === "interior")
    .sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
  const m = interior[0];
  if (m) {
    for (let y = m.gr + 11; y <= m.gr + 13; y++) put(m.x, y, m.z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
