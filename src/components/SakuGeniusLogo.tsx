import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const SakuGeniusLogo: React.FC<LogoProps> = ({
  className = "w-10 h-10",
}) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-md shadow-sky-500/20 bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 flex-shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        {/* House Outline */}
        <path
          d="M50 16L20 40V78C20 81.3137 22.6863 84 26 84H74C77.3137 84 80 81.3137 80 78V40L50 16Z"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Door line cut at bottom-right */}
        <path
          d="M68 84H74C77.3137 84 80 81.3137 80 78V66"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dollar Sign in Center */}
        <path
          d="M50 36V64M43 43.5C43 40.5 45.5 38 49 38H51.5C55 38 57.5 40.5 57.5 43.5C57.5 46.5 55 49 51 49H49C45 49 42.5 51.5 42.5 55C42.5 58.5 45 61 49 61H51.5C55.5 61 58 58.5 58 55"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
