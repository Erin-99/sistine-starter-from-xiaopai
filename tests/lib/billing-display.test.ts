import {
  DEFAULT_ONE_TIME_PACK_KEY,
  getDefaultOneTimePack,
  getSubscriptionPlanDisplays,
  MARKETING_SUBSCRIPTION_PLAN_FAMILIES,
} from "@/lib/billing-display";

describe("getDefaultOneTimePack", () => {
  it("returns the configured default pack key", () => {
    expect(DEFAULT_ONE_TIME_PACK_KEY).toBe("pack_200");
  });

  it("returns the pack values from billing config", () => {
    expect(getDefaultOneTimePack()).toEqual({
      key: "pack_200",
      pack: {
        key: "pack_200",
        kind: "one_time",
        priceCents: 500,
        currency: "usd",
        credits: 200,
        creemPriceId: "prod_3SiroZeMbMQidMVFDMUzKy",
      },
      displayCredits: "200",
      displayPrice: "$5",
    });
  });
});

describe("getSubscriptionPlanDisplays", () => {
  it("only exposes subscription families that exist in billing config", () => {
    expect(MARKETING_SUBSCRIPTION_PLAN_FAMILIES).toEqual([
      {
        id: "clothcraft",
        monthlyKey: "clothcraft_monthly",
        yearlyKey: "clothcraft_yearly",
        featured: true,
      },
    ]);
  });

  it("derives marketing prices and credits from the real billing plans", () => {
    expect(getSubscriptionPlanDisplays()).toEqual([
      {
        id: "clothcraft",
        monthlyKey: "clothcraft_monthly",
        yearlyKey: "clothcraft_yearly",
        featured: true,
        monthlyPlan: {
          key: "clothcraft_monthly",
          kind: "subscription",
          priceCents: 1990,
          currency: "usd",
          creditsPerCycle: 0,
          cycle: "month",
          grantSchedule: { mode: "per_cycle" },
        },
        yearlyPlan: {
          key: "clothcraft_yearly",
          kind: "subscription",
          priceCents: 19900,
          currency: "usd",
          creditsPerCycle: 0,
          cycle: "year",
          grantSchedule: { mode: "per_cycle" },
        },
        displayMonthlyPrice: "$19.90",
        displayYearlyPrice: "$199",
        displayMonthlyCredits: "0",
        displayYearlyCredits: "0",
        displayYearlyCreditsPerGrant: "0",
      },
    ]);
  });
});
