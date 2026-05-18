interface QuizMindIconProps {
  size?: number;
  className?: string;
}

/** Brain/quiz mark used across the app and in /public/icon.svg */
export default function QuizMindIcon({
  size = 52,
  className = "text-blue-600",
}: QuizMindIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M26 8C18.5 8 13 13.5 13 21V31C13 35.5 15.5 39 19 41"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M26 8C33.5 8 39 13.5 39 21V31C39 35.5 36.5 39 33 41"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="26" cy="26" r="6" fill="currentColor" />
    </svg>
  );
}
