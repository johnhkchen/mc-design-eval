// Vanilla structure .nbt (structure block / Create schematic format) <-> an editable block grid.
//
//   import { loadStructure, Grid } from "./nbt.mjs"
//   const g = await loadStructure("in.nbt")           // Grid
//   g.set(3, 1, 4, "minecraft:spruce_stairs", { facing: "east", half: "bottom" })
//   g.fill([0,0,0], [6,0,20], "minecraft:polished_andesite")
//   await g.save("out.nbt")
//
// Coordinates are structure-local: 0 <= x < size[0], etc. Unset cells are NOT stored, so they are
// left untouched when the structure is placed; "minecraft:air" is stored and clears the cell.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

// prismarine-nbt ships with the repo's render/ package (no separate install for the spike).
const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "..", "..", "..", "render", "package.json"));
const nbt = require("prismarine-nbt");

export const DATA_VERSION_1_20_1 = 3465;
const AIR = "minecraft:air";

const norm = (name) => (name.includes(":") ? name : `minecraft:${name}`);
const keyOf = (x, y, z) => `${x},${y},${z}`;

export class Grid {
  /** @param {[number,number,number]} size */
  constructor(size, { dataVersion = DATA_VERSION_1_20_1 } = {}) {
    this.size = [...size];
    this.dataVersion = dataVersion;
    /** @type {Map<string, {pos:number[], block:string, state?:Record<string,string>}>} */
    this.cells = new Map();
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.size[0] && y < this.size[1] && z < this.size[2];
  }

  /** Set one block. `state` values are stringified (NBT block properties are strings). */
  set(x, y, z, block, state) {
    if (!this.inBounds(x, y, z)) throw new Error(`set out of bounds: ${x},${y},${z} (size ${this.size})`);
    const s = state && Object.keys(state).length ? Object.fromEntries(Object.entries(state).map(([k, v]) => [k, String(v)])) : undefined;
    this.cells.set(keyOf(x, y, z), { pos: [x, y, z], block: norm(block), ...(s ? { state: s } : {}) });
    return this;
  }

  /** @returns {{pos:number[], block:string, state?:object} | undefined} undefined = unset */
  get(x, y, z) {
    return this.cells.get(keyOf(x, y, z));
  }

  /** Block name at a cell; unset cells read as air. */
  blockAt(x, y, z) {
    return this.get(x, y, z)?.block ?? AIR;
  }

  isAir(x, y, z) {
    const b = this.blockAt(x, y, z);
    return b === AIR || b === "minecraft:cave_air" || b === "minecraft:void_air";
  }

  /** Remove a cell from the structure entirely (left untouched on placement). */
  unset(x, y, z) {
    this.cells.delete(keyOf(x, y, z));
    return this;
  }

  /** Fill the inclusive box a..b. */
  fill(a, b, block, state) {
    const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
    const [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
    const [z0, z1] = [Math.min(a[2], b[2]), Math.max(a[2], b[2])];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) this.set(x, y, z, block, state);
    return this;
  }

  /** Iterate stored cells. */
  *[Symbol.iterator]() {
    yield* this.cells.values();
  }

  /** Non-air stored cells as renderer voxels ({pos, block, state}). */
  voxels() {
    return [...this.cells.values()].filter((c) => !this.isAir(...c.pos));
  }

  clone() {
    const g = new Grid(this.size, { dataVersion: this.dataVersion });
    for (const c of this.cells.values()) g.cells.set(keyOf(...c.pos), { ...c, pos: [...c.pos], ...(c.state ? { state: { ...c.state } } : {}) });
    return g;
  }

  /** Grow the structure box (e.g. to add an outward buttress). Shifts nothing. */
  resize(size) {
    this.size = [...size];
    return this;
  }

  /** Block-name -> count, most common first. */
  census() {
    const m = new Map();
    for (const c of this.voxels()) m.set(c.block, (m.get(c.block) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  toNbt() {
    const palette = [];
    const index = new Map();
    const blocks = [];
    for (const c of this.cells.values()) {
      const pk = c.block + JSON.stringify(c.state ? Object.entries(c.state).sort() : []);
      if (!index.has(pk)) {
        index.set(pk, palette.length);
        const entry = { Name: nbt.string(c.block) };
        if (c.state) entry.Properties = nbt.comp(Object.fromEntries(Object.entries(c.state).map(([k, v]) => [k, nbt.string(v)])));
        palette.push(entry);
      }
      blocks.push({ pos: nbt.list(nbt.int(c.pos)), state: nbt.int(index.get(pk)) });
    }
    return nbt.comp(
      {
        DataVersion: nbt.int(this.dataVersion),
        size: nbt.list(nbt.int(this.size)),
        palette: nbt.list(nbt.comp(palette)),
        blocks: nbt.list(nbt.comp(blocks)),
        entities: nbt.list(nbt.comp([])),
      },
      ""
    );
  }

  /** Write a gzipped structure .nbt (what structure blocks / Create read). */
  async save(path) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, gzipSync(nbt.writeUncompressed(this.toNbt(), "big")));
    return path;
  }
}

/** Read a structure .nbt (gzipped or not) into a Grid. Block-entity NBT and entities are dropped. */
export async function loadStructure(path) {
  const { parsed } = await nbt.parse(readFileSync(path));
  const s = nbt.simplify(parsed);
  const palette = s.palette ?? s.palettes?.[0];
  if (!s.size || !palette || !s.blocks) throw new Error(`${path}: not a structure .nbt (needs size/palette/blocks)`);
  const g = new Grid(s.size, { dataVersion: s.DataVersion ?? DATA_VERSION_1_20_1 });
  for (const b of s.blocks) {
    const p = palette[b.state];
    g.set(b.pos[0], b.pos[1], b.pos[2], p.Name, p.Properties);
  }
  return g;
}
