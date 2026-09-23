"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Sparkles,
  Compass,
  Calendar,
  Sun,
  Moon,
  ShieldAlert,
  HeartHandshake,
  Hash,
  Flame,
  BookOpen,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Award,
  Clock,
  MapPin,
  FileDown,
  ChevronDown,
  ChevronRight,
  Layers,
  Table,
  X,
  ArrowLeft,
  Star,
  Bot,
  MessageSquare,
  Send,
  ExternalLink
} from "lucide-react";

import { OverviewTab } from "./components/OverviewTab";
import { AiAstrologerTab } from "./components/AiAstrologerTab";
import { KundliTab } from "./components/KundliTab";
import { PlanetsTab } from "./components/PlanetsTab";
import { PanchangTab } from "./components/PanchangTab";
import { DashaTab } from "./components/DashaTab";
import { YogasTab } from "./components/YogasTab";
import { DoshaTab } from "./components/DoshaTab";
import { MatchingTab } from "./components/MatchingTab";
import { NumerologyTab } from "./components/NumerologyTab";
import { WesternTab } from "./components/WesternTab";
import { RemediesTab } from "./components/RemediesTab";
import { KpTab } from "./components/KpTab";
import { LalKitabTab } from "./components/LalKitabTab";
import { TajikTab } from "./components/TajikTab";
import { PdfTab } from "./components/PdfTab";
import { HoroscopeTab } from "./components/HoroscopeTab";
import { TarotTab } from "./components/TarotTab";
import { VastuTab } from "./components/VastuTab";
import { DEMO_TRANSLATIONS, SupportedLang } from "./i18n";

interface BirthProfile {
  name: string;
  dob: string;
  tob: string;
  lat: number;
  lon: number;
  tz: number;
  cityName: string;
  lang: string;
}

const DEFAULT_PROFILE: BirthProfile = {
  name: "Aaditya Sharma",
  dob: "1995-10-05",
  tob: "14:30",
  lat: 28.6139,
  lon: 77.2090,
  tz: 5.5,
  cityName: "New Delhi, India",
  lang: "hi"
};

const POPULAR_CITIES = [
  { name: "New Delhi, India", lat: 28.6139, lon: 77.2090, tz: 5.5 },
  { name: "Mumbai, India", lat: 19.0760, lon: 72.8777, tz: 5.5 },
  { name: "Bengaluru, India", lat: 12.9716, lon: 77.5946, tz: 5.5 },
  { name: "Kolkata, India", lat: 22.5726, lon: 88.3639, tz: 5.5 },
  { name: "Varanasi, India", lat: 25.3176, lon: 82.9739, tz: 5.5 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278, tz: 1.0 },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060, tz: -4.0 }
];

const VARGA_CHARTS = [
  { id: "D1", name: "Lagna / Rashi", hindi: "लग्न कुंडली", desc: "Physical body, vitality, general life path" },
  { id: "D2", name: "Hora", hindi: "होरा कुंडली", desc: "Wealth, assets, financial prosperity" },
  { id: "D3", name: "Drekkana", hindi: "द्रेष्काण कुंडली", desc: "Siblings, courage, motivation & energy" },
  { id: "D4", name: "Chaturthamsha", hindi: "चतुर्थांश कुंडली", desc: "Fixed assets, property, home & luck" },
  { id: "D7", name: "Saptamsha", hindi: "सप्तांश कुंडली", desc: "Children, progeny & lineage prosperity" },
  { id: "D9", name: "Navamsha", hindi: "नवांश कुंडली", desc: "Dharma, marriage, spouse profile & destiny" },
  { id: "D10", name: "Dashamsha", hindi: "दशांश कुंडली", desc: "Career, profession, power, social status" },
  { id: "D12", name: "Dwadashamsha", hindi: "द्वादशांश कुंडली", desc: "Parents, ancestral lineage & heritage" },
  { id: "D16", name: "Shodashamsha", hindi: "षोडशांश कुंडली", desc: "Vehicles, conveyances, material pleasures" },
  { id: "D20", name: "Vimshamsha", hindi: "विंशांश कुंडली", desc: "Spiritual progress, upasana, meditation" },
  { id: "D24", name: "Chaturvimshamsha", hindi: "चतुर्विंशांश कुंडली", desc: "Higher learning, knowledge, wisdom" },
  { id: "D27", name: "Saptavimshamsha", hindi: "सप्तविंशांश कुंडली", desc: "Inherent strengths, fortitude, subconscious" },
  { id: "D30", name: "Trimshamsha", hindi: "त्रिंशांश कुंडली", desc: "Misfortunes, health challenges, arishta" },
  { id: "D40", name: "Khavedamsha", hindi: "खवेदांश कुंडली", desc: "Auspicious & inauspicious karmic effects" },
  { id: "D45", name: "Akshavedamsha", hindi: "अक्षवेदांश कुंडली", desc: "General morality, character & uprightness" },
  { id: "D60", name: "Shashtiamsha", hindi: "षष्ट्यांश कुंडली", desc: "Past-life karma & ultimate precision" }
];

