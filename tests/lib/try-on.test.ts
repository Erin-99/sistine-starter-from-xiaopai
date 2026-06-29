import * as imageGeneration from "@/lib/image-generation";

type TryOnModule = typeof imageGeneration & {
  buildTryOnPrompt: (garmentCount: number) => string;
  createSeedreamTryOnRequest: (inputImages: string[], garmentCount: number) => {
    image: string[];
    model: string;
    output_format: "png";
    prompt: string;
    sequential_image_generation: "disabled";
    size: "2K";
    watermark: false;
  };
  getTryOnDayWindow: (now: Date) => { start: Date; end: Date };
  resolveTryOnPolicy: (hasActiveSubscription: boolean) => {
    dailyLimit: number;
    maxGarments: number;
    tier: "free" | "paid";
    watermark: boolean;
  };
  validateTryOnInput: (input: {
    garmentImages: string[];
    hasActiveSubscription: boolean;
    modelImage: string;
  }) => { garmentImages: string[]; modelImage: string };
};

const tryOn = imageGeneration as TryOnModule;
const PNG_DATA_URL = "data:image/png;base64,aGVsbG8=";
const JPEG_DATA_URL = "data:image/jpeg;base64,d29ybGQ=";

describe("virtual try-on rules", () => {
  it("uses the free and paid limits defined by the product", () => {
    expect(typeof tryOn.resolveTryOnPolicy).toBe("function");

    expect(tryOn.resolveTryOnPolicy(false)).toEqual({
      dailyLimit: 3,
      maxGarments: 1,
      tier: "free",
      watermark: true,
    });
    expect(tryOn.resolveTryOnPolicy(true)).toEqual({
      dailyLimit: 20,
      maxGarments: 3,
      tier: "paid",
      watermark: false,
    });
  });

  it("validates lowercase Base64 image data URLs and garment limits", () => {
    expect(typeof tryOn.validateTryOnInput).toBe("function");

    expect(
      tryOn.validateTryOnInput({
        modelImage: PNG_DATA_URL,
        garmentImages: [JPEG_DATA_URL],
        hasActiveSubscription: false,
      })
    ).toEqual({
      modelImage: PNG_DATA_URL,
      garmentImages: [JPEG_DATA_URL],
    });

    expect(() =>
      tryOn.validateTryOnInput({
        modelImage: PNG_DATA_URL,
        garmentImages: [JPEG_DATA_URL, PNG_DATA_URL],
        hasActiveSubscription: false,
      })
    ).toThrow("Free users can upload 1 garment image");

    expect(() =>
      tryOn.validateTryOnInput({
        modelImage: "data:image/PNG;base64,aGVsbG8=",
        garmentImages: [JPEG_DATA_URL],
        hasActiveSubscription: true,
      })
    ).toThrow("modelImage must be a lowercase PNG, JPEG, or WebP Base64 data URL");
  });

  it("builds the exact Seedream multi-image request", () => {
    expect(typeof tryOn.createSeedreamTryOnRequest).toBe("function");

    const request = tryOn.createSeedreamTryOnRequest(
      [PNG_DATA_URL, JPEG_DATA_URL],
      1
    );

    expect(request).toMatchObject({
      model: "doubao-seedream-5-0-260128",
      image: [PNG_DATA_URL, JPEG_DATA_URL],
      sequential_image_generation: "disabled",
      size: "2K",
      output_format: "png",
      watermark: false,
    });
    expect(request.prompt).toContain("图1");
    expect(request.prompt).toContain("图2");
  });

  it("resets at midnight in US Eastern time across standard and daylight time", () => {
    expect(typeof tryOn.getTryOnDayWindow).toBe("function");

    expect(tryOn.getTryOnDayWindow(new Date("2026-01-15T12:00:00.000Z"))).toEqual({
      start: new Date("2026-01-15T05:00:00.000Z"),
      end: new Date("2026-01-16T05:00:00.000Z"),
    });
    expect(tryOn.getTryOnDayWindow(new Date("2026-07-15T12:00:00.000Z"))).toEqual({
      start: new Date("2026-07-15T04:00:00.000Z"),
      end: new Date("2026-07-16T04:00:00.000Z"),
    });
  });
});
