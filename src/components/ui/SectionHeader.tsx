interface SectionHeaderProps {
  tag?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export default function SectionHeader({
  tag,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div className={`mb-10 ${align === "center" ? "mx-auto max-w-2xl text-center" : ""}`}>
      {tag && (
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">
          {tag}
        </span>
      )}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
