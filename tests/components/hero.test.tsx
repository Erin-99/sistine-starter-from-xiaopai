import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Hero } from "@/components/hero";

const routerPushMock = vi.fn();
const sessionState: {
  data: null | { user: { id: string } };
  isPending: boolean;
} = {
  data: null,
  isPending: false,
};

const translations: Record<string, string> = {
  badge: "AI virtual try-on",
  title: "ClothCraft virtual try-on",
  description: "Upload a model photo and garment images.",
  "tryOn.model.title": "Model photo",
  "tryOn.model.description": "Use a clear full-body photo",
  "tryOn.model.upload": "Upload model photo",
  "tryOn.model.replace": "Replace model photo",
  "tryOn.model.alt": "Model preview",
  "tryOn.garments.title": "Garments",
  "tryOn.garments.description": "Upload the clothing to try on",
  "tryOn.garments.upload": "Upload garment",
  "tryOn.garments.replace": "Replace garment",
  "tryOn.garments.alt": "Garment preview",
  "tryOn.result.title": "Your result",
  "tryOn.result.empty": "Your styled look will appear here",
  "tryOn.result.alt": "Virtual try-on result",
  "tryOn.result.download": "Download result",
  "tryOn.generate": "Generate try-on",
  "tryOn.generating": "Styling your look...",
  "tryOn.signIn": "Sign in to try on",
  "tryOn.remaining": "{remaining} of {limit} try-ons left today",
  "tryOn.freeNote": "Free: 1 garment and ClothCraft watermark",
  "tryOn.paidNote": "Paid: up to 3 garments and no watermark",
  "tryOn.remove": "Remove image",
  "tryOn.errors.fileType": "Use a PNG, JPEG, or WebP image.",
  "tryOn.errors.fileSize": "Each image must be 10MB or smaller.",
  "tryOn.errors.missingImages": "Upload a model photo and at least one garment.",
  "tryOn.errors.generation": "Could not generate the try-on.",
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () =>
    (key: string, values?: Record<string, string | number>) => {
      let translated = translations[key] ?? key;
      for (const [name, value] of Object.entries(values ?? {})) {
        translated = translated.replace(`{${name}}`, String(value));
      }
      return translated;
    },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => sessionState,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag) =>
        (props: React.PropsWithChildren<Record<string, unknown>>) => {
          const { children, initial, animate, transition, ...elementProps } = props;
          void initial;
          void animate;
          void transition;
          return React.createElement(String(tag), elementProps, children);
        },
    }
  ),
}));

describe("Hero virtual try-on", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.data = null;
    sessionState.isPending = false;
  });

  it("shows the try-on workspace and sends anonymous users to login", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", { name: "ClothCraft virtual try-on" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Upload model photo" }));
    expect(routerPushMock).toHaveBeenCalledWith("/en/login");
  });

  it("shows three garment slots for an active paid subscriber", async () => {
    sessionState.data = { user: { id: "user_1" } };
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          dailyLimit: 20,
          maxGarments: 3,
          remaining: 20,
          tier: "paid",
          used: 0,
          watermark: false,
        }),
        { status: 200 }
      )
    );

    render(<Hero />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Upload garment" })).toHaveLength(3);
    });
    expect(screen.getByText("Paid: up to 3 garments and no watermark")).toBeInTheDocument();
  });
});
