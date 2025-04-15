"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Loading spinner

export function NavBar() {
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Reset loading state when route changes
  useEffect(() => {
    setLoadingButton(null);
  }, [pathname]);

  const handleNavigation = (href: string, buttonName: string) => {
    if (pathname !== href) {
      setLoadingButton(buttonName);
      router.push(href);
    }
  };

  return (
    <header className="flex py-4 shadow bg-background">
      <nav className="flex items-center gap-10 container">
        {/* Brand Logo */}
        <Button
          variant="ghost"
          className="mr-auto"
          onClick={() => handleNavigation("/dashboard", "dashboard")}
          disabled={loadingButton === "dashboard"}
        >
          {loadingButton === "dashboard" ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
          <BrandLogo />
        </Button>

        {/* Products */}
        <Button
          variant="ghost"
          onClick={() => handleNavigation("/dashboard/products", "products")}
          disabled={loadingButton === "products"}
        >
          {loadingButton === "products" ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
          Products
        </Button>

        {/* Analytics */}
        <Button
          variant="ghost"
          onClick={() => handleNavigation("/dashboard/analytics", "analytics")}
          disabled={loadingButton === "analytics"}
        >
          {loadingButton === "analytics" ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
          Analytics
        </Button>

        {/* Subscription */}
        <Button
          variant="ghost"
          onClick={() => handleNavigation("/dashboard/subscription", "subscription")}
          disabled={loadingButton === "subscription"}
        >
          {loadingButton === "subscription" ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
          Subscription
        </Button>

        {/* User Profile */}
        <UserButton />
      </nav>
    </header>
  );
}
