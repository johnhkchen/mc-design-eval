// Site and gardens (elements 13, 15, 16, 17): sidewalk and drive, front beds behind the iron fence, the rear deck with
// its posts, rail and steps, the lawn with a gravel path, the retaining kerb, the raised upper garden, the tree and the
// board fences. Writes only into air and the lot's grade; a cell an earlier part built is left alone (see `blocked`).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  SITE, CONCRETE, GRASS, DIRT, GRAVEL, STONE, TIMBER, TIMBER_PLANKS, FARMLAND,
  flowerBed, ironFence, deck, tree,
} from "../vocab.mjs";

const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

export function build(g) {
  // what earlier parts put down: only the lot's grade at y0 (grass from build.mjs) may be written over here
  const before = new Map([...g.cells].map(([k, c]) => [k, c.block]));
  let skipped = 0;
  const blocked = (x, y, z) => {
    const was = before.get(`${x},${y},${z}`);
    return was !== undefined && !(y === 0 && was === "minecraft:grass_block");
  };
  const P = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        if (blocked(x, y, z)) skipped++;
        else target.set(x, y, z, block, state, nbt);
        return P;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });

  // ---- street side: sidewalk, drive apron ------------------------------------------------------------------------
  for (const x of span(SITE.sidewalk.x0, SITE.sidewalk.x1)) for (const z of span(SITE.sidewalk.z0, SITE.sidewalk.z1)) {
    P.set(x, 0, z, CONCRETE);
  }
  for (const x of span(SITE.drive.x0, SITE.drive.x1)) for (const z of span(SITE.drive.z0, SITE.drive.z1)) {
    P.set(x, 0, z, CONCRETE);
  }

  // ---- front garden: beds sit behind the iron line (z=2), so they start at z=3 ----------------------------------------
  const fb = SITE.flowerBeds;
  flowerBed(P, fb.westFront.x0, fb.westFront.x1, 3, 3);
  flowerBed(P, fb.eastFront.x0, fb.eastFront.x1, 3, 3);
  flowerBed(P, fb.strip.x0, fb.strip.x1, fb.strip.z0, fb.strip.z1);
  flowerBed(P, fb.stoopSide.x0, fb.stoopSide.x1, fb.stoopSide.z0, fb.stoopSide.z1);
  for (const [x0, x1] of SITE.ironFence.segments) ironFence(P, x0, x1);

  // ---- back grade: lawn to y2 over dirt, gravel path from the deck steps to the kerb ----------------------------------
  for (const x of span(0, 15)) for (const z of span(31, 43)) {
    P.set(x, 1, z, DIRT);
    P.set(x, 2, z, GRASS);
  }
  for (const x of span(7, 8)) for (const z of span(36, 43)) P.set(x, 2, z, GRAVEL);

  // retaining kerb: stone two high at z44, so the upper garden's grass (y3) is flush with its top
  for (const x of span(0, 15)) {
    P.set(x, 2, 44, STONE);
    P.set(x, 3, 44, STONE);
  }

  // upper garden: dirt to y2, grass at y3 for z45..49
  for (const x of span(0, 15)) for (const z of span(45, 49)) {
    P.set(x, 1, z, DIRT);
    P.set(x, 2, z, DIRT);
    P.set(x, 3, z, GRASS);
  }

  // ---- raised vegetable beds: farmland at y4 in a plank rim at y3 (the kerb row z44 is left alone) -------------------
  const raisedBed = (x0, x1, z0, z1) => {
    for (const x of span(x0 - 1, x1 + 1)) for (const z of span(z0 - 1, z1 + 1)) {
      const inside = x >= x0 && x <= x1 && z >= z0 && z <= z1;
      if (z === 44) continue;
      if (inside) {
        P.set(x, 3, z, DIRT);
        P.set(x, 4, z, FARMLAND);
        const crop = (x + z) % 2 === 0 ? "wheat" : "carrots";
        P.set(x, 5, z, crop, { age: "7" });
      } else {
        P.set(x, 3, z, ...B.block(TIMBER_PLANKS));
      }
    }
  };
  for (const b of SITE.raisedBeds) raisedBed(b.x0, b.x1, b.z0, b.z1);

  // ---- side flower borders along the fences: dirt raised to y3, flowers at y4 -------------------------------------
  flowerBed(P, 1, 2, 37, 43, 3);
  flowerBed(P, 13, 14, 37, 43, 3);

  // ---- tree ---------------------------------------------------------------------------------------------------
  tree(P);

  // ---- rear deck: under-deck skirt first, then the posts, deck, fascia and rail on top of it ------------------------
  const d = SITE.deck;
  for (const x of span(d.x0, d.x1)) for (const z of span(d.z0, d.z1)) P.set(x, d.y - 1, z, ...B.block(TIMBER_PLANKS));
  deck(P, d);

  // ---- board fences: spruce boards two high above the grade, capped with a slab ------------------------------------
  const fence = new Map();
  for (const z of span(31, 49)) {
    fence.set(`0,${z}`, [0, z]);
    fence.set(`15,${z}`, [15, z]);
  }
  for (const x of span(0, 15)) fence.set(`${x},49`, [x, 49]);
  for (const [x, z] of fence.values()) {
    const s = z <= 43 ? 3 : 4;             // y of the first board: the lawn (y2), or the kerb/upper garden top
    P.set(x, s, z, ...B.block(TIMBER_PLANKS));
    P.set(x, s + 1, z, ...B.block(TIMBER_PLANKS));
    P.set(x, s + 2, z, ...B.slab(TIMBER, "bottom"));
  }

  // ---- light: the courts had dark cells at y1 (sidewalk), y3 (lawn) and y4 (upper garden). Lanterns stand on the iron
  // fence posts at x0 and x7 (x10 is the stoop rail), on spruce lamp posts in the lawn (clear of the gravel path x7..8)
  // and the upper garden, and on the board-fence caps at the side borders.
  P.set(0, 2, 2, ...B.lantern(false));
  P.set(7, 2, 2, ...B.lantern(false));
  for (const x of [5, 10]) {
    P.set(x, 3, 39, ...B.fence("spruce"));
    P.set(x, 4, 39, ...B.lantern(false));
  }
  P.set(7, 4, 46, ...B.fence("spruce"));
  P.set(7, 5, 46, ...B.lantern(false));
  P.set(0, 6, 40, ...B.lantern(false));
  P.set(15, 6, 40, ...B.lantern(false));

  if (skipped) console.log(`# site: ${skipped} writes left to earlier parts`);
}
