import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-xl font-semibold text-white">Paynto A.I.</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-zinc-400">Sign in to continue building with AI</p>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-zinc-900 border border-zinc-800 shadow-2xl rounded-xl",
                headerTitle: "text-white",
                headerSubtitle: "text-zinc-400",
                socialButtonsBlockButton:
                  "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 transition-colors",
                socialButtonsBlockButtonText: "text-white font-medium",
                dividerLine: "bg-zinc-700",
                dividerText: "text-zinc-500",
                formFieldLabel: "text-zinc-300",
                formFieldInput:
                  "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-amber-500 focus:border-amber-500",
                formButtonPrimary:
                  "bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-colors",
                footerActionLink: "text-amber-500 hover:text-amber-400",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-amber-500",
                formFieldAction: "text-amber-500",
                otpCodeFieldInput: "bg-zinc-800 border-zinc-700 text-white",
              },
            }}
          />

          <p className="text-center text-zinc-500 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-amber-500 hover:text-amber-400 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-zinc-600 text-sm">
        © {new Date().getFullYear()} Paynto A.I. All rights reserved.
      </footer>
    </div>
  );
}
