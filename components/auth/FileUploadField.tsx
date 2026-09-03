"use client";

import { CheckCircle2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function FileUploadField({
  label,
  required,
  accept = "image/*,.pdf",
  onFileSelected,
}: {
  label: string;
  required?: boolean;
  accept?: string;
  onFileSelected: (file: File | null) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | null) {
    setFileName(file?.name ?? null);
    onFileSelected(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase"
      >
        {label}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.06em] normal-case",
            required ? "bg-brand/15 text-brand" : "bg-white/8 text-muted",
          )}
        >
          {required ? "Required" : "Optional"}
        </span>
      </label>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer.files[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-ink-950 px-4 py-3.5 transition-colors duration-200",
          dragOver ? "border-brand bg-brand/[0.04]" : "border-white/15 hover:border-white/30",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          required={required}
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
        {fileName ? (
          <>
            <CheckCircle2 className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="truncate text-[0.85rem] text-white">{fileName}</span>
          </>
        ) : (
          <>
            <Upload className="size-4 shrink-0 text-muted" aria-hidden />
            <span className="text-[0.85rem] text-muted">Click or drop a file to upload</span>
          </>
        )}
      </div>
    </div>
  );
}
