"use client";

import { useEffect, useRef } from "react";

export type BalanceCardShaderShape = "wave" | "ripple" | "diamond";

export type BalanceCardShaderConfig = {
  shape: BalanceCardShaderShape;
  intensity: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  refraction: number;
  dispersion: number;
  frequency: number;
  thickness: number;
  lightResponse: number;
  speed: number;
};

export const DEFAULT_BALANCE_CARD_SHADER_CONFIG: BalanceCardShaderConfig = {
  shape: "wave",
  intensity: 0.085,
  offsetX: 100,
  offsetY: 0,
  rotation: -22,
  refraction: 1,
  dispersion: 0.1,
  frequency: 8,
  thickness: 4.6,
  lightResponse: 1,
  speed: 1,
};

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform vec2 u_textureSize;
  uniform float u_centerOffsetX;
  uniform float u_centerOffsetY;
  uniform float u_rotation;
  uniform float u_intensity;
  uniform float u_refraction;
  uniform float u_dispersion;
  uniform float u_frequency;
  uniform float u_thickness;
  uniform float u_lightResponse;
  uniform float u_speed;
  uniform float u_shape;
  uniform float u_time;
  uniform sampler2D u_background;
  varying vec2 v_uv;

  float square(float value) {
    return value * value;
  }

  float luminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
  }

  vec2 coverUv(vec2 uv) {
    float screenAspect = u_resolution.x / u_resolution.y;
    float imageAspect = u_textureSize.x / u_textureSize.y;

    if (imageAspect > screenAspect) {
      uv.x = (uv.x - 0.5) * (screenAspect / imageAspect) + 0.5;
    } else {
      uv.y = (uv.y - 0.5) * (imageAspect / screenAspect) + 0.5;
    }

    return uv;
  }

  void main() {
    vec2 p = v_uv - 0.5;
    p.x -= u_centerOffsetX;
    p.y -= u_centerOffsetY;
    float aspect = u_resolution.x / u_resolution.y;
    p.x *= aspect;

    float time = u_time * u_speed * 0.24;
    vec2 waveDirection = vec2(cos(radians(u_rotation)), sin(radians(u_rotation)));
    vec2 waveNormal = vec2(-waveDirection.y, waveDirection.x);
    float alongWave = dot(p, waveDirection);
    float acrossWave = dot(p, waveNormal);
    float ridgeDistance = acrossWave;
    float phasePosition = alongWave;
    vec2 refractionNormal = waveNormal;

    if (u_shape > 0.5 && u_shape < 1.5) {
      float radialDistance = length(p);
      ridgeDistance = radialDistance - 0.24;
      phasePosition = radialDistance;
      refractionNormal = normalize(p + vec2(0.0001));
    } else if (u_shape > 1.5) {
      float diamondDistance = abs(alongWave) + abs(acrossWave);
      ridgeDistance = diamondDistance - 0.24;
      phasePosition = diamondDistance;
      refractionNormal = waveDirection * sign(alongWave) + waveNormal * sign(acrossWave);
    }

    float waveEnvelope = exp(-square(ridgeDistance * u_thickness));
    float wavePhase =
      phasePosition * u_frequency - u_time * u_speed * 0.9 +
      sin(ridgeDistance * 3.0 + time) * 0.35;
    float ripple = sin(wavePhase);
    float secondaryRipple = sin(wavePhase * 2.1 + 1.1) * 0.18;

    float lensDistortion =
      waveEnvelope * (ripple * 0.82 + secondaryRipple) * u_intensity * u_refraction;
    vec2 refractionDirection = vec2(refractionNormal.x / aspect, refractionNormal.y);
    vec2 distortedUv = clamp(
      coverUv(v_uv + refractionDirection * lensDistortion),
      vec2(0.001),
      vec2(0.999)
    );
    vec3 background = texture2D(u_background, distortedUv).rgb;
    vec2 dispersionOffset = refractionDirection * abs(lensDistortion) * u_dispersion;
    vec3 redLight = texture2D(
      u_background,
      clamp(distortedUv + dispersionOffset, vec2(0.001), vec2(0.999))
    ).rgb;
    vec3 blueLight = texture2D(
      u_background,
      clamp(distortedUv - dispersionOffset, vec2(0.001), vec2(0.999))
    ).rgb;
    vec3 refractedBackground = vec3(redLight.r, background.g, blueLight.b);

    vec3 lightAhead = texture2D(
      u_background,
      clamp(distortedUv + refractionDirection * 0.014, vec2(0.001), vec2(0.999))
    ).rgb;
    vec3 lightBehind = texture2D(
      u_background,
      clamp(distortedUv - refractionDirection * 0.014, vec2(0.001), vec2(0.999))
    ).rgb;
    float backgroundIllumination = luminance(background);
    float backgroundLightEdge =
      abs(luminance(lightAhead) - luminance(lightBehind));
    float lightResponse = clamp(
      (backgroundIllumination * 0.55 + backgroundLightEdge * 2.5) *
        u_lightResponse,
      0.0,
      1.0
    );

    float specularRidge = exp(-square(ridgeDistance * u_thickness * 3.9));
    float softRidge = exp(-square(ridgeDistance * u_thickness * 1.04));
    float shimmer = 0.5 + 0.5 * sin(wavePhase + time * 0.5);

    vec3 gold = vec3(1.0, 0.76, 0.43);
    vec3 ice = vec3(0.66, 0.82, 1.0);
    vec3 reflectedColor = mix(gold, ice, smoothstep(-0.65, 0.65, p.x + sin(time) * 0.18));
    reflectedColor = mix(
      reflectedColor,
      (lightAhead + lightBehind) * 0.5,
      lightResponse * 0.55
    );
    float sheen = specularRidge * (0.06 + shimmer * 0.09);
    sheen += softRidge * 0.025 + waveEnvelope * abs(ripple) * 0.025;
    sheen += specularRidge * lightResponse * 0.12;

    gl_FragColor = vec4(
      clamp(refractedBackground + reflectedColor * sheen, 0.0, 1.0),
      1.0
    );
  }
