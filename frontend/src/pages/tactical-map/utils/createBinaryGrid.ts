export function createBinaryGrid(img: HTMLImageElement, gridSize: number): Uint8Array {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return new Uint8Array(gridSize * gridSize);
    }

    ctx.drawImage(img, 0, 0, gridSize, gridSize);

    const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
    const pixels = imageData.data;

    const grid = new Uint8Array(gridSize * gridSize);

    for (let i = 0; i < gridSize * gridSize; i++) {
        const r = pixels[i * 4];
        const g = pixels[i * 4 + 1];
        const b = pixels[i * 4 + 2];

        const brightness = (r + g + b) / 3;
        grid[i] = brightness > 128 ? 1 : 0;
    }

    return grid;
}
