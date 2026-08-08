"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const src =
    mounted && resolvedTheme === "light"
      ? "/brand/logo-light-bg.png"
      : "/brand/logo-dark-bg.png";

  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <Image src={src} alt="FF Madagascar E-Sport" width={32} height={32} className="rounded-md" priority />
      <span className="text-sm font-bold uppercase tracking-wide text-foreground">
        FF Mdg <span className="text-primary">Admin</span>
      </span>
    </Link>
  );
}