`;

export function BalanceCardShader({
  config = DEFAULT_BALANCE_CARD_SHADER_CONFIG,
}: {
  config?: BalanceCardShaderConfig;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);
  const refreshRef = useRef<() => void>(() => {});
  configRef.current = config;

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const hostElement = canvasElement.parentElement;
    if (!hostElement) return;

    const context = canvasElement.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      stencil: false,
    });
    if (!context) return;

    const canvas = canvasElement;
    const host = hostElement;
    const gl: WebGLRenderingContext = context;

    const vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource,
    );
    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return;
    }

    const texture = gl.createTexture();
    if (!texture) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
    const centerOffsetXLocation = gl.getUniformLocation(
      program,
      "u_centerOffsetX",
    );
    const centerOffsetYLocation = gl.getUniformLocation(
      program,
      "u_centerOffsetY",
    );
    const rotationLocation = gl.getUniformLocation(program, "u_rotation");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");
    const refractionLocation = gl.getUniformLocation(program, "u_refraction");
    const dispersionLocation = gl.getUniformLocation(program, "u_dispersion");
    const frequencyLocation = gl.getUniformLocation(program, "u_frequency");
    const thicknessLocation = gl.getUniformLocation(program, "u_thickness");
    const lightResponseLocation = gl.getUniformLocation(
      program,
      "u_lightResponse",
    );
    const speedLocation = gl.getUniformLocation(program, "u_speed");
    const shapeLocation = gl.getUniformLocation(program, "u_shape");
    const backgroundLocation = gl.getUniformLocation(program, "u_background");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (backgroundLocation) gl.uniform1i(backgroundLocation, 0);

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = motionPreference.matches;
    let visible = true;
    let frame = 0;
    let startedAt = 0;
    let elapsedBeforePause = 0;
    let lastFrameAt = 0;
    let textureReady = false;
    let disposed = false;

    const backgroundImage = new Image();
    backgroundImage.decoding = "async";
    backgroundImage.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        backgroundImage,
      );
      if (textureSizeLocation) {
        gl.uniform2f(
          textureSizeLocation,
          backgroundImage.naturalWidth,
          backgroundImage.naturalHeight,
        );
      }
      textureReady = true;
      if (reducedMotion) render(performance.now());
      else start();
    };
    backgroundImage.src = "/current-balance-card-background.png";

    function render(timestamp: number) {
      if (!textureReady) return;
      frame = 0;
      if (!reducedMotion && timestamp - lastFrameAt < 1000 / 30) {
        frame = window.requestAnimationFrame(render);
        return;
      }
      lastFrameAt = timestamp;
      if (canvas.width !== Math.round(host.clientWidth * getPixelRatio())) {
        resize();
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      }
      const currentConfig = configRef.current;
      const pixelRatio = getPixelRatio();
      setUniformFloat(
        gl,
        centerOffsetXLocation,
        (currentConfig.offsetX * pixelRatio) / canvas.width,
      );
      setUniformFloat(
        gl,
        centerOffsetYLocation,
        (currentConfig.offsetY * pixelRatio) / canvas.height,
      );
      setUniformFloat(gl, rotationLocation, currentConfig.rotation);
      setUniformFloat(gl, intensityLocation, currentConfig.intensity);
      setUniformFloat(gl, refractionLocation, currentConfig.refraction);
      setUniformFloat(gl, dispersionLocation, currentConfig.dispersion);
      setUniformFloat(gl, frequencyLocation, currentConfig.frequency);
      setUniformFloat(gl, thicknessLocation, currentConfig.thickness);
      setUniformFloat(gl, lightResponseLocation, currentConfig.lightResponse);
      setUniformFloat(gl, speedLocation, currentConfig.speed);
      setUniformFloat(
        gl,
        shapeLocation,
        currentConfig.shape === "wave"
          ? 0
          : currentConfig.shape === "ripple"
            ? 1
            : 2,
      );
      if (timeLocation) {
        gl.uniform1f(
          timeLocation,
          reducedMotion
            ? 0
            : Math.min(
                elapsedBeforePause + (timestamp - startedAt) / 1000,
                3600,
              ),
        );
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion && visible && document.visibilityState === "visible") {
        frame = window.requestAnimationFrame(render);
      }
    }

    function getPixelRatio() {
      return Math.min(window.devicePixelRatio || 1, 1.35);
    }

    refreshRef.current = () => {
      if (reducedMotion && textureReady) render(performance.now());
    };

    function resize() {
      const pixelRatio = getPixelRatio();
      const width = Math.max(1, Math.round(host.clientWidth * pixelRatio));
      const height = Math.max(1, Math.round(host.clientHeight * pixelRatio));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      if (reducedMotion) render(performance.now());
    }

    function stop() {
      if (frame) {
        window.cancelAnimationFrame(frame);
        elapsedBeforePause += (performance.now() - startedAt) / 1000;
      }
      frame = 0;
    }

    function start() {
      if (!textureReady) return;
      if (reducedMotion) {
        stop();
        render(performance.now());
        return;
      }
      if (frame || !visible || document.visibilityState !== "visible") return;
      startedAt = performance.now();
      frame = window.requestAnimationFrame(render);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    function onMotionPreferenceChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stop();
        render(performance.now());
      } else {
        start();
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersectionObserver.observe(host);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionPreference.addEventListener("change", onMotionPreferenceChange);
    resize();
    start();

    return () => {
      disposed = true;
      stop();
      refreshRef.current = () => {};
      backgroundImage.onload = null;
      backgroundImage.onerror = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  useEffect(() => {
    refreshRef.current();
  }, [config]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_26%_30%,hsl(43_85%_72%_/_0.16),transparent_42%),radial-gradient(ellipse_at_78%_16%,hsl(208_75%_72%_/_0.12),transparent_38%)]" />
      <canvas className="absolute inset-0 size-full" ref={canvasRef} />
    </div>
  );
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function setUniformFloat(
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation | null,
  value: number,
) {
  if (location) gl.uniform1f(location, value);
}
