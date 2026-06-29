"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Shirt,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type TryOnStatus = {
  dailyLimit: number;
  maxGarments: number;
  remaining: number;
  tier: "free" | "paid";
  used: number;
  watermark: boolean;
};

const FREE_STATUS: TryOnStatus = {
  dailyLimit: 3,
  maxGarments: 1,
  remaining: 3,
  tier: "free",
  used: 0,
  watermark: true,
};

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read image ${file.name}`));
    reader.readAsDataURL(file);
  });
}

type UploadSurfaceProps = {
  alt: string;
  ariaLabel: string;
  className?: string;
  icon: React.ReactNode;
  image: string | null;
  onChoose: () => void;
  onRemove?: () => void;
  removeLabel: string;
};

function UploadSurface({
  alt,
  ariaLabel,
  className,
  icon,
  image,
  onChoose,
  onRemove,
  removeLabel,
}: UploadSurfaceProps) {
  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden rounded-md border border-dashed border-border bg-muted/40",
        className
      )}
    >
      {image ? (
        <>
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 30vw"
            unoptimized
            className="object-contain"
          />
          <button
            type="button"
            aria-label={ariaLabel}
            onClick={onChoose}
            className="absolute inset-0 z-10 bg-black/0 transition-colors hover:bg-black/10"
          />
          {onRemove && (
            <button
              type="button"
              aria-label={removeLabel}
              onClick={onRemove}
              className="absolute right-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={onChoose}
          className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm">
            {icon}
          </span>
          <span className="text-sm font-semibold text-foreground">{ariaLabel}</span>
          <span className="text-xs">PNG · JPEG · WebP</span>
        </button>
      )}
    </div>
  );
}

export function Hero() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("hero");
  const session = useSession();
  const modelInput = useRef<HTMLInputElement>(null);
  const garmentInputs = useRef<Array<HTMLInputElement | null>>([]);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [garmentImages, setGarmentImages] = useState<Array<string | null>>([null]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<TryOnStatus>(FREE_STATUS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session.data?.user?.id;

  useEffect(() => {
    if (!userId) {
      setStatus(FREE_STATUS);
      setGarmentImages([null]);
      return;
    }

    let cancelled = false;
    void fetch("/api/try-on", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Try-on status request failed with ${response.status}`);
        }
        return (await response.json()) as TryOnStatus;
      })
      .then(nextStatus => {
        if (cancelled) return;
        setStatus(nextStatus);
        setGarmentImages(current =>
          Array.from(
            { length: nextStatus.maxGarments },
            (_, index) => current[index] ?? null
          )
        );
      })
      .catch(statusError => {
        console.error("Failed to load try-on status:", statusError);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function requireLogin() {
    if (userId) return true;
    router.push(`/${locale}/login`);
    return false;
  }

  async function readSelectedImage(file: File) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error(t("tryOn.errors.fileType"));
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(t("tryOn.errors.fileSize"));
    }

    return readImageAsDataUrl(file);
  }

  async function selectModelImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setError(null);
      setModelImage(await readSelectedImage(file));
      setResultImage(null);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : t("tryOn.errors.fileType"));
    }
  }

  async function selectGarmentImage(
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setError(null);
      const image = await readSelectedImage(file);
      setGarmentImages(current =>
        current.map((currentImage, currentIndex) =>
          currentIndex === index ? image : currentImage
        )
      );
      setResultImage(null);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : t("tryOn.errors.fileType"));
    }
  }

  async function generateTryOn() {
    if (!requireLogin()) return;

    const selectedGarments = garmentImages.filter(
      (image): image is string => Boolean(image)
    );
    if (!modelImage || selectedGarments.length === 0) {
      setError(t("tryOn.errors.missingImages"));
      return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelImage,
          garmentImages: selectedGarments,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        remaining?: number;
        url?: string;
      };

      if (response.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || t("tryOn.errors.generation"));
      }

      setResultImage(payload.url);
      if (typeof payload.remaining === "number") {
        setStatus(current => ({
          ...current,
          remaining: payload.remaining as number,
          used: current.dailyLimit - (payload.remaining as number),
        }));
      }
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : t("tryOn.errors.generation")
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section id="try-on" className="relative min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("description")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
          className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-primary/10"
        >
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Shirt className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {status.tier === "paid" ? t("tryOn.paidNote") : t("tryOn.freeNote")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {userId
                    ? t("tryOn.remaining", {
                        remaining: status.remaining,
                        limit: status.dailyLimit,
                      })
                    : t("tryOn.signIn")}
                </p>
              </div>
            </div>
            {!userId && (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <LockKeyhole className="h-4 w-4" />
                {t("tryOn.signIn")}
              </span>
            )}
          </div>

          <div className="grid lg:grid-cols-[0.9fr_1.1fr_1fr]">
            <div className="border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  {t("tryOn.model.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("tryOn.model.description")}
                </p>
              </div>
              <input
                ref={modelInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={selectModelImage}
              />
              <UploadSurface
                alt={t("tryOn.model.alt")}
                ariaLabel={modelImage ? t("tryOn.model.replace") : t("tryOn.model.upload")}
                icon={<UserRound className="h-5 w-5" />}
                image={modelImage}
                onChoose={() => {
                  if (requireLogin()) modelInput.current?.click();
                }}
                onRemove={modelImage ? () => setModelImage(null) : undefined}
                removeLabel={t("tryOn.remove")}
                className="aspect-[3/4] w-full lg:aspect-auto lg:h-[400px]"
              />
            </div>

            <div className="border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  {t("tryOn.garments.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("tryOn.garments.description")}
                </p>
              </div>
              <div
                className={cn(
                  "grid gap-3",
                  status.maxGarments === 1 ? "grid-cols-1" : "grid-cols-3"
                )}
              >
                {garmentImages.map((image, index) => (
                  <div key={index}>
                    <input
                      ref={element => {
                        garmentInputs.current[index] = element;
                      }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={event => selectGarmentImage(index, event)}
                    />
                    <UploadSurface
                      alt={`${t("tryOn.garments.alt")} ${index + 1}`}
                      ariaLabel={image ? t("tryOn.garments.replace") : t("tryOn.garments.upload")}
                      icon={
                        image ? (
                          <Upload className="h-5 w-5" />
                        ) : (
                          <ImagePlus className="h-5 w-5" />
                        )
                      }
                      image={image}
                      onChoose={() => {
                        if (requireLogin()) garmentInputs.current[index]?.click();
                      }}
                      onRemove={
                        image
                          ? () =>
                              setGarmentImages(current =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index ? null : item
                                )
                              )
                          : undefined
                      }
                      removeLabel={t("tryOn.remove")}
                      className={cn(
                        "aspect-[3/4] w-full",
                        status.maxGarments === 1 && "max-w-sm lg:h-[400px] lg:max-w-none lg:aspect-auto"
                      )}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Button
                  type="button"
                  onClick={generateTryOn}
                  disabled={isGenerating || (Boolean(userId) && status.remaining === 0)}
                  className="w-full justify-center rounded-md py-3"
                >
                  {isGenerating ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {t("tryOn.generating")}
                    </>
                  ) : userId ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t("tryOn.generate")}
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      {t("tryOn.signIn")}
                    </>
                  )}
                </Button>
                {error && (
                  <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {t("tryOn.result.title")}
                </h2>
                {resultImage && (
                  <a
                    href={resultImage}
                    download="clothcraft-try-on.png"
                    aria-label={t("tryOn.result.download")}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-border bg-muted/40 lg:h-[400px] lg:aspect-auto">
                {resultImage ? (
                  <Image
                    src={resultImage}
                    alt={t("tryOn.result.alt")}
                    fill
                    sizes="(max-width: 1024px) 100vw, 32vw"
                    unoptimized
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-muted-foreground">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
                      {isGenerating ? (
                        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <Shirt className="h-6 w-6 text-primary" />
                      )}
                    </span>
                    <p className="max-w-52 text-sm leading-6">
                      {isGenerating ? t("tryOn.generating") : t("tryOn.result.empty")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
