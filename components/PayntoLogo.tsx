interface PayntoLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function PayntoLogo({
  className = "",
  size = 32,
  showText = true
}: PayntoLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#1A1A1A" />
        <path
          d="M10 8V24M10 8H18C20.2091 8 22 9.79086 22 12V12C22 14.2091 20.2091 16 18 16H10"
          stroke="#FAFAFA"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="text-lg font-medium text-foreground tracking-tight">
          Paynto
        </span>
      )}
    </div>
  );
}
