export default defineNuxtPlugin((nuxtApp) => {
  
  const { start, finish } = useLoadingIndicator();

  nuxtApp.hook("page:start", () => {
    console.log("page:start");
    start({ force: true });
  });
  nuxtApp.hook("page:finish", () => {
    console.log("page:finish");
    finish({ force: true });
  });
});
