"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error }: { error: Error }) {
    useEffect(() => {
        // Log the exact frontend runtime error to the console
        console.error("[Health Gate] ❌ frontend_runtime_error:", error);
        
        // Set a short-lived cookie that the middleware looks for.
        // It tells the middleware to intercept the request and show the 
        // static site_unavailable.html page.
        document.cookie = "qs-force-error=runtime_crash; path=/; max-age=5";
        
        // Redirect to the home page (as requested by the user).
        // If already on the home page, reload it so middleware can intercept it.
        if (window.location.pathname !== "/") {
            window.location.href = "/";
        } else {
            window.location.reload();
        }
    }, [error]);

    // We don't render anything because we're immediately redirecting
    // to let the middleware handle serving the static HTML.
    return null;
}
