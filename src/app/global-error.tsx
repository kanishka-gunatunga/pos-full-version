"use client";

import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error }) {
    useEffect(() => {
        // Log the exact global layout error to the console
        console.error("[Health Gate] ❌ global_layout_error:", error);
        
        // Trigger middleware exactly like error.tsx
        document.cookie = "qs-force-error=global_crash; path=/; max-age=5";
        
        if (window.location.pathname !== "/") {
            window.location.href = "/";
        } else {
            window.location.reload();
        }
    }, [error]);

    return (
        <html lang="en">
            <body>
                {/* Fallback while redirecting */}
                <div style={{ display: "none" }}>Redirecting...</div>
            </body>
        </html>
    );
}
