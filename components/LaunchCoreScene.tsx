'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const CORE_CONFIG = {
  particles: 28_000,
  lowPowerParticles: 12_000,
  maxParticles: 36_000,
  maxRenderPixels: 4_194_304,
  lowPowerRenderPixels: 2_073_600,
  bloomStrength: 0.68,
  bloomRadius: 0.72,
  bloomThreshold: 0.72,
  standbySpeed: 0.12,
  countdownSpeed: 1.1,
  tunnelSpeed: 24,
  coreRadius: 2.45,
  orbitRadius: 3.05,
  hudTicks: 120,
  glyphs: ['0', '1', '{', '}', '<', '>', '/', '#'],
  colors: {
    black: '#000000',
    offWhite: '#f5f5f2',
    cyan: '#00f0ff',
    core: '#d7ffff',
  },
  launch: {
    silenceEnd: 0.083,
    blastEnd: 0.16,
    scatterEnd: 0.4,
    morphStart: 0.4,
    morphEnd: 0.75,
    lockStart: 0.72,
  },
  post: {
    baseAberration: 0.00015,
    maxAberration: 0.0024,
    vignette: 0.54,
    grain: 0.018,
  },
} as const

const BOOT_LOG_LINES = [
  { progress: 0, text: '[ OK ] core oscillator stable' },
  { progress: 0.2, text: '[ OK ] linking modules' },
  { progress: 0.5, text: '[ OK ] compiling community' },
  { progress: 0.8, text: '[ OK ] deploying Nexora' },
] as const

export type LaunchVisualStatus = 'STAY_TUNED' | 'COUNTDOWN_RUNNING' | 'ANIMATION' | 'LAUNCHED'

export type LaunchCoreVisual = {
  status: LaunchVisualStatus
  countdown: number | null
  countdownProgress: number
  launchProgress: number
}

type LaunchCoreSceneProps = {
  visual: LaunchCoreVisual
  onUnavailable: () => void
}

type CoreUniforms = {
  uTime: { value: number }
  uIntensity: { value: number }
  uWarp: { value: number }
  uImplode: { value: number }
  uScatter: { value: number }
  uMorph: { value: number }
  uGlyphAtlas: { value: THREE.Texture }
  uParticleColor: { value: THREE.Color }
}

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aAngle;
  attribute float aRadius;
  attribute float aDepth;
  attribute float aSize;
  attribute float aGlyph;
  attribute float aSeed;
  attribute vec2 aText;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uWarp;
  uniform float uImplode;
  uniform float uScatter;
  uniform float uMorph;

  varying vec2 vUv;
  varying float vGlyph;
  varying float vAlpha;

  void main() {
    float angle = aAngle + uTime * (0.025 + uIntensity * 0.22) * (0.4 + aDepth);
    float radius = aRadius + sin(uTime * 0.36 + aSeed * 6.28318) * 0.12;
    vec3 galaxy = vec3(cos(angle) * radius, sin(angle) * radius * 0.58, (aDepth - 0.5) * 16.0);

    float tunnelAngle = angle * 1.35 + aSeed * 2.8;
    vec2 tunnelXY = vec2(cos(tunnelAngle), sin(tunnelAngle)) * radius * 0.15;
    float tunnelZ = mod((aDepth - 0.5) * 24.0 + uTime * (2.0 + uIntensity * 17.0), 24.0) - 12.0;
    vec3 tunnel = vec3(tunnelXY, tunnelZ);

    vec3 point = mix(galaxy, tunnel, uWarp);
    vec3 scatterDirection = normalize(vec3(cos(aSeed * 45.0), sin(aSeed * 31.0), aDepth - 0.5));
    point += scatterDirection * uScatter * (2.5 + aSeed * 6.5);
    point = mix(point, vec3(aText, 0.0), uMorph);
    point = mix(point, vec3(0.0), uImplode);

    float perspective = mix(0.72, 1.45, aDepth);
    float size = aSize * perspective * (1.0 + uWarp * 0.35);
    vec3 billboard = point + vec3(position.xy * size, 0.0);
    vec4 mvPosition = modelViewMatrix * vec4(billboard, 1.0);

    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    vGlyph = aGlyph;
    vAlpha = mix(0.05, 0.3, aDepth) * (0.28 + uIntensity * 0.45);
  }
