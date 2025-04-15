"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Loading spinner

export function NavBar() {
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string, buttonName: string) => {
    if (pathname !== href && href !== "#") { 
      setLoadingButton(buttonName);
      router.push(href);
    }
  };

  return (
    <header className="flex py-6 shadow-xl fixed top-0 w-full z-10 bg-background/95">
      <nav className="flex items-center gap-10 container font-semibold">
        <Link href="/" className="mr-auto">
          <BrandLogo />
        </Link>

        {/* API Documentation */}
        <Button
          variant="ghost"
          className="text-lg"
          onClick={() => handleNavigation("/api-documentation", "api-docs")}
          disabled={loadingButton === "api-docs"}
        >
          {loadingButton === "api-docs" ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
          API Documentation
        </Button>

        {/* Features, Pricing, About use Link (no loading needed) */}
        <Link href="/#features" className="text-lg">Features</Link>
        <Link href="/#pricing" className="text-lg">Pricing</Link>
        <Link href="/#about" className="text-lg">About</Link>

        {/* Dashboard */}
        <SignedIn>
          <Button
            variant="ghost"
            className="text-lg"
            onClick={() => handleNavigation("/dashboard", "dashboard")}
            disabled={loadingButton === "dashboard"}
          >
            {loadingButton === "dashboard" ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Dashboard
          </Button>
        </SignedIn>

        {/* Login Button (No Loading Needed) */}
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="ghost">Login</Button>
          </SignInButton>
        </SignedOut>
      </nav>
    </header>
  );
}
