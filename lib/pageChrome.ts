/** Replace `{title}`, `{date}` in header/footer templates (preview + export). */
export function formatPageChrome(
  template: string,
  ctx: { title: string; date?: Date }
): string {
  if (!template.trim()) {
    return "";
  }
  const date = ctx.date ?? new Date();
  const dateStr = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return template
    .replaceAll("{title}", ctx.title || "Untitled")
    .replaceAll("{date}", dateStr);
}
