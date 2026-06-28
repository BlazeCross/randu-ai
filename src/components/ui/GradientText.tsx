interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
}

export default function GradientText({
  children,
  className = "",
  from = "from-primary",
  to = "to-primary-400",
}: GradientTextProps) {
  return (
    <span className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}
