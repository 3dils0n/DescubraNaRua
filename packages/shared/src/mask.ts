export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "***";
  if (parts.length === 1) {
    const w = parts[0];
    if (w.length <= 2) return `${w[0]}**`;
    return `${w.slice(0, 3)}***`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  const maskedFirst = first.length <= 2 ? `${first[0]}**` : `${first.slice(0, 3)}***`;
  return `${maskedFirst} ${last}`;
}
