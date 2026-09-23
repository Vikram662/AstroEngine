"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Copy, 
  Check, 
  ExternalLink,
  Code2,
  Terminal
} from "lucide-react";

interface ApiEndpointDoc {
  module: string;
  name: string;
  method: "POST" | "GET";
  path: string;
  description: string;
  samplePayload: Record<string, unknown>;
}

const API_DOCS: ApiEndpointDoc[] = [
  {
    module: "Parashari Kundli",
    name: "Lagna Kundli (D1)",
    method: "POST",
    path: "/api/v1/parashari/chart/d1",
    description: "Calculates Primary Lagna Kundli, 12 Bhavas, Ascendant degree, and planetary occupancy.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "en"
    }
  },
  {
    module: "Parashari Kundli",
    name: "Navamsha Chart (D9)",
    method: "POST",
    path: "/api/v1/parashari/chart/d9",
    description: "Calculates D9 Navamsha chart used for spouse, dharma, and planetary inner strength.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "hi"
    }
  },
  {
    module: "Panchang & Muhurat",
    name: "Daily Panchang",
    method: "POST",
    path: "/api/v1/panchang/daily",
    description: "High-precision Tithi with elapsed percent, Vaar Lord, Nakshatra, 27 Yogas, and 11 Karanas.",
    samplePayload: {
      dob: "2026-09-16",
      tob: "06:00",
      lat: 28.6139,
      lon: 77.2090,
      tz: 5.5,
      lang: "hi"
    }
  },
  {
    module: "Dasha Engine",
    name: "Current Running Dasha",
    method: "POST",
    path: "/api/v1/dasha/vimshottari/current",
    description: "Computes active Mahadasha, Antardasha, and Pratyantardasha (MD > AD > PD).",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "en"
    }
  },
  {
    module: "Matchmaking",
    name: "Ashtakoota 36-Guna",
    method: "POST",
    path: "/api/v1/matchmaking/ashtakoota",
    description: "36-Guna scoring with Nadi Dosha cancellation rules and detailed compatibility.",
    samplePayload: {
      boy: { dob: "1994-08-12", tob: "10:15", lat: 28.6139, lon: 77.2090, tz: 5.5 },
      girl: { dob: "1996-03-24", tob: "18:45", lat: 19.0760, lon: 72.8777, tz: 5.5 },
      lang: "en"
    }
  },
  {
    module: "AI Astrologer",
    name: "AI Astro Consultation",
    method: "POST",
    path: "/api/v1/ai/consult",
    description: "Natural language astrological consultation combining classical Parashari rules, active Vimshottari Dasha, and personalized remedies in 5 languages.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "hi",
      question: "Will I get a promotion or job change in the next 1 year?",
      category: "career"
    }
  },
  {
    module: "Panchang & Muhurat",
    name: "Day & Night 16 Choghadiya",
    method: "POST",
    path: "/api/v1/panchang/choghadiya",
    description: "Calculates daytime and nighttime 16 dynamic Choghadiya Muhurat slots (Amrit, Shubh, Labh, Char, Rog, Kaal, Udveg) based on sunrise-sunset.",
    samplePayload: {
      dob: "2026-09-20",
      tob: "12:00",
      lat: 28.6139,
      lon: 77.2090,
      tz: 5.5,
      lang: "hi"
    }
  },
  {
    module: "Panchang & Muhurat",
    name: "12 Rashis Daily Horoscope",
    method: "POST",
    path: "/api/v1/panchang/horoscope/daily",
    description: "Predicts real-time daily career, finance, love, and health outcomes for all 12 Rashis based on Moon transit.",
    samplePayload: {
      rashi: "mesh",
      lang: "hi"
    }
  },
  {
    module: "Tarot Consultation",
    name: "Tarot Oracle Draw",
    method: "POST",
    path: "/api/v1/tarot/draw",
    description: "Draws cards from the 78 Rider-Waite Tarot deck with upright/reversed interpretations for Daily Card, 3-Card Spread, or Celtic Cross.",
    samplePayload: {
      spread: "three_card",
      question: "What does my relationship future look like?"
    }
  },
  {
    module: "Vedic MahaVastu",
    name: "16-Zone MahaVastu Evaluation",
    method: "POST",
    path: "/api/v1/vastu/evaluate",
    description: "Evaluates room placements and colors against the 16 compass zones (NE, SE, SW, SSW, etc.) and detects elemental imbalances.",
    samplePayload: {
      property_type: "residential",
      facing_direction: "East",
      rooms: [
        { room_type: "kitchen", zone: "SE", color: "Orange" },
        { room_type: "master_bedroom", zone: "SW", color: "Cream" },
        { room_type: "pooja_mandir", zone: "NE", color: "White" }
      ]
    }
  },
  {
    module: "Dosha Suite",
    name: "Manglik Dosha with Cancellations",
    method: "POST",
    path: "/api/v1/dosha/manglik",
    description: "Evaluates Kuja Dosha from Lagna, Moon, and Venus with 12 classical BPHS cancellation exceptions.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "hi"
    }
  },
  {
    module: "Dosha Suite",
    name: "Saturn Sade Sati & Dhaiya Status",
    method: "POST",
    path: "/api/v1/dosha/sade-sati/status",
    description: "Evaluates active Saturn Sade Sati transit relative to Janma Rashi, current phase, and Ashtama/Kantaka Dhaiya.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "en"
    }
  },
  {
    module: "KP System",
    name: "KP Planets & Sub-Lords",
    method: "POST",
    path: "/api/v1/kp/planets",
    description: "Krishnamurti Paddhati Sign Lords, Star Lords (Nakshatra), and Sub-Lords calculated using Placidus house system.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "en"
    }
  },
  {
    module: "Lal Kitab",
    name: "Lal Kitab Kalpurush Kundli & Debts",
    method: "POST",
    path: "/api/v1/lalkitab/chart/kundli",
    description: "Computes fixed Kalpurush house placements, sleeping houses/planets, and 6 ancestral debts (Rin).",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5
    }
  },
  {
    module: "Numerology",
    name: "Comprehensive Lo Shu & Forecast",
    method: "POST",
    path: "/api/v1/numerology/comprehensive",
    description: "Calculates Mulank, Bhagyank, Chaldean Namank, 3x3 Lo Shu Magic Grid 8 Planes, and multi-year Personal Year forecasts.",
    samplePayload: {
      name: "Rohit Sharma",
      dob: "1987-04-30"
    }
  },
  {
    module: "Western Astrology",
    name: "Tropical Big Three & Aspects",
    method: "POST",
    path: "/api/v1/western/big-three",
    description: "Calculates Sun, Moon, and Rising signs on the tropical Sayana zodiac along with major planetary aspects.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5
    }
  },
  {
    module: "Astrological Remedies",
    name: "Vedic Gemstone Recommendations",
    method: "POST",
    path: "/api/v1/remedies/gemstones",
    description: "Recommends Life Stone, Lucky Stone, and Benefic Stone with explicit Maraka/Badhaka conflict cautions.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "hi"
    }
  },
  {
    module: "PDF Reports",
    name: "Async Kundli PDF Generator",
    method: "POST",
    path: "/api/v1/pdf/kundli/basic",
    description: "Generates 15–20 page print-ready branded Kundli PDF report (Async Queue).",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "en",
      branding: {
        company_name: "Astrology Studio",
        logo_url: "https://example.com/logo.png",
        primary_color: "#4f46e5"
      }
    }
  },
  {
    module: "PDF Reports",
    name: "Grand Brihat Kundli PDF (80+ Pages)",
    method: "POST",
    path: "/api/v1/pdf/kundli/brihat",
    description: "Generates 60–100 page grand encyclopedic Kundli PDF with all harmonic charts and dasha trees.",
    samplePayload: {
      dob: "1995-10-05",
      tob: "14:30",
      lat: 24.5854,
      lon: 73.7125,
      tz: 5.5,
      lang: "hi",
      branding: {
        company_name: "Astrology Studio",
        logo_url: "https://example.com/logo.png"
      }
    }
  },
  {
    module: "PDF Reports",
    name: "Poll Report Job Status & Download URL",
    method: "GET",
    path: "/api/v1/pdf/status/pdf_job_sample123",
    description: "Poll status (PENDING / PROCESSING / COMPLETED) and fetch Cloudflare R2 download URL.",
    samplePayload: {}
  }
];

