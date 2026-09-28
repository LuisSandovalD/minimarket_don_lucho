import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { escapeHtml } from "@/lib/security";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import { proxy } from "@/proxy";

function request(path: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) {
  return new NextRequest(`https://minimarket.test${path}`, init);
}

describe("security hardening", () => {
  it("escapes executable HTML from stored values", () => {
    const malicious = `<img src=x onerror="alert('xss')"><script>alert(1)</script>&"`;
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<script>");
    expect(escaped).not.toContain("<img");
    expect(escaped).toContain("&lt;script&gt;");
    expect(escaped).toContain("&lt;img");
    expect(escaped).toContain("&amp;");
    expect(escaped).toContain("&quot;");
  });

  it("extracts the first trusted proxy IP candidate", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("redirects protected pages without a session", () => {
    const response = proxy(request("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://minimarket.test/login");
  });

  it("rejects cross-site API writes", async () => {
    const response = proxy(request("/api/sales", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
        "x-forwarded-for": "198.51.100.10"
      }
    }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "INVALID_ORIGIN" });
  });

  it("rejects oversized API requests before reaching route handlers", async () => {
    const response = proxy(request("/api/sales", {
      method: "POST",
      headers: {
        origin: "https://minimarket.test",
        "sec-fetch-site": "same-origin",
        "content-length": String(6 * 1024 * 1024 + 1),
        "x-forwarded-for": "198.51.100.11"
      }
    }));
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });

  it("rate-limits abusive API write bursts", async () => {
    let response: Response | undefined;
    for (let i = 0; i < 61; i++) {
      response = proxy(request("/api/sales", {
        method: "POST",
        headers: {
          origin: "https://minimarket.test",
          "sec-fetch-site": "same-origin",
          "x-forwarded-for": "198.51.100.12"
        }
      }));
    }
    expect(response?.status).toBe(429);
    await expect(response?.json()).resolves.toMatchObject({ code: "RATE_LIMITED" });
    expect(response?.headers.get("retry-after")).toBe("60");
  });
});
