export const createBinaryGrid = (image, size) => {
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const grid = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i += 1) {
    grid[i] = data[i * 4] > 128 ? 1 : 0;
  }
  return grid;
};
