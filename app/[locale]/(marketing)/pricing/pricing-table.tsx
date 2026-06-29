"use client";

import { useTranslations } from "next-intl";

export function PricingTable() {
  const t = useTranslations("pricing");
  const rows = ["dailyTryOns", "garments", "watermark", "resolution"] as const;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-0">
      <h2 className="mb-8 text-2xl font-semibold text-foreground">
        {t("comparison.title")}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground" />
              <th className="px-4 py-4 text-center text-base font-semibold text-foreground">
                {t("tiers.free.name")}
              </th>
              <th className="px-4 py-4 text-center text-base font-semibold text-foreground">
                {t("tiers.clothcraft.name")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row} className="border-b border-border">
                <th scope="row" className="px-4 py-4 text-left text-sm font-medium text-foreground">
                  {t(`comparison.rows.${row}`)}
                </th>
                <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                  {t(`comparison.values.free.${row}`)}
                </td>
                <td className="px-4 py-4 text-center text-sm font-medium text-foreground">
                  {t(`comparison.values.paid.${row}`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
