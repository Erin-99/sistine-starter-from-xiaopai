"use client";

import { Shirt } from "lucide-react";

import { LocaleLink } from "@/components/locale-link";

export function Logo() {
  return (
    <LocaleLink
      href="/"
      className="relative z-20 mr-4 flex items-center gap-2 px-2 py-1 text-foreground"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Shirt className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold">ClothCraft</span>
    </LocaleLink>
  );
}
