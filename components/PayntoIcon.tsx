interface PayntoIconProps {
  className?: string;
  size?: number;
}

export default function PayntoIcon({
  className = "",
  size = 24
}: PayntoIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="6" fill="#1A1A1A" />
      <path
        d="M7 6V18M7 6H14C15.6569 6 17 7.34315 17 9V9C17 10.6569 15.6569 12 14 12H7"
        stroke="#FAFAFA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
