#!/usr/bin/env node
// A path-traced photograph of a place with Chunky (chunky-dev/chunky, GPL-3.0; run separately, not bundled): writes a
// scene description for the place's world (out/<place>/world, from `irl world`) with a camera that looks from an eye to a
// target, the sun at an altitude and azimuth, the physically based Nishita sky with clouds, and renders it headless.
//   node bin/chunky-shot.mjs <place> <name> --eye x,y,z --look x,y,z [--sun alt,az (degrees)] [--size 3200x2000]
//     [--spp 400] [--fov 50] [--projection PINHOLE|PANORAMIC_SLOT (a wide cylindrical panorama: --fov is its horizontal angle, e.g. 140 at 6000x2000)|PANORAMIC|FISHEYE] [--fog 0.0] [--exposure 1] [--post TONEMAP2 (ACES filmic; TONEMAP1, TONEMAP3 Hable, GAMMA)] [--emitters 13] [--sky-light 1] [--sun-intensity 1.25] (dusk: a dim sky, brighter lamps) [--clouds yes] [--cloud-y y] (the cloud layer, default 120 over the eye) [--water-plane y] (water past the world's edge) [--ymax y] (load blocks up to y, for a world taller than vanilla's; Chunky clips at 256 by default) [--horizon 0.1] (the sky's horizon offset: 0.4 lifts the dark band under the horizon out of an oblique view) [--sky-fog 1] [--chunks x0,z0,x1,z1] [--frustum] (load only the chunks in that box / in the camera's view) [--chunky <launcher jar>] [--rerender] (the saved scene <name> again on the re-composed world) [--reuse-octree <scene>] (its loaded world, not the chunks again) [--crop x,y,w,h] (one window of the full frame, at final resolution) [--water-shading STILL|SIMPLEX|TILED_NORMALMAP] [--sun-sampling IMPORTANCE|NON_LUMINOUS|HIGH_QUALITY|FAST|OFF] [--emitters 0] (off: lamps sampled by chance are fireflies in daylight)
//   -> out/<place>/shots/<name>.png   (Chunky's scene and render dump stay in out/<place>/chunky/)
// Conventions (Chunky's, as measured on a top view): yaw 0 looks along -x, pi/2 along +z; pitch -pi/2 is level, 0 straight down; the sun's azimuth
// 0 is toward +x (east in our frame), altitude up from the horizon.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync, existsSync, unlinkSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

const HERE = resolve(import.meta.dirname, ".."), [place, name] = process.argv.slice(2);
const opt = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const v3 = (s) => s.split(",").map(Number);
// --rerender: the scene <name> exactly as saved (camera, sun, sky, size, samples, chunks) on the world as it now is (after
// a re-compose): its progress is reset and the old photograph kept as shots/<name>-pre-fix.png
const rerender = process.argv.includes("--rerender");
const eye = v3(opt("--eye", rerender ? "0,0,0" : undefined)), look = v3(opt("--look", rerender ? "1,0,1" : undefined)), [alt, az] = v3(opt("--sun", "22,10")).map((d) => (d * Math.PI) / 180);
const [W, H] = opt("--size", "3200x2000").split("x").map(Number), spp = +opt("--spp", 400), fov = +opt("--fov", 50);
// Chunky's panoramic slot reads its fov as the VERTICAL angle and spans fov x width/height across (measured: 140 at 3:1
// wrapped past 360 degrees), so the horizontal angle asked for is turned into that
const chunkyFov = opt("--projection", "PINHOLE") === "PANORAMIC_SLOT" ? +(fov * H / W).toFixed(3) : fov;
const jar = opt("--chunky", `${homedir()}/.local/share/chunky-tool/chunky-2.4.6.jar`);
const out = `${HERE}/out/${place}`, world = `${out}/world`, sceneDir = `${out}/chunky`;
if (!existsSync(`${world}/level.dat`)) throw new Error(`no world: run 'node bin/irl.mjs world ${place}' first`);

// the camera: yaw from the horizontal direction, pitch from the vertical
const d = [look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]], h = Math.hypot(d[0], d[2]);
const YAW = { A: Math.atan2(d[2], -d[0]), B: Math.atan2(-d[2], -d[0]) };
// A, measured: Chunky's forward is (-cos yaw, sin yaw) in world x, z
const yaw = YAW[opt("--yawmode", "A")], pitch = -Math.PI / 2 - Math.atan2(d[1], h);
const chunks =readdirSync(`${world}/region`).flatMap((f) => { const m = /^r\.(-?\d+)\.(-?\d+)\.mca$/.exec(f); if (!m) return [];
  const rx = +m[1], rz = +m[2], out2 = []; for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) out2.push([rx * 32 + x, rz * 32 + z]); return out2; });
