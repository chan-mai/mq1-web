import type { Ref } from 'vue';

// data-fill-in/data-fade-inのスクロール出現演出
// data-fill-delay/data-fade-delay: 秒単位の時差
export function useRevealAnimations(scope: Ref<HTMLElement | null>) {
  let ctx: { revert: () => void } | undefined;
  let removeBands: (() => void) | undefined;

  onMounted(async () => {
    if (!scope.value) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    const { CustomEase } = await import('gsap/CustomEase');
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create('sweep', 'M0,0 C0.77,0 0.18,1 1,1');
    const bands: HTMLElement[] = [];
    ctx = gsap.context(() => {
      const root = scope.value!;
      // 初期表示範囲内は文書位置順の時差で発火
      const orderDelay = (target: HTMLElement) => {
        const top = target.getBoundingClientRect().top;
        return top < window.innerHeight
          ? (Math.max(0, top) / window.innerHeight) * 0.5
          : 0;
      };
      // 帯が要素をスイープして中身が現れる
      root.querySelectorAll<HTMLElement>('[data-fill-in]').forEach((target) => {
        if (getComputedStyle(target).position === 'static')
          target.style.position = 'relative';
        target.style.overflow = 'hidden';
        const band = document.createElement('span');
        band.setAttribute('aria-hidden', 'true');
        Object.assign(band.style, {
          position: 'absolute',
          inset: '0',
          backgroundColor: '#f57aa5',
          pointerEvents: 'none',
        });
        target.appendChild(band);
        bands.push(band);
        const inner = Array.from(target.children).filter(
          (child) => child !== band,
        );
        gsap.set(band, { xPercent: -101 });
        gsap.set(inner, { autoAlpha: 0 });
        const tl = gsap.timeline({
          delay: Number(target.dataset.fillDelay ?? 0) + orderDelay(target),
          scrollTrigger: { trigger: target, start: 'top 90%', once: true },
        });
        tl.to(band, { xPercent: 0, duration: 0.45, ease: 'sweep' })
          .set(inner, { autoAlpha: 1 })
          .to(band, { xPercent: 101, duration: 0.45, ease: 'sweep' }, '+=0.1')
          // 掃了後は帯を消しはみ出す装飾のクリップも解除
          .set(band, { display: 'none' })
          .set(target, { clearProps: 'overflow' });
      });
      // 控えめなフェード上昇
      root.querySelectorAll<HTMLElement>('[data-fade-in]').forEach((target) => {
        gsap.from(target, {
          y: 18,
          autoAlpha: 0,
          duration: 0.8,
          delay: Number(target.dataset.fadeDelay ?? 0) + orderDelay(target),
          ease: 'power2.out',
          scrollTrigger: { trigger: target, start: 'top 90%', once: true },
        });
      });
    }, scope.value);
    removeBands = () => bands.forEach((band) => band.remove());
  });

  onUnmounted(() => {
    ctx?.revert();
    removeBands?.();
  });
}
