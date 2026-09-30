"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The Haulio SmartLoad™ photo picker on Move With You — same drag/drop +
 * click-to-open shape as `FileUploadField` (driver document uploads), but
 * shows an image thumbnail instead of a filename, and adds `capture` so
 * mobile browsers offer "Take Photo" alongside "Choose from Library". Purely
 * the picker + preview; the parent page owns what happens with the file
 * (uploading it, sending it to `analyze-cargo`, showing the suggestion).
 */
export function CargoPhotoUpload({
  onFileSelected,
}: {
  onFileSelected: (file: File | null) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Revoke the previous object URL whenever it's replaced or the component
  // unmounts — otherwise each new photo leaks the last one's memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(file: File | null) {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
    onFileSelected(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase"
      >
        Cargo Photo
        <span className="rounded-full bg-edge/8 px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.06em] text-muted normal-case">
          Optional — SmartLoad™
        </span>
      </label>

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-edge/12 bg-ink-950">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, next/image gains nothing here */}
          <img src={previewUrl} alt="Selected cargo" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              handleFile(null);
            }}
            aria-label="Remove photo"
            className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-ink-950/80 text-fg transition-colors duration-200 hover:bg-ink-950"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
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
            dragOver ? "border-brand bg-brand/[0.04]" : "border-edge/15 hover:border-edge/30",
          )}
        >
          <Camera className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="text-[0.85rem] text-muted">
            Add a photo and SmartLoad™ will suggest a truck size
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        className="sr-only"
      />
    </div>
  );
}
