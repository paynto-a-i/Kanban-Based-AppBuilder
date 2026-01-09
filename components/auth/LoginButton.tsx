"use client";

import { SignInButton, SignedOut } from "@clerk/nextjs";

interface LoginButtonProps {
  className?: string;
}

const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

export function LoginButton({ className = "" }: LoginButtonProps) {
  if (!isAuthEnabled) {
    return null;
  }

  return (
    <SignedOut>
      <SignInButton mode="modal">
        <button
          className={`flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors ${className}`}
        >
          Sign In
        </button>
      </SignInButton>
    </SignedOut>
  );
}
