import { randomUUID } from "crypto";
import {
  and,
  count,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getActiveSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generationHistory, subscription } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import {
  buildTryOnPrompt,
  getTryOnDayWindow,
  resolveTryOnPolicy,
  type TryOnPolicy,
  validateTryOnInput,
} from "@/lib/image-generation";
import { uploadImageBuffer, uploadImageFromUrl } from "@/lib/r2-storage";
import { applyClothCraftWatermark } from "@/lib/try-on-watermark";
import { volcanoEngine } from "@/lib/volcano-engine";

export const dynamic = "force-dynamic";

type TryOnRequestBody = {
  garmentImages?: unknown;
  modelImage?: unknown;
};

async function hasActivePaidSubscription(userId: string, now: Date) {
  const activeSubscriptions = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        eq(subscription.status, "active"),
        or(
          isNull(subscription.currentPeriodEnd),
          gt(subscription.currentPeriodEnd, now)
        )
      )
    )
    .limit(1);

  return activeSubscriptions.length > 0;
}

function tryOnUsageFilters(userId: string, now: Date) {
  const { start, end } = getTryOnDayWindow(now);

  return and(
    eq(generationHistory.userId, userId),
    eq(generationHistory.type, "try_on"),
    inArray(generationHistory.status, ["processing", "completed"]),
    gte(generationHistory.createdAt, start),
    lt(generationHistory.createdAt, end)
  );
}

async function getTodayUsage(userId: string, now: Date) {
  const rows = await db
    .select({ total: count() })
    .from(generationHistory)
    .where(tryOnUsageFilters(userId, now));

  return rows[0]?.total ?? 0;
}

async function reserveTryOnUsage(
  userId: string,
  policy: TryOnPolicy,
  garmentCount: number,
  now: Date
) {
  return db.transaction(async transaction => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`try_on:${userId}`}))`
    );

    const rows = await transaction
      .select({ total: count() })
      .from(generationHistory)
      .where(tryOnUsageFilters(userId, now));
    const used = rows[0]?.total ?? 0;

    if (used >= policy.dailyLimit) {
      return { historyId: null, used };
    }

    const historyId = randomUUID();
    await transaction.insert(generationHistory).values({
      id: historyId,
      userId,
      type: "try_on",
      prompt: buildTryOnPrompt(garmentCount),
      status: "processing",
      creditsUsed: 0,
      metadata: JSON.stringify({
        feature: "try_on",
        garmentCount,
        tier: policy.tier,
        watermark: policy.watermark,
      }),
    });

    return { historyId, used: used + 1 };
  });
}

export async function GET(request: NextRequest) {
  const access = await getActiveSessionUser(request.headers);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = new Date();
  const hasPaidSubscription = await hasActivePaidSubscription(access.user.id, now);
  const policy = resolveTryOnPolicy(hasPaidSubscription);
  const used = await getTodayUsage(access.user.id, now);

  return NextResponse.json({
    ...policy,
    used,
    remaining: Math.max(0, policy.dailyLimit - used),
  });
}

export async function POST(request: NextRequest) {
  const access = await getActiveSessionUser(request.headers);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const now = new Date();
  const hasPaidSubscription = await hasActivePaidSubscription(access.user.id, now);
  const policy = resolveTryOnPolicy(hasPaidSubscription);
  let historyId: string | null = null;

  try {
    const body = (await request.json()) as TryOnRequestBody;
    if (typeof body.modelImage !== "string" || !Array.isArray(body.garmentImages)) {
      return NextResponse.json(
        { error: "modelImage and garmentImages are required" },
        { status: 400 }
      );
    }

    const input = validateTryOnInput({
      modelImage: body.modelImage,
      garmentImages: body.garmentImages.filter(
        (image): image is string => typeof image === "string"
      ),
      hasActiveSubscription: hasPaidSubscription,
    });
    if (input.garmentImages.length !== body.garmentImages.length) {
      return NextResponse.json(
        { error: "Every garment image must be a Base64 data URL" },
        { status: 400 }
      );
    }

    const reservation = await reserveTryOnUsage(
      access.user.id,
      policy,
      input.garmentImages.length,
      now
    );
    historyId = reservation.historyId;

    if (!historyId) {
      return NextResponse.json(
        {
          error: "Daily try-on limit reached",
          dailyLimit: policy.dailyLimit,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const generation = await volcanoEngine.generateTryOnImage([
      input.modelImage,
      ...input.garmentImages,
    ]);
    const generatedImage = generation.data?.[0];
    if (!generatedImage?.url) {
      throw new Error("Seedream returned no generated image URL");
    }

    let resultUrl: string;
    if (policy.watermark) {
      const imageResponse = await fetch(generatedImage.url, { cache: "no-store" });
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to download generated image for watermarking: ${imageResponse.status}`
        );
      }
      const generatedBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const watermarkedBuffer = await applyClothCraftWatermark(generatedBuffer);
      resultUrl = await uploadImageBuffer(
        watermarkedBuffer,
        access.user.id,
        "image/png"
      );
    } else {
      resultUrl = await uploadImageFromUrl(
        generatedImage.url,
        access.user.id,
        "image"
      );
    }

    await db
      .update(generationHistory)
      .set({
        resultUrl,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(generationHistory.id, historyId));

    return NextResponse.json({
      id: historyId,
      url: resultUrl,
      tier: policy.tier,
      watermark: policy.watermark,
      remaining: Math.max(0, policy.dailyLimit - reservation.used),
    });
  } catch (error) {
    if (historyId) {
      await db
        .update(generationHistory)
        .set({
          error: getErrorMessage(error, "Try-on generation failed"),
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(generationHistory.id, historyId));
    }

    const message = getErrorMessage(error, "Try-on generation failed");
    const isValidationError =
      error instanceof SyntaxError ||
      message.includes("Base64 data URL") ||
      message.includes("garment image") ||
      message.includes("10MB or smaller");

    console.error("Try-on API error:", error);
    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
