#!/usr/bin/env node
// A path-traced photograph of a place with Chunky (chunky-dev/chunky, GPL-3.0; run separately, not bundled): writes a
// scene description for the place's world (out/<place>/world, from `irl world`) with a camera that looks from an eye to a
// target, the sun at an altitude and azimuth, the physically based Nishita sky with clouds, and renders it headless.
//   node bin/chunky-shot.mjs <place> <name> --eye x,y,z --look x,y,z [--sun alt,az (degrees)] [--size 3200x2000]
//     [--spp 400] [--fov 50] [--fog 0.0] [--exposure 1] [--post TONEMAP2 (ACES filmic; TONEMAP1, TONEMAP3 Hable, GAMMA)] [--emitters 13] [--sky-light 1] [--sun-intensity 1.25] (dusk: a dim sky, brighter lamps) [--clouds yes] [--chunky <launcher jar>]
//   -> out/<place>/shots/<name>.png   (Chunky's scene and render dump stay in out/<place>/chunky/)
// Conventions (Chunky's, as measured on a top view): yaw 0 looks along -x, pi/2 along +z; pitch -pi/2 is level, 0 straight down; the sun's azimuth
// 0 is toward +x (east in our frame), altitude up from the horizon.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

const HERE = resolve(import.meta.dirname, ".."), [place, name] = process.argv.slice(2);
const opt = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const v3 = (s) => s.split(",").map(Number);
const eye = v3(opt("--eye")), look = v3(opt("--look")), [alt, az] = v3(opt("--sun", "22,10")).map((d) => (d * Math.PI) / 180);
const [W, H] = opt("--size", "3200x2000").split("x").map(Number), spp = +opt("--spp", 400), fov = +opt("--fov", 50);
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
const scene = {
  sdfVersion: 10, name, width: W, height: H, exposure: +opt("--exposure", 1.0), postprocess: opt("--post", "TONEMAP2"), outputMode: "PNG",
  renderTime: 0, spp: 0, sppTarget: spp, rayDepth: 6, pathTrace: true, dumpFrequency: 500, saveSnapshots: false,
  emittersEnabled: true, emitterIntensity: +opt("--emitters", 13), sunSamplingStrategy: "IMPORTANCE", fancierTranslucency: true, transmissivityCap: 1.0,
  waterOpacity: 0.42, waterVisibility: 9, useCustomWaterColor: false, biomeColorsEnabled: true, transparentSky: false,
  hideUnknownBlocks: false, waterWorldEnabled: false,
  fog: { mode: +opt("--fog", 0) > 0 ? "UNIFORM" : "NONE", uniformDensity: +opt("--fog", 0), skyFogDensity: 1, fogColor: { red: 0.66, green: 0.73, blue: 0.82 }, fastFog: true, layers: [] },
  world: { path: world, dimension: "minecraft:overworld" },
  camera: { name: "camera 1", position: { x: eye[0], y: eye[1], z: eye[2] }, orientation: { roll: 0, pitch, yaw }, projectionMode: "PINHOLE", fov, dof: "Infinity", focalOffset: 2, shift: { x: 0, y: 0 } },
  sun: { altitude: alt, azimuth: az, intensity: +opt("--sun-intensity", 1.25), luminosity: 100, apparentBrightness: 1, radius: 0.03, modifySunTexture: false,
    color: { red: 1, green: 1, blue: 1 }, importanceSampling: { chance: 0.1, radius: 1.2 } },
  sky: { skyYaw: 0, skyPitch: 0, skyRoll: 0, skyMirrored: true, skyExposure: 1, skyLight: +opt("--sky-light", 1), apparentSkyLight: +opt("--sky-light", 1), mode: "SIMULATED", horizonOffset: 0.1,
    cloudsEnabled: opt("--clouds", "no") === "yes", cloudSize: 64, cloudOffset: { x: 0, y: eye[1] + 120, z: 0 }, simulatedSky: "Nishita", skyCacheResolution: 128 },
  chunkList: chunks, cameraPresets: {}, materials: {}, renderer: "PathTracingRenderer", previewRenderer: "PreviewRenderer",
};
mkdirSync(sceneDir, { recursive: true }); mkdirSync(`${out}/shots`, { recursive: true });
writeFileSync(`${sceneDir}/${name}.json`, JSON.stringify(scene, null, 1));
const t0 = Date.now();
execFileSync("java", ["-Xmx8g", "-jar", jar, "-scene-dir", sceneDir, "-reload-chunks", "-f", "-render", name], { stdio: ["ignore", "inherit", "inherit"] });
// Chunky writes its snapshots under <scene dir>/snapshots/: the newest PNG for this scene is the photograph
const snaps = existsSync(`${sceneDir}/snapshots`) ? readdirSync(`${sceneDir}/snapshots`, { recursive: true }).map(String) : [];
const png = snaps.filter((f) => f.split("/").pop().startsWith(name) && f.endsWith(".png")).sort().at(-1);
if (!png) throw new Error("Chunky wrote no image");
copyFileSync(`${sceneDir}/snapshots/${png}`, `${out}/shots/${name}.png`);
console.log(`${place}: ${name}.png (${W}x${H}, ${spp} spp, ${Math.round((Date.now() - t0) / 1000)} s)`);
