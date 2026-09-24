"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IMAGE_TYPES } from "@/lib/validations/uploads";

type Props = {
  id: string;
  name: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/** Profile-photo picker with a local preview. The <input> itself submits with the form. */
export function AvatarPicker({ id, name, ...a11y }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  // Track the object URL in a ref: a [preview]-dependent cleanup would revoke the live URL
  // as soon as StrictMode re-runs effects, leaving the preview blank.
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function onFileChange(file: File | undefined) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(urlRef.current);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16 border bg-muted">
        {preview && <AvatarImage src={preview} alt="Selected profile photo" className="object-cover" />}
        <AvatarFallback className="bg-muted">
          <UserRound className="size-7 text-muted-foreground" strokeWidth={1.5} />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-fit cursor-pointer has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          )}
        >
          <Camera />
          {preview ? "Change photo" : "Upload photo"}
          <input
            id={id}
            name={name}
            type="file"
            accept={Object.keys(IMAGE_TYPES).join(",")}
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0])}
            {...a11y}
          />
        </label>
        <p className="text-xs text-muted-foreground">Profile photo · optional · JPEG, PNG or WebP, max 5 MB</p>
      </div>
    </div>
  );
}
