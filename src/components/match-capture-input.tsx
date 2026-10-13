"use client";

import { useEffect, useState } from "react";
import { ImagePlus, TriangleAlert, X } from "lucide-react";
import { formatFileSize, OCR_MAX_IMAGE_BYTES, OCR_MAX_IMAGE_LABEL } from "@/constants/ocr";

// Créneau de capture d'un résultat de match (scrims, scrims externes,
// tournois). Une image au-delà de la limite OCR est refusée dès la sélection :
// elle n'est jamais retenue, donc jamais envoyée ni analysée.
export function MatchCaptureInput({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function select(selected: File | null) {
    if (selected && selected.size > OCR_MAX_IMAGE_BYTES) {
      setSizeError(
        `Image trop lourde (${formatFileSize(selected.size)}) — ${OCR_MAX_IMAGE_LABEL} maximum pour l'analyse OCR. Compressez-la ou recadrez la capture, puis choisissez-la à nouveau.`
      );
      onChange(null);
      return;
    }
    setSizeError(null);
    onChange(selected);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {previewUrl ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local avant envoi, jamais une URL Cloudinary */}
          <img src={previewUrl} alt={label} className="max-h-48 w-auto rounded-md border border-border object-contain" />
          <button
            type="button"
            onClick={() => select(null)}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow"
            aria-label="Retirer cette image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary">
          <ImagePlus className="size-4 shrink-0" />
          Choisir une image (JPEG, PNG, WebP — {OCR_MAX_IMAGE_LABEL} max)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              select(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {sizeError && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-accent">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          {sizeError}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
