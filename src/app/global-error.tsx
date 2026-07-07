/**
 * global-error.tsx — Root Layout Error Boundary
 *
 * This is the LAST line of defense — it catches errors that happen
 * inside the root layout.tsx itself. Scenarios include:
 *
 *  - Vercel deployment failure / CDN error causing a 500
 *  - Google Fonts / external script failing to load and throwing
 *  - SessionAuthProvider or Redux Provider crashing
 *  - Any error in providers.tsx during SSR
 *
 * IMPORTANT: Because layout.tsx has not rendered, this component must
 * provide its own <html> and <body> tags. It cannot use any layout
 * components or providers.
 *
 * Must be a "use client" component.
 */
"use client";

import { useEffect } from "react";
import ServiceErrorPage from "@/components/ServiceErrorPage";

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error(
            "[Quick Seats] CRITICAL: Layout-level error caught by global-error.tsx:",
            error
        );
    }, [error]);

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Service Unavailable — Quick Seats</title>
            </head>
            <body>
                <ServiceErrorPage
                    reason="unknown"
                    message={
                        process.env.NODE_ENV === "development"
                            ? `Layout crash: ${error.message}`
                            : undefined
                    }
                    resetErrorBoundary={reset}
                />
            </body>
        </html>
    );
}
