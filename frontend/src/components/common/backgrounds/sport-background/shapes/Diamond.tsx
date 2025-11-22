import React from "react";

export default function Diamond() {
  return (
    <div className="relative size-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d="M10 2 L18 10 L10 18 L2 10 Z" fill="var(--fill-0, #ED413E)" opacity="0.8" />
      </svg>
    </div>
  );
}

