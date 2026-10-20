// A compact voxel volume: each distinct block (name + state) once in a palette, and 2 bytes per cell. A 448 x 133 x 448
// place is 27M cells, about 53 MB, where the toolkit's grid (an object per block in a Map) needed gigabytes. It has the
// grid's set/get/size, so the build and the tree helper work on either, and it writes a vanilla structure file (.nbt,
// gzipped) itself, streaming the blocks out without making an object per block.
import { gzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const ns = (b) => (String(b).includes(":") ? String(b) : `minecraft:${b}`);
const AIR = /(^|:)(cave_|void_)?air$/;

export class Voxels {
  // { sparse: true } makes a SparseVoxels (below): the same API over 16-cube sections allocated as they fill
  constructor(size, { dataVersion = 3955, sparse = false } = {}) {
    if (sparse && new.target === Voxels) return new SparseVoxels(size, { dataVersion });
    this.size = size; this.dataVersion = dataVersion;
    if (new.target === Voxels) this.data = new Uint16Array(size[0] * size[1] * size[2]);    // 0 = nothing (left out of the file: missing cells are air)
    this.palette = [null]; this.index = new Map();
  }
  at(x, y, z) { const [X, Y, Z] = this.size; return x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? -1 : (z * Y + y) * X + x; }
  inBounds(x, y, z) { return this.at(x, y, z) >= 0; }
  /** the palette index of a block (0 for air), added to the palette if new */
  paletteIndex(block, state) {
    const name = ns(block); if (AIR.test(name)) return 0;
    const st = state && Object.keys(state).length ? Object.fromEntries(Object.entries(state).map(([k, v]) => [k, String(v)]).sort()) : null;
    const key = name + (st ? JSON.stringify(st) : "");
    let p = this.index.get(key);
    if (p === undefined) { if (this.palette.length >= 65535) throw new Error("more than 65535 distinct blocks"); p = this.palette.length; this.palette.push({ block: name, state: st }); this.index.set(key, p); }
    return p;
  }
  set(x, y, z, block, state) {
    const i = this.at(x, y, z); if (i < 0) return this;
    this.data[i] = this.paletteIndex(block, state); return this;
  }
  get(x, y, z) { const i = this.at(x, y, z); if (i < 0 || !this.data[i]) return null; const p = this.palette[this.data[i]]; return { pos: [x, y, z], block: p.block, state: p.state ?? undefined }; }
  /** a cell's palette index by its linear index (z * Y + y) * X + x, as at() gives it; and set by it */
  cellAt(i) { return this.data[i]; }
  /** the palette index at x, y, z (0 for nothing or out of bounds) */
  val(x, y, z) { const i = this.at(x, y, z); return i < 0 ? 0 : this.data[i]; }
  setCellAt(i, v) { this.data[i] = v; }
  /** every filled cell: fn(linear index, palette index) */
  forEachCell(fn) { const d = this.data; for (let i = 0; i < d.length; i++) if (d[i]) fn(i, d[i]); }
  get cellCount() { return this.data.length; }
  /** Taller, in place (more sky over the same ground): a module can stand higher than the massing it replaces. */
  growTo(Y) {
    const [X, Y0, Z] = this.size; if (Y <= Y0) return this;
    const d = new Uint16Array(X * Y * Z);
    for (let z = 0; z < Z; z++) for (let y = 0; y < Y0; y++) d.set(this.data.subarray((z * Y0 + y) * X, (z * Y0 + y + 1) * X), (z * Y + y) * X);
    this.data = d; this.size = [X, Y, Z]; return this;
  }
  count() { let n = 0; this.forEachCell(() => n++); return n; }

  /** A vanilla structure file: size, palette, blocks (pos + state index), entities, DataVersion; gzipped. */
  save(file) {
    const used = new Uint8Array(this.palette.length); this.forEachCell((i, v) => { used[v] = 1; });
    const remap = new Int32Array(this.palette.length).fill(-1), pal = [];
    for (let p = 1; p < this.palette.length; p++) if (used[p]) { remap[p] = pal.length; pal.push(this.palette[p]); }
    const w = new NbtWriter();
    w.compoundStart("");
    w.listOfInt("size", this.size);
    w.listStart("palette", 10, pal.length);
    for (const p of pal) { w.string("Name", p.block); if (p.state) { w.compoundStart("Properties"); for (const [k, v] of Object.entries(p.state)) w.string(k, v); w.end(); } w.end(); }
    const n = this.count(), [X, Y] = this.size;
    w.listStart("blocks", 10, n);
    this.forEachCell((i, v) => { const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
      w.listOfInt("pos", [x, y, z]); w.int("state", remap[v]); w.end(); });
    w.listStart("entities", 10, 0);
    w.int("DataVersion", this.dataVersion);
    w.end();
    writeFileSync(file, gzipSync(w.bytes()));
    return { blocks: n, palette: pal.length };
  }
}

// The same volume, sparse: 16x16x16 sections, each a Uint16Array allocated when its first block is set, so a tall,
// mostly empty world (a 3000-block square with a 711-block tower: 7 billion cells, 14 GB dense) costs only the sections
// that hold something. Linear indices are the dense layout's, so callers that pass cell indices (float.mjs) work on
// either; a section's own cells are in Minecraft's order (y, z, x), so anvil.mjs writes them straight out. Up to 4096 high.
export class SparseVoxels extends Voxels {
  constructor(size, { dataVersion = 3955 } = {}) {
    super(size, { dataVersion });
    this.sparse = true; this.SX = Math.ceil(size[0] / 16); this.SZ = Math.ceil(size[2] / 16);
    if (size[1] > 4096) throw new Error("a sparse volume is at most 4096 high");
    this.sec = new Array(this.SX * this.SZ * 256).fill(null);
  }
  key(x, y, z) { return (((z >> 4) * this.SX + (x >> 4)) << 8) | (y >> 4); }
  /** the section holding block x, y, z (null if it was never written); its cell for that block is ((y&15)<<8)|((z&15)<<4)|(x&15) */
  section(cx, sy, cz) { return this.sec[((cz * this.SX + cx) << 8) | sy]; }
  set(x, y, z, block, state) {
    const [X, Y, Z] = this.size; if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return this;
    const p = this.paletteIndex(block, state), k = this.key(x, y, z); let s = this.sec[k];
    if (!s) { if (!p) return this; s = this.sec[k] = new Uint16Array(4096); }
    s[((y & 15) << 8) | ((z & 15) << 4) | (x & 15)] = p; return this;
  }
  /** the palette index at x, y, z (0 for nothing or out of bounds) */
  val(x, y, z) {
    const [X, Y, Z] = this.size; if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) return 0;
    const s = this.sec[(((z >> 4) * this.SX + (x >> 4)) << 8) | (y >> 4)]; return s ? s[((y & 15) << 8) | ((z & 15) << 4) | (x & 15)] : 0;
  }
  get(x, y, z) { const v = this.val(x, y, z); if (!v) return null; const p = this.palette[v]; return { pos: [x, y, z], block: p.block, state: p.state ?? undefined }; }
  cellAt(i) { const [X, Y] = this.size, x = i % X, r = Math.floor(i / X); return this.val(x, r % Y, Math.floor(r / Y)); }
  setCellAt(i, v) {
    const [X, Y] = this.size, x = i % X, r = Math.floor(i / X), y = r % Y, z = Math.floor(r / Y), k = this.key(x, y, z); let s = this.sec[k];
    if (!s) { if (!v) return; s = this.sec[k] = new Uint16Array(4096); } s[((y & 15) << 8) | ((z & 15) << 4) | (x & 15)] = v;
  }
  forEachCell(fn) {
    const [X, Y, Z] = this.size;
    for (let k = 0; k < this.sec.length; k++) { const s = this.sec[k]; if (!s) continue;
      const sy = k & 255, col = k >> 8, cx = col % this.SX, cz = Math.floor(col / this.SX);
      for (let l = 0; l < 4096; l++) { const v = s[l]; if (!v) continue;
        const x = cx * 16 + (l & 15), z = cz * 16 + ((l >> 4) & 15), y = sy * 16 + (l >> 8); if (x >= X || y >= Y || z >= Z) continue;
        fn((z * Y + y) * X + x, v); } }
  }
  get cellCount() { return this.size[0] * this.size[1] * this.size[2]; }
  /** sections allocated (each 8 KB) */
  get sections() { let n = 0; for (const s of this.sec) if (s) n++; return n; }
  growTo(Y) { if (Y > this.size[1]) { if (Y > 4096) throw new Error("a sparse volume is at most 4096 high"); this.size = [this.size[0], Y, this.size[2]]; } return this; }
}

