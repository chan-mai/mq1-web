export default defineEventHandler(async (event) => {
  return {
    status: 'ok',
    time: new Date().toISOString(),
  }
});
