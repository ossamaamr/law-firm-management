import { useEffect } from "react";

export function Analytics() {
  useEffect(() => {
    const endpoint = String(import.meta.env.VITE_ANALYTICS_ENDPOINT ?? "").trim();
    const websiteId = String(import.meta.env.VITE_ANALYTICS_WEBSITE_ID ?? "").trim();
    if (!endpoint || !websiteId) return;

    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(endpoint);
      if (parsedEndpoint.protocol !== "https:") return;
    } catch {
      return;
    }

    const script = document.createElement("script");
    script.defer = true;
    script.src = new URL("umami", `${parsedEndpoint.toString().replace(/\/$/, "")}/`).toString();
    script.dataset.websiteId = websiteId;
    script.dataset.autoTrack = "true";
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