export default function LiveDemoApp() {
  const [profile, setProfile] = useState<BirthProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Live calculation results
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stored API Data from 135 Engines
  const [d1Chart, setD1Chart] = useState<any>(null);
  const [d9Chart, setD9Chart] = useState<any>(null);
  const [svgChartD1, setSvgChartD1] = useState<string>("");
  const [svgChartD9, setSvgChartD9] = useState<string>("");
  const [chartStyle, setChartStyle] = useState<"NORTH_INDIAN" | "SOUTH_INDIAN">("NORTH_INDIAN");
  const [selectedVarga, setSelectedVarga] = useState<string>("D1");
  const [vargaSvgMap, setVargaSvgMap] = useState<Record<string, string>>({});
  const [vargaLoading, setVargaLoading] = useState<boolean>(false);
  const [sarvashtakData, setSarvashtakData] = useState<any>(null);
  const [bhinnashtakData, setBhinnashtakData] = useState<any>(null);
  const [planets, setPlanets] = useState<any[]>([]);
  const [panchang, setPanchang] = useState<any>(null);
  const [choghadiya, setChoghadiya] = useState<any>(null);
  const [currentDasha, setCurrentDasha] = useState<any>(null);
  const [fullMahadashas, setFullMahadashas] = useState<any[]>([]);
  const [antardashas, setAntardashas] = useState<any[]>([]);
  const [selectedMdForAd, setSelectedMdForAd] = useState<string>("JUPITER");

  // 5-Level Interactive Drilldown (MD -> AD -> PD -> SD -> PR)
  const [dashaDrillLevel, setDashaDrillLevel] = useState<number>(1); // 1: MD, 2: AD, 3: PD, 4: SD, 5: PR
  const [selectedMdObj, setSelectedMdObj] = useState<any>(null);
  const [selectedAdObj, setSelectedAdObj] = useState<any>(null);
  const [selectedPdObj, setSelectedPdObj] = useState<any>(null);
  const [selectedSdObj, setSelectedSdObj] = useState<any>(null);

  const [currentLevelList, setCurrentLevelList] = useState<any[]>([]);
  const [drillLoading, setDrillLoading] = useState<boolean>(false);
  const [yoginiDasha, setYoginiDasha] = useState<any>(null);
  const [parashariYogas, setParashariYogas] = useState<any[]>([]);
  const [shadbalaDetails, setShadbalaDetails] = useState<any>(null);
  const [sadeSatiStatus, setSadeSatiStatus] = useState<any>(null);
  const [pitraDosha, setPitraDosha] = useState<any>(null);
  const [guruChandal, setGuruChandal] = useState<any>(null);
  const [manglikData, setManglikData] = useState<any>(null);
  const [kaalSarpData, setKaalSarpData] = useState<any>(null);
  const [numerology, setNumerology] = useState<any>(null);
  const [loshuGrid, setLoshuGrid] = useState<any>(null);
  const [gemstones, setGemstones] = useState<any>(null);
  const [rudrakshaList, setRudrakshaList] = useState<any[]>([]);
  const [mantrasList, setMantrasList] = useState<any[]>([]);
  const [fastingRecs, setFastingRecs] = useState<any>(null);
  const [donationsRecs, setDonationsRecs] = useState<any>(null);
  const [westernData, setWesternData] = useState<any>(null);
  const [westernWheelSvg, setWesternWheelSvg] = useState<string>("");
  const [kpPlanets, setKpPlanets] = useState<any[]>([]);
  const [kpCusps, setKpCusps] = useState<any[]>([]);
  const [kpChartSvg, setKpChartSvg] = useState<string>("");
  const [kpSignificators, setKpSignificators] = useState<any[]>([]);
  const [kpRulingPlanets, setKpRulingPlanets] = useState<any>(null);
  const [lalKitabData, setLalKitabData] = useState<any>(null);
  const [lalKitabChartSvg, setLalKitabChartSvg] = useState<string>("");
  const [lalKitabRemedies, setLalKitabRemedies] = useState<any[]>([]);
  const [jaiminiKarakas, setJaiminiKarakas] = useState<any[]>([]);
  const [tajikVarshphal, setTajikVarshphal] = useState<any>(null);
  const [vargaD10, setVargaD10] = useState<any>(null);
  const [chandraKundli, setChandraKundli] = useState<any>(null);

  // ── NEW: All remaining pending API states ──
  // Core Astronomy extras
  const [retrogradeData, setRetrogradeData] = useState<any>(null);
  const [sunMoonTimings, setSunMoonTimings] = useState<any>(null);
  const [ayanamsaData, setAyanamsaData] = useState<any>(null);
  const [houseCusps, setHouseCusps] = useState<any>(null);
  // Panchang extras
  const [panchangAdvanced, setPanchangAdvanced] = useState<any>(null);
  const [horaData, setHoraData] = useState<any>(null);
  const [bhadraData, setBhadraData] = useState<any>(null);
  const [panchakData, setPanchakData] = useState<any>(null);
  const [monthlyCalendar, setMonthlyCalendar] = useState<any>(null);
  const [marriageMuhurat, setMarriageMuhurat] = useState<any>(null);
  const [grihaProveshMuhurat, setGrihaPraveshMuhurat] = useState<any>(null);
  const [propertyMuhurat, setPropertyMuhurat] = useState<any>(null);
  // Parashari extras
  const [bhavChalit, setBhavChalit] = useState<any>(null);
  const [avasthasData, setAvasthasData] = useState<any>(null);
  const [bhavabalaData, setBhavabalaData] = useState<any>(null);
  const [specialPoints, setSpecialPoints] = useState<any>(null);
  // KP extras
  const [kpSignificatorsData, setKpSignificatorsData] = useState<any>(null);
  // Jaimini extras
  const [jaiminiPadas, setJaiminiPadas] = useState<any>(null);
  const [charaDasha, setCharaDasha] = useState<any>(null);
  // Tajik extras
  const [tajikYogas, setTajikYogas] = useState<any>(null);
  // Western extras
  const [westernTropicalPlanets, setWesternTropicalPlanets] = useState<any>(null);
  const [westernAspects, setWesternAspects] = useState<any>(null);
  const [westernSynastry, setWesternSynastry] = useState<any>(null);
  const [westernTransits, setWesternTransits] = useState<any>(null);
  const [westernSolarReturn, setWesternSolarReturn] = useState<any>(null);
  // Dosha extras
  const [grahaMaitri, setGrahaMaitri] = useState<any>(null);
  const [compatibilityScore, setCompatibilityScore] = useState<any>(null);
  // Remedies extras
  const [yantraData, setYantraData] = useState<any>(null);
  const [gemRestrictions, setGemRestrictions] = useState<any>(null);

  // Numerology extras (Module 10)
  const [missingNumbersData, setMissingNumbersData] = useState<any>(null);
  const [nameAnalysisData, setNameAnalysisData] = useState<any>(null);
  const [numerologyForecastData, setNumerologyForecastData] = useState<any>(null);
  const [pinnaclesData, setPinnaclesData] = useState<any>(null);
  const [favorableData, setFavorableData] = useState<any>(null);

  // ── PDF Engine (Module 12) state ──
  const [pdfJobs, setPdfJobs] = useState<Record<string, {
    jobId: string; status: string; reportType: string;
    pollUrl?: string; fileUrl?: string; error?: string;
  }>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});

  // ── Horoscope Tab state ──
  const [selectedRashi, setSelectedRashi] = useState<string>("mesh");
  const [rashiPeriod, setRashiPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [apiHoroscopeData, setApiHoroscopeData] = useState<Record<string, any>>({});
  const [horoscopeApiLoading, setHoroscopeApiLoading] = useState<boolean>(false);
  const [housePredictions, setHousePredictions] = useState<any>(null);
  const [namaksharData, setNamaksharData] = useState<any>(null);

  // ── Option 1: Advanced Astrological Engine States ──
  const [sadeSatiTimeline, setSadeSatiTimeline] = useState<any>(null);
  const [dashakootaData, setDashakootaData] = useState<any>(null);
  const [papasamyaData, setPapasamyaData] = useState<any>(null);
  const [matchExceptions, setMatchExceptions] = useState<any>(null);
  const [kpHorarySeed, setKpHorarySeed] = useState<number>(108);
  const [kpHoraryData, setKpHoraryData] = useState<any>(null);
  const [kpHoraryLoading, setKpHoraryLoading] = useState<boolean>(false);
  const [kpLevel4Significators, setKpLevel4Significators] = useState<any>(null);
  const [lalKitabBlind, setLalKitabBlind] = useState<any>(null);
  const [jaiminiKarakamsha, setJaiminiKarakamsha] = useState<any>(null);
  const [upagrahasData, setUpagrahasData] = useState<any>(null);
  const [tajikSahams, setTajikSahams] = useState<any>(null);

  // ── AI Astrologer Chat Engine States ──
  const [aiQuestion, setAiQuestion] = useState<string>("मेरी नौकरी में पदोन्नति और करियर में आगे क्या योग हैं?");
  const [aiChatHistory, setAiChatHistory] = useState<any[]>([]);
  const [aiChatLoading, setAiChatLoading] = useState<boolean>(false);
  const [aiQuickInsights, setAiQuickInsights] = useState<any>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState<boolean>(false);

  // ── Tarot Card Reading Suite States ──
  const [tarotQuestion, setTarotQuestion] = useState<string>("What energy is surrounding my career and life right now?");
  const [tarotSpreadMode, setTarotSpreadMode] = useState<"daily" | "3_card_time" | "3_card_mind" | "celtic_cross">("3_card_time");
  const [tarotLoading, setTarotLoading] = useState<boolean>(false);
  const [tarotDailyResult, setTarotDailyResult] = useState<any>(null);
  const [tarot3CardResult, setTarot3CardResult] = useState<any>(null);
  const [tarotCelticResult, setTarotCelticResult] = useState<any>(null);

  // ── Vastu Shastra Energy Engine States ──
  const [vastuPropertyFacing, setVastuPropertyFacing] = useState<string>("East");
  const [vastuPropertyType, setVastuPropertyType] = useState<string>("residential");
  const [vastuRooms, setVastuRooms] = useState<any[]>([
    { room_type: "pooja_mandir", zone: "NE", color: "White" },
    { room_type: "kitchen", zone: "SE", color: "Orange" },
    { room_type: "master_bedroom", zone: "SW", color: "Cream" },
    { room_type: "toilet", zone: "SSW", color: "Yellow" },
    { room_type: "locker", zone: "N", color: "Light Green" },
    { room_type: "living_room", zone: "E", color: "White" }
  ]);
  const [vastuLoading, setVastuLoading] = useState<boolean>(false);
  const [vastuEvaluationResult, setVastuEvaluationResult] = useState<any>(null);

  // Dynamic City Geo API Search (Module 1 — Endpoint 6 & 7)
  const [citySearchQuery, setCitySearchQuery] = useState<string>(DEFAULT_PROFILE.cityName);
  const [citySearchResults, setCitySearchResults] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);

  // Live city autocomplete function
  const searchCities = async (query: string) => {
    setCitySearchQuery(query);
    if (!query || query.trim().length < 2) {
      setCitySearchResults([]);
      setShowCityDropdown(false);
      return;
    }

    setIsSearchingCity(true);
    try {
      const res = await callProxy("/api/v1/core/geo/search", {}, { q: query.trim() }, "GET");
      if (res?.data?.results && Array.isArray(res.data.results)) {
        setCitySearchResults(res.data.results);
        setShowCityDropdown(res.data.results.length > 0);
      } else {
        setCitySearchResults([]);
      }
    } catch (err) {
      console.error("City search failed:", err);
      // Fallback filter on popular cities
      const qLower = query.toLowerCase();
      const localMatches = POPULAR_CITIES.filter(c => c.name.toLowerCase().includes(qLower)).map(c => ({
        city: c.name.split(",")[0],
        country: c.name.split(",")[1]?.trim() || "India",
        lat: c.lat,
        lon: c.lon,
        tz: c.tz
      }));
      setCitySearchResults(localMatches);
      setShowCityDropdown(localMatches.length > 0);
    } finally {
      setIsSearchingCity(false);
    }
  };

  // Select city from autocomplete dropdown
  const handleSelectGeoCity = (geoCity: any) => {
    const fullName = `${geoCity.city}, ${geoCity.country || "India"}`;
    setCitySearchQuery(fullName);
    setShowCityDropdown(false);

    const updatedProfile: BirthProfile = {
      ...profile,
      cityName: fullName,
      lat: Number(geoCity.lat),
      lon: Number(geoCity.lon),
      tz: Number(geoCity.tz ?? 5.5)
    };
    setProfile(updatedProfile);
    calculateAllData(updatedProfile);
  };

  // Matchmaking secondary profile
  const [partnerProfile, setPartnerProfile] = useState<BirthProfile>({
    name: "Priyanka Verma",
    dob: "1997-04-18",
    tob: "08:15",
    lat: 28.6139,
    lon: 77.2090,
    tz: 5.5,
    cityName: "New Delhi, India",
    lang: "hi"
  });
  const [matchmakingResult, setMatchmakingResult] = useState<any>(null);
  const [matchingLoading, setMatchingLoading] = useState<boolean>(false);

  // Fetch SVG for any selected Varga Chart
  const loadVargaSvg = async (vargaId: string, currentP: BirthProfile = profile, targetStyle: "NORTH_INDIAN" | "SOUTH_INDIAN" = chartStyle) => {
    const cacheKey = `${vargaId}_${targetStyle}`;
    if (vargaSvgMap[cacheKey]) return;
    setVargaLoading(true);
    try {
      const payload = {
        dob: currentP.dob,
        tob: currentP.tob,
        lat: currentP.lat,
        lon: currentP.lon,
        tz: currentP.tz,
        lang: currentP.lang
      };
      const svgRes = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/parashari/chart/svg",
        payload,
        queryParams: { varga: vargaId, chart_style: targetStyle },
        method: "POST"
      }, { responseType: "text" });
      if (svgRes.data && typeof svgRes.data === "string" && svgRes.data.includes("<svg")) {
        setVargaSvgMap(prev => ({ ...prev, [cacheKey]: svgRes.data, [vargaId]: svgRes.data }));
        if (vargaId === "D1") setSvgChartD1(svgRes.data);
        if (vargaId === "D9") setSvgChartD9(svgRes.data);
      }
    } catch (err) {
      console.error(`Failed to load SVG for ${vargaId}`, err);
    } finally {
      setVargaLoading(false);
    }
  };

  // 5-Level Dasha Drilldown Functions (MD -> AD -> PD -> SD -> PR)
  const drillIntoAd = async (md: any) => {
    setSelectedMdObj(md);
    setSelectedAdObj(null);
    setSelectedPdObj(null);
    setSelectedSdObj(null);
    setDashaDrillLevel(2);
    setDrillLoading(true);

    const planetKey = (md.planet_id || md.planet_name || "").toUpperCase();
    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        lang: profile.lang
      };
      const res = await callProxy("/api/v1/dasha/vimshottari/antardasha", payload, {
        planet: planetKey,
        start_date: md.start_date || "2020-01-01",
        end_date: md.end_date || "2036-01-01"
      });
      if (res?.data?.antardashas) {
        setCurrentLevelList(res.data.antardashas);
      }
    } catch (err) {
      console.error("Failed to load Antardashas for", planetKey, err);
    } finally {
      setDrillLoading(false);
    }
  };

  const drillIntoPd = async (ad: any) => {
    setSelectedAdObj(ad);
    setSelectedPdObj(null);
    setSelectedSdObj(null);
    setDashaDrillLevel(3);
    setDrillLoading(true);

    const mdPlanet = (selectedMdObj?.planet_id || "").toUpperCase();
    const adPlanet = (ad.antardasha || ad.planet_id || ad.planet || "").toUpperCase();
    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        lang: profile.lang
      };
      const res = await callProxy("/api/v1/dasha/vimshottari/pratyantar", payload, {
        mahadasha: mdPlanet,
        antardasha: adPlanet,
        start_date: ad.start_datetime || ad.start_date || "2024-01-01 00:00:00"
      });
      if (res?.data?.pratyantardashas) {
        setCurrentLevelList(res.data.pratyantardashas);
      }
    } catch (err) {
      console.error("Failed to load Pratyantardashas", err);
    } finally {
      setDrillLoading(false);
    }
  };

  const drillIntoSd = async (pd: any) => {
    setSelectedPdObj(pd);
    setSelectedSdObj(null);
    setDashaDrillLevel(4);
    setDrillLoading(true);

    const mdPlanet = (selectedMdObj?.planet_id || "").toUpperCase();
    const adPlanet = (selectedAdObj?.antardasha || selectedAdObj?.planet_id || selectedAdObj?.planet || "").toUpperCase();
    const pdPlanet = (pd.pratyantar_planet || pd.planet_id || pd.planet || "").toUpperCase();
    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        lang: profile.lang
      };
      const res = await callProxy("/api/v1/dasha/vimshottari/sookshma", payload, {
        mahadasha: mdPlanet,
        antardasha: adPlanet,
        pratyantar: pdPlanet,
        start_date: pd.start_datetime || pd.start_date || "2024-01-01 00:00:00"
      });
      if (res?.data?.sookshmadashas) {
        setCurrentLevelList(res.data.sookshmadashas);
      }
    } catch (err) {
      console.error("Failed to load Sookshma dashas", err);
    } finally {
      setDrillLoading(false);
    }
  };

  const drillIntoPr = async (sd: any) => {
    setSelectedSdObj(sd);
    setDashaDrillLevel(5);
    setDrillLoading(true);

    const mdPlanet = (selectedMdObj?.planet_id || "").toUpperCase();
    const adPlanet = (selectedAdObj?.antardasha || selectedAdObj?.planet_id || selectedAdObj?.planet || "").toUpperCase();
    const pdPlanet = (selectedPdObj?.pratyantar_planet || selectedPdObj?.planet_id || selectedPdObj?.planet || "").toUpperCase();
    const sdPlanet = (sd.sookshma_planet || sd.planet_id || sd.planet || "").toUpperCase();

    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        lang: profile.lang
      };
      const res = await callProxy("/api/v1/dasha/vimshottari/prana", payload, {
        mahadasha: mdPlanet,
        antardasha: adPlanet,
        pratyantar: pdPlanet,
        sookshma: sdPlanet,
        start_date: sd.start_datetime || sd.start_date || "2024-01-01 00:00:00"
      });
      if (res?.data?.pranadashas) {
        setCurrentLevelList(res.data.pranadashas);
      }
    } catch (err) {
      console.error("Failed to load Prana dashas", err);
    } finally {
      setDrillLoading(false);
    }
  };

  const navigateDashaBreadcrumb = (targetLevel: number) => {
    if (targetLevel === 1) {
      setDashaDrillLevel(1);
      setSelectedMdObj(null);
      setSelectedAdObj(null);
      setSelectedPdObj(null);
      setSelectedSdObj(null);
      setCurrentLevelList([]);
    } else if (targetLevel === 2) {
      drillIntoAd(selectedMdObj);
    } else if (targetLevel === 3) {
      drillIntoPd(selectedAdObj);
    } else if (targetLevel === 4) {
      drillIntoSd(selectedPdObj);
    }
  };

  // Helper to call backend via secure proxy
  const callProxy = async (endpoint: string, payload: any = {}, queryParams: any = null, method: string = "POST") => {
    const res = await axios.post("/api/demo/proxy", {
      endpoint,
      payload,
      queryParams,
      method
    });
    return res.data;
  };

  // Master fetch function to populate all app modules
  const calculateAllData = async (currentP: BirthProfile = profile) => {
    setLoading(true);
    setError(null);

    const payload = {
      dob: currentP.dob,
      tob: currentP.tob,
      lat: currentP.lat,
      lon: currentP.lon,
      tz: currentP.tz,
      lang: currentP.lang
    };

    try {
      // 1. Core Astronomy & Planetary Positions (Module 1)
      const planetsRes = await callProxy("/api/v1/core/planets/positions", payload);
      if (planetsRes?.data?.planets) {
        setPlanets(planetsRes.data.planets);
      }

      // 2. Parashari D1 Chart (Module 3)
      const d1Res = await callProxy("/api/v1/parashari/chart/d1", payload);
      if (d1Res?.data) setD1Chart(d1Res.data);

      // 3. Parashari D9 Navamsha Chart (Module 3)
      const d9Res = await callProxy("/api/v1/parashari/chart/d9", payload);
      if (d9Res?.data) setD9Chart(d9Res.data);

      // 4. Vector SVG Kundli Charts (D1 and D9 - Module 3)
      try {
        const svgRes = await axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/svg",
          payload,
          queryParams: { varga: "D1", chart_style: "NORTH_INDIAN" },
          method: "POST"
        }, { responseType: "text" });
        if (svgRes.data && typeof svgRes.data === "string" && svgRes.data.includes("<svg")) {
          setSvgChartD1(svgRes.data);
          setVargaSvgMap(prev => ({ ...prev, D1_NORTH_INDIAN: svgRes.data, D1: svgRes.data }));
        }
      } catch (e) { }

      try {
        const svgD9Res = await axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/svg",
          payload,
          queryParams: { varga: "D9", chart_style: "NORTH_INDIAN" },
          method: "POST"
        }, { responseType: "text" });
        if (svgD9Res.data && typeof svgD9Res.data === "string" && svgD9Res.data.includes("<svg")) {
          setSvgChartD9(svgD9Res.data);
          setVargaSvgMap(prev => ({ ...prev, D9_NORTH_INDIAN: svgD9Res.data, D9: svgD9Res.data }));
        }
      } catch (e) { }

      // 5. Daily Panchang & Choghadiya (Module 2)
      const panchangRes = await callProxy("/api/v1/panchang/daily", payload);
      if (panchangRes?.data) setPanchang(panchangRes.data);

      const choghadiyaRes = await callProxy("/api/v1/panchang/choghadiya", payload);
      if (choghadiyaRes?.data) setChoghadiya(choghadiyaRes.data);

      // 6. Vimshottari Dasha Suite (Module 4)
      const dashaRes = await callProxy("/api/v1/dasha/vimshottari/current", payload);
      if (dashaRes?.data) setCurrentDasha(dashaRes.data);

      const mahaRes = await callProxy("/api/v1/dasha/vimshottari/mahadasha", payload);
      if (mahaRes?.data?.mahadashas) setFullMahadashas(mahaRes.data.mahadashas);

      const yoginiRes = await callProxy("/api/v1/dasha/yogini/complete", payload);
      if (yoginiRes?.data) setYoginiDasha(yoginiRes.data);

      // 7. Classical Parashari Yogas & Shadbala & Ashtakavarga (Module 3)
      const yogasRes = await callProxy("/api/v1/parashari/yogas/find", payload);
      if (yogasRes?.data?.yogas) setParashariYogas(yogasRes.data.yogas);

      const shadbalaRes = await callProxy("/api/v1/parashari/shadbala/details", payload);
      if (shadbalaRes?.data) setShadbalaDetails(shadbalaRes.data);

      const sarvashtakRes = await callProxy("/api/v1/parashari/ashtakvarga/sarvashtak", payload);
      if (sarvashtakRes?.data) setSarvashtakData(sarvashtakRes.data);

      const bhinnashtakRes = await callProxy("/api/v1/parashari/ashtakvarga/bhinnashtak", payload);
      if (bhinnashtakRes?.data) setBhinnashtakData(bhinnashtakRes.data);

      const d10Res = await callProxy("/api/v1/parashari/chart/d10", payload);
      if (d10Res?.data) setVargaD10(d10Res.data);

      const chandraRes = await callProxy("/api/v1/parashari/chart/moon-lagna", payload);
      if (chandraRes?.data) setChandraKundli(chandraRes.data);

      // 8. Dosha Suite (Module 8)
      const manglikRes = await callProxy("/api/v1/dosha-matching/manglik", payload);
      if (manglikRes?.data) setManglikData(manglikRes.data);

      const kaalSarpRes = await callProxy("/api/v1/dosha-matching/kalsarpa", payload);
      if (kaalSarpRes?.data) setKaalSarpData(kaalSarpRes.data);

      const sadesatiRes = await callProxy("/api/v1/dosha-matching/sade-sati/status", payload);
      if (sadesatiRes?.data) setSadeSatiStatus(sadesatiRes.data);

      const pitraRes = await callProxy("/api/v1/dosha-matching/pitra-dosha", payload);
      if (pitraRes?.data) setPitraDosha(pitraRes.data);

      const chandalRes = await callProxy("/api/v1/dosha-matching/guru-chandal", payload);
      if (chandalRes?.data) setGuruChandal(chandalRes.data);

      // 9. Numerology & Lo Shu Grid (Module 10)
      const numRes = await callProxy("/api/v1/numerology/core-numbers", payload, { name: "Aditya Sharma" });
      if (numRes?.data) setNumerology(numRes.data);

      const loshuRes = await callProxy("/api/v1/numerology/loshu-grid", payload);
      if (loshuRes?.data) setLoshuGrid(loshuRes.data);

      try { const r = await callProxy("/api/v1/numerology/missing-numbers", payload); if (r?.data) setMissingNumbersData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/numerology/name-analysis", payload, { name: "Aditya Sharma" }); if (r?.data) setNameAnalysisData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/numerology/forecast", payload, { target_year: 2026 }); if (r?.data) setNumerologyForecastData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/numerology/pinnacles-challenges", payload); if (r?.data) setPinnaclesData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/numerology/favorable", payload); if (r?.data) setFavorableData(r.data); } catch (e) { }

      // 10. Astrological Remedies Suite (Module 9)
      const gemRes = await callProxy("/api/v1/remedies/gemstones", payload);
      if (gemRes?.data) setGemstones(gemRes.data);

      const rudraRes = await callProxy("/api/v1/remedies/rudraksha", payload);
      if (rudraRes?.data?.rudraksha_recommendations) setRudrakshaList(rudraRes.data.rudraksha_recommendations);

      const mantraRes = await callProxy("/api/v1/remedies/mantras", payload);
      if (mantraRes?.data?.mantras) {
        const rawM = mantraRes.data.mantras;
        if (Array.isArray(rawM)) {
          setMantrasList(rawM);
        } else if (typeof rawM === "object") {
          const arr = Object.entries(rawM).map(([pName, mData]: [string, any]) => ({
            planet: pName,
            mantra: mData.mantra || mData.beej_mantra,
            counts: `${mData.recitations || 10000} times`
          }));
          setMantrasList(arr);
        }
      }

      const fastingRes = await callProxy("/api/v1/remedies/fasting", payload);
      if (fastingRes?.data) setFastingRecs(fastingRes.data);

      const donationsRes = await callProxy("/api/v1/remedies/donations", payload);
      if (donationsRes?.data) setDonationsRecs(donationsRes.data);

      // 11. Western Astrology (Module 11)
      const westRes = await callProxy("/api/v1/western/big-three", payload);
      if (westRes?.data) setWesternData(westRes.data);

      try {
        const westSvgRes = await axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/western/chart/wheel-svg",
          payload,
          method: "POST"
        }, { responseType: "text" });
        if (westSvgRes.data && typeof westSvgRes.data === "string" && westSvgRes.data.includes("<svg")) {
          setWesternWheelSvg(westSvgRes.data);
        }
      } catch (e) { }

      // 12. KP System & Cusps (Module 5)
      const kpRes = await callProxy("/api/v1/kp/planets", payload);
      if (kpRes?.data?.planets) setKpPlanets(kpRes.data.planets);

      const kpCuspRes = await callProxy("/api/v1/kp/cusps", payload);
      if (kpCuspRes?.data?.cusps) setKpCusps(kpCuspRes.data.cusps);

      try {
        const kpSvgRes = await axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/kp/chart/svg",
          payload,
          method: "POST"
        }, { responseType: "text" });
        if (kpSvgRes.data && typeof kpSvgRes.data === "string" && kpSvgRes.data.includes("<svg")) {
          setKpChartSvg(kpSvgRes.data);
        }
      } catch (e) { }

      try {
        const kpRpRes = await callProxy("/api/v1/kp/ruling-planets", payload);
        if (kpRpRes?.data) setKpRulingPlanets(kpRpRes.data);
      } catch (e) { }

      // 13. Lal Kitab (Module 6)
      const lalRes = await callProxy("/api/v1/lalkitab/chart/kundli", payload);
      if (lalRes?.data) setLalKitabData(lalRes.data);

      try {
        const lkSvgRes = await axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/lalkitab/chart/svg",
          payload,
          method: "POST"
        }, { responseType: "text" });
        if (lkSvgRes.data && typeof lkSvgRes.data === "string" && lkSvgRes.data.includes("<svg")) {
          setLalKitabChartSvg(lkSvgRes.data);
        }
      } catch (e) { }

      try {
        const lkRemRes = await callProxy("/api/v1/lalkitab/remedies/planet-wise", payload);
        if (lkRemRes?.data?.remedies) setLalKitabRemedies(lkRemRes.data.remedies);
      } catch (e) { }


      // 14. Jaimini & Tajik Varshphal (Module 7)
      const jaiminiRes = await callProxy("/api/v1/advanced/jaimini/karakas", payload);
      if (jaiminiRes?.data?.karakas) setJaiminiKarakas(jaiminiRes.data.karakas);

      const tajikRes = await callProxy("/api/v1/advanced/tajik/varshphal-chart", payload, { target_year: 2026 }, "POST");
      if (tajikRes?.data) setTajikVarshphal(tajikRes.data);

      // ── BATCH 2: All remaining pending APIs ──

      // Core Astronomy extras
      try { const r = await callProxy("/api/v1/core/planets/retrograde", payload); if (r?.data) setRetrogradeData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/core/sun-moon/timings", payload); if (r?.data) setSunMoonTimings(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/core/ayanamsa/all", payload); if (r?.data) setAyanamsaData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/core/houses/cusps", payload); if (r?.data) setHouseCusps(r.data); } catch (e) { }

      // Panchang extras
      try { const r = await callProxy("/api/v1/panchang/advanced", payload); if (r?.data) setPanchangAdvanced(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/panchang/hora", payload); if (r?.data) setHoraData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/panchang/bhadra", payload); if (r?.data) setBhadraData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/panchang/panchak", payload); if (r?.data) setPanchakData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/panchang/monthly-calendar", payload); if (r?.data) setMonthlyCalendar(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/panchang/muhurat/marriage", payload); if (r?.data) setMarriageMuhurat(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/panchang/muhurat/griha-pravesh", payload); if (r?.data) setGrihaPraveshMuhurat(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/panchang/muhurat/property-vehicle", payload); if (r?.data) setPropertyMuhurat(r.data); } catch (e) { }

      // Parashari extras
      try { const r = await callProxy("/api/v1/parashari/chart/bhav-chalit", payload); if (r?.data) setBhavChalit(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/parashari/avasthas", payload); if (r?.data) setAvasthasData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/parashari/bhavabala", payload); if (r?.data) setBhavabalaData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/parashari/special-points", payload); if (r?.data) setSpecialPoints(r.data); } catch (e) { }

      // KP Significators
      try { const r = await callProxy("/api/v1/kp/significators", payload); if (r?.data) setKpSignificatorsData(r.data); } catch (e) { }

      // Jaimini extras
      try { const r = await callProxy("/api/v1/advanced/jaimini/padas", payload); if (r?.data) setJaiminiPadas(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/advanced/jaimini/chara-dasha", payload); if (r?.data) setCharaDasha(r.data); } catch (e) { }

      // Tajik Yogas
      try { const r = await callProxy("/api/v1/advanced/tajik/yogas", payload, { target_year: 2026 }); if (r?.data) setTajikYogas(r.data); } catch (e) { }

      // Western extras
      try { const r = await callProxy("/api/v1/western/tropical-planets", payload); if (r?.data) setWesternTropicalPlanets(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/western/aspects/matrix", payload); if (r?.data) setWesternAspects(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/western/transits/daily", payload); if (r?.data) setWesternTransits(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/western/solar-return", payload, { target_year: new Date().getFullYear() }); if (r?.data) setWesternSolarReturn(r.data); } catch (e) { }

      // Remedies extras
      try { const r = await callProxy("/api/v1/remedies/yantras", payload); if (r?.data) setYantraData(r.data); } catch (e) { }
      try { const r = await callProxy("/api/v1/remedies/gemstones/restrictions", payload); if (r?.data) setGemRestrictions(r.data); } catch (e) { }

      // Official Horoscope / Rashifal Backend APIs (Module 2)
      try {
        setHoroscopeApiLoading(true);
        const [dailyH, weeklyH, monthlyH, yearlyH] = await Promise.allSettled([
          callProxy("/api/v1/panchang/horoscope/daily", payload),
          callProxy("/api/v1/panchang/horoscope/weekly", payload),
          callProxy("/api/v1/panchang/horoscope/monthly", payload),
          callProxy("/api/v1/panchang/horoscope/yearly", payload)
        ]);
        const hData: Record<string, any> = {};
        if (dailyH.status === "fulfilled" && dailyH.value?.data) hData.daily = dailyH.value.data;
        if (weeklyH.status === "fulfilled" && weeklyH.value?.data) hData.weekly = weeklyH.value.data;
        if (monthlyH.status === "fulfilled" && monthlyH.value?.data) hData.monthly = monthlyH.value.data;
        if (yearlyH.status === "fulfilled" && yearlyH.value?.data) hData.yearly = yearlyH.value.data;
        setApiHoroscopeData(hData);
      } catch (e) { } finally {
        setHoroscopeApiLoading(false);
      }

      // 12 Houses Bhavaphala & Life Predictions (Module 3)
      try {
        const hpRes = await callProxy("/api/v1/parashari/predictions/12-houses", payload);
        if (hpRes?.data) setHousePredictions(hpRes.data);
      } catch (e) { }

      // Namakshar & Baby Naming (Module 2)
      try {
        const namRes = await callProxy("/api/v1/panchang/namakshar", payload);
        if (namRes?.data) setNamaksharData(namRes.data);
      } catch (e) { }

      // ── Option 1 Backend APIs Integration ──
      // 1. Shani Sade Sati 30-Year Lifetime Timeline (Module 8 — Endpoint 64)
      try {
        const ssTimeRes = await callProxy("/api/v1/dosha-matching/sade-sati/timeline", payload);
        if (ssTimeRes?.data) setSadeSatiTimeline(ssTimeRes.data);
      } catch (e) { }

      // 2. KP Horary 1–249 & Level 4 Significators (Module 5 — Endpoints 41 & 44)
      try {
        const horaryRes = await callProxy("/api/v1/kp/horary/1-249", payload, { seed: 108 });
        if (horaryRes?.data) setKpHoraryData(horaryRes.data);
      } catch (e) { }
      try {
        const [sig4Res, sigHouseRes] = await Promise.allSettled([
          callProxy("/api/v1/kp/significators/level-4", payload),
          callProxy("/api/v1/kp/house-significators", payload)
        ]);
        const s4Data = (sig4Res.status === "fulfilled" && sig4Res.value?.data) ? sig4Res.value.data : {};
        const sHData = (sigHouseRes.status === "fulfilled" && sigHouseRes.value?.data) ? sigHouseRes.value.data : {};
        setKpLevel4Significators({ ...sHData, ...s4Data, houses: sHData });
      } catch (e) { }

      // 3. Lal Kitab Blind/Dharmi Teva Diagnostics (Module 6 — Endpoint 49)
      try {
        const lkBlindRes = await callProxy("/api/v1/lalkitab/blind-halfblind", payload);
        if (lkBlindRes?.data) setLalKitabBlind(lkBlindRes.data);
      } catch (e) { }

      // 4. Advanced Jaimini Karakamsha (Module 7 — Endpoint 53)
      try {
        const jkRes = await callProxy("/api/v1/advanced/jaimini/karakamsha", payload);
        if (jkRes?.data) setJaiminiKarakamsha(jkRes.data);
      } catch (e) { }

      // 5. Upagrahas (Mandi, Gulika, etc. - Module 7 — Endpoint 55)
      try {
        const upaRes = await callProxy("/api/v1/advanced/upagrahas", payload);
        if (upaRes?.data) setUpagrahasData(upaRes.data);
      } catch (e) { }

      // 6. Tajik 36 Sahams (Arabic Parts - Module 7 — Endpoint 60)
      try {
        const sahamsRes = await callProxy("/api/v1/advanced/tajik/sahams", payload, { target_year: 2026 });
        if (sahamsRes?.data) setTajikSahams(sahamsRes.data);
      } catch (e) { }

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to calculate some horoscope engines.");
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation on mount
  useEffect(() => {
    calculateAllData(DEFAULT_PROFILE);
  }, []);

  // Matchmaking execution (Ashtakoot + South Indian Dashakoota + Papasamya + Exceptions)
  const runMatchmaking = async () => {
    setMatchingLoading(true);
    try {
      const matchPayload = {
        boy_dob: profile.dob,
        boy_tob: profile.tob,
        boy_lat: profile.lat,
        boy_lon: profile.lon,
        boy_tz: profile.tz,
        girl_dob: partnerProfile.dob,
        girl_tob: partnerProfile.tob,
        girl_lat: partnerProfile.lat,
        girl_lon: partnerProfile.lon,
        girl_tz: partnerProfile.tz,
        lang: profile.lang
      };

      const [resAsh, resDash, resPapa, resExc] = await Promise.allSettled([
        callProxy("/api/v1/dosha-matching/matchmaking/ashtakoot", matchPayload),
        callProxy("/api/v1/dosha-matching/matchmaking/dashakoot", matchPayload),
        callProxy("/api/v1/dosha-matching/matchmaking/papasmya", matchPayload),
        callProxy("/api/v1/dosha-matching/matchmaking/exceptions", matchPayload)
      ]);

      if (resAsh.status === "fulfilled" && resAsh.value?.data) setMatchmakingResult(resAsh.value.data);
      if (resDash.status === "fulfilled" && resDash.value?.data) setDashakootaData(resDash.value.data);
      if (resPapa.status === "fulfilled" && resPapa.value?.data) setPapasamyaData(resPapa.value.data);
      if (resExc.status === "fulfilled" && resExc.value?.data) setMatchExceptions(resExc.value.data);

    } catch (e: any) {
      setError("Matchmaking calculation failed.");
    } finally {
      setMatchingLoading(false);
    }
  };

  // KP Horary Seed Calculator helper
  const handleHorarySeedChange = async (seedNum: number) => {
    const validSeed = Math.max(1, Math.min(249, seedNum));
    setKpHorarySeed(validSeed);
    setKpHoraryLoading(true);
    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        lang: profile.lang
      };
      const horaryRes = await callProxy("/api/v1/kp/horary/1-249", payload, { seed: validSeed });
      if (horaryRes?.data) setKpHoraryData(horaryRes.data);
    } catch (e) {
      console.error("Horary calculation error", e);
    } finally {
      setKpHoraryLoading(false);
    }
  };

  // ── AI Astrologer Engine Handlers ──
  const handleAskAiAstrologer = async (customQ?: string, customCat?: string) => {
    const q = (customQ || aiQuestion || "").trim();
    if (!q) return;
    setAiChatLoading(true);
    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        question: q,
        category: customCat,
        lang: profile.lang || "hi"
      };
      const res = await callProxy("/api/v1/ai-astrologer/ask", payload);
      if (res?.data) {
        setAiChatHistory(prev => [res.data, ...prev]);
        setAiQuestion("");
      }
    } catch (e: any) {
      console.error("AI Astrologer error", e);
    } finally {
      setAiChatLoading(false);
    }
  };

  const handleFetchQuickInsights = async () => {
    setAiInsightsLoading(true);
    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        lang: profile.lang || "hi"
      };
      const res = await callProxy("/api/v1/ai-astrologer/quick-insights", payload);
      if (res?.data?.pillars) {
        setAiQuickInsights(res.data.pillars);
      }
    } catch (e) {
      console.error("Quick insights error", e);
    } finally {
      setAiInsightsLoading(false);
    }
  };

  // ── Tarot Suite Handlers ──
  const handleDrawTarot = async (mode = tarotSpreadMode, customQ = tarotQuestion) => {
    setTarotLoading(true);
    try {
      if (mode === "daily") {
        const res = await callProxy("/api/v1/tarot/daily-card", { question: customQ });
        if (res?.data) setTarotDailyResult(res.data);
      } else if (mode === "celtic_cross") {
        const res = await callProxy("/api/v1/tarot/spread/celtic-cross", { question: customQ });
        if (res?.data) setTarotCelticResult(res.data);
      } else {
        const subMode = mode === "3_card_mind" ? "mind_body_spirit" : "time";
        const res = await callProxy("/api/v1/tarot/spread/3-card", {
          question: customQ,
          spread_mode: subMode
        });
        if (res?.data) setTarot3CardResult(res.data);
      }
    } catch (e: any) {
      console.error("Tarot draw error", e);
    } finally {
      setTarotLoading(false);
    }
  };

  // ── Vastu Shastra Handlers ──
  const handleEvaluateVastu = async (customRooms = vastuRooms, customFacing = vastuPropertyFacing) => {
    setVastuLoading(true);
    try {
      const payload = {
        property_type: vastuPropertyType,
        facing_direction: customFacing,
        rooms: customRooms
      };
      const res = await callProxy("/api/v1/vastu/evaluate", payload);
      if (res?.data) {
        setVastuEvaluationResult(res.data);
      }
    } catch (e: any) {
      console.error("Vastu evaluation error", e);
    } finally {
      setVastuLoading(false);
    }
  };

  const handleApplyVastuPreset = (presetType: "ideal" | "doshas") => {
    if (presetType === "ideal") {
      const ideal = [
        { room_type: "pooja_mandir", zone: "NE", color: "White" },
        { room_type: "kitchen", zone: "SE", color: "Orange" },
        { room_type: "master_bedroom", zone: "SW", color: "Cream" },
        { room_type: "toilet", zone: "SSW", color: "Yellow" },
        { room_type: "locker", zone: "N", color: "Light Green" },
        { room_type: "living_room", zone: "E", color: "White" }
      ];
      setVastuRooms(ideal);
      setVastuPropertyFacing("East");
      handleEvaluateVastu(ideal, "East");
    } else {
      const withDoshas = [
        { room_type: "kitchen", zone: "NE", color: "Red" }, // Fire in Water!
        { room_type: "toilet", zone: "SW", color: "Blue" }, // Toilet in Pitra sthana!
        { room_type: "master_bedroom", zone: "SE", color: "Pink" },
        { room_type: "pooja_mandir", zone: "WNW", color: "Grey" },
        { room_type: "locker", zone: "SSW", color: "Dark Yellow" }
      ];
      setVastuRooms(withDoshas);
      setVastuPropertyFacing("North");
      handleEvaluateVastu(withDoshas, "North");
    }
  };

  // Helper to parse and render bold **markdown** syntax cleanly into HTML strong tags
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={pIdx} className="leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const cleanBold = part.slice(2, -2);
              return (
                <strong key={i} className="font-bold text-slate-900 bg-amber-50 text-indigo-950 px-1 py-0.5 rounded border border-amber-200/60 mx-0.5">
                  {cleanBold}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // ── PDF Engine: Generate + Poll + Download ──
  const pollPdfStatus = async (jobId: string, reportType: string, maxAttempts = 60) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, 3000)); // poll every 3s
      try {
        const res = await callProxy(`/api/v1/pdf/status/${jobId}`, {}, null, "GET");
        const jobData = res?.data;
        if (jobData) {
          setPdfJobs(prev => ({
            ...prev,
            [reportType]: {
              jobId,
              status: jobData.status,
              reportType,
              fileUrl: jobData.file_url,
              error: jobData.failure_reason || jobData.error
            }
          }));
          if (jobData.status === "COMPLETED" || jobData.status === "FAILED") {
            setPdfLoading(prev => ({ ...prev, [reportType]: false }));
            return;
          }
        }
      } catch (e) {
        // continue polling
      }
    }
    // Timeout
    setPdfJobs(prev => ({
      ...prev,
      [reportType]: { ...prev[reportType], status: "FAILED", error: "Timeout — job took too long." }
    }));
    setPdfLoading(prev => ({ ...prev, [reportType]: false }));
  };

  const generatePdf = async (endpoint: string, reportType: string, extraPayload: any = {}) => {
    setPdfLoading(prev => ({ ...prev, [reportType]: true }));
    setPdfJobs(prev => ({
      ...prev,
      [reportType]: { jobId: "", status: "PENDING", reportType }
    }));
    try {
      const payload = {
        dob: profile.dob,
        tob: profile.tob,
        lat: profile.lat,
        lon: profile.lon,
        tz: profile.tz,
        lang: profile.lang,
        branding: {
          firm_name: "AstroEngine Demo",
          astrologer_name: profile.name
        },
        ...extraPayload
      };
      const res = await callProxy(endpoint, payload);
      const jobId = res?.job_id;
      if (jobId) {
        setPdfJobs(prev => ({
          ...prev,
          [reportType]: { jobId, status: "PROCESSING", reportType }
        }));
        // Start background polling
        pollPdfStatus(jobId, reportType);
      } else {
        throw new Error("No job_id returned");
      }
    } catch (e: any) {
      setPdfJobs(prev => ({
        ...prev,
        [reportType]: { jobId: "", status: "FAILED", reportType, error: e.message || "Failed to start PDF job" }
      }));
      setPdfLoading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const openPdfDownload = (jobId: string) => {
    if (jobId) window.open(`/api/demo/proxy?dl=pdf&job_id=${jobId}`, "_blank");
  };


  const langKey = (["en", "hi", "mr", "gu", "ta", "te", "bn"].includes(profile.lang) ? profile.lang : "en") as SupportedLang;
  const t = DEMO_TRANSLATIONS[langKey] || DEMO_TRANSLATIONS.en;

  const getLangBadgeName = (lang: string) => {
    switch (lang) {
      case "hi": return "हिंदी (Hindi)";
      case "mr": return "मराठी (Marathi)";
      case "gu": return "ગુજરાતી (Gujarati)";
      case "ta": return "தமிழ் (Tamil)";
      case "te": return "తెలుగు (Telugu)";
      case "bn": return "বাংলা (Bengali)";
      default: return "English (en)";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top App Bar with clean, calm styling */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 border border-indigo-500/20">
                {t.enginesLiveBadge}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {t.securityBadge}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              {t.appTitle}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              {t.appSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => calculateAllData(profile)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? t.recalculatingBtn : t.recalculateBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Birth Profile Customizer Bar (Relative layout, no overlapping sticky) */}
      <div className="bg-white border-b border-slate-200 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Mode Context Badge */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
            {["panchang", "horoscope", "tarot", "vastu"].includes(activeTab) ? (
              <div className="flex items-center gap-2 text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold">🌐 {t.universalModeTitle}</span>
                <span className="text-slate-500">{t.universalModeDescPrefix}<strong>{profile.cityName}</strong>{t.universalModeDescSuffix}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-800">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="font-bold">👤 {t.personalModeTitle}</span>
                <span className="text-slate-500">{t.personalModeDescPrefix}<strong>{profile.name}</strong> ({profile.dob} • {profile.tob} • {profile.cityName}).</span>
              </div>
            )}
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {getLangBadgeName(profile.lang)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {t.nameLabel}
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {t.dobLabel}
              </label>
              <input
                type="date"
                value={profile.dob}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {t.tobLabel}
              </label>
              <input
                type="time"
                value={profile.tob}
                onChange={(e) => setProfile({ ...profile, tob: e.target.value })}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden font-mono"
              />
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {t.cityLabel}
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => searchCities(e.target.value)}
                  onFocus={() => {
                    if (citySearchResults.length > 0) setShowCityDropdown(true);
                  }}
                  placeholder={t.cityPlaceholder}
                  className="w-full text-xs font-semibold pl-2.5 pr-8 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
                />
                {citySearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCitySearchQuery("");
                      setCitySearchResults([]);
                      setShowCityDropdown(false);
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    title="Clear city"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {isSearchingCity && (
                  <Loader2 className="w-3 h-3 animate-spin absolute right-6 text-indigo-500" />
                )}
              </div>

              {/* Dynamic Auto-complete Dropdown */}
              {showCityDropdown && citySearchResults.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {citySearchResults.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectGeoCity(c)}
                      className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{c.city}</span>
                        <span className="text-slate-500 ml-1">({c.country})</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-600 font-semibold">
                        {c.lat?.toFixed(2)}°, {c.lon?.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {t.langLabel}
              </label>
              <select
                value={profile.lang}
                onChange={(e) => {
                  const newLang = e.target.value;
                  const updatedProfile = { ...profile, lang: newLang };
                  setProfile(updatedProfile);
                  calculateAllData(updatedProfile);
                }}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 outline-hidden"
              >
                <option value="en">English (English)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="bn">বাংলা (Bengali)</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => calculateAllData(profile)}
                disabled={loading}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.applyBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* Categorized Navigation Tabs */}
        <div className="space-y-3 pb-3 border-b border-slate-200">
          {/* Category 1: Personal Birth Profile APIs (DOB, TOB, Lat, Lon, Name) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                <span>{t.cat1Title}</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400">{t.cat1Count}</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "overview", label: t.tabs.overview, icon: Sparkles, endpoint: "POST /api/v1/parashari/chart/d1", work: "Lagna Kundli, Bhavas, Current Dasha, Quick Panchang & Graha Sphuta Summary" },
                { id: "ai_astrologer", label: t.tabs.ai_astrologer, icon: Bot, endpoint: "POST /api/v1/ai/consult", work: "AI-powered Classical Parashari Consultation with Dasha analysis and timing" },
                { id: "kundli", label: t.tabs.kundli, icon: Compass, endpoint: "POST /api/v1/parashari/varga/d1..d60", work: "Generates D1 to D60 High-Precision Harmonic Divisional SVG Charts & Bhavaphala" },
                { id: "planets", label: t.tabs.planets, icon: Sun, endpoint: "POST /api/v1/core/planets/positions", work: "Real-time Swiss Ephemeris Graha Sphuta, Retrograde Motion, House Cusps & Timings" },
                { id: "dasha", label: t.tabs.dasha, icon: Clock, endpoint: "POST /api/v1/dasha/vimshottari/tree", work: "120-Year Vimshottari 5-Tier Hierarchy (MD > AD > PD > SD > Prana) & Yogini Dasha" },
                { id: "yogas", label: t.tabs.yogas, icon: Flame, endpoint: "POST /api/v1/parashari/yogas", work: "Sarvashtakavarga 337 Bindus, Bhinnashtakavarga, Raja Yogas & Shadbala Strengths" },
                { id: "dosha", label: t.tabs.dosha, icon: ShieldAlert, endpoint: "POST /api/v1/dosha/all", work: "Manglik with 20+ Classical Cancellations, Shani Sade Sati Transit, Kaal Sarp & Pitra Dosha" },
                { id: "matching", label: t.tabs.matching, icon: HeartHandshake, endpoint: "POST /api/v1/matchmaking/ashtakoota", work: "Vedic 36 Guna Milan, Dashakoota, Papasamya, Nadi Dosha exceptions & Verdict" },
                { id: "numerology", label: t.tabs.numerology, icon: Hash, endpoint: "POST /api/v1/numerology/comprehensive", work: "Mulank, Bhagyank, Namank, 3x3 Lo Shu Magic Grid 8 Planes & Year Forecast" },
                { id: "western", label: t.tabs.western, icon: Globe, endpoint: "POST /api/v1/western/big-three", work: "Tropical/Sayana Zodiac, Sun-Moon-Rising Big Three, Aspects Grid & Circular Wheel SVG" },
                { id: "remedies", label: t.tabs.remedies, icon: Award, endpoint: "POST /api/v1/remedies/gemstones", work: "Life/Lucky/Benefic Gemstones, 1-14 Mukhi Rudraksha, Tantrik Beej Mantras, Yantras & Fasting" },
                { id: "kp", label: t.tabs.kp, icon: Sliders, endpoint: "POST /api/v1/kp/planets", work: "Krishnamurti Paddhati Sign/Star/Sub-Lords, Placidus Cusps, 1-249 Horary & Ruling Planets" },
                { id: "lalkitab", label: t.tabs.lalkitab, icon: BookOpen, endpoint: "POST /api/v1/lalkitab/chart/kundli", work: "Lal Kitab Fixed Kalpurush Houses, Sleeping Houses/Planets, 6 Debts & Specific Upay" },
                { id: "tajik", label: t.tabs.tajik, icon: Eye, endpoint: "POST /api/v1/advanced/jaimini/karakas", work: "7 Jaimini Chara Karakas, Chara Dasha, Tajik Varshphal, Muntha, Sahams & 16 Tajik Yogas" },
                { id: "pdf", label: t.tabs.pdf, icon: FileDown, endpoint: "POST /api/v1/pdf/kundli/basic", work: "Async PDF Generation Queue (HTTP 202) for 20-80 page branded client astrology reports" },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={`${tab.endpoint} — ${tab.work}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${isActive
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category 2: Universal & Daily Services (Panchang, Choghadiya, Muhurat, Rashifal, Tarot, Vastu) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>{t.cat2Title}</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 font-mono">{t.cat2Count}</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "panchang", label: t.tabs.panchang, icon: Calendar, endpoint: "POST /api/v1/panchang/daily", work: "Tithi, Vaar Lord, Nakshatra, Yoga, Karana, 16 Day/Night Choghadiya, Hora & Shubh Muhurat" },
                { id: "horoscope", label: t.tabs.horoscope, icon: Star, endpoint: "POST /api/v1/panchang/horoscope/daily", work: "Real-time Daily, Weekly, Monthly & Yearly Horoscope predictions for all 12 Rashis in 5 languages" },
                { id: "tarot", label: t.tabs.tarot, icon: Sparkles, endpoint: "POST /api/v1/tarot/draw", work: "78 Rider-Waite Tarot Deck readings: Daily Card, 3-Card Spread (Past/Present/Future), Celtic Cross" },
                { id: "vastu", label: t.tabs.vastu, icon: Compass, endpoint: "POST /api/v1/vastu/evaluate", work: "16 Vedic MahaVastu zones evaluation, 5 elemental imbalances (Pancha Tattva) & Non-demolition cures" },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={`${tab.endpoint} — ${tab.work}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${isActive
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Engine Description Header: Clean, modern card */}
        {(() => {
          const tabMetaMap: Record<string, { title: string; endpoint: string; purpose: string; requiresBirth: boolean }> = {
            overview: {
              title: t.tabMeta.overview?.title || "Overview",
              endpoint: "/api/v1/parashari/chart/d1 & /api/v1/core/planets/positions",
              purpose: t.tabMeta.overview?.purpose || "",
              requiresBirth: true
            },
            ai_astrologer: {
              title: t.tabMeta.ai_astrologer?.title || "AI Astrologer",
              endpoint: "/api/v1/ai/consult",
              purpose: t.tabMeta.ai_astrologer?.purpose || "",
              requiresBirth: true
            },
            kundli: {
              title: t.tabMeta.kundli?.title || "Kundli Charts",
              endpoint: "/api/v1/parashari/chart/d1..d60 & /bhav-chalit",
              purpose: t.tabMeta.kundli?.purpose || "",
              requiresBirth: true
            },
            planets: {
              title: t.tabMeta.planets?.title || "Planetary Positions",
              endpoint: "/api/v1/core/planets/positions & /timings/sun-moon",
              purpose: t.tabMeta.planets?.purpose || "",
              requiresBirth: true
            },
            dasha: {
              title: t.tabMeta.dasha?.title || "Dasha Hierarchy",
              endpoint: "/api/v1/dasha/vimshottari/current & /tree",
              purpose: t.tabMeta.dasha?.purpose || "",
              requiresBirth: true
            },
            yogas: {
              title: t.tabMeta.yogas?.title || "Yogas & Ashtakavarga",
              endpoint: "/api/v1/parashari/ashtakavarga & /yogas",
              purpose: t.tabMeta.yogas?.purpose || "",
              requiresBirth: true
            },
            dosha: {
              title: t.tabMeta.dosha?.title || "Dosha Suite",
              endpoint: "/api/v1/dosha/manglik & /sade-sati & /kaal-sarp",
              purpose: t.tabMeta.dosha?.purpose || "",
              requiresBirth: true
            },
            matching: {
              title: t.tabMeta.matching?.title || "Kundli Milan",
              endpoint: "/api/v1/matchmaking/ashtakoota & /dashakoota",
              purpose: t.tabMeta.matching?.purpose || "",
              requiresBirth: true
            },
            numerology: {
              title: t.tabMeta.numerology?.title || "Numerology & Lo Shu",
              endpoint: "/api/v1/numerology/comprehensive & /loshu",
              purpose: t.tabMeta.numerology?.purpose || "",
              requiresBirth: true
            },
            western: {
              title: t.tabMeta.western?.title || "Western Tropical",
              endpoint: "/api/v1/western/big-three & /wheel",
              purpose: t.tabMeta.western?.purpose || "",
              requiresBirth: true
            },
            remedies: {
              title: t.tabMeta.remedies?.title || "Vedic Remedies",
              endpoint: "/api/v1/remedies/gemstones & /rudraksha & /mantras",
              purpose: t.tabMeta.remedies?.purpose || "",
              requiresBirth: true
            },
            kp: {
              title: t.tabMeta.kp?.title || "KP System",
              endpoint: "/api/v1/kp/planets & /cusps & /horary",
              purpose: t.tabMeta.kp?.purpose || "",
              requiresBirth: true
            },
            lalkitab: {
              title: t.tabMeta.lalkitab?.title || "Lal Kitab System",
              endpoint: "/api/v1/lalkitab/chart/kundli & /debts & /remedies",
              purpose: t.tabMeta.lalkitab?.purpose || "",
              requiresBirth: true
            },
            tajik: {
              title: t.tabMeta.tajik?.title || "Tajik Varshphal & Jaimini",
              endpoint: "/api/v1/advanced/tajik/varshphal & /jaimini/karakas",
              purpose: t.tabMeta.tajik?.purpose || "",
              requiresBirth: true
            },
            pdf: {
              title: t.tabMeta.pdf?.title || "PDF Report Engine",
              endpoint: "/api/v1/pdf/kundli/basic & /status",
              purpose: t.tabMeta.pdf?.purpose || "",
              requiresBirth: true
            },
            panchang: {
              title: t.tabMeta.panchang?.title || "Panchang & Muhurat",
              endpoint: "/api/v1/panchang/daily & /choghadiya & /hora",
              purpose: t.tabMeta.panchang?.purpose || "",
              requiresBirth: false
            },
            horoscope: {
              title: t.tabMeta.horoscope?.title || "12 Rashi Forecast",
              endpoint: "/api/v1/panchang/horoscope/daily & /weekly & /yearly",
              purpose: t.tabMeta.horoscope?.purpose || "",
              requiresBirth: false
            },
            tarot: {
              title: t.tabMeta.tarot?.title || "78-Card Tarot Suite",
              endpoint: "/api/v1/tarot/draw & /spread/three-card & /celtic-cross",
              purpose: t.tabMeta.tarot?.purpose || "",
              requiresBirth: false
            },
            vastu: {
              title: t.tabMeta.vastu?.title || "16-Zone MahaVastu",
              endpoint: "/api/v1/vastu/evaluate",
              purpose: t.tabMeta.vastu?.purpose || "",
              requiresBirth: false
            }
          };

          const currentMeta = tabMetaMap[activeTab] || {
            title: t.fallbackTitle,
            endpoint: "/api/v1/...",
            purpose: t.fallbackPurpose,
            requiresBirth: true
          };

          return (
            <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {currentMeta.title}
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {currentMeta.endpoint}
                  </span>
                  {currentMeta.requiresBirth ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {t.birthProfileBadge}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {t.universalModeBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                  <strong className="text-slate-900 font-semibold">{t.metaScopeLabel}</strong>
                  {currentMeta.purpose}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-xs">
                <a
                  href="/documentation"
                  target="_blank"
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1 transition text-[11px]"
                >
                  <span>{t.apiSpecsBtn}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          );
        })()}

        {/* Tab Content Display */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <OverviewTab
              d1Chart={d1Chart}
              planets={planets}
              panchang={panchang}
              currentDasha={currentDasha}
              chartStyle={chartStyle}
              setChartStyle={setChartStyle}
              vargaSvgMap={vargaSvgMap}
              svgChartD1={svgChartD1}
              vargaLoading={vargaLoading}
              loadVargaSvg={loadVargaSvg}
              profile={profile}
              manglikData={manglikData}
              kaalSarpData={kaalSarpData}
              lang={profile.lang}
            />
          )}

          {activeTab === "ai_astrologer" && (
            <AiAstrologerTab
              aiQuestion={aiQuestion}
              setAiQuestion={setAiQuestion}
              aiChatHistory={aiChatHistory}
              aiChatLoading={aiChatLoading}
              aiQuickInsights={aiQuickInsights}
              aiInsightsLoading={aiInsightsLoading}
              onAskQuestion={handleAskAiAstrologer}
              onFetchQuickInsights={handleFetchQuickInsights}
            />
          )}

          {activeTab === "kundli" && (
            <KundliTab
              chartStyle={chartStyle}
              setChartStyle={setChartStyle}
              selectedVarga={selectedVarga}
              setSelectedVarga={setSelectedVarga}
              vargaCharts={VARGA_CHARTS}
              vargaSvgMap={vargaSvgMap}
              svgChartD1={svgChartD1}
              vargaLoading={vargaLoading}
              loadVargaSvg={loadVargaSvg}
              profile={profile}
              housePredictions={housePredictions}
              bhavChalit={bhavChalit}
              avasthasData={avasthasData}
              bhavabalaData={bhavabalaData}
              specialPoints={specialPoints}
            />
          )}

          {activeTab === "planets" && (
            <PlanetsTab
              planets={planets}
              sunMoonTimings={sunMoonTimings}
              retrogradeData={retrogradeData}
              ayanamsaData={ayanamsaData}
              houseCusps={houseCusps}
            />
          )}

          {activeTab === "panchang" && (
            <PanchangTab
              panchang={panchang}
              choghadiya={choghadiya}
              panchangAdvanced={panchangAdvanced}
              horaData={horaData}
              bhadraData={bhadraData}
              panchakData={panchakData}
              marriageMuhurat={marriageMuhurat}
              grihaProveshMuhurat={grihaProveshMuhurat}
              propertyMuhurat={propertyMuhurat}
              monthlyCalendar={monthlyCalendar}
              namaksharData={namaksharData}
              planets={planets}
              d1Chart={d1Chart}
              currentDasha={currentDasha}
              sunMoonTimings={sunMoonTimings}
              lang={profile.lang}
            />
          )}

          {activeTab === "dasha" && (
            <DashaTab
              currentDasha={currentDasha}
              dashaDrillLevel={dashaDrillLevel}
              navigateDashaBreadcrumb={navigateDashaBreadcrumb}
              selectedMdObj={selectedMdObj}
              selectedAdObj={selectedAdObj}
              selectedPdObj={selectedPdObj}
              selectedSdObj={selectedSdObj}
              drillLoading={drillLoading}
              fullMahadashas={fullMahadashas}
              currentLevelList={currentLevelList}
              drillIntoAd={drillIntoAd}
              drillIntoPd={drillIntoPd}
              drillIntoSd={drillIntoSd}
              drillIntoPr={drillIntoPr}
              yoginiDasha={yoginiDasha}
            />
          )}

          {activeTab === "yogas" && (
            <YogasTab
              sarvashtakData={sarvashtakData}
              bhinnashtakData={bhinnashtakData}
              parashariYogas={parashariYogas}
              shadbalaDetails={shadbalaDetails}
              bhavabalaData={bhavabalaData}
              avasthasData={avasthasData}
              specialPoints={specialPoints}
            />
          )}

          {activeTab === "dosha" && (
            <DoshaTab
              manglikData={manglikData}
              kaalSarpData={kaalSarpData}
              sadeSatiStatus={sadeSatiStatus}
              pitraDosha={pitraDosha}
              guruChandal={guruChandal}
              sadeSatiTimeline={sadeSatiTimeline}
            />
          )}

          {activeTab === "matching" && (
            <MatchingTab
              runMatchmaking={runMatchmaking}
              matchingLoading={matchingLoading}
              profile={profile}
              partnerProfile={partnerProfile}
              matchmakingResult={matchmakingResult}
              dashakootaData={dashakootaData}
              papasamyaData={papasamyaData}
              matchExceptions={matchExceptions}
            />
          )}

          {activeTab === "numerology" && (
            <NumerologyTab
              numerology={numerology}
              profile={profile}
              loshuGrid={loshuGrid}
              missingNumbersData={missingNumbersData}
              favorableData={favorableData}
              numerologyForecastData={numerologyForecastData}
              pinnaclesData={pinnaclesData}
              nameAnalysisData={nameAnalysisData}
            />
          )}

          {activeTab === "western" && (
            <WesternTab
              westernData={westernData}
              westernWheelSvg={westernWheelSvg}
              westernTropicalPlanets={westernTropicalPlanets}
              westernAspects={westernAspects}
              westernTransits={westernTransits}
              westernSolarReturn={westernSolarReturn}
            />
          )}

          {activeTab === "remedies" && (
            <RemediesTab
              gemstones={gemstones}
              rudrakshaList={rudrakshaList}
              fastingRecs={fastingRecs}
              mantrasList={mantrasList}
              yantraData={yantraData}
              gemRestrictions={gemRestrictions}
            />
          )}

          {activeTab === "kp" && (
            <KpTab
              kpChartSvg={kpChartSvg}
              kpRulingPlanets={kpRulingPlanets}
              kpPlanets={kpPlanets}
              kpCusps={kpCusps}
              kpHorarySeed={kpHorarySeed}
              kpHoraryData={kpHoraryData}
              kpHoraryLoading={kpHoraryLoading}
              kpLevel4Significators={kpLevel4Significators}
              kpSignificatorsData={kpSignificatorsData}
              onHorarySeedChange={handleHorarySeedChange}
            />
          )}

          {activeTab === "lalkitab" && (
            <LalKitabTab
              lalKitabChartSvg={lalKitabChartSvg}
              lalKitabData={lalKitabData}
              lalKitabRemedies={lalKitabRemedies}
              lalKitabBlind={lalKitabBlind}
            />
          )}

          {activeTab === "tajik" && (
            <TajikTab
              jaiminiKarakas={jaiminiKarakas}
              tajikVarshphal={tajikVarshphal}
              jaiminiPadas={jaiminiPadas}
              charaDasha={charaDasha}
              tajikYogas={tajikYogas}
              jaiminiKarakamsha={jaiminiKarakamsha}
              upagrahasData={upagrahasData}
              tajikSahams={tajikSahams}
            />
          )}

          {activeTab === "pdf" && (
            <PdfTab
              pdfJobs={pdfJobs}
              pdfLoading={pdfLoading}
              generatePdf={generatePdf}
              openPdfDownload={openPdfDownload}
            />
          )}

          {activeTab === "horoscope" && (
            <HoroscopeTab
              planets={planets}
              currentDasha={currentDasha}
              apiHoroscopeData={apiHoroscopeData}
              selectedRashi={selectedRashi}
              setSelectedRashi={setSelectedRashi}
              rashiPeriod={rashiPeriod}
              setRashiPeriod={setRashiPeriod}
              lang={profile.lang}
            />
          )}

          {activeTab === "tarot" && (
            <TarotTab
              tarotQuestion={tarotQuestion}
              setTarotQuestion={setTarotQuestion}
              tarotSpreadMode={tarotSpreadMode}
              setTarotSpreadMode={setTarotSpreadMode}
              tarotLoading={tarotLoading}
              tarotDailyResult={tarotDailyResult}
              tarot3CardResult={tarot3CardResult}
              tarotCelticResult={tarotCelticResult}
              onDrawTarot={handleDrawTarot}
            />
          )}

          {activeTab === "vastu" && (
            <VastuTab
              vastuPropertyType={vastuPropertyType}
              setVastuPropertyType={setVastuPropertyType}
              vastuPropertyFacing={vastuPropertyFacing}
              setVastuPropertyFacing={setVastuPropertyFacing}
              vastuRooms={vastuRooms}
              setVastuRooms={setVastuRooms}
              vastuLoading={vastuLoading}
              vastuEvaluationResult={vastuEvaluationResult}
              onEvaluateVastu={handleEvaluateVastu}
              onApplyPreset={handleApplyVastuPreset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
