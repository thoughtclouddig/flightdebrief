import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudentHeaderActions } from "./student-nav-v2";
import type { MembershipOption, Viewer } from "@/lib/viewer";

const viewer: Viewer = {
  user: { id: "user-1", name: "Mia Chen", email: "mia@example.com", authUserId: "mia@example.com", avatarUrl: null, createdAt: "2026-01-01T00:00:00.000Z" },
  organization: {
    id: "org-1",
    name: "Falcon Aviation",
    kind: "school",
    defaultGuidanceMode: "freeform",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    subscriptionPlan: null,
    subscriptionQuantity: 1,
    demoExpiresAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  role: "student",
};
const memberships: MembershipOption[] = [];

describe("StudentHeaderActions support icon", () => {
  it("navigates to the authenticated in-app Support screen, never a mailto: link", () => {
    const markup = renderToStaticMarkup(<StudentHeaderActions viewer={viewer} memberships={memberships} />);

    expect(markup).toContain('href="/profile/support"');
    expect(markup).not.toContain("mailto:");
  });
});
