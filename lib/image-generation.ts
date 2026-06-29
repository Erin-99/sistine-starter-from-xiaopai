type CreateImageGenerationPayloadParams = {
  imageUrl?: string | null;
  prompt: string;
  size: "adaptive" | "1K" | "2K" | "4K";
  watermark: boolean;
};

const TRY_ON_TIME_ZONE = "America/New_York";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const BASE64_IMAGE_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export type TryOnPolicy = {
  dailyLimit: number;
  maxGarments: number;
  tier: "free" | "paid";
  watermark: boolean;
};

type ValidateTryOnInputParams = {
  garmentImages: string[];
  hasActiveSubscription: boolean;
  modelImage: string;
};

type TimeZoneDateParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
};

export function createImageGenerationPayload({
  imageUrl,
  prompt,
  size,
  watermark,
}: CreateImageGenerationPayloadParams) {
  if (!imageUrl) {
    throw new Error("Reference image is required");
  }

  return {
    imageUrl,
    prompt,
    size,
    watermark,
  };
}

export function resolveTryOnPolicy(hasActiveSubscription: boolean): TryOnPolicy {
  if (hasActiveSubscription) {
    return {
      dailyLimit: 20,
      maxGarments: 3,
      tier: "paid",
      watermark: false,
    };
  }

  return {
    dailyLimit: 3,
    maxGarments: 1,
    tier: "free",
    watermark: true,
  };
}

function validateBase64Image(image: string, fieldName: string) {
  if (!BASE64_IMAGE_PATTERN.test(image)) {
    throw new Error(
      `${fieldName} must be a lowercase PNG, JPEG, or WebP Base64 data URL`
    );
  }

  const base64 = image.slice(image.indexOf(",") + 1);
  const paddingBytes = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const byteLength = (base64.length * 3) / 4 - paddingBytes;
  if (byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`${fieldName} must be 10MB or smaller`);
  }
}

export function validateTryOnInput({
  garmentImages,
  hasActiveSubscription,
  modelImage,
}: ValidateTryOnInputParams) {
  const policy = resolveTryOnPolicy(hasActiveSubscription);

  validateBase64Image(modelImage, "modelImage");

  if (garmentImages.length === 0) {
    throw new Error("At least 1 garment image is required");
  }
  if (garmentImages.length > policy.maxGarments) {
    const userType = policy.tier === "free" ? "Free" : "Paid";
    throw new Error(
      `${userType} users can upload ${policy.maxGarments} garment image${policy.maxGarments === 1 ? "" : "s"}`
    );
  }

  garmentImages.forEach((image, index) => {
    validateBase64Image(image, `garmentImages[${index}]`);
  });

  return { modelImage, garmentImages };
}

export function buildTryOnPrompt(garmentCount: number) {
  if (!Number.isInteger(garmentCount) || garmentCount < 1 || garmentCount > 3) {
    throw new Error(`garmentCount must be an integer from 1 to 3, received ${garmentCount}`);
  }

  const garmentReferences = Array.from(
    { length: garmentCount },
    (_, index) => `图${index + 2}`
  ).join("、");

  return `将${garmentReferences}中的服装自然地穿到图1的模特身上。完整保留图1人物的面部、发型、体型、姿势、手部、背景、构图和光线；准确保留服装的版型、材质、颜色、纹理、图案与层次关系。根据人体姿态调整衣物褶皱、遮挡和阴影，生成真实、合身、可用于时尚展示的试穿效果。不要改变人物身份，不要添加多余服装、配饰、文字或边框。`;
}

export function createSeedreamTryOnRequest(
  inputImages: string[],
  garmentCount: number
) {
  if (inputImages.length !== garmentCount + 1) {
    throw new Error(
      `Expected ${garmentCount + 1} input images, received ${inputImages.length}`
    );
  }

  return {
    model: "doubao-seedream-5-0-260128",
    prompt: buildTryOnPrompt(garmentCount),
    image: inputImages,
    sequential_image_generation: "disabled" as const,
    size: "2K" as const,
    output_format: "png" as const,
    watermark: false as const,
  };
}

function getTimeZoneDateParts(date: Date): TimeZoneDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: TRY_ON_TIME_ZONE,
    year: "numeric",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  );

  return parts as TimeZoneDateParts;
}

function getTimeZoneOffset(date: Date) {
  const parts = getTimeZoneDateParts(date);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return representedAsUtc - date.getTime();
}

function easternMidnightToUtc(year: number, month: number, day: number) {
  const localTimeAsUtc = Date.UTC(year, month - 1, day);
  let candidate = new Date(localTimeAsUtc);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    candidate = new Date(localTimeAsUtc - getTimeZoneOffset(candidate));
  }

  return candidate;
}

export function getTryOnDayWindow(now: Date) {
  if (Number.isNaN(now.getTime())) {
    throw new Error(`now must be a valid date, received ${String(now)}`);
  }

  const currentDate = getTimeZoneDateParts(now);
  const nextCalendarDay = new Date(
    Date.UTC(currentDate.year, currentDate.month - 1, currentDate.day + 1)
  );

  return {
    start: easternMidnightToUtc(
      currentDate.year,
      currentDate.month,
      currentDate.day
    ),
    end: easternMidnightToUtc(
      nextCalendarDay.getUTCFullYear(),
      nextCalendarDay.getUTCMonth() + 1,
      nextCalendarDay.getUTCDate()
    ),
  };
}
