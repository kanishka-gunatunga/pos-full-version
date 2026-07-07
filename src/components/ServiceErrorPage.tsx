/**
 * ServiceErrorPage.tsx
 *
 * ─────────────────────────────────────────────────────────────────
 * REUSABLE FULL-SCREEN ERROR PAGE
 * ─────────────────────────────────────────────────────────────────
 *
 * Rendered when the health gate fails OR when error.tsx / global-error.tsx
 * catches an unhandled JS error at runtime.
 *
 * Props:
 *  - reason: what kind of failure occurred
 *  - onRetry: optional callback; if omitted defaults to hard reload
 *
 * To reuse in another project:
 *  - Update BRAND_COLOR to match your brand
 *  - Update the site name in SITE_NAME
 *  - Optionally update STATUS_PAGE_URL
 */
"use client";

import React, { useEffect, useState } from "react";
import type { HealthReason } from "@/lib/healthCheck";

// ─── Customisation ────────────────────────────────────────────────
const SITE_NAME = "Ahas Gawwa POS";
const BRAND_COLOR = "#27337C";
const STATUS_PAGE_URL = ""; // e.g. "https://status.quickseats.lk" — leave empty to hide
// ─────────────────────────────────────────────────────────────────

export type ErrorReason = HealthReason | "runtime" | "unknown";

interface ServiceErrorPageProps {
    reason?: ErrorReason;
    /** Optional override message */
    message?: string;
    /** Replaces default retry (hard reload) */
    onRetry?: () => void;
    /** Pass the Next.js error boundary reset fn for runtime errors */
    resetErrorBoundary?: () => void;
}

// ─── Content map ─────────────────────────────────────────────────
const CONTENT: Record<
    ErrorReason,
    { icon: string; heading: string; body: string; badge: string }
> = {
    env_missing: {
        icon: "⚙️",
        heading: "Configuration Error",
        body: "The application is missing required environment configuration. Please contact the system administrator.",
        badge: "CONFIG",
    },
    api_unreachable: {
        icon: "📡",
        heading: "Service Unreachable",
        body: "We're unable to connect to our servers right now. This may be a temporary network issue. Please try again shortly.",
        badge: "API DOWN",
    },
    api_error: {
        icon: "🔧",
        heading: "Server Error",
        body: "Our servers returned an unexpected response. Our team has been notified and is working on a fix.",
        badge: "SERVER ERROR",
    },
    db_disconnected: {
        icon: "🗄️",
        heading: "Database Unavailable",
        body: "We're experiencing database connectivity issues. Your data is safe — we'll be back shortly.",
        badge: "DB OFFLINE",
    },
    runtime: {
        icon: "⚡",
        heading: "Something Went Wrong",
        body: "An unexpected error occurred while loading this page. Try refreshing — if the problem persists, contact support.",
        badge: "RUNTIME ERROR",
    },
    unknown: {
        icon: "🌐",
        heading: "Service Unavailable",
        body: "We're currently experiencing technical difficulties. Please try again in a few minutes.",
        badge: "UNAVAILABLE",
    },
};

// ─── Status indicators ────────────────────────────────────────────
interface StatusItem {
    label: string;
    status: "ok" | "error" | "checking";
}

function getStatusItems(reason: ErrorReason): StatusItem[] {
    return [
        {
            label: "Frontend",
            status:
                reason === "runtime" || reason === "env_missing"
                    ? "error"
                    : "ok",
        },
        {
            label: "Backend API",
            status:
                reason === "api_unreachable" || reason === "api_error"
                    ? "error"
                    : "ok",
        },
        {
            label: "Database",
            status: reason === "db_disconnected" ? "error" : "ok",
        },
    ];
}

