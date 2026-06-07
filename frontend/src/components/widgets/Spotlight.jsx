import React, { useEffect, useRef } from "react";

/**
 * Wrap any block with this to get a moving radial highlight on hover.
 */
export default function Spotlight({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Tag ref={ref} className={`spotlight ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
