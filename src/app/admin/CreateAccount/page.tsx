"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateAccountRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/create-user");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ color: "#64748b", fontFamily: "sans-serif", fontSize: "0.9rem" }}>
        Loading...
      </div>
    </div>
  );
}
