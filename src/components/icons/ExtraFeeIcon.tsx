"use client";

type ExtraFeeIconProps = {
  className?: string;
};

export default function ExtraFeeIcon({ className }: ExtraFeeIconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.6" stroke="currentColor" strokeWidth="2" />
      <g transform="translate(12 12) scale(0.92) translate(-12 -12)">
        <path
          d="M12 5.6V18.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.5 8.2C14.8 7.35 13.5 6.95 12.05 7.1C10.15 7.28 8.95 8.48 8.95 9.85C8.95 11.34 10.12 12.18 11.9 12.48C13.64 12.77 15.05 13.22 15.05 14.72C15.05 16.05 13.72 16.96 12.01 16.96C10.48 16.96 9.09 16.33 8.4 15.3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
