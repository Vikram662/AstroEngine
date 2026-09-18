"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Copy, 
  Check, 
  ExternalLink
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

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState<ApiEndpointDoc>(API_DOCS[0]);
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "python" | "php">("curl");
  const [copied, setCopied] = useState(false);

  const getSnippet = () => {
    const payloadStr = JSON.stringify(activeDoc.samplePayload, null, 2);
    const apiBaseUrl = (process.env.NEXT_PUBLIC_ASTRO_ENGINE_URL || "http://localhost:8000").replace(/\/$/, "");

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

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">API Documentation</h1>
            <p className="text-zinc-600 text-xs sm:text-sm mt-0.5">
              117 production endpoints with code samples in cURL, Node.js, Python, and PHP.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/postman_collection.json"
              download="AstroEngine_Postman_Collection.json"
              className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Download Postman Collection</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_ASTRO_ENGINE_URL || "http://localhost:8000"}/documentation`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-md bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <span>Documentation</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Endpoints Nav Sidebar */}
          <div className="lg:col-span-4 space-y-1">
            <div className="text-[11px] font-mono font-semibold uppercase text-zinc-400 tracking-wider mb-2 px-2">
              Common Endpoints
            </div>
            {API_DOCS.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDoc(doc)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  activeDoc.path === doc.path
                    ? "bg-white border-zinc-300 text-zinc-900 shadow-xs font-medium"
                    : "bg-transparent border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>{doc.name}</span>
                  <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {doc.method}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                  {doc.path}
                </div>
              </button>
            ))}
          </div>

          {/* Documentation Details & Code Snippets */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                  {activeDoc.method}
                </span>
                <span className="font-mono text-xs text-zinc-900 font-semibold">{activeDoc.path}</span>
              </div>
              <p className="text-zinc-600 text-xs leading-relaxed">
                {activeDoc.description}
              </p>
              <div className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 font-mono">
                Header: <code className="text-zinc-800">x-api-key: ak_live_...</code> required
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  {(["curl", "node", "python", "php"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 rounded uppercase transition ${
                        activeTab === tab ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white transition text-xs font-sans"
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
      </div>
    </div>
  );
}
