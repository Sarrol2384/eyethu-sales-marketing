type Props = {
  description: string | null;
  fallback?: string | null;
};

export function PropertyDescription({ description, fallback }: Props) {
  const text = description ?? fallback;
  if (!text) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight">
        About this home
      </h2>
      <div className="space-y-3 text-base leading-relaxed text-foreground/90">
        {text.split(/\n\s*\n/).map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
      </div>
    </section>
  );
}
