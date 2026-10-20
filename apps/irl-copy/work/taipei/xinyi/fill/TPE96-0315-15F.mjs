import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE96-0315-15F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 86, D = 55;
const ROOF = 74;      // roof deck level
const PODIUM = 15;    // podium terrace level
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const inside = (x, z) => G.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the outside edge: 1 = perimeter, 2 = one cell in, and so on.
const dist = new Map();
const q = [];
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  if (NB.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      q.push([nx, nz]);
    }
  }
}

// Footprint extents; entrance on the lowest-z face, centred on the footprint.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of q) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
const entranceX = Math.round(cx);

// Stepped massing: the facade steps inward at y 40 and y 60, leaving terraces.
const fd = (y) => (y < PODIUM ? 1 : y < 40 ? 3 : y < 60 ? 4 : 5);
const BOUNDARIES = [15, 40, 60];

const put = (x, y, z, id, props) => {
  if (!id) return;
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Mast on the penthouse cell that is deepest inside the footprint.
let mast = null;
for (const [k, d] of dist) {
  const [x, z] = k.split(",").map(Number);
  const score = d * 1000 - Math.hypot(x - cx, z - cz);
  if (!mast || score > mast.score) mast = { x, z, score };
}

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k);
  const entrRange = d === 1 && z === minZ && Math.abs(x - entranceX) <= 2;
  const porchRange = d === 2 && z === minZ + 1 && Math.abs(x - entranceX) <= 2;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF - 1; y++) {
    // Floor slabs: ground floor, every storey line on the podium, and on
    // the tower wherever it is present (d >= 3). Podium terrace is open.
    if (y === gr || (y % 5 === 0 && (y <= PODIUM || d >= 3))) {
      put(x, y, z, "light_gray_concrete");
    }

    if (y < PODIUM) {
      // Podium: base course, shopfront, entrance with canopy and porch.
      if (d === 1) {
        if (entrRange) {
          if (x === entranceX && (y === gr + 1 || y === gr + 2)) {
            put(x, y, z, "dark_oak_door", {
              facing: "south",
              half: y === gr + 1 ? "lower" : "upper",
              hinge: "left", open: "false", powered: "false",
            });
          } else if (y >= gr + 1 && y <= gr + 3) {
            put(x, y, z, "glass");
          } else if (y === gr + 4) {
            put(x, y, z, "light_gray_concrete");
          }
        } else if (y < gr + 2) {
          put(x, y, z, "polished_granite");
        } else if (y % 5 !== 0) {
          if ((x + z) % 3 === 0) put(x, y, z, "white_concrete");
          else put(x, y, z, "light_blue_stained_glass");
        }
      } else if (d === 2) {
        if (porchRange && y >= gr + 1 && y <= gr + 3) {
          put(x, y, z, "polished_granite");           // porch pier mass
        } else if (porchRange && y === gr + 4) {
          put(x, y, z, "light_gray_concrete");        // canopy over entrance
        } else if (y % 5 !== 0 && (y % 5 === 2 || y % 5 === 3) && (x + z) % 4 === 0) {
          put(x, y, z, "glowstone");                  // warm light behind shopfront
        }
      }
    } else {
      // Terrace railings at each setback, on the ring just inside the step.
      let railed = false;
      for (const b of BOUNDARIES) {
        if (y === b + 1 && d === fd(b - 1)) {
          put(x, y, z, "iron_bars");
          railed = true;
          break;
        }
      }
      if (railed) continue;

      const f = fd(y);
      if (d === f && y % 5 !== 0) {
        // Curtain wall with mullions.
        if ((x + z) % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass");
      } else if (d === f + 1 && (y % 5 === 2 || y % 5 === 3) && (x + z + Math.floor(y / 5)) % 4 === 0) {
        put(x, y, z, "glowstone");                    // warm light behind glass
      }
    }
  }

  // Roof deck, parapet on the top tier, and penthouse.
  if (d >= 5) put(x, ROOF, z, "gray_concrete");
  if (d === 5) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
  }
  if (d >= 8) {
    for (let y = ROOF + 1; y <= ROOF + 5; y++) {
      const louver = d === 8 && y >= ROOF + 2 && y <= ROOF + 4 && (x + z) % 2 === 0;
      put(x, y, z, louver ? "iron_bars" : "light_gray_concrete");
    }
  }
}

// Antenna mast and lightning rod, top at y 85.
if (mast) {
  for (let y = ROOF + 6; y <= 84; y++) put(mast.x, y, mast.z, "iron_block");
  put(mast.x, 85, mast.z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