// a big world can run Chunky out of heap: --chunks x0,z0,x1,z1 (blocks) loads only the chunks that meet that box, and
// --frustum only those whose centre is within the camera's horizontal view (plus 10 degrees, and everything within 96
// blocks of the eye); both may be given (a chunk must pass each)
const view = (() => { const p = opt("--projection", "PINHOLE"), hf = p === "PANORAMIC_SLOT" ? fov : p === "PINHOLE" ? (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * (W / H)) * 180) / Math.PI : 360;
  return { half: ((hf / 2 + 10) * Math.PI) / 180, dir: Math.atan2(d[2], d[0]) }; })();
const box = opt("--chunks")?.split(",").map(Number);
const chunkList = chunks.filter(([cx, cz]) => {
  if (box && (cx * 16 + 15 < box[0] || cx * 16 > box[2] || cz * 16 + 15 < box[1] || cz * 16 > box[3])) return false;
  if (!process.argv.includes("--frustum") || view.half >= Math.PI) return true;
  const dx = cx * 16 + 8 - eye[0], dz = cz * 16 + 8 - eye[2]; if (Math.hypot(dx, dz) < 96) return true;
  return Math.abs(Math.atan2(Math.sin(Math.atan2(dz, dx) - view.dir), Math.cos(Math.atan2(dz, dx) - view.dir))) <= view.half; });
