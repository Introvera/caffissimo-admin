"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  multiple?: boolean;
  value?: File | string | (File | string)[] | null;
  onChange: (value: File | File[] | (File | string)[] | string | null) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  accept?: string;
  helperText?: string;
  className?: string;
}

export function ImageUploader({
  multiple = false,
  value,
  onChange,
  disabled = false,
  maxSizeMB = 5,
  accept = "image/*",
  helperText = "JPEG, PNG, and GIF formats, up to 5 MB.",
  className = "",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    validateAndProcessFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      validateAndProcessFiles(files);
    }
  };

  const validateAndProcessFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Filter by accept type if provided
    const isImageOnly = accept.startsWith("image/");

    for (const file of files) {
      if (isImageOnly && !file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image file.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        toast.error(`"${file.name}" is too large. Max size is ${maxSizeMB}MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (multiple) {
      const currentValue = Array.isArray(value) ? value : value ? [value] : [];
      onChange([...currentValue, ...validFiles] as any);
    } else {
      onChange(validFiles[0]);
    }
  };

  const removeFile = (e: React.MouseEvent, index?: number) => {
    e.stopPropagation();
    if (disabled) return;

    if (multiple && Array.isArray(value)) {
      const newValue = [...value];
      newValue.splice(index!, 1);
      onChange(newValue.length > 0 ? (newValue as any) : null);
    } else {
      onChange(null);
    }
  };

  const renderPreviewItem = (item: File | string, index?: number) => {
    const isString = typeof item === "string";
    const name = isString ? item.split("/").pop() || "Image" : (item as File).name;
    const isImage = isString || (item as File).type.startsWith("image/");

    let src = "";
    if (isString) {
      src = item as string;
    } else if (isImage) {
      try {
        src = URL.createObjectURL(item as File);
      } catch (err) {
        console.error("Error creating object URL", err);
      }
    }

    return (
      <div
        key={index ?? "single"}
        className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted flex flex-col items-center justify-center shadow-sm"
      >
        {isImage && src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 p-2 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground truncate w-20 px-1">
              {name}
            </span>
          </div>
        )}

        {!disabled && (
          <button
            type="button"
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            onClick={(e) => removeFile(e, index)}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all relative flex flex-col items-center justify-center ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-muted/10 border-muted-foreground/10"
            : isDragActive
            ? "border-primary bg-primary/5 cursor-pointer"
            : "border-muted-foreground/20 hover:border-primary/50 cursor-pointer bg-background hover:bg-muted/5"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          hidden
          ref={fileInputRef}
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
        />

        {/* Cloud Upload Icon */}
        <div className="h-12 w-12 rounded-full flex items-center justify-center text-muted-foreground/80 mb-3 bg-muted/30">
          <UploadCloud className="h-6 w-6" />
        </div>

        {/* Text descriptions */}
        <h4 className="text-sm font-semibold text-foreground mb-1">
          Choose a file or drag & drop it here.
        </h4>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
          {helperText}
        </p>

        {/* Browse Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="rounded-full px-5 py-1.5 h-8 text-xs border-muted-foreground/20 text-muted-foreground hover:text-foreground font-medium bg-background shadow-none"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) fileInputRef.current?.click();
          }}
        >
          Browse File
        </Button>
      </div>

      {/* Previews List */}
      {value && (
        <div className="flex flex-wrap gap-2 justify-start mt-2">
          {Array.isArray(value)
            ? value.map((f, i) => renderPreviewItem(f, i))
            : renderPreviewItem(value)}
        </div>
      )}
    </div>
  );
}
