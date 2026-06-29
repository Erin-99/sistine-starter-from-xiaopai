import sharp from "sharp";

export async function applyClothCraftWatermark(image: Buffer) {
  const metadata = await sharp(image).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Generated image dimensions are unavailable for watermarking");
  }

  const horizontalInset = Math.max(24, Math.round(metadata.width * 0.025));
  const verticalInset = Math.max(24, Math.round(metadata.height * 0.025));
  const overlayWidth = Math.min(
    Math.max(180, Math.round(metadata.width * 0.28)),
    metadata.width - horizontalInset * 2
  );
  const overlayHeight = Math.max(54, Math.round(overlayWidth * 0.28));
  const fontSize = Math.max(20, Math.round(overlayWidth * 0.125));
  const overlay = Buffer.from(`
    <svg width="${overlayWidth}" height="${overlayHeight}" viewBox="0 0 ${overlayWidth} ${overlayHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${overlayWidth}" height="${overlayHeight}" rx="${Math.round(overlayHeight * 0.18)}" fill="#10271f" fill-opacity="0.78"/>
      <circle cx="${Math.round(overlayHeight * 0.5)}" cy="${Math.round(overlayHeight * 0.5)}" r="${Math.round(overlayHeight * 0.2)}" fill="#a7f3d0"/>
      <path d="M ${Math.round(overlayHeight * 0.42)} ${Math.round(overlayHeight * 0.5)} L ${Math.round(overlayHeight * 0.49)} ${Math.round(overlayHeight * 0.58)} L ${Math.round(overlayHeight * 0.61)} ${Math.round(overlayHeight * 0.4)}" fill="none" stroke="#10271f" stroke-width="${Math.max(2, Math.round(overlayHeight * 0.04))}" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${Math.round(overlayHeight * 0.9)}" y="50%" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700">ClothCraft</text>
    </svg>
  `);

  return sharp(image)
    .composite([
      {
        input: overlay,
        left: metadata.width - overlayWidth - horizontalInset,
        top: metadata.height - overlayHeight - verticalInset,
      },
    ])
    .png()
    .toBuffer();
}
