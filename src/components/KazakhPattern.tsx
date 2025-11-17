export function KazakhPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      opacity="0.1"
    >
      <pattern id="kazakh-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <path
          d="M50 10 L60 30 L80 30 L65 42 L70 60 L50 48 L30 60 L35 42 L20 30 L40 30 Z"
          fill="currentColor"
        />
        <circle cx="10" cy="10" r="3" fill="currentColor" />
        <circle cx="90" cy="10" r="3" fill="currentColor" />
        <circle cx="10" cy="90" r="3" fill="currentColor" />
        <circle cx="90" cy="90" r="3" fill="currentColor" />
      </pattern>
      <rect width="200" height="200" fill="url(#kazakh-pattern)" />
    </svg>
  );
}
