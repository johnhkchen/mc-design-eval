// Shaders for the deepslate views: a sky (a gradient that warms toward sunrise and sunset, the sun's disc and glow, soft
// clouds lit from the sun's side), sunlight with cast shadows, a sky-tinted ambient, and distance haze into the horizon's
// colour, in place of deepslate's flat face shading. deepslate draws every chunk mesh with drawMesh() through whichever
// program is active, so a sun's-eye depth pass (a shadow map, kept until the sun or the structure changes) and the lit
// main pass both reuse its meshes. Needs WEBGL_depth_texture (all current browsers); without it the view stays plain.
//   const s = shading(gl, renderer, size)   null if unsupported
//   s.setSun(t)       t 0..1: morning (sun low in the east) through noon to evening (low in the west)
//   s.draw(view, { shaded })   instead of renderer.drawStructure(view); shaded false = deepslate's flat lighting, still
//                     with cut-out leaves
//   s.invalidate()    after setStructure(): the shadow map is drawn again
import { mat4, vec3 } from "gl-matrix";

const MAIN_VS = `
  attribute vec4 vertPos; attribute vec2 texCoord; attribute vec4 texLimit; attribute vec3 vertColor; attribute vec3 normal;
  uniform mat4 mView; uniform mat4 mProj; uniform mat4 mSun;
  varying highp vec2 vTexCoord; varying highp vec4 vTexLimit; varying highp vec3 vTint; varying highp vec3 vNormal;
  varying highp vec4 vSun; varying highp float vDist;
  void main(void) {
    vec4 eye = mView * vertPos;
    gl_Position = mProj * eye;
    vTexCoord = texCoord; vTexLimit = texLimit; vTint = vertColor; vNormal = normal;
    vSun = mSun * vertPos; vDist = length(eye.xyz);
  }`;
const MAIN_FS = `
  precision highp float;
  varying highp vec2 vTexCoord; varying highp vec4 vTexLimit; varying highp vec3 vTint; varying highp vec3 vNormal;
  varying highp vec4 vSun; varying highp float vDist;
  uniform sampler2D sampler; uniform highp float pixelSize;
  uniform sampler2D shadowMap; uniform float texel; uniform vec3 sunDir; uniform vec3 sunColor; uniform vec3 skyColor;
  uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; uniform float cutout; uniform float shaded;
  float lit(vec3 n) {
    float ndl = dot(n, sunDir);
    if (ndl <= 0.0) return 0.0;
    vec3 p = vSun.xyz / vSun.w * 0.5 + 0.5;
    if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return ndl;
    float bias = 0.0006 + 0.0018 * (1.0 - ndl), s = 0.0;
    for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++)
      s += p.z - bias > texture2D(shadowMap, p.xy + vec2(float(i), float(j)) * texel).r ? 0.0 : 1.0;
    return ndl * s / 9.0;
  }
  void main(void) {
    vec4 tex = texture2D(sampler, clamp(vTexCoord, vTexLimit.xy + vec2(0.5) * pixelSize, vTexLimit.zw - vec2(0.5) * pixelSize));
    // leaves, flowers and the rest of the solid meshes are cut out (a pixel is there or not): a mipmapped leaf edge blended
    // half-transparent over whatever was drawn behind it (often the sky) is the white shimmer. Glass and water blend.
    if (cutout > 0.5) { if (tex.a < 0.5) discard; tex.a = 1.0; } else if (tex.a < 0.01) discard;
    vec3 n = normalize(vNormal);
    vec3 albedo = tex.rgb * vTint;
    if (shaded < 0.5) { gl_FragColor = vec4(albedo * (n.y * 0.2 + abs(n.z) * 0.1 + 0.8), tex.a); return; }   // deepslate's own
    // sky from above, a little bounce from below, the sun where it reaches
    vec3 light = skyColor * (0.58 + 0.2 * n.y) + sunColor * lit(n);
    vec3 c = albedo * light;
    c = c / (1.0 + 0.18 * c);                                    // a soft shoulder, so sunlit pale walls don't clip
    c = mix(c, fogColor, smoothstep(fogNear, fogFar, vDist) * 0.55);
    gl_FragColor = vec4(c, tex.a);
  }`;
const DEPTH_VS = `
  attribute vec4 vertPos; attribute vec2 texCoord; attribute vec4 texLimit;
  uniform mat4 mSun;
  varying highp vec2 vTexCoord; varying highp vec4 vTexLimit;
  void main(void) { gl_Position = mSun * vertPos; vTexCoord = texCoord; vTexLimit = texLimit; }`;
