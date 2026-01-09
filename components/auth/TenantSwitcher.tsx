"use client";

import { OrganizationSwitcher, SignedIn } from "@clerk/nextjs";

const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

interface TenantSwitcherProps {
  className?: string;
}

export function TenantSwitcher({ className = "" }: TenantSwitcherProps) {
  if (!isAuthEnabled) {
    return null;
  }

  return (
    <SignedIn>
      <OrganizationSwitcher
        hidePersonal={false}
        afterCreateOrganizationUrl="/dashboard"
        afterLeaveOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        afterSelectPersonalUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: className,
            organizationSwitcherTrigger:
              "px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors",
            organizationPreviewTextContainer: "text-sm",
            organizationSwitcherTriggerIcon: "w-4 h-4",
          },
        }}
      />
    </SignedIn>
  );
}
