"use client";

import { useTranslations } from "next-intl";

import { Logo } from "@/components/Logo";
import { LocaleLink } from "@/components/locale-link";
import { NewsletterInline } from "@/components/newsletter-inline";

export function Footer() {
  const t = useTranslations();
  const productLinks = [
    { name: t("navigation.main.tryOn"), href: "/#try-on" },
    { name: t("navigation.main.pricing"), href: "/pricing" },
    { name: t("navigation.main.contact"), href: "/contact" },
  ];
  const legalLinks = [
    { name: t("navigation.footer.legal.terms"), href: "/terms" },
    { name: t("navigation.footer.legal.privacy"), href: "/privacy" },
    { name: t("navigation.footer.legal.cookies"), href: "/cookies" },
    { name: t("navigation.footer.legal.refund"), href: "/refund" },
  ];

  return (
    <footer className="border-t border-border bg-background px-6 py-14 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_auto_auto]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            {t("footer.tagline")}
          </p>
          <div className="mt-6 max-w-sm">
            <NewsletterInline />
          </div>
        </div>
        <nav className="grid content-start gap-3 text-sm" aria-label={t("footer.product.title")}>
          <p className="mb-1 font-semibold text-foreground">{t("footer.product.title")}</p>
          {productLinks.map(link => (
            <LocaleLink key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.name}
            </LocaleLink>
          ))}
        </nav>
        <nav className="grid content-start gap-3 text-sm" aria-label={t("footer.legal.title")}>
          <p className="mb-1 font-semibold text-foreground">{t("footer.legal.title")}</p>
          {legalLinks.map(link => (
            <LocaleLink key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.name}
            </LocaleLink>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{t("common.brand.copyright")}</span>
        <span>{t("common.brand.allRightsReserved")}</span>
      </div>
    </footer>
  );
}