export default function DocumentationPage() {
  const [activeDoc, setActiveDoc] = useState<ApiEndpointDoc>(API_DOCS[0]);
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "python" | "php">("curl");
  const [copied, setCopied] = useState(false);

  const getSnippet = () => {
    const payloadStr = JSON.stringify(activeDoc.samplePayload, null, 2);
    const apiBaseUrl = (process.env.NEXT_PUBLIC_ASTRO_ENGINE_URL || "").replace(/\/$/, "");

    if (activeTab === "curl") {
      return `curl -X ${activeDoc.method} "${apiBaseUrl}${activeDoc.path}" \\
  -H "x-api-key: ak_live_your_api_token" \\
  -H "Content-Type: application/json" \\
  -d '${payloadStr}'`;
    }
    if (activeTab === "node") {
      return `import axios from 'axios';

const response = await axios.${activeDoc.method.toLowerCase()}('${apiBaseUrl}${activeDoc.path}', 
  ${payloadStr},
  {
    headers: {
      'x-api-key': 'ak_live_your_api_token',
      'Content-Type': 'application/json'
    }
  }
);
console.log(response.data);`;
    }
    if (activeTab === "python") {
      return `import requests

url = "${apiBaseUrl}${activeDoc.path}"
headers = {
    "x-api-key": "ak_live_your_api_token",
    "Content-Type": "application/json"
}
payload = ${payloadStr}

response = requests.${activeDoc.method.toLowerCase()}(url, json=payload, headers=headers)
print(response.json())`;
    }
    return `<?php
$ch = curl_init("${apiBaseUrl}${activeDoc.path}");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => '${payloadStr}',
    CURLOPT_HTTPHEADER => [
        'x-api-key: ak_live_your_api_token',
        'Content-Type: application/json'
    ]
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apiBaseUrl = `${process.env.NEXT_PUBLIC_ASTRO_ENGINE_URL}`;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-line text-xs font-semibold text-accent mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>डेवलपर API संदर्भ • 135 Production Endpoints</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">API Documentation</h1>
            <p className="text-ink-soft text-xs sm:text-sm mt-1">
              cURL, Node.js, Python और PHP कोड नमूनों के साथ पूर्ण API संदर्भ।
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/postman_collection.json"
              download="AstroEngine_Postman_Collection.json"
              className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Download Postman</span>
              <ExternalLink className="w-3 h-3 text-white/80" />
            </a>
            <a
              href={`${apiBaseUrl}/documentation`}
              target="_blank"
              rel="noreferrer"
              id="redoc-link"
              className="px-3.5 py-2 rounded-xl bg-card hover:bg-surface-alt border border-line text-ink text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>ReDoc Reference</span>
              <ExternalLink className="w-3 h-3 text-ink-muted" />
            </a>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Endpoints Nav Sidebar */}
          <div className="lg:col-span-4 space-y-1">
            <div className="text-[11px] font-bold uppercase text-ink-muted tracking-wider mb-2 px-2">
              प्रमुख एंडपॉइंट्स (Common Endpoints)
            </div>
            {API_DOCS.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDoc(doc)}
                className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                  activeDoc.path === doc.path
                    ? "bg-card border-accent text-accent shadow-xs font-semibold"
                    : "bg-transparent border-transparent text-ink-soft hover:text-ink hover:bg-surface-alt"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>{doc.name}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-alt text-ink border border-line">
                    {doc.method}
                  </span>
                </div>
                <div className="text-[11px] text-ink-muted font-mono mt-0.5 truncate">
                  {doc.path}
                </div>
              </button>
            ))}
          </div>

          {/* Documentation Details & Code Snippets */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-2xl border border-line bg-card shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
                  {activeDoc.method}
                </span>
                <span className="font-mono text-xs text-ink font-bold">{activeDoc.path}</span>
              </div>
              <p className="text-ink-soft text-xs leading-relaxed">
                {activeDoc.description}
              </p>
              <div className="text-[11px] text-ink-muted pt-2 border-t border-line font-mono">
                Header: <code className="text-accent font-semibold">x-api-key: ak_live_...</code> आवश्यक है
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="rounded-2xl border border-line bg-zinc-950 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {(["curl", "node", "python", "php"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-lg uppercase transition font-semibold cursor-pointer ${
                        activeTab === tab ? "bg-accent text-white" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition text-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <pre className="p-4 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
                {getSnippet()}
              </pre>
            </div>
          </div>
        </div>

        {/* ReDoc Full API Reference Section */}
        <div id="redoc" className="mt-14 pt-10 border-t border-line">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-ink">Full Interactive ReDoc Reference</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                पूर्ण 135+ एंडपॉइंट्स, स्कीमा और अनुरोध/प्रतिक्रिया मॉडल्स के साथ इंटरैक्टिव OpenAPI डॉक्यूमेंटेशन।
              </p>
            </div>
          </div>
          <div className="bg-card border border-line rounded-2xl p-8 text-center shadow-xs">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-soft text-accent mb-4">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1.5">कस्टम ReDoc — सम्पूर्ण API संदर्भ</h3>
            <p className="text-xs text-ink-soft mb-6 max-w-md mx-auto leading-relaxed">
              FastAPI बैकएंड द्वारा संचालित संपूर्ण 135 लाइव एंडपॉइंट्स की विस्तृत जांच, पैरामीटर्स और स्कीमा देखने के लिए ReDoc खोलें।
            </p>
            <a
              href={`${apiBaseUrl}/documentation`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition shadow-xs"
            >
              <span>ReDoc डॉक्यूमेंटेशन खोलें</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
