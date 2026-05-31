"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Sub-component that handles tracking with searchParams safely wrapped in Suspense
function TrackerCore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Avoid running on server side
    if (typeof window === "undefined") return;

    // Helper: Geolocation with 3 free services (Main + 2 fallbacks)
    const fetchGeoData = async () => {
      // 1. Check SessionStorage to avoid duplicate geolocation calls within the same session
      const cached = sessionStorage.getItem("heinze_geo_cache");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }

      // Service 1 (Main): ipapi.co
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            const result = {
              ip: data.ip,
              country: data.country_name || "Unknown",
              city: data.city || "Unknown",
              region: data.region || "Unknown",
              org: data.org || "Unknown"
            };
            sessionStorage.setItem("heinze_geo_cache", JSON.stringify(result));
            return result;
          }
        }
      } catch (e) {
        console.warn("Analytics Tracker: Service 1 (ipapi.co) failed. Trying Fallback 1...", e);
      }

      // Service 2 (Fallback 1): ipwho.is
      try {
        const res = await fetch("https://ipwho.is/");
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            const result = {
              ip: data.ip,
              country: data.country || "Unknown",
              city: data.city || "Unknown",
              region: data.region || "Unknown",
              org: data.connection?.isp || data.connection?.org || "Unknown"
            };
            sessionStorage.setItem("heinze_geo_cache", JSON.stringify(result));
            return result;
          }
        }
      } catch (e) {
        console.warn("Analytics Tracker: Service 2 (ipwho.is) failed. Trying Fallback 2...", e);
      }

      // Service 3 (Fallback 2): freeipapi.com
      try {
        const res = await fetch("https://freeipapi.com/api/json");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const result = {
              ip: data.ipAddress || "Unknown",
              country: data.countryName || "Unknown",
              city: data.cityName || "Unknown",
              region: data.regionName || "Unknown",
              org: "FreeIPAPI"
            };
            sessionStorage.setItem("heinze_geo_cache", JSON.stringify(result));
            return result;
          }
        }
      } catch (e) {
        console.error("Analytics Tracker: Geolocation services fully exhausted.", e);
      }

      // Fallback response
      return {
        ip: "Unknown",
        country: "Unknown",
        city: "Unknown",
        region: "Unknown",
        org: "Unknown"
      };
    };

    // Helper: Parse Device and browser
    const getDeviceDetails = () => {
      const ua = navigator.userAgent;
      
      let device = "Desktop";
      if (/tablet|ipad|playbook|silk/i.test(ua.toLowerCase())) {
        device = "Tablet";
      } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua.toLowerCase())) {
        device = "Mobile";
      }

      let browser = "Other";
      if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) browser = "Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edg") || ua.includes("Edge")) browser = "Edge";
      else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

      let os = "Other";
      if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("Linux")) os = "Linux";

      return { device, browser, os };
    };

    // Helper: Referrer Domain
    const getReferrer = () => {
      const ref = document.referrer;
      if (!ref) return "Direct";
      try {
        const url = new URL(ref);
        if (url.hostname === window.location.hostname) {
          return "Internal";
        }
        return url.hostname;
      } catch (_) {
        return "Direct";
      }
    };

    // Session IDs
    let sessionId = sessionStorage.getItem("heinze_analytics_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("heinze_analytics_session_id", sessionId);
    }

    let visitorId = localStorage.getItem("heinze_analytics_visitor_id");
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("heinze_analytics_visitor_id", visitorId);
    }

    // Determine path type
    let pageType = "other";
    let entityId = "";

    if (pathname === "/") {
      pageType = "home";
    } else if (pathname.startsWith("/articles/")) {
      pageType = "article";
      entityId = pathname.replace("/articles/", "");
    } else if (pathname.startsWith("/books/")) {
      pageType = "book";
      entityId = pathname.replace("/books/", "");
    } else if (pathname === "/articles") {
      pageType = "articles_index";
    } else if (pathname === "/books") {
      pageType = "books_index";
    }

    // Send payload
    const sendTrackingPayload = async () => {
      const geo = await fetchGeoData();
      const deviceDetails = getDeviceDetails();
      const referrer = getReferrer();

      const body = {
        ip: geo.ip,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        connection_org: geo.org,
        device: deviceDetails.device,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        referrer,
        page_path: pathname,
        page_type: pageType,
        entity_id: entityId,
        session_id: sessionId,
        visitor_id: visitorId,
        user_agent: navigator.userAgent
      };

      try {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } catch (err) {
        console.error("Analytics Tracker: Error posting tracking payload", err);
      }
    };

    // Debounce track call slightly to allow layout to settle
    const trackTimeout = setTimeout(() => {
      sendTrackingPayload();
    }, 500);

    return () => clearTimeout(trackTimeout);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerCore />
    </Suspense>
  );
}