`

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform sampler2D uGlyphAtlas;
  uniform vec3 uParticleColor;

  varying vec2 vUv;
  varying float vGlyph;
  varying float vAlpha;

  void main() {
    vec2 atlasUv = vec2((vGlyph + vUv.x) / 8.0, vUv.y);
    float glyphAlpha = texture2D(uGlyphAtlas, atlasUv).a;
    if (glyphAlpha < 0.16) discard;
    gl_FragColor = vec4(uParticleColor, glyphAlpha * vAlpha);
  }
`

const POST_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uChroma: { value: CORE_CONFIG.post.baseAberration },
    uVignette: { value: CORE_CONFIG.post.vignette },
    uGrain: { value: CORE_CONFIG.post.grain },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uChroma;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + uTime * 0.01) * 43758.5453123);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      vec2 offset = centered * uChroma;
      vec3 color;
      color.r = texture2D(tDiffuse, vUv + offset).r;
      color.g = texture2D(tDiffuse, vUv).g;
      color.b = texture2D(tDiffuse, vUv - offset).b;
      float vignette = 1.0 - smoothstep(0.25, 0.78, length(centered) * 1.4) * uVignette;
      float grain = (hash(gl_FragCoord.xy) - 0.5) * uGrain;
      float brightness = max(color.r, max(color.g, color.b));
      gl_FragColor = vec4(color * vignette + grain * smoothstep(0.005, 0.05, brightness), 1.0);
    }
  `,
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function easeOutExpo(value: number) {
  return value >= 1 ? 1 : 1 - 2 ** (-10 * value)
}

function isLowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8
  const memory = 'deviceMemory' in navigator ? Number(navigator.deviceMemory) : 8
  return cores <= 4 || memory <= 4
}

function getParticleCount(lowPower: boolean) {
  const requested = lowPower ? CORE_CONFIG.lowPowerParticles : CORE_CONFIG.particles
  return Math.min(requested, CORE_CONFIG.maxParticles)
}

function getRenderPixelRatio(width: number, height: number, lowPower: boolean) {
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelBudget = lowPower ? CORE_CONFIG.lowPowerRenderPixels : CORE_CONFIG.maxRenderPixels
  const budgetRatio = Math.sqrt(pixelBudget / (width * height))
  return Math.min(devicePixelRatio, budgetRatio)
}

function createGlyphAtlas() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the glyph atlas canvas.')

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#ffffff'
  context.font = '700 88px "IBM Plex Mono", monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  CORE_CONFIG.glyphs.forEach((glyph, index) => {
    context.fillText(glyph, index * 128 + 64, 65)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function createTextTargets(count: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 240
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the logo target canvas.')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#fff'
  context.font = '700 176px Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('NEXORA', canvas.width / 2, canvas.height / 2)

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const points: Array<[number, number]> = []
  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 180) {
        points.push([
          ((x / canvas.width) - 0.5) * 8.8,
          (0.5 - y / canvas.height) * 1.76,
        ])
      }
    }
  }

  if (points.length === 0) throw new Error('Could not sample the logo morph target.')
  return Float32Array.from({ length: count * 2 }, (_, index) => {
    const point = points[Math.floor(index / 2) % points.length]
    return point[index % 2]
  })
}

function createParticleGeometry(count: number) {
  const base = new THREE.PlaneGeometry(1, 1)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.index = base.index
  for (const [name, attribute] of Object.entries(base.attributes)) {
    geometry.setAttribute(name, attribute)
  }

  const angles = new Float32Array(count)
  const radii = new Float32Array(count)
  const depths = new Float32Array(count)
  const sizes = new Float32Array(count)
  const glyphs = new Float32Array(count)
  const seeds = new Float32Array(count)

  for (let index = 0; index < count; index += 1) {
    angles[index] = Math.random() * Math.PI * 2
    radii[index] = 2.1 + Math.random() * 8.8
    depths[index] = Math.random()
    sizes[index] = 0.025 + Math.random() * 0.07
    glyphs[index] = Math.floor(Math.random() * CORE_CONFIG.glyphs.length)
    seeds[index] = Math.random()
  }

  geometry.setAttribute('aAngle', new THREE.InstancedBufferAttribute(angles, 1))
  geometry.setAttribute('aRadius', new THREE.InstancedBufferAttribute(radii, 1))
  geometry.setAttribute('aDepth', new THREE.InstancedBufferAttribute(depths, 1))
  geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1))
  geometry.setAttribute('aGlyph', new THREE.InstancedBufferAttribute(glyphs, 1))
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  geometry.setAttribute('aText', new THREE.InstancedBufferAttribute(createTextTargets(count), 2))
  geometry.instanceCount = count
  base.dispose()
  return geometry
}

function createCoreEmblem() {
  const shape = new THREE.Shape()
  shape.moveTo(-1.1, 1.58)
  shape.lineTo(-0.54, 1.58)
  shape.lineTo(0, 0.62)
  shape.lineTo(0.54, 1.58)
  shape.lineTo(1.1, 1.58)
  shape.lineTo(0.27, 0)
  shape.lineTo(1.1, -1.58)
  shape.lineTo(0.54, -1.58)
  shape.lineTo(0, -0.62)
  shape.lineTo(-0.54, -1.58)
  shape.lineTo(-1.1, -1.58)
  shape.lineTo(-0.27, 0)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    curveSegments: 2,
  })
  geometry.center()
  return geometry
}

function makeRing(radius: number, tube: number, opacity: number, color: string = CORE_CONFIG.colors.cyan) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 8, 180),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
}

function LaunchCoreScene({ visual, onUnavailable }: LaunchCoreSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visualRef = useRef(visual)
  const unavailableRef = useRef(onUnavailable)
  const drawRef = useRef<((time: number) => void) | null>(null)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    visualRef.current = visual
    if (reducedMotionRef.current) drawRef.current?.(performance.now())
  }, [visual])

  useEffect(() => {
    unavailableRef.current = onUnavailable
  }, [onUnavailable])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: THREE.WebGLRenderer | null = null
    let composer: EffectComposer | null = null
    let sceneForCleanup: THREE.Scene | null = null
    let glyphAtlasForCleanup: THREE.Texture | null = null
    let renderPassForCleanup: RenderPass | null = null
    let bloomForCleanup: UnrealBloomPass | null = null
    let postPassForCleanup: ShaderPass | null = null
    let outputPassForCleanup: OutputPass | null = null
    let disposed = false
    let frame = 0
    const cleanups: Array<() => void> = []
    const dispose = () => {
      if (disposed) return
      disposed = true
      drawRef.current = null
      if (frame) window.cancelAnimationFrame(frame)
      cleanups.forEach((cleanup) => cleanup())
      composer?.dispose()
      renderPassForCleanup?.dispose()
      bloomForCleanup?.dispose()
      postPassForCleanup?.dispose()
      outputPassForCleanup?.dispose()
      sceneForCleanup?.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Sprite)) return
        object.geometry?.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
          material.dispose()
        })
      })
      glyphAtlasForCleanup?.dispose()
      renderer?.dispose()
    }

    try {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      reducedMotionRef.current = reducedMotion.matches
      const lowPower = isLowPowerDevice()
      const rendererInstance = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      })
      renderer = rendererInstance
      renderer.setPixelRatio(getRenderPixelRatio(window.innerWidth, window.innerHeight, lowPower))
      renderer.setSize(window.innerWidth, window.innerHeight, false)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15

      const scene = new THREE.Scene()
      sceneForCleanup = scene
      scene.background = new THREE.Color(CORE_CONFIG.colors.black)
      const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.set(0, 0, 20)

      const core = new THREE.Group()
      scene.add(core)

      const xMaterial = new THREE.MeshStandardMaterial({
        color: CORE_CONFIG.colors.core,
        emissive: CORE_CONFIG.colors.cyan,
        emissiveIntensity: 2.4,
        metalness: 0.08,
        roughness: 0.22,
      })
      const xEmblem = new THREE.Mesh(createCoreEmblem(), xMaterial)
      core.add(xEmblem)
      core.add(new THREE.PointLight(CORE_CONFIG.colors.cyan, 4.2, 7, 2))

      const flareCanvas = document.createElement('canvas')
      flareCanvas.width = 256
      flareCanvas.height = 256
      const flareContext = flareCanvas.getContext('2d')
      if (!flareContext) throw new Error('Could not create the core flare texture.')
      const flareGradient = flareContext.createRadialGradient(128, 128, 2, 128, 128, 128)
      flareGradient.addColorStop(0, 'rgba(255,255,255,0.95)')
      flareGradient.addColorStop(0.12, 'rgba(0,240,255,0.54)')
      flareGradient.addColorStop(0.45, 'rgba(0,240,255,0.12)')
      flareGradient.addColorStop(1, 'rgba(0,240,255,0)')
      flareContext.fillStyle = flareGradient
      flareContext.fillRect(0, 0, 256, 256)
      const flareTexture = new THREE.CanvasTexture(flareCanvas)
      const flare = new THREE.Sprite(new THREE.SpriteMaterial({
        map: flareTexture,
        color: CORE_CONFIG.colors.cyan,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }))
      flare.scale.set(5.8, 5.8, 1)
      flare.position.z = -0.35
      core.add(flare)

      const ringA = makeRing(CORE_CONFIG.orbitRadius, 0.008, 0.24)
      const ringB = makeRing(CORE_CONFIG.orbitRadius * 1.26, 0.006, 0.12)
      ringB.rotation.x = 0.72
      ringB.rotation.y = 0.38
      const ringC = makeRing(CORE_CONFIG.orbitRadius * 0.78, 0.006, 0.12)
      ringC.rotation.x = -0.8
      ringC.rotation.y = 0.5
      core.add(ringA, ringB, ringC)

      const hudGroup = new THREE.Group()
      const tickGeometry = new THREE.BoxGeometry(0.018, 0.13, 0.012)
      const tickMaterial = new THREE.MeshBasicMaterial({
        color: CORE_CONFIG.colors.offWhite,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const ticks = new THREE.InstancedMesh(tickGeometry, tickMaterial, CORE_CONFIG.hudTicks)
      const tickObject = new THREE.Object3D()
      const dimTick = new THREE.Color('#34565a')
      for (let index = 0; index < CORE_CONFIG.hudTicks; index += 1) {
        const angle = index / CORE_CONFIG.hudTicks * Math.PI * 2
        const radius = CORE_CONFIG.coreRadius
        tickObject.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.1)
        tickObject.rotation.z = angle
        tickObject.scale.y = index % 10 === 0 ? 1.8 : 1
        tickObject.updateMatrix()
        ticks.setMatrixAt(index, tickObject.matrix)
        ticks.setColorAt(index, dimTick)
      }
      ticks.instanceMatrix.needsUpdate = true
      hudGroup.add(ticks)
      core.add(hudGroup)

      const rayPositions = new Float32Array(64 * 6)
      for (let index = 0; index < 64; index += 1) {
        const angle = index / 64 * Math.PI * 2
        const innerRadius = 0.4 + Math.random() * 0.6
        const outerRadius = 1.5 + Math.random() * 1.8
        const offset = index * 6
        rayPositions[offset] = Math.cos(angle) * innerRadius
        rayPositions[offset + 1] = Math.sin(angle) * innerRadius
        rayPositions[offset + 2] = -0.12
        rayPositions[offset + 3] = Math.cos(angle) * outerRadius
        rayPositions[offset + 4] = Math.sin(angle) * outerRadius
        rayPositions[offset + 5] = -0.12
      }
      const rayGeometry = new THREE.BufferGeometry()
      rayGeometry.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3))
      const rays = new THREE.LineSegments(rayGeometry, new THREE.LineBasicMaterial({
        color: CORE_CONFIG.colors.cyan,
        transparent: true,
        opacity: 0.085,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }))
      core.add(rays)

      const shockwave = makeRing(1, 0.018, 0.8, CORE_CONFIG.colors.offWhite)
      shockwave.visible = false
      shockwave.position.z = 0.24
      scene.add(shockwave)

      const glyphAtlas = createGlyphAtlas()
      glyphAtlasForCleanup = glyphAtlas
      const count = getParticleCount(lowPower)
      const particleGeometry = createParticleGeometry(count)
      const uniforms: CoreUniforms = {
        uTime: { value: 0 },
        uIntensity: { value: 0.08 },
        uWarp: { value: 0 },
        uImplode: { value: 0 },
        uScatter: { value: 0 },
        uMorph: { value: 0 },
        uGlyphAtlas: { value: glyphAtlas },
        uParticleColor: { value: new THREE.Color(CORE_CONFIG.colors.cyan) },
      }
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: PARTICLE_VERTEX,
        fragmentShader: PARTICLE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      })
      const particles = new THREE.Mesh(particleGeometry, particleMaterial)
      particles.frustumCulled = false
      scene.add(particles)

      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        CORE_CONFIG.bloomStrength,
        CORE_CONFIG.bloomRadius,
        CORE_CONFIG.bloomThreshold,
      )
      const postPass = new ShaderPass(POST_SHADER)
      const renderPass = new RenderPass(scene, camera)
      const outputPass = new OutputPass()
      bloomForCleanup = bloom
      postPassForCleanup = postPass
      renderPassForCleanup = renderPass
      outputPassForCleanup = outputPass
      const activeComposer = new EffectComposer(rendererInstance)
      composer = activeComposer
      activeComposer.addPass(renderPass)
      activeComposer.addPass(bloom)
      activeComposer.addPass(postPass)
      activeComposer.addPass(outputPass)

      const visible = () => !document.hidden
      const updateView = () => {
        if (!renderer || !composer) return
        const width = window.innerWidth
        const height = window.innerHeight
        camera.aspect = width / height
        camera.position.z = width / height < 1 ? 24 : 20
        camera.updateProjectionMatrix()
        renderer.setPixelRatio(getRenderPixelRatio(width, height, lowPower))
        renderer.setSize(width, height, false)
        activeComposer.setSize(width, height)
        if (reducedMotion.matches) activeComposer.render()
      }

      const updateTickDial = (activeTicks: number) => {
        const colors = ticks.instanceColor?.array
        if (!colors) return
        const dim = new THREE.Color('#34565a')
        const bright = new THREE.Color(CORE_CONFIG.colors.offWhite)
        const cyan = new THREE.Color(CORE_CONFIG.colors.cyan)
        for (let index = 0; index < CORE_CONFIG.hudTicks; index += 1) {
          const isActive = index < activeTicks
          ticks.setColorAt(index, isActive ? (index % 10 === 0 ? bright : cyan) : dim)
        }
        if (ticks.instanceColor) ticks.instanceColor.needsUpdate = true
      }

      let lastDialTicks = -1
      let previousFrameTime: number | null = null
      let renderedCountdownProgress = 0
      const render = (frameTime: number, scheduleNextFrame = true) => {
        frame = 0
        if (disposed || !visible()) return

        const current = visualRef.current
        const deltaSeconds = previousFrameTime === null
          ? 0
          : Math.min((frameTime - previousFrameTime) / 1000, 0.05)
        previousFrameTime = frameTime
        const targetCountdownProgress = current.status === 'COUNTDOWN_RUNNING'
          ? THREE.MathUtils.clamp(current.countdownProgress, 0, 1)
          : current.status === 'ANIMATION' || current.status === 'LAUNCHED' ? 1 : 0
        if (current.status === 'COUNTDOWN_RUNNING' && deltaSeconds > 0) {
          renderedCountdownProgress +=
            (targetCountdownProgress - renderedCountdownProgress) *
            (1 - Math.exp(-deltaSeconds * 12))
        } else {
          renderedCountdownProgress = targetCountdownProgress
        }
        const countdownProgress = renderedCountdownProgress
        const launchProgress = current.status === 'LAUNCHED' ? 1 : current.launchProgress
        const launchPhase = current.status === 'ANIMATION' || current.status === 'LAUNCHED'
        const elapsed = launchProgress
        const intensity = current.status === 'STAY_TUNED'
          ? 0.08 + (Math.sin(frameTime * 0.00035) + 1) * 0.035
          : launchPhase ? 1 : 0.12 + countdownProgress * 0.88
        const warp = launchPhase
          ? 1 - smoothstep(CORE_CONFIG.launch.scatterEnd, CORE_CONFIG.launch.morphEnd, elapsed)
          : countdownProgress * 0.92
        const implode = launchPhase && elapsed < CORE_CONFIG.launch.silenceEnd
          ? easeOutExpo(elapsed / CORE_CONFIG.launch.silenceEnd)
          : launchPhase && elapsed < CORE_CONFIG.launch.blastEnd
            ? 1 - smoothstep(CORE_CONFIG.launch.silenceEnd, CORE_CONFIG.launch.blastEnd, elapsed)
            : 0
        const scatter = launchPhase
          ? smoothstep(CORE_CONFIG.launch.silenceEnd, CORE_CONFIG.launch.blastEnd, elapsed) *
            (1 - smoothstep(0.27, CORE_CONFIG.launch.scatterEnd, elapsed))
          : 0
        const morph = launchPhase
          ? smoothstep(CORE_CONFIG.launch.morphStart, CORE_CONFIG.launch.morphEnd, elapsed)
          : 0
        const shockwaveProgress = launchPhase
          ? THREE.MathUtils.clamp(
            (elapsed - CORE_CONFIG.launch.blastEnd) /
            (CORE_CONFIG.launch.scatterEnd - CORE_CONFIG.launch.blastEnd),
            0,
            1,
          )
          : 1
        const dialProgress = current.status === 'COUNTDOWN_RUNNING'
          ? countdownProgress
          : launchPhase ? 1 : 0

        uniforms.uTime.value = frameTime * 0.001
        uniforms.uIntensity.value = intensity
        uniforms.uWarp.value = warp
        uniforms.uImplode.value = implode
        uniforms.uScatter.value = scatter
        uniforms.uMorph.value = morph
        bloom.strength = CORE_CONFIG.bloomStrength * (0.28 + intensity * 0.52)
        bloom.radius = CORE_CONFIG.bloomRadius
        postPass.uniforms.uTime.value = frameTime * 0.001
        postPass.uniforms.uChroma.value = CORE_CONFIG.post.baseAberration +
          CORE_CONFIG.post.maxAberration * (countdownProgress * 0.5 + (launchPhase ? 0.5 : 0))
        postPass.uniforms.uVignette.value = CORE_CONFIG.post.vignette
        postPass.uniforms.uGrain.value = CORE_CONFIG.post.grain

        const shake = current.status === 'COUNTDOWN_RUNNING'
          ? countdownProgress * 0.045
          : launchPhase && elapsed < 0.18 ? 0.07 * (1 - elapsed / 0.18) : 0
        core.position.x = shake ? Math.sin(frameTime * 0.082) * shake : 0
        core.position.y = shake ? Math.cos(frameTime * 0.097) * shake : 0
        core.rotation.z += deltaSeconds *
          (CORE_CONFIG.standbySpeed + countdownProgress * CORE_CONFIG.countdownSpeed)
        core.rotation.x = Math.sin(frameTime * 0.00023) * 0.045
        xEmblem.material.emissiveIntensity = 0.45 + intensity * 3
        flare.material.opacity = 0.045 + intensity * 0.12
        ringA.material.opacity = 0.12 + intensity * 0.12
        ringB.rotation.z = -frameTime * 0.00012
        ringC.rotation.z = frameTime * 0.00016
        rays.rotation.z = -frameTime * 0.00018
        hudGroup.rotation.z = -frameTime * 0.00011
        shockwave.visible = launchPhase && shockwaveProgress < 1
        shockwave.scale.setScalar(1 + shockwaveProgress * 13)
        shockwave.material.opacity = launchPhase ? (1 - shockwaveProgress) * 0.62 : 0
        const activeTicks = Math.round(dialProgress * CORE_CONFIG.hudTicks)
        if (activeTicks !== lastDialTicks) {
          updateTickDial(activeTicks)
          lastDialTicks = activeTicks
        }
        activeComposer.render()

        if (!reducedMotion.matches && scheduleNextFrame) {
          frame = window.requestAnimationFrame(render)
        }
      }
      drawRef.current = (frameTime) => render(frameTime, false)

      const start = () => {
        if (!visible() || disposed || frame) return
        if (reducedMotion.matches) {
          render(performance.now())
          return
        }
        frame = window.requestAnimationFrame(render)
      }
      const onVisibilityChange = () => {
        if (document.hidden) {
          if (frame) window.cancelAnimationFrame(frame)
          frame = 0
        } else {
          start()
        }
      }
      const onReducedMotionChange = () => {
        if (frame) window.cancelAnimationFrame(frame)
        frame = 0
        reducedMotionRef.current = reducedMotion.matches
        start()
      }
      const onWebglLost = (event: Event) => {
        event.preventDefault()
        unavailableRef.current()
        dispose()
      }

      window.addEventListener('resize', updateView)
      document.addEventListener('visibilitychange', onVisibilityChange)
      reducedMotion.addEventListener('change', onReducedMotionChange)
      canvas.addEventListener('webglcontextlost', onWebglLost)
      cleanups.push(
        () => window.removeEventListener('resize', updateView),
        () => document.removeEventListener('visibilitychange', onVisibilityChange),
        () => reducedMotion.removeEventListener('change', onReducedMotionChange),
        () => canvas.removeEventListener('webglcontextlost', onWebglLost),
      )
      start()

    } catch (error) {
      console.error('Launch core WebGL scene failed:', error)
      unavailableRef.current()
      dispose()
    }

    return dispose
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="launch-core-canvas" />
}

export { BOOT_LOG_LINES, CORE_CONFIG, LaunchCoreScene, easeOutExpo, smoothstep }