const DEPTH_FS = `
  precision highp float;
  varying highp vec2 vTexCoord; varying highp vec4 vTexLimit;
  uniform sampler2D sampler;
  void main(void) { if (texture2D(sampler, clamp(vTexCoord, vTexLimit.xy, vTexLimit.zw)).a < 0.5) discard; gl_FragColor = vec4(1.0); }`;

const SKY_VS = `
  attribute vec2 p; varying vec2 vp;
  void main(void) { vp = p; gl_Position = vec4(p, 0.9999, 1.0); }`;
const SKY_FS = `
  precision highp float;
  varying vec2 vp;
  uniform mat4 invVP; uniform vec3 camPos; uniform vec3 sunDir; uniform vec3 sunColor; uniform vec3 zenith; uniform vec3 horizon;
  float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 q) { vec2 i = floor(q), f = fract(q), w = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), w.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), w.x), w.y); }
  float fbm(vec2 q) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(q); q *= 2.03; a *= 0.5; } return v; }
  void main(void) {
    vec4 w = invVP * vec4(vp, 1.0, 1.0);
    vec3 d = normalize(w.xyz / w.w - camPos);
    vec3 c = d.y >= 0.0 ? mix(horizon, zenith, pow(d.y, 0.55)) : horizon * (1.0 - min(0.15, -d.y));
    float s = max(dot(d, sunDir), 0.0);
    c += sunColor * (pow(s, 6.0) * 0.22 + pow(s, 64.0) * 0.45);                       // the glow round the sun
    c += vec3(1.0, 0.96, 0.88) * smoothstep(0.99935, 0.9997, s) * 1.6;                 // its disc
    if (d.y > 0.01) {                                                                   // clouds on a plane overhead
      vec2 uv = d.xz / d.y * 0.55;
      float cl = smoothstep(0.52, 0.8, fbm(uv * 1.7 + vec2(3.1, 1.7)));
      vec3 lit = mix(horizon, vec3(1.0), 0.65) + sunColor * 0.35 * pow(s, 3.0);
      c = mix(c, lit, cl * smoothstep(0.01, 0.22, d.y) * 0.9);
    }
    gl_FragColor = vec4(c, 1.0);
  }`;

function program(gl, vs, fs, attrs) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));   // the same slots in both programs, so no stale array is left enabled
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

// the sun through the day: east -> over the street side (north, where the catalog's fronts face, so the default view is
// lit) -> west; elevation low -> high -> low; warmer when low
function sunAt(t) {
  const az = Math.PI * (0.1 + 0.8 * t), el = 0.18 + 0.85 * Math.sin(Math.PI * t);
  const dir = vec3.normalize(vec3.create(), [Math.cos(az) * Math.cos(el), Math.sin(el), -(Math.sin(az) * Math.cos(el) * 0.6 + 0.4)]);
  const warm = 1 - Math.min(1, el / 0.9);
  const sun = [1.0, 0.93 - 0.18 * warm, 0.82 - 0.35 * warm].map((v) => v * (0.8 + 0.2 * (1 - warm)));
  const sky = [0.56 + 0.1 * warm, 0.62 + 0.02 * warm, 0.74 - 0.08 * warm];
  // the sky's own colours: a clear blue at noon, a warm horizon under a deeper zenith when the sun is low
  const k = warm ** 1.5, mix = (a, b) => a.map((v, i) => v + (b[i] - v) * k);
  return { dir, sun, sky, zenith: mix([0.3, 0.5, 0.85], [0.27, 0.35, 0.62]), horizon: mix([0.76, 0.85, 0.96], [0.98, 0.7, 0.46]) };
}

