"use client";

import Image from "next/image";
import type { MediaType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
  url: string | null;
  mediaType: MediaType;
  alt?: string;
  className?: string;
  fill?: boolean;
}

export function MediaPreview({
  url,
  mediaType,
  alt = "Media",
  className,
  fill = true,
}: MediaPreviewProps) {
  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-50 text-xs text-muted",
          className
        )}
      >
        No media
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <video
        src={url}
        className={cn("h-full w-full object-cover", className)}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        unoptimized={mediaType === "gif" || url.startsWith("blob:")}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function detectMediaType(file: File): MediaType {
  if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
    return "gif";
  }
  if (file.type.startsWith("video/")) {
    return "video";
  }
  return "image";
}

export function acceptForMediaType(mediaType: MediaType): string {
  const map: Record<MediaType, string> = {
    image: "image/jpeg,image/png,image/webp",
    video: "video/mp4,video/webm,video/quicktime",
    gif: "image/gif,.gif",
  };
  return map[mediaType];
}