// Just enough of NBT to write a structure: big-endian, named tags, a growing buffer.
class NbtWriter {
  constructor() { this.buf = Buffer.alloc(1 << 24); this.o = 0; }
  grow(n) { if (this.o + n <= this.buf.length) return; const b = Buffer.alloc(Math.max(this.buf.length * 2, this.o + n)); this.buf.copy(b, 0, 0, this.o); this.buf = b; }
  u8(v) { this.grow(1); this.buf.writeUInt8(v, this.o); this.o += 1; }
  i32(v) { this.grow(4); this.buf.writeInt32BE(v, this.o); this.o += 4; }
  str(s) { const b = Buffer.from(s, "utf8"); this.grow(2 + b.length); this.buf.writeUInt16BE(b.length, this.o); this.o += 2; b.copy(this.buf, this.o); this.o += b.length; }
  tag(type, name) { this.u8(type); this.str(name); }
  compoundStart(name) { this.tag(10, name); }
  end() { this.u8(0); }                                                  // TAG_End closes a compound (or a list element)
  int(name, v) { this.tag(3, name); this.i32(v); }
  string(name, v) { this.tag(8, name); this.str(v); }
  listOfInt(name, a) { this.tag(9, name); this.u8(3); this.i32(a.length); for (const v of a) this.i32(v); }
  listStart(name, type, n) { this.tag(9, name); this.u8(n ? type : 0); this.i32(n); }   // compound elements follow, each closed by end()
  bytes() { return this.buf.subarray(0, this.o); }
}
