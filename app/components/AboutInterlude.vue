<script setup lang="ts">
const itlPin = ref<HTMLElement | null>(null);
const itlCanvas = ref<HTMLCanvasElement | null>(null);
const itlPct = ref<HTMLElement | null>(null);
const itlBgLayer = ref<HTMLElement | null>(null);
const itlTypo = ref<HTMLElement | null>(null);
let itlCleanup: (() => void) | undefined;

onMounted(async () => {
  if (!itlPin.value || !itlCanvas.value) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafId = 0;

  // インタールード(浮遊する傘の回廊+分散タイポ)
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const itlRenderer = new THREE.WebGLRenderer({
    canvas: itlCanvas.value!,
    alpha: true,
    antialias: true,
  });
  itlRenderer.setClearColor(0x000000, 0);
  const itlScene = new THREE.Scene();
  const itlCam = new THREE.PerspectiveCamera(60, 1, 0.1, 160);
  itlCam.position.set(0, 0, 8);
  const makeMat = (color: [number, number, number]) =>
    new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: { uColor: { value: new THREE.Color(...color) } },
      vertexShader: `
        varying float vViewZ;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewZ = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vViewZ;

        void main() {
          // 遠景ほど背景へフェード
          float depthFade = 1.0 - smoothstep(22.0, 65.0, vViewZ);
          gl_FragColor = vec4(uColor, depthFade);
        }
      `,
    });
  const umbrellaMat = makeMat([0.95, 0.64, 0.73]);
  const sparkleMat = makeMat([0.84, 0.42, 0.55]);
  let tunnelRoot: InstanceType<typeof THREE.Group> | null = null;
  const itlGltfLoader = new GLTFLoader();
  itlGltfLoader.load('/models/tunnel.glb?v=14', (gltf) => {
    tunnelRoot = gltf.scene;
    gltf.scene.traverse((node) => {
      const mesh = node as InstanceType<typeof THREE.Mesh>;
      if (mesh.isMesh) {
        mesh.material = mesh.name.includes('sparkles')
          ? sparkleMat
          : umbrellaMat;
      }
    });
    gltf.scene.rotation.x = Math.PI / 2;
    gltf.scene.position.z = -14;
    itlScene.add(gltf.scene);
  });

  let itlSmooth = 0;
  const itlTick = () => {
    if (!itlPin.value || !itlCanvas.value) return;
    const rect = itlPin.value.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = itlPin.value.offsetHeight - vh;
    const progress =
      total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
    // 進入率でモデル先行フェード
    const pre = Math.max(0, Math.min(1, 1 - rect.top / vh));
    itlCanvas.value.style.opacity = pre.toFixed(3);
    // 画面占有後にスクロール進度で転調
    const entry = Math.max(0, Math.min(1, progress / 0.15));
    if (itlBgLayer.value) itlBgLayer.value.style.opacity = entry.toFixed(3);
    const typoIn = Math.max(0, Math.min(1, (progress - 0.04) / 0.14));
    // 終端は文字のみフェード
    const exit = Math.max(0, Math.min(1, (progress - 0.88) / 0.12));
    if (itlTypo.value)
      itlTypo.value.style.opacity = (typoIn * (1 - exit)).toFixed(3);
    if (itlPct.value) {
      itlPct.value.textContent = `TRANSITION ${String(Math.round(progress * 100)).padStart(3, '0')}%`;
      itlPct.value.style.opacity = (1 - exit).toFixed(3);
    }
    // 画面外では描画停止
    if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) return;
    const cv = itlCanvas.value;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.round(cv.clientWidth * dpr);
    const h = Math.round(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h) {
      itlRenderer.setSize(w, h, false);
      itlCam.aspect = w / h;
      itlCam.updateProjectionMatrix();
    }
    itlSmooth += (progress - itlSmooth) * 0.06;
    // 終端で最終傘を通過して抜ける移動量
    itlCam.position.z = 24 - itlSmooth * 72;
    itlCam.rotation.z = reduced ? 0 : itlSmooth * 2;
    itlRenderer.render(itlScene, itlCam);
  };

  const loop = () => {
    itlTick();
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  itlCleanup = () => {
    cancelAnimationFrame(rafId);
    tunnelRoot?.traverse((node) => {
      const mesh = node as InstanceType<typeof THREE.Mesh>;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    umbrellaMat.dispose();
    sparkleMat.dispose();
    itlRenderer.dispose();
  };
});

onUnmounted(() => itlCleanup?.());
</script>

<template>
  <section class="relative">
    <div ref="itlPin" class="relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] h-[520vh]">
      <!-- 進入に比例して転調する背景 -->
      <div ref="itlBgLayer" class="absolute inset-0 bg-[#f2e6e7] opacity-0 dark:bg-primary/5" aria-hidden="true"></div>
      <div class="pointer-events-none sticky top-0 h-dvh min-h-[480px] overflow-hidden">
        <div class="absolute inset-0" aria-hidden="true">
          <canvas ref="itlCanvas" class="absolute inset-0 h-full w-full"></canvas>
          <div ref="itlTypo" class="absolute inset-0 opacity-0">
            <p
              class="font-futura absolute left-[5vw] top-[16vh] text-[11vw] font-semibold uppercase leading-none tracking-tight text-fg md:text-[7.5vw]">
              Engineer
            </p>
            <p
              class="font-futura absolute right-[8vw] top-[44vh] text-[6vw] font-semibold uppercase text-transparent [-webkit-text-stroke:1.2px_rgba(224,86,127,0.75)] md:text-[3.2vw]">
              (&nbsp;&&nbsp;)
            </p>
            <p
              class="font-futura absolute bottom-[12vh] left-[5vw] text-[8vw] font-semibold uppercase leading-none tracking-tight text-accent md:text-[5.5vw]">
              Video Director
            </p>
          </div>
          <p ref="itlPct"
            class="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] text-fg-muted/70">
            TRANSITION 000%
          </p>
        </div>
      </div>
    </div>

    <!-- 事業内容 -->
    <div class="relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] bg-[#f2e6e7] dark:bg-primary/5">
      <div class="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <!-- 大型ステートメント -->
        <section>
          <h3 data-fill-in class="w-fit text-xs font-semibold uppercase tracking-[0.3em] text-fg-muted">
            <span>What I Do</span>
          </h3>
          <p class="mt-8 max-w-[60rem] text-2xl font-light leading-snug tracking-wide text-fg md:mt-10 md:text-4xl">
            <span data-fill-in class="block w-fit">
              <span>フルスタック<span class="align-top text-xl text-accent">?</span>エンジニア&nbsp;/&nbsp;映像作家</span>
            </span>
            <span data-fill-in data-fill-delay="0.15" class="block w-fit">
              <span>ソフトウェアからインフラ、映像まで。</span>
            </span>
            <span data-fill-in data-fill-delay="0.3" class="block w-fit">
              <span>設計し、つくり、育てるところまで手がけています。</span>
            </span>
          </p>
          <p class="mt-6 text-xs leading-relaxed text-fg-muted md:mt-8">
            <span data-fade-in class="block">Full-stack? engineer / video director.</span>
            <span data-fade-in data-fade-delay="0.1" class="block">From software to infrastructure and video,</span>
            <span data-fade-in data-fade-delay="0.2" class="block">I design, build, and keep them growing.</span>
          </p>
        </section>
      </div>
    </div>
  </section>
</template>
