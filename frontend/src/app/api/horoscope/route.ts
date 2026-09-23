import { NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY || "ak_live_dev_test_master_key_astro2026";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily"; // daily | weekly | yearly
    const lang = searchParams.get("lang") || "hi";
    const today = new Date().toISOString().slice(0, 10);

    const body = {
      dob: today,
      tob: "06:00",
      date: today,
      lat: 28.6139,
      lon: 77.209,
      tz: 5.5,
      lang
    };
    const headers = { "x-api-key": INTERNAL_API_KEY, "Content-Type": "application/json" };

    let endpoint = "/api/v1/panchang/horoscope/daily";
    if (period === "weekly") endpoint = "/api/v1/panchang/horoscope/weekly";
    if (period === "monthly") endpoint = "/api/v1/panchang/horoscope/monthly";
    if (period === "yearly") endpoint = "/api/v1/panchang/horoscope/yearly";

    const res = await axios.post(`${BACKEND_URL}${endpoint}`, body, { headers, timeout: 9000 });
    const resData = res.data?.data || {};

    return NextResponse.json({
      status: "success",
      period,
      language: lang,
      data: resData
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to load horoscope data" },
      { status: 502 }
    );
  }
}
