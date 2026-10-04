import { useState } from "react";
import { getCategoryMeta } from "../constants/categoryMeta";
import { imageSrc } from "../utils/image";

export default function MenuImage({ url, category, variant = "card", size = 44 }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = imageSrc(url);
  const showPhoto = src && failedSrc !== src;
  const isThumb = variant === "thumb";

  const box = isThumb
    ? { width: size, height: size, flexShrink: 0, borderRadius: 6 }
    : { width: "100%", aspectRatio: "4 / 3", borderRadius: 8 };

  if (showPhoto) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        style={{ ...box, objectFit: "cover", display: "block", background: "#f3f4f6" }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...box, display: "grid", placeItems: "center", background: "#f3f4f6", fontSize: isThumb ? size * 0.5 : 36 }}
    >
      {getCategoryMeta(category).icon}
    </span>
  );
}