import { NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY || "ak_live_dev_test_master_key_astro2026";

// Reference location for the public-site "today's Panchang" info ticker.
// Panchang isn't tied to any visitor's birth data, but the backend still
// requires a lat/lon/tz — New Delhi is the same default used across the
// rest of the app (see demo/page.tsx's DEFAULT_PROFILE).
const DEFAULT_LOCATION = { lat: 28.6139, lon: 77.209, tz: 5.5 };

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const body = {
      dob: today,
      tob: "06:00",
      date: today,
      ...DEFAULT_LOCATION,
      lang: "en"
    };
    const headers = { "x-api-key": INTERNAL_API_KEY, "Content-Type": "application/json" };

    const [dailyRes, advancedRes, choghadiyaRes, sunMoonRes] = await Promise.all([
      axios.post(`${BACKEND_URL}/api/v1/panchang/daily`, body, { headers, timeout: 8000 }),
      axios.post(`${BACKEND_URL}/api/v1/panchang/advanced`, body, { headers, timeout: 8000 }),
      axios.post(`${BACKEND_URL}/api/v1/panchang/choghadiya`, body, { headers, timeout: 8000 }),
      axios.post(`${BACKEND_URL}/api/v1/core/sun-moon/timings`, body, { headers, timeout: 8000 })
    ]);

    const daily = dailyRes.data?.data || {};
    const advanced = advancedRes.data?.data || {};
    const choghadiya = choghadiyaRes.data?.data || {};
    const sunMoon = sunMoonRes.data?.data || {};

    return NextResponse.json({
      status: "success",
      date: today,
      location: "New Delhi, India",
      vaar: daily.vaar?.name || null,
      tithi: daily.tithi || null,
      nakshatra: daily.nakshatra || null,
      yoga: daily.yoga || null,
      karana: daily.karana || null,
      rahu_kaal: advanced.rahu_kaal || null,
      yamaghanda: advanced.yamaghanda || null,
      gulika: advanced.gulika || null,
      abhijit: advanced.abhijit_muhurat || null,
      brahma_muhurat: advanced.brahma_muhurat || null,
      choghadiya: choghadiya.slots || choghadiya.day_choghadiya || [],
      night_choghadiya: choghadiya.night_choghadiya || [],
      sun_moon: sunMoon
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to load today's panchang" },
      { status: 502 }
    );
  }
}
