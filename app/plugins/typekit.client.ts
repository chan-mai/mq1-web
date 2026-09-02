export default defineNuxtPlugin(() => {
  const config = {
    kitId: 'knf0bwf',
    scriptTimeout: 3000,
    async: true,
  };

  const h = document.documentElement;
  const t = setTimeout(() => {
    h.className = h.className.replace(/\bwf-loading\b/g, '') + ' wf-inactive';
  }, config.scriptTimeout);

  h.className += ' wf-loading';

  const tk = document.createElement('script');
  tk.src = `https://use.typekit.net/${config.kitId}.js`;
  tk.async = true;
  tk.onload = () => {
    clearTimeout(t);
    try {
      // @ts-expect-error Typekitは外部スクリプト由来
      Typekit.load(config);
    } catch {
      // 失敗時はフォールバックフォント
    }
  };

  const s = document.getElementsByTagName('script')[0];
  if (s && s.parentNode) {
    s.parentNode.insertBefore(tk, s);
  }
});
