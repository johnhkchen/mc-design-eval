import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542612587";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 21, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gy);
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Facade geometry: 1990s-era Taipei office/retail block, 2 storeys of 5 blocks,
// ground-floor shopfront, cream concrete piers, blue-tinted glazing, parapet roof.
const dirs = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Footprint extent for the entrance and roof plant placement
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.round((minX + maxX) / 2);
const midZ = Math.round((minZ + maxZ) / 2);

for (const [x, z, rawGround] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  const base = Math.max(0, Math.min(rawGround, 10));

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const exposed = Object.entries(dirs)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);
  const edge = exposed.length > 0;

  // Base course and floor slabs
  put(x, base, z, edge ? "polished_andesite" : "smooth_stone");
  put(x, base + 5, z, edge ? "smooth_quartz" : "smooth_stone");

  // Roof deck at base+10; parapet wall on the edge
  put(x, base + 10, z, edge ? "stone_brick_wall" : "smooth_stone");

  if (!edge) continue;

  const corner = exposed.length >= 2;

  for (const side of exposed) {
    const [dx, dz] = dirs[side];
    const ns = side === "north" || side === "south";
    const along = ns ? x : z;
    const pillar = corner || along % 3 === 0;

    // Ground storey: shopfront glazing between granite piers
    for (let y = base + 1; y <= base + 3; y++) {
      if (pillar) {
        put(x, y, z, "polished_granite");
      } else {
        const props = ns
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "light_blue_stained_glass_pane", props);
      }
    }

    // Cornice band at base+4
    put(x, base + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

    // Upper storey: sill, piers, glazing, head
    for (let y = base + 6; y <= base + 9; y++) {
      if (y === base + 6 || y === base + 9) {
        put(x, y, z, "smooth_quartz");
      } else if (pillar) {
        put(x, y, z, "white_concrete");
      } else {
        const props = ns
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "light_blue_stained_glass_pane", props);
      }
    }

    // Warm lights behind some upper windows (inside the air gap)
    if (!pillar && (along + base) % 4 === 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) put(ix, base + 7, iz, "shroomlight");
    }

    // Entrance on the south face, centre three cells: glazed doors
    if (side === "south" && Math.abs(x - midX) <= 1) {
      for (let y = base + 1; y <= base + 3; y++) {
        put(x, y, z, "tinted_glass");
      }
    }
  }
}

// Roof plant: small penthouse over the centre of the footprint
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const edge = Object.values(dirs).some(([dx, dz]) => !has(x + dx, z + dz));
  if (edge) continue;
  if (Math.abs(x - midX) <= 1 && Math.abs(z - midZ) <= 1) {
    const rawGround = ground.get(`${x},${z}`);
    const base = Math.max(0, Math.min(rawGround, 10));
    put(x, base + 11, z, "light_gray_concrete");
    if (Math.abs(x - midX) <= 0 && Math.abs(z - midZ) <= 0) {
      put(x, base + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/${id}.nbt`);
