interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export default function GlowCard({ glow = false, className, children, ...rest }: GlowCardProps) {
  return (
    <div
      className={`relative rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-all duration-300 ${
        glow ? "hover:shadow-[var(--glow-primary-strong)] hover:border-primary/40" : "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
      } ${className || ""}`}
      {...rest}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
