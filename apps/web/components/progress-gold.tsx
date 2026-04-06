"use client";

export function ProgressGold({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[#161616] gold-border">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#8C6A1D] via-[#D4AF37] to-[#F2C94C] shimmer-bar transition-[width] duration-700 ease-out"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