// ─── Component ────────────────────────────────────────────────────
export default function ServiceErrorPage({
    reason = "unknown",
    message,
    onRetry,
    resetErrorBoundary,
}: ServiceErrorPageProps) {
    const content = CONTENT[reason] ?? CONTENT.unknown;
    const statusItems = getStatusItems(reason);
    const [dots, setDots] = useState<
        { x: number; y: number; size: number; opacity: number; speed: number }[]
    >([]);
    const [retrying, setRetrying] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // Generate background particles once on mount (client only)
    useEffect(() => {
        setDots(
            Array.from({ length: 40 }, () => ({
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.4 + 0.1,
                speed: Math.random() * 20 + 10,
            }))
        );
    }, []);

    // Auto-retry countdown (30s)
    useEffect(() => {
        if (reason === "api_unreachable" || reason === "api_error") {
            setCountdown(30);
        }
    }, [reason]);

    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            handleRetry();
            return;
        }
        const timer = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    function handleRetry() {
        setRetrying(true);
        setCountdown(null);
        if (resetErrorBoundary) {
            resetErrorBoundary();
        } else if (onRetry) {
            onRetry();
        } else {
            window.location.reload();
        }
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .qs-error-root {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          min-height: 100vh;
          width: 100%;
          background: #030712;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        /* Radial gradient backdrop */
        .qs-error-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(39,51,124,0.45) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(39,51,124,0.2) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Animated grid lines */
        .qs-error-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(39,51,124,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(39,51,124,0.08) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Floating particles */
        .qs-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(99,120,255,0.6);
          animation: qs-float linear infinite;
          pointer-events: none;
        }

        @keyframes qs-float {
          0%   { transform: translateY(0) scale(1); opacity: var(--op); }
          50%  { transform: translateY(-30px) scale(1.1); opacity: calc(var(--op) * 0.5); }
          100% { transform: translateY(0) scale(1); opacity: var(--op); }
        }

        /* Card */
        .qs-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 560px;
          margin: 24px;
          background: rgba(15,20,40,0.85);
          border: 1px solid rgba(39,51,124,0.4);
          border-radius: 24px;
          padding: 48px 44px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(39,51,124,0.2),
            0 25px 50px -12px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(255,255,255,0.05);
          animation: qs-slide-up 0.5s cubic-bezier(.16,1,.3,1) both;
        }

        @keyframes qs-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Badge */
        .qs-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(220,38,38,0.15);
          border: 1px solid rgba(220,38,38,0.35);
          color: #f87171;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 24px;
        }

        .qs-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          animation: qs-pulse 1.5s ease-in-out infinite;
        }

        @keyframes qs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        /* Icon */
        .qs-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: rgba(39,51,124,0.2);
          border: 1px solid rgba(39,51,124,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 24px;
          box-shadow: 0 0 30px rgba(39,51,124,0.3);
        }

        /* Text */
        .qs-heading {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 12px;
        }

        .qs-body {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 8px;
        }

        .qs-dev-msg {
          font-size: 11px;
          color: #475569;
          font-family: 'Courier New', monospace;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 10px 12px;
          margin-top: 12px;
          margin-bottom: 0;
          word-break: break-word;
        }

        /* Divider */
        .qs-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 28px 0;
        }

        /* Status items */
        .qs-status-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .qs-status-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        .qs-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .qs-status-dot.ok  { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.5); }
        .qs-status-dot.err { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); animation: qs-pulse 1.5s infinite; }

        /* Buttons */
        .qs-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .qs-btn {
          flex: 1;
          min-width: 120px;
          padding: 13px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .qs-btn-primary {
          background: ${BRAND_COLOR};
          color: #fff;
          box-shadow: 0 4px 15px rgba(39,51,124,0.4);
        }

        .qs-btn-primary:hover:not(:disabled) {
          background: #1e2860;
          box-shadow: 0 4px 20px rgba(39,51,124,0.6);
          transform: translateY(-1px);
        }

        .qs-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .qs-btn-secondary {
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .qs-btn-secondary:hover {
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
          transform: translateY(-1px);
        }

        .qs-btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: qs-spin 0.7s linear infinite;
        }

        @keyframes qs-spin {
          to { transform: rotate(360deg); }
        }

        /* Site brand */
        .qs-brand {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          color: #334155;
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .qs-brand span { color: #475569; }

        /* Countdown pill */
        .qs-countdown {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(39,51,124,0.15);
          border: 1px solid rgba(39,51,124,0.3);
          color: #818cf8;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
          margin-left: 8px;
        }
      `}</style>

            <div className="qs-error-root">
                {/* Background particles */}
                {dots.map((d, i) => (
                    <div
                        key={i}
                        className="qs-particle"
                        style={{
                            left: `${d.x}%`,
                            top: `${d.y}%`,
                            width: `${d.size}px`,
                            height: `${d.size}px`,
                            // @ts-expect-error CSS custom property
                            "--op": d.opacity,
                            animationDuration: `${d.speed}s`,
                            animationDelay: `${-d.speed * Math.random()}s`,
                        }}
                    />
                ))}

                <div className="qs-card">
                    {/* Badge */}
                    <div className="qs-badge">
                        <span className="qs-badge-dot" />
                        {content.badge}
                    </div>

                    {/* Icon */}
                    <div className="qs-icon-wrap">{content.icon}</div>

                    {/* Heading & body */}
                    <h1 className="qs-heading">{content.heading}</h1>
                    <p className="qs-body">{content.body}</p>

                    {/* Dev message */}
                    {message && (
                        <p className="qs-dev-msg">
                            <strong>Details:</strong> {message}
                        </p>
                    )}

                    <div className="qs-divider" />

                    {/* Status indicators */}
                    <div className="qs-status-grid">
                        {statusItems.map((item) => (
                            <div key={item.label} className="qs-status-item">
                                <span
                                    className={`qs-status-dot ${item.status === "ok" ? "ok" : "err"}`}
                                />
                                {item.label}
                                <span
                                    style={{
                                        color: item.status === "ok" ? "#22c55e" : "#f87171",
                                        fontSize: 10,
                                        fontWeight: 700,
                                    }}
                                >
                                    {item.status === "ok" ? "OK" : "FAIL"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="qs-actions">
                        <button
                            className="qs-btn qs-btn-primary"
                            onClick={handleRetry}
                            disabled={retrying}
                            id="qs-retry-btn"
                        >
                            {retrying ? (
                                <>
                                    <span className="qs-btn-spinner" />
                                    Retrying…
                                </>
                            ) : (
                                <>
                                    ↺ Try Again
                                    {countdown !== null && (
                                        <span className="qs-countdown">{countdown}s</span>
                                    )}
                                </>
                            )}
                        </button>

                        {STATUS_PAGE_URL ? (
                            <a
                                href={STATUS_PAGE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="qs-btn qs-btn-secondary"
                                id="qs-status-btn"
                                style={{ textDecoration: "none" }}
                            >
                                Status Page ↗
                            </a>
                        ) : (
                            <button
                                className="qs-btn qs-btn-secondary"
                                onClick={() => (window.location.href = "/")}
                                id="qs-home-btn"
                            >
                                Go to Home
                            </button>
                        )}
                    </div>

                    {/* Brand */}
                    <p className="qs-brand">
                        <span>{SITE_NAME}</span> · We&apos;ll be back soon
                    </p>
                </div>
            </div>
        </>
    );
}
