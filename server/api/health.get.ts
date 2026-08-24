export default defineEventHandler(async () => {
  return {
    status: 'ok',
    time: new Date().toISOString(),
  };
});
