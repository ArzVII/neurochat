import { useEffect, useState } from "react";

export function useAppPath() {
  const [path, setPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  useEffect(() => {
    const onNav = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  return path;
}

export function navigateTo(path) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
