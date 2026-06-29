import sharp from "sharp";
import * as watermarkModule from "@/lib/try-on-watermark";

type WatermarkModule = typeof watermarkModule & {
  applyClothCraftWatermark: (image: Buffer) => Promise<Buffer>;
};

const watermark = watermarkModule as WatermarkModule;

describe("applyClothCraftWatermark", () => {
  it("adds visible pixels while preserving the image dimensions", async () => {
    expect(typeof watermark.applyClothCraftWatermark).toBe("function");

    const source = await sharp({
      create: {
        width: 600,
        height: 800,
        channels: 4,
        background: "#ffffff",
      },
    })
      .png()
      .toBuffer();

    const result = await watermark.applyClothCraftWatermark(source);
    const metadata = await sharp(result).metadata();
    const statistics = await sharp(result).stats();

    expect(metadata.width).toBe(600);
    expect(metadata.height).toBe(800);
    expect(statistics.channels.some(channel => channel.stdev > 0)).toBe(true);
  });
});
