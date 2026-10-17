// 3-D structure views in the browser with deepslate. Block models and the texture atlas load at view time from
// misode's mcmeta mirror (the site does not host Mojang's assets). One loader is shared by every view on a page.
import { BlockDefinition, BlockModel, BlockPos, Identifier, NbtFile, Structure, StructureRenderer, TextureAtlas, upperPowerOfTwo } from "deepslate";
import { mat4 } from "gl-matrix";

const MCMETA = "https://raw.githubusercontent.com/misode/mcmeta";
const VERSION = "1.21.1";

// Full cubes that hide the faces behind them; everything else draws all its faces.
const OPAQUE = /(_planks|_log|_wood|_hyphae|_stem|stone|cobblestone|bricks|dirt|grass_block|podzol|mycelium|sand|gravel|terracotta|concrete|_wool|_ore|deepslate|tuff|andesite|diorite|granite|^mud$|packed_mud|clay|netherrack|blackstone|basalt|calcite|quartz|smooth_|_block|prismarine|obsidian|bedrock|bookshelf|hay_block|pumpkin|melon|sponge|snow_block|ice$|magma|glowstone|lamp|crafting_table|furnace|barrel|loom|smoker|blast|cartography|fletching|smithing|_shroom|mushroom_block)$/;
const NOT_OPAQUE = /(slab|stairs|wall|fence|button|pressure|door|trapdoor|pane|glass|leaves|carpet|sign|torch|lantern|chain|rail|vine|flower|sapling|bars|fern|ladder|candle|pot|head|skull|banner|bed|chest|anvil|cauldron|hopper|lectern|scaffolding|campfire|bell|grindstone|stonecutter|composter|cake|rod|frame|pickle|coral|kelp|seagrass|mushroom$|wire|repeater|comparator|lever|plate|snow$|path|farmland|dripleaf|azalea)/;
// Water has no block model; show it as tinted glass so ponds and canals stay visible.
const STAND_IN = { "minecraft:water": "minecraft:light_blue_stained_glass", "minecraft:bubble_column": "minecraft:light_blue_stained_glass" };

let resources = null;
export function loadResources() {
  return (resources ??= (async () => {
    const get = (path) => fetch(`${MCMETA}/${path}`).then((r) => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r; });
    const [states, models, uvs, atlasBlob] = await Promise.all([
      get(`${VERSION}-summary/assets/block_definition/data.min.json`).then((r) => r.json()),
      get(`${VERSION}-summary/assets/model/data.min.json`).then((r) => r.json()),
      get(`${VERSION}-atlas/all/data.min.json`).then((r) => r.json()),
      get(`${VERSION}-atlas/all/atlas.png`).then((r) => r.blob()),
    ]);
    const defs = {}, mods = {};
    for (const id in states) defs["minecraft:" + id] = BlockDefinition.fromJson(states[id]);
    for (const id in models) mods["minecraft:" + id] = BlockModel.fromJson(models[id]);
    const accessor = { getBlockModel: (id) => mods[id.toString()] };
    for (const m of Object.values(mods)) m.flatten(accessor);
    const img = await createImageBitmap(atlasBlob);
    const size = upperPowerOfTwo(Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = c.height = size;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, size, size), idMap = {};
    for (const id in uvs) { const [u, v, du, dv] = uvs[id]; const h = du !== dv && id.startsWith("block/") ? du : dv;
      idMap[Identifier.create(id).toString()] = [u / size, v / size, (u + du) / size, (v + h) / size]; }
    const atlas = new TextureAtlas(data, idMap);
    return {
      getBlockDefinition: (id) => defs[id.toString()],
      getBlockModel: (id) => mods[id.toString()],
      getTextureUV: (id) => atlas.getTextureUV(id),
      getTextureAtlas: () => atlas.getTextureAtlas(),
      getBlockFlags: (id) => { const n = id.path; return { opaque: OPAQUE.test(n) && !NOT_OPAQUE.test(n), semi_transparent: /glass|ice$|slime|honey/.test(n), self_culling: /glass/.test(n) }; },
      getBlockProperties: () => null,
      getDefaultBlockProperties: () => null,
    };
  })());
}

/** Fetch an .nbt and read its blocks: [{pos, name, props}], plus its size. `offset` shifts every block (to align a pair). */
export async function loadBlocks(url, { offset = [0, 0, 0] } = {}) {
  const [buf, res] = await Promise.all([fetch(url).then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b)), loadResources()]);
  const s = Structure.fromNbt(NbtFile.read(buf).root);
  const size = s.getSize();
  const blocks = [];
  for (const b of s.getBlocks()) {
    const name = b.state.getName().toString();
    if (/air$/.test(name)) continue;
    blocks.push({ pos: [b.pos[0] + offset[0], b.pos[1] + offset[1], b.pos[2] + offset[2]], name: STAND_IN[name] || name, props: STAND_IN[name] ? {} : withDefaults(res, name, b.state.getProperties()), water: !!STAND_IN[name] });
  }
  return { blocks: visible(blocks), size: [size[0] + Math.max(0, offset[0]), size[1] + Math.max(0, offset[1]), size[2] + Math.max(0, offset[2])] };
}

