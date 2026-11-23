"use client";

import { useEffect, useState } from "react";

/**
 * Profile picture of an X account, fetched by handle from unavatar.io (no X API needed).
 * Falls back to initials while loading or if the picture can't be found.
 */
export default function XAvatar({ handle, size = 32 }: { handle: string; size?: number }) {
  const clean = handle.replace(/^@/, "");
  const valid = /^[A-Za-z0-9_]{1,15}$/.test(clean);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset when the handle changes (e.g. while typing on the create page)
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [clean]);

  const initials = (clean.replace(/^0x/, "") || "?").slice(0, 2).toUpperCase();

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-xs font-bold text-white"
      style={{ width: size, height: size }}
    >
      {!loaded && initials}
      {valid && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={clean}
          src={`https://unavatar.io/x/${clean}?fallback=false`}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-full w-full object-cover ${loaded ? "" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
