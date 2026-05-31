"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("ff_token");
    router.replace(token ? "/home" : "/login");
  }, [router]);
  return null;
}