// Some files leave out block states (a bare grass_block); deepslate then matches no variant and draws nothing.
// Fill them from the block's first listed variant.
function withDefaults(res, name, props) {
  if (Object.keys(props).length) return props;
  const keys = Object.keys(res.getBlockDefinition(name)?.variants ?? {});
  if (!keys.length || keys.includes("")) return props;
  return Object.fromEntries(keys[0].split(",").map((kv) => kv.split("=")));
}

// Only the top layer of water is kept: a swamp is mostly water, and its depths add nothing but faces to draw.
function visible(blocks) {
  const water = new Set();
  for (const b of blocks) if (b.water) water.add(b.pos.join(","));
  return blocks.filter(({ pos: [x, y, z], water: w }) => !w || !water.has(`${x},${y + 1},${z}`));
}

export function toStructure(blocks, size) {
  const s = new Structure(BlockPos.create(...size));
  for (const b of blocks) s.addBlock(BlockPos.create(...b.pos), b.name, b.props);
  return s;
}

// Blocks the schematicannon holds back until the solid blocks are down: things that hang off or stand on others.
const DEFERRED = /torch|lantern|button|lever|ladder|vine|sign|carpet|rail|door|trapdoor|flower|sapling|bed|banner|chain|candle|pot$|bell|pressure_plate|redstone_wire|repeater|comparator|tripwire|grass$|fern|bush|lichen|item_frame|dripleaf|_head|skull|snow$|scaffolding/;
/** The order a schematicannon prints in: bottom layer up, row by row; attached blocks in a second pass. */
export function cannonOrder(blocks) {
  const key = (b) => b.pos[1] * 1e6 + b.pos[2] * 1e3 + b.pos[0];
  const first = [], later = [];
  for (const b of blocks) (DEFERRED.test(b.name.replace("minecraft:", "")) ? later : first).push(b);
  return [...first.sort((a, b) => key(a) - key(b)), ...later.sort((a, b) => key(a) - key(b))];
}

// A narrow lens, so builds read close to the isometric renders instead of the fisheye of deepslate's 70°.
const FOV = 30 * Math.PI / 180;
/** A camera that orbits the structure's centre: yaw/pitch/distance, plus a pan offset. Starts with the whole box in frame. */
export function orbitFor(size) {
  const r = Math.hypot(size[0], size[1], size[2]);
  const dist = (r * 0.5) / Math.tan(FOV / 2) * 0.95;
  return { yaw: Math.PI * 1.25, pitch: 0.55, dist, pan: [0, 0], center: [size[0] / 2, size[1] * 0.45, size[2] / 2], min: dist * 0.15, max: dist * 2.5 };
}
export function viewMatrix(cam) {
  const m = mat4.create();
  mat4.translate(m, m, [cam.pan[0], cam.pan[1], -cam.dist]);
  mat4.rotateX(m, m, cam.pitch);
  mat4.rotateY(m, m, cam.yaw);
  mat4.translate(m, m, [-cam.center[0], -cam.center[1], -cam.center[2]]);
  return m;
}

/** One WebGL view of a structure on a canvas. Resize-aware; draw(cam) renders a frame. */
export function createView(canvas, structure, res) {
  const gl = canvas.getContext("webgl", { antialias: true, preserveDrawingBuffer: false });
  if (!gl) throw new Error("WebGL is not available in this browser");
  // No outline mesh for empty cells: deepslate builds one per air cell in the box, which is most of a landscape's cost.
  const renderer = new StructureRenderer(gl, structure, res, { chunkSize: 16, useInvisibleBlockBuffer: false });
  renderer.getPerspective = () => mat4.perspective(mat4.create(), FOV, canvas.clientWidth / canvas.clientHeight, 1, 4000);
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    renderer.setViewport(0, 0, w, h);
  };
  return {
    draw(cam) { fit(); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); renderer.drawStructure(viewMatrix(cam)); },
    setStructure(s) { renderer.setStructure(s); },
  };
}

/** Pointer controls on an element: drag to rotate, right-drag or shift-drag to pan, wheel or pinch to zoom. */
export function attachOrbit(el, cam, onChange) {
  const pts = new Map(); let pinch = 0;
  const down = (e) => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button, shift: e.shiftKey }); };
  const move = (e) => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) zoom(pinch / d); pinch = d; return; }
    if (p.b === 2 || p.shift) { const k = cam.dist / el.clientHeight; cam.pan[0] += dx * k; cam.pan[1] -= dy * k; }
    else { cam.yaw += dx * 0.008; cam.pitch = Math.max(-0.2, Math.min(1.45, cam.pitch + dy * 0.008)); }
    onChange();
  };
  const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
  const zoom = (f) => { cam.dist = Math.max(cam.min, Math.min(cam.max, cam.dist * f)); onChange(); };
  el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  el.addEventListener("wheel", (e) => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.001)); }, { passive: false });
  return () => {};
}