if (chunkList.length < chunks.length) console.log(`${chunkList.length} of ${chunks.length} chunks in view`);
const scene = {
  sdfVersion: 10, name, width: W, height: H, exposure: +opt("--exposure", 1.0), postprocess: opt("--post", "TONEMAP2"), outputMode: "PNG",
  renderTime: 0, spp: 0, sppTarget: spp, rayDepth: 6, pathTrace: true, dumpFrequency: 500, saveSnapshots: false,
  emittersEnabled: +opt("--emitters", 13) > 0, emitterIntensity: +opt("--emitters", 13), sunSamplingStrategy: opt("--sun-sampling", "IMPORTANCE"),   // NON_LUMINOUS: the sun lights surfaces directly but a bounced ray never hits it (no glint fireflies)
  fancierTranslucency: true, transmissivityCap: 1.0,
  // --water-shading STILL|SIMPLEX|TILED_NORMALMAP: a rippled normal map glints the sun into fireflies on open water
  waterShadingStrategy: opt("--water-shading", "TILED_NORMALMAP"), waterOpacity: 0.42, waterVisibility: 9, useCustomWaterColor: false, biomeColorsEnabled: true, transparentSky: false,
  hideUnknownBlocks: false, waterWorldEnabled: false,
  // --water-plane y: an endless water plane at that height past the world's edge (clipped inside the loaded chunks), so an
  // oblique view sees a horizon of water instead of the void's black band under the sky
  ...(opt("--water-plane") != null ? { waterWorldEnabled: true, waterWorldHeight: +opt("--water-plane"), waterWorldClipEnabled: true, waterWorldHeightOffsetEnabled: false } : {}),
  // --ymax y: the highest block Chunky loads (its default clips at 256), for a world taller than vanilla's
  ...(opt("--ymax") != null ? { yMin: 0, yMax: +opt("--ymax"), yClipMin: 0, yClipMax: +opt("--ymax") } : {}),
  fog: { mode: +opt("--fog", 0) > 0 ? "UNIFORM" : "NONE", uniformDensity: +opt("--fog", 0), skyFogDensity: +opt("--sky-fog", 1), color: { red: 0.66, green: 0.73, blue: 0.82 }, fastFog: true, layers: [] },
  world: { path: world, dimension: "minecraft:overworld" },
  camera: { name: "camera 1", position: { x: eye[0], y: eye[1], z: eye[2] }, orientation: { roll: 0, pitch, yaw }, projectionMode: opt("--projection", "PINHOLE"), fov: chunkyFov, dof: "Infinity", focalOffset: 2, shift: { x: 0, y: 0 } },
  sun: { altitude: alt, azimuth: az, intensity: +opt("--sun-intensity", 1.25), luminosity: +opt("--sun-luminosity", 100), apparentBrightness: 1, radius: 0.03, modifySunTexture: false,
    color: (([r, g, b]) => ({ red: r, green: g, blue: b }))(v3(opt("--sun-color", "1,1,1"))), importanceSampling: { chance: 0.1, radius: 1.2 } },
  sky: { skyYaw: 0, skyPitch: 0, skyRoll: 0, skyMirrored: true, skyExposure: 1, skyLight: +opt("--sky-light", 1), apparentSkyLight: +opt("--sky-light", 1), mode: "SIMULATED", horizonOffset: +opt("--horizon", 0.1),
    cloudsEnabled: opt("--clouds", "no") === "yes", cloudSize: 64, cloudOffset: { x: 0, y: +opt("--cloud-y", eye[1] + 120), z: 0 }, simulatedSky: "Nishita", skyCacheResolution: 128 },
  chunkList, cameraPresets: {}, materials: {}, renderer: "PathTracingRenderer", previewRenderer: "PreviewRenderer",
  // --octree PACKED|BIGPACKED|NODE|DICTIONARY: Chunky's world octree implementation (default left to Chunky)
  ...(opt("--octree") ? { octreeImplementation: opt("--octree") } : {}),
};
// --crop x,y,w,h: render only that window of the full frame, at the final resolution (a test of the final pixels at a
// fraction of the cost); applied after --rerender so a saved scene can be cropped too
const crop = opt("--crop")?.split(",").map(Number);
mkdirSync(sceneDir, { recursive: true }); mkdirSync(`${out}/shots`, { recursive: true });
if (rerender) {
  const saved = JSON.parse(readFileSync(`${sceneDir}/${name}.json`, "utf8"));
  Object.keys(scene).forEach((k) => delete scene[k]); Object.assign(scene, saved, { spp: 0, renderTime: 0 });
  for (const f of [`${name}.dump`, `${name}.dump.backup`, `${name}.octree2`]) if (existsSync(`${sceneDir}/${f}`)) unlinkSync(`${sceneDir}/${f}`);
  if (existsSync(`${sceneDir}/snapshots`)) for (const f of readdirSync(`${sceneDir}/snapshots`)) if (new RegExp(`^${name}-\\d+\\.png$`).test(f)) renameSync(`${sceneDir}/snapshots/${f}`, `${sceneDir}/snapshots/pre-fix-${f}`);
  if (existsSync(`${out}/shots/${name}.png`) && !existsSync(`${out}/shots/${name}-pre-fix.png`)) copyFileSync(`${out}/shots/${name}.png`, `${out}/shots/${name}-pre-fix.png`);
}
// --reuse-octree <scene>: that scene's loaded world (its chunk list and .octree2) instead of loading the chunks again, so
// a sequence of frames (bin/chunky-orbit.mjs) pays for the world once
const reuse = opt("--reuse-octree");
if (reuse) { scene.chunkList = JSON.parse(readFileSync(`${sceneDir}/${reuse}.json`, "utf8")).chunkList; copyFileSync(`${sceneDir}/${reuse}.octree2`, `${sceneDir}/${name}.octree2`); }
if (crop) Object.assign(scene, { fullWidth: scene.width, fullHeight: scene.height, cropX: crop[0], cropY: crop[1], width: crop[2], height: crop[3] });
writeFileSync(`${sceneDir}/${name}.json`, JSON.stringify(scene, null, 1));
const t0 = Date.now();
// Chunky's launcher starts the renderer as a second JVM with its own heap (1 GB unless set in its settings), which a big
// world outgrows whatever -Xmx the launcher gets: run the newest installed core directly, with $CHUNKY_HEAP (default 8g)
const heap = `-Xmx${process.env.CHUNKY_HEAP ?? "8g"}`, home = `${homedir()}/.chunky`, args = ["-scene-dir", sceneDir, ...(reuse ? [] : ["-reload-chunks"]), "-f", "-render", name];
const core = existsSync(`${home}/versions`) && !process.argv.includes("--chunky") ? readdirSync(`${home}/versions`).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(`${home}/versions/${f}`, "utf8"))).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))[0] : null;
if (core) { let java = "java"; try { java = `${execFileSync("/usr/libexec/java_home", ["-v", "17+"], { encoding: "utf8" }).trim()}/bin/java`; } catch {}
  execFileSync(java, [heap, `-Dchunky.home=${home}`, "-classpath", core.libraries.map((l) => `${home}/lib/${l.name}`).join(":"), "se.llbit.chunky.main.Chunky", ...args], { stdio: ["ignore", "inherit", "inherit"] }); }
else execFileSync("java", [heap, "-jar", jar, ...args], { stdio: ["ignore", "inherit", "inherit"] });
// Chunky writes its snapshots under <scene dir>/snapshots/: the newest PNG for this scene is the photograph
const snaps = existsSync(`${sceneDir}/snapshots`) ? readdirSync(`${sceneDir}/snapshots`, { recursive: true }).map(String) : [];
// (<name>-<spp>.png exactly: a prefix match took "wtest-se-50.png" for the scene "wtest-s")
const own = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)\\.png$`);
const png = snaps.filter((f) => own.test(f.split("/").pop())).sort((a, b) => +own.exec(a.split("/").pop())[1] - +own.exec(b.split("/").pop())[1]).at(-1);
if (!png) throw new Error("Chunky wrote no image");
copyFileSync(`${sceneDir}/snapshots/${png}`, `${out}/shots/${name}.png`);
console.log(`${place}: ${name}.png (${scene.width}x${scene.height}, ${scene.sppTarget} spp, ${Math.round((Date.now() - t0) / 1000)} s)`);
