"use client";

import React, { useState, useEffect } from "react";
import { getInitials } from "./types";

interface ParticipantAvatarProps {
  name: string;
  photoUrl?: string | null;
  sizeClass?: string;
  textClass?: string;
}

export function ParticipantAvatar({
  name,
  photoUrl,
  sizeClass = "w-9 h-9",
  textClass = "text-xs",
}: ParticipantAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  return (
    <div
      className={`${sizeClass} rounded-xl overflow-hidden bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold shrink-0 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs relative`}
    >
      {photoUrl && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={textClass}>{getInitials(name)}</span>
      )}
    </div>
  );
}