export function shading(gl, renderer, size) {
  const ext = gl.getExtension("WEBGL_depth_texture");
  if (!ext) return null;
  const main = program(gl, MAIN_VS, MAIN_FS, ["vertPos", "texCoord", "texLimit", "vertColor", "normal"]);
  const depth = program(gl, DEPTH_VS, DEPTH_FS, ["vertPos", "texCoord", "texLimit"]);
  const skyProg = program(gl, SKY_VS, SKY_FS, ["p"]), quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one triangle over the screen
  // a town wants a fine shadow map; a phone (or a small build) gets 2048, a quarter of the memory
  const small = typeof matchMedia === "function" && (matchMedia("(pointer: coarse)").matches || innerWidth < 900);
  const N = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), Math.max(...size) > 64 && !small ? 4096 : 2048);
  const depthTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, N, N, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  // WebGL1 wants a colour attachment on most drivers: a 16-bit renderbuffer we never read
  const colour = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, colour);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, N, N);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colour);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!ok) return null;

  const centre = [size[0] / 2, size[1] / 2, size[2] / 2], R = Math.hypot(...size) / 2 + 2;
  const mSun = mat4.create();
  let sun = sunAt(0.38), fresh = false;
  const u = (p, name) => gl.getUniformLocation(p, name);
  const clearAttribs = () => { for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i); };

  function shadowPass() {
    const eye = vec3.scaleAndAdd(vec3.create(), centre, sun.dir, R * 1.5);
    const up = Math.abs(sun.dir[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
    const v = mat4.lookAt(mat4.create(), eye, centre, up), p = mat4.ortho(mat4.create(), -R, R, -R, R, 0.5 * R, 2.6 * R);
    mat4.multiply(mSun, p, v);
    const vp = gl.getParameter(gl.VIEWPORT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, N, N);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.colorMask(false, false, false, false);
    clearAttribs();
    renderer.setShader(depth);
    gl.uniformMatrix4fv(u(depth, "mSun"), false, mSun);
    renderer.setTexture(renderer.atlasTexture, renderer.resources.getPixelSize?.());
    gl.uniform1i(u(depth, "sampler"), 0);
    for (const m of renderer.chunkBuilder.getMeshes()) renderer.drawMesh(m, { pos: true, texture: true });
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(vp[0], vp[1], vp[2], vp[3]);
    fresh = true;
  }

  return {
    setSun(t) { sun = sunAt(t); fresh = false; },
    invalidate() { fresh = false; },
    draw(view, { fog, dist = 300, shaded = true } = {}) {
      if (shaded && !fresh) shadowPass();
      clearAttribs();
      fog = fog ?? (shaded ? sun.horizon : [0.86, 0.9, 0.97]);
      if (shaded) {                                                         // the sky first, behind everything
        const vp = mat4.multiply(mat4.create(), renderer.projMatrix, view), inv = mat4.invert(mat4.create(), vp), iv = mat4.invert(mat4.create(), view);
        gl.useProgram(skyProg); gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
        gl.uniformMatrix4fv(u(skyProg, "invVP"), false, inv); gl.uniform3fv(u(skyProg, "camPos"), [iv[12], iv[13], iv[14]]);
        gl.uniform3fv(u(skyProg, "sunDir"), sun.dir); gl.uniform3fv(u(skyProg, "sunColor"), sun.sun);
        gl.uniform3fv(u(skyProg, "zenith"), sun.zenith); gl.uniform3fv(u(skyProg, "horizon"), sun.horizon);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disableVertexAttribArray(0); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      }
      renderer.setShader(main);
      gl.uniformMatrix4fv(u(main, "mSun"), false, mSun);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, depthTex); gl.uniform1i(u(main, "shadowMap"), 1);
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(u(main, "sampler"), 0);
      gl.uniform1f(u(main, "texel"), 1 / N); gl.uniform1f(u(main, "shaded"), shaded ? 1 : 0);
      gl.uniform3fv(u(main, "sunDir"), sun.dir); gl.uniform3fv(u(main, "sunColor"), sun.sun); gl.uniform3fv(u(main, "skyColor"), sun.sky);
      gl.uniform3fv(u(main, "fogColor"), fog); gl.uniform1f(u(main, "fogNear"), dist * 1.05); gl.uniform1f(u(main, "fogFar"), dist * 2.2);
      renderer.setTexture(renderer.atlasTexture, renderer.resources.getPixelSize?.());
      renderer.prepareDraw(view);
      // deepslate's chunks keep solid and translucent blocks in separate meshes: solids first, cut out; then the translucent
      // ones blended over them, without writing depth (so glass behind glass still shows)
      const chunks = renderer.chunkBuilder.chunks.flatMap((a) => a.flatMap((b) => b.flatMap((c) => c ?? [])));
      const attrs = { pos: true, color: true, texture: true, normal: true };
      gl.uniform1f(u(main, "cutout"), 1);
      for (const c of chunks) if (!c.mesh.isEmpty()) renderer.drawMesh(c.mesh, attrs);
      gl.uniform1f(u(main, "cutout"), 0); gl.depthMask(false);
      for (const c of chunks) if (!c.transparentMesh.isEmpty()) renderer.drawMesh(c.transparentMesh, attrs);
      gl.depthMask(true);
      clearAttribs();
    },
  };
}
