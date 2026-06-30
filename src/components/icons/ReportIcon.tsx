export default function ReportIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Document outline with dog-eared corner - stroke only */}
      <path
        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dog-ear fold line */}
      <path
        d="M14 2V8H20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bar chart - 3 vertical bars (stroke/outline only) */}
      <rect x="8" y="14" width="1.5" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="11.5" y="12" width="1.5" height="6" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="15" y="10" width="1.5" height="8" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
