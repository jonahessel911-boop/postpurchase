export function WidgetUnavailable({
  title = "Offers unavailable",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="mx-auto flex min-h-[240px] w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <p className="text-[15px] font-semibold text-zinc-900">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{message}</p>
    </div>
  );
}
