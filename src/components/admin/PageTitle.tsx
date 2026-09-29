/** Page heading in the auth pages' voice: tracked eyebrow over a serif title. */
export function PageTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3 lg:mb-8">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.22em] text-forest uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-display text-2xl leading-none font-normal lg:text-4xl">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
