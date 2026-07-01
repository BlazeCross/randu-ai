"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <main
      className={`flex-1 ${isTransitioning ? "opacity-95" : "opacity-100"} transition-opacity duration-150`}
      style={{ viewTransitionName: "page-content" }}
    >
      {children}
    </main>
  );
}
