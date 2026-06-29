import { fireEvent, render, screen } from "@testing-library/react";

import { LanguageSwitcher } from "@/components/language-switcher";

vi.mock("next-intl", () => ({
  useLocale: () => "zh",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/zh/pricing",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("LanguageSwitcher", () => {
  it("uses a document navigation link when switching locales", () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole("button", { name: "Select language" }));

    expect(screen.getByRole("menuitem", { name: "English" })).toHaveAttribute(
      "href",
      "/en/pricing"
    );
  });
});
