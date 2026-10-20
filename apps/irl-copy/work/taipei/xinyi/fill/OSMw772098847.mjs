import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098847";
const W = 16, H = 23, D = 19;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward directions
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const facesOf = (x, z) =>
  Object.keys(DIRS).filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });

// Glass pane connection props for a wall face
const paneProps = face =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Choose the entrance on the south face (near the middle), avoiding corners
const southCells = [];
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = facesOf(x, z);
  if (f.length === 1 && f[0] === "south") southCells.push([x, z]);
}
let doorKey = null;
if (southCells.length) {
  const xs = southCells.map(c => c[0]).sort((a, b) => a - b);
  const midX = xs[Math.floor(xs.length / 2)];
  southCells.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
  doorKey = `${southCells[0][0]},${southCells[0][1]}`;
}

// Build
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;

  // Foundation from y 0 up to the ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground (gr), first-floor (gr+5), roof (gr+10)
  put(x, gr, z, "stone_bricks");
  const midSlab = perim ? "smooth_quartz" : "stone";
  put(x, gr + 5, z, midSlab);
  put(x, gr + 10, z, perim ? "smooth_quartz" : "stone");

  // Rooftop equipment on interior cells
  if (!perim && x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, "light_gray_concrete");
  }

  if (!perim) continue;

  // Parapet
  put(x, gr + 11, z, corner ? "white_concrete" : "smooth_quartz");

  if (corner) {
    // Corner column of quartz pillars through both storeys
    for (let y = gr + 1; y <= gr + 9; y++) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    }
    continue;
  }

  const face = faces[0];
  const idx = (face === "north" || face === "south") ? x : z;
  const isDoor = key === doorKey;

  if (isDoor) {
    // Entrance: iron door with transom glass and quartz head
    put(x, gr + 1, z, "iron_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false"
    });
    put(x, gr + 2, z, "iron_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false"
    });
    put(x, gr + 3, z, "light_blue_stained_glass_pane", paneProps(face));
    put(x, gr + 4, z, "smooth_quartz");
    // Upper storey above the entrance
    put(x, gr + 6, z, "polished_andesite");
    put(x, gr + 7, z, "light_blue_stained_glass_pane", paneProps(face));
    put(x, gr + 8, z, "light_blue_stained_glass_pane", paneProps(face));
    put(x, gr + 9, z, "smooth_quartz");
    continue;
  }

  const pillar = idx % 3 === 0;
  const storeyBases = [gr + 1, gr + 6];

  for (const b of storeyBases) {
    for (let dy = 0; dy < 4; dy++) {
      const y = b + dy;
      if (pillar) {
        put(x, y, z, "quartz_pillar", { axis: "y" });
      } else if (dy === 0) {
        put(x, y, z, "polished_andesite");
      } else if (dy === 3) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      }
    }
  }

  // Warm lanterns standing on the floor behind some windows
  if (!pillar && idx % 6 === 1) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && gAt(ix, iz) === gr) {
      const inner = facesOf(ix, iz);
      if (inner.length === 0) {
        put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
        put(ix, gr + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
