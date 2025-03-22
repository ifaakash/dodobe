export function parseUserAgent(userAgent: string) {
    // Simple user agent parser - in production, consider using a library like ua-parser-js
    const device = userAgent.match(/Mobile|Android|iPhone|iPad|Windows Phone/i)
        ? "Mobile"
        : userAgent.match(/Tablet|iPad/i)
        ? "Tablet"
        : "Desktop";

    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    else if (userAgent.includes("MSIE") || userAgent.includes("Trident/"))
        browser = "Internet Explorer";

    return { device, browser };
}
