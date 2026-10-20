import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw430628147";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const c of cells) ground.set(key(c[0], c[1]), c[2]);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

// 4-neighbourhood: [name, dx, dz]; name is the compass direction of that neighbour
const NB = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const missingDirs = (x, z) => NB.filter(([, dx, dz]) => !has(x + dx, z + dz)).map(([n]) => n);
const isPerim = (x, z) => missingDirs(x, z).length > 0;

// ---- distance to outside (hip roof profile) ----------------------------------
const dist = new Map();
const queue = [];
for (const c of cells) {
  const [x, z] = c;
  if (isPerim(x, z)) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [, dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const maxD = Math.max(...dist.values());
// roof rises in layers: 1 layer at the eave, up to 3 at the ridge
const roofR = (d) => Math.min(3, Math.ceil(d / 2));
const rOf = (x, z) => (has(x, z) ? roofR(dist.get(key(x, z))) : 0);

// ---- block helpers ----------------------------------------------------------
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const pane = (x, y, z, axisX) =>
  put(x, y, z, "glass_pane", {
    north: axisX ? "false" : "true",
    south: axisX ? "false" : "true",
    east: axisX ? "true" : "false",
    west: axisX ? "true" : "false",
    waterlogged: "false",
  });

// ---- front entrance: perimeter cell on the minimum-z edge nearest the middle --
const minZ = Math.min(...cells.map((c) => c[1]));
const frontCells = cells.filter((c) => c[1] === minZ && missingDirs(c[0], c[1]).includes("north"));
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const doorCell = frontCells.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX))[0];
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

// ---- build each footprint cell ----------------------------------------------
for (const c of cells) {
  const [x, z, gi] = c;
  const perim = isPerim(x, z);
  const miss = missingDirs(x, z);
  const corner = miss.length >= 2;
  const wallAxisX = miss.includes("north") || miss.includes("south"); // wall runs along x

  // foundation
  for (let y = 0; y < gi; y++) put(x, y, z, "stone_bricks");

  // ground floor: base course on the perimeter, floor slab inside
  put(x, gi, z, perim ? "stone_bricks" : "smooth_stone");

  // two storeys of ~5 blocks: band of windows, spandrel/belt, cornice
  const storeys = [gi];                // storey floor levels
  for (const b of storeys) {
    // storey 1 (base gi): windows gi+1..gi+3, spandrel gi+4
    if (perim) {
      for (const y of [b + 1, b + 2, b + 3]) {
        if (corner) put(x, y, z, "red_concrete");
        else if ((x + z + y) % 2 === 0) {
          pane(x, y, z, wallAxisX);
        } else put(x, y, z, "red_concrete");
      }
      put(x, b + 4, z, "red_concrete");
    }
  }

  // storey line at gi+5
  put(x, gi + 5, z, perim ? "yellow_concrete" : "smooth_stone");

  // storey 2 (base gi+5): windows gi+6..gi+8, cornice gi+9
  if (perim) {
    for (const y of [gi + 6, gi + 7, gi + 8]) {
      if (corner) put(x, y, z, "red_concrete");
      else if ((x + z + y) % 2 === 0) pane(x, y, z, wallAxisX);
      else put(x, y, z, "red_concrete");
    }
    put(x, gi + 9, z, "polished_andesite");
  }

  // roof slab / eave course at gi+10 covering every cell
  put(x, gi + 10, z, "oxidized_cut_copper");

  // roof layers gi+11 .. gi+10+r
  const r = roofR(dist.get(key(x, z)));
  const d = dist.get(key(x, z));
  for (let k = 1; k <= r; k++) {
    const y = gi + 10 + k;
    if (k === r) {
      // find a lower neighbour (or outside) to face the stair toward
      const lower = NB.filter(([, dx, dz]) => {
        const nx = x + dx, nz = z + dz;
        return !has(nx, nz) || rOf(nx, nz) < r;
      });
      if (lower.length > 0) {
        put(x, y, z, "oxidized_cut_copper_stairs", {
          facing: lower[0][0],
          half: "bottom",
          shape: "straight",
          waterlogged: "false",
        });
        continue;
      }
    }
    put(x, y, z, "oxidized_cut_copper");
  }

  // ridge ornaments on the highest band
  if (d === maxD) {
    const top = gi + 10 + r + 1;
    const cx = (W - 1) / 2, cz = (D - 1) / 2;
    const isCentre = Math.abs(x - cx) + Math.abs(z - cz) === Math.min(
      ...cells.filter((q) => dist.get(key(q[0], q[1])) === maxD).map((q) => Math.abs(q[0] - cx) + Math.abs(q[1] - cz))
    );
    if (isCentre) put(x, top, z, "lantern", { hanging: "false", waterlogged: "false" });
    else put(x, top, z, "gold_block");
  }
}

// ---- entrance: double-height door, hanging lantern, gold lintel ----------
if (doorCell) {
  const [dx0, dz0, dg] = doorCell;
  put(dx0, dg + 1, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, dg + 2, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx0, dg + 3, dz0, "lantern", { hanging: "true", waterlogged: "false" });
  put(dx0, dg + 4, dz0, "gold_block");
}

// ---- warm light behind some windows (interior air cells) ------------------
for (const c of cells) {
  const [x, z, gi] = c;
  if (!isPerim(x, z)) continue;
  const miss = missingDirs(x, z);
  if (miss.length >= 2) continue;
  // inward neighbour is opposite the single missing side
  const inward = { north: "south", south: "north", east: "west", west: "east" }[miss[0]];
  const [ix, iz] = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[inward];
  const nx = x + ix, nz = z + iz;
  if (!has(nx, nz) || isPerim(nx, nz)) continue;
  if ((x + z) % 4 === 0) {
    put(nx, gi + 2, nz, "glowstone");
  } else if ((x + z) % 4 === 2) {
    put(nx, gi + 7, nz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
