import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century Taipei shophouse-style commercial block:
// stone base course, cream quartz facade, ribbed pillars every 3 blocks,
// glass shopfront with a centred door, a storey line at mid-height,
// a cornice and a low parapet, with roof units on top.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542682860";
const W = 15, H = 23, D = 8;

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;

const put = (x, y, z, b, p) => {
  if (!inside(x, z) || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const perimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Which faces a perimeter cell sits on
const faces = (x, z) => ({
  north: !has(x, z - 1), // front, z = 0 side
  south: !has(x, z + 1), // back, z = D-1 side
  west: !has(x - 1, z),
  east: !has(x + 1, z),
});

const GLASS_Z = { north: "true", south: "true", east: "false", west: "false" };
const GLASS_X = { north: "false", south: "false", east: "true", west: "true" };

for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);
  const b = base;
  const edge = perimeter(x, z);
  const f = faces(x, z);
  const faceCount = Object.values(f).filter(Boolean).length;
  const corner = faceCount >= 2;

  // Foundation: solid from y = 0 up to just below this cell's floor
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  if (edge) put(x, b, z, "stone_bricks");
  else put(x, b, z, "smooth_stone");

  // Storey line / floor slab at mid-height (second floor)
  if (edge) put(x, b + 5, z, "smooth_quartz");
  else put(x, b + 5, z, "smooth_stone");

  // Roof deck and cornice
  if (edge) put(x, b + 10, z, "smooth_quartz");
  else put(x, b + 10, z, "smooth_stone");

  // Parapet cap on perimeter
  if (edge) put(x, b + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  if (!edge) {
    // Roof units on the interior of the roof deck
    if (z === 3 && (x === 4 || x === 5)) put(x, b + 11, z, "iron_block");
    continue;
  }

  // Facade: storeys 1 (b+1..b+4) and 2 (b+6..b+9)
  const u = f.north || f.south ? x : z; // position along the face
  const windowable = !corner && u % 3 !== 0;
  const storeys = [
    { lo: b + 1, hi: b + 4, ground: true },
    { lo: b + 6, hi: b + 9, ground: false },
  ];

  for (const st of storeys) {
    for (let y = st.lo; y <= st.hi; y++) {
      if (corner || !windowable) {
        // pillars / corners
        put(x, y, z, corner ? "smooth_quartz" : "polished_andesite");
        continue;
      }
      // Entrance door on the front (north, z = 0) at centre bay, ground storey only
      if (st.ground && f.north && x === 7 && (y === b + 1 || y === b + 2)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: y === b + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      const conn = f.north || f.south ? GLASS_Z : GLASS_X;
      put(x, y, z, "glass_pane", conn);
    }
  }

  // Warm lights behind a few windows (interior cell just inside the glass)
  if (windowable && !corner) {
    let ix = x, iz = z;
    if (f.north) iz = z + 1;
    else if (f.south) iz = z - 1;
    else if (f.west) ix = x + 1;
    else if (f.east) ix = x - 1;
    if (has(ix, iz) && (u === 4 || u === 10)) {
      put(ix, b + 2, iz, "glowstone");
      put(ix, b + 7, iz, "shroomlight");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
