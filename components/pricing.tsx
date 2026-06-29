"use client";

import { Check, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { useSession } from "@/lib/auth-client";
import { getSubscriptionPlanDisplays } from "@/lib/billing-display";
import { cn } from "@/lib/utils";

type BillingTab = "monthly" | "yearly";

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul role="list" className="mt-7 space-y-3 text-sm leading-6">
      {features.map(feature => (
        <li key={feature} className="flex gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function Pricing() {
  const [active, setActive] = useState<BillingTab>("monthly");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const session = useSession();
  const router = useRouter();
  const t = useTranslations("pricing");
  const locale = useLocale();
  const userId = session.data?.user?.id;
  const plan = getSubscriptionPlanDisplays()[0];

  const startCheckout = useCallback(async () => {
    if (!plan) {
      setCheckoutError(t("errors.unavailable"));
      return;
    }
    if (!userId) {
      router.push(`/${locale}/signup`);
      return;
    }

    const selectedPlan = active === "monthly" ? plan.monthlyPlan : plan.yearlyPlan;
    setCheckoutError(null);
    try {
      const response = await fetch("/api/payments/creem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selectedPlan.key, kind: "subscription" }),
      });
      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || t("errors.checkout"));
      }
      window.location.href = payload.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : t("errors.checkout"));
    }
  }, [active, locale, plan, router, t, userId]);

  if (!plan) {
    return null;
  }

  const paidPrice = active === "monthly" ? plan.displayMonthlyPrice : plan.displayYearlyPrice;
  const paidPeriod = active === "monthly" ? t("period.month") : t("period.year");

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="mx-auto mb-10 grid w-fit grid-cols-2 rounded-md border border-border bg-muted p-1">
        {(["monthly", "yearly"] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={cn(
              "min-w-28 rounded px-4 py-2 text-sm font-medium transition",
              active === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`billing.${tab}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <article className="flex min-h-[430px] flex-col rounded-lg border border-border bg-card p-7 sm:p-9">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-foreground">{t("tiers.free.name")}</h3>
            <span className="text-xs font-medium text-muted-foreground">
              {t("tiers.free.badge")}
            </span>
          </div>
          <p className="mt-5 text-4xl font-semibold text-foreground">$0</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("tiers.free.description")}
          </p>
          <div className="text-muted-foreground">
            <FeatureList features={t.raw("tiers.free.features") as string[]} />
          </div>
          <Button
            type="button"
            variant="simple"
            onClick={() => router.push(userId ? `/${locale}/#try-on` : `/${locale}/signup`)}
            className="mt-auto w-full justify-center rounded-md border border-border py-3"
          >
            {t("tiers.free.cta")}
          </Button>
        </article>

        <article className="relative flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-primary bg-card p-7 shadow-2xl shadow-primary/10 sm:p-9">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-foreground">
              {t("tiers.clothcraft.name")}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("tiers.clothcraft.badge")}
            </span>
          </div>
          <p className="mt-5 text-4xl font-semibold text-foreground">
            {paidPrice}
            <span className="ml-2 text-sm font-normal text-muted-foreground">/{paidPeriod}</span>
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("tiers.clothcraft.description")}
          </p>
          <div className="text-muted-foreground">
            <FeatureList features={t.raw("tiers.clothcraft.features") as string[]} />
          </div>
          <Button
            type="button"
            onClick={startCheckout}
            className="mt-auto w-full justify-center rounded-md py-3"
          >
            {t("tiers.clothcraft.cta")}
          </Button>
        </article>
      </div>

      {checkoutError && (
        <p role="alert" className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
          {checkoutError}
        </p>
      )}
    </div>
  );
}
