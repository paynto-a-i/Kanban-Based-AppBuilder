"use client";

import { UserButton, SignedIn } from "@clerk/nextjs";

const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

export function UserMenu() {
  if (!isAuthEnabled) {
    return null;
  }

  return (
    <SignedIn>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8"
          }
        }}
      />
    </SignedIn>
  );
}
