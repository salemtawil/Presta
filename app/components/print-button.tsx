"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white"
    >
      <Printer size={17} />
      {label}
    </button>
  );
}
