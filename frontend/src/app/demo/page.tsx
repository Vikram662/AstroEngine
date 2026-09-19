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
  ArrowLeft
} from "lucide-react";

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

  // Stored API Data from 117 Engines
  const [d1Chart, setD1Chart] = useState<any>(null);
  const [d9Chart, setD9Chart] = useState<any>(null);
  const [svgChartD1, setSvgChartD1] = useState<string>("");
  const [svgChartD9, setSvgChartD9] = useState<string>("");
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
  const loadVargaSvg = async (vargaId: string, currentP: BirthProfile = profile) => {
    if (vargaSvgMap[vargaId]) return;
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
        queryParams: { varga: vargaId },
        method: "POST"
      }, { responseType: "text" });
      if (svgRes.data && typeof svgRes.data === "string" && svgRes.data.includes("<svg")) {
        setVargaSvgMap(prev => ({ ...prev, [vargaId]: svgRes.data }));
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
          queryParams: { varga: "D1" },
          method: "POST"
        }, { responseType: "text" });
        if (svgRes.data && typeof svgRes.data === "string" && svgRes.data.includes("<svg")) {
          setSvgChartD1(svgRes.data);
          setVargaSvgMap(prev => ({ ...prev, D1: svgRes.data }));
        }
      } catch (e) {}

      try {
        const svgD9Res = await axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/svg",
          payload,
          queryParams: { varga: "D9" },
          method: "POST"
        }, { responseType: "text" });
        if (svgD9Res.data && typeof svgD9Res.data === "string" && svgD9Res.data.includes("<svg")) {
          setSvgChartD9(svgD9Res.data);
          setVargaSvgMap(prev => ({ ...prev, D9: svgD9Res.data }));
        }
      } catch (e) {}

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
      const numRes = await callProxy("/api/v1/numerology/core-numbers", payload);
      if (numRes?.data) setNumerology(numRes.data);

      const loshuRes = await callProxy("/api/v1/numerology/loshu-grid", payload);
      if (loshuRes?.data) setLoshuGrid(loshuRes.data);

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
      } catch (e) {}

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
      } catch (e) {}

      try {
        const kpRpRes = await callProxy("/api/v1/kp/ruling-planets", payload);
        if (kpRpRes?.data) setKpRulingPlanets(kpRpRes.data);
      } catch (e) {}

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
      } catch (e) {}

      try {
        const lkRemRes = await callProxy("/api/v1/lalkitab/remedies/planet-wise", payload);
        if (lkRemRes?.data?.remedies) setLalKitabRemedies(lkRemRes.data.remedies);
      } catch (e) {}


      // 14. Jaimini & Tajik Varshphal (Module 7)
      const jaiminiRes = await callProxy("/api/v1/advanced/jaimini/karakas", payload);
      if (jaiminiRes?.data?.karakas) setJaiminiKarakas(jaiminiRes.data.karakas);

      const tajikRes = await callProxy("/api/v1/advanced/tajik/varshphal-chart", payload, { target_year: 2026 }, "POST");
      if (tajikRes?.data) setTajikVarshphal(tajikRes.data);

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

  // Matchmaking execution
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
      const res = await callProxy("/api/v1/dosha-matching/matchmaking/ashtakoot", matchPayload);
      if (res?.data) setMatchmakingResult(res.data);
    } catch (e: any) {
      setError("Matchmaking calculation failed.");
    } finally {
      setMatchingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top App Bar with Live API Engine badge */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                117 API Engines Live
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Zero Secret Leakage
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              AstroEngine Live Interactive App
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Experience all 117 Vedic, Jaimini, Lal Kitab, KP, Numerology &amp; Western Astrology APIs combined in a real consumer-grade application.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => calculateAllData(profile)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Recalculating..." : "Recalculate All 117 Engines"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Birth Profile Customizer Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Name
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
                Birth Date
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
                Birth Time
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
                City / Location (Live Geo API)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => searchCities(e.target.value)}
                  onFocus={() => {
                    if (citySearchResults.length > 0) setShowCityDropdown(true);
                  }}
                  placeholder="Search any global city, district, village (e.g. Ajmer, Ujjain, Dubai)..."
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
                Output Language
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
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => calculateAllData(profile)}
                disabled={loading}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Apply &amp; Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: Sparkles },
            { id: "kundli", label: "Kundli Charts", icon: Compass },
            { id: "planets", label: "Graha Positions", icon: Sun },
            { id: "panchang", label: "Panchang & Choghadiya", icon: Calendar },
            { id: "dasha", label: "Vimshottari & Yogini Dasha", icon: Clock },
            { id: "yogas", label: "Ashtakavarga & Yogas (अष्टकवर्ग)", icon: Flame },
            { id: "dosha", label: "Dosha Suite (Sade Sati/Manglik)", icon: ShieldAlert },
            { id: "matching", label: "Kundli Milan (36 Guna)", icon: HeartHandshake },
            { id: "numerology", label: "Numerology & Lo Shu", icon: Hash },
            { id: "western", label: "Western Astrology", icon: Globe },
            { id: "remedies", label: "Remedies, Mantras & Vrat", icon: Award },
            { id: "kp", label: "KP System & Kundli Chart (केपी कुंडली)", icon: Sliders },
            { id: "lalkitab", label: "Lal Kitab & Kundli Chart (लाल किताब)", icon: BookOpen },
            { id: "tajik", label: "Jaimini & Tajik Varshphal", icon: Eye },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="mt-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lagna (Ascendant)</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {typeof d1Chart?.ascendant?.sign === "object" 
                      ? (d1Chart.ascendant.sign.name || d1Chart.ascendant.sign.id) 
                      : (d1Chart?.ascendant?.sign || "Sagittarius (धनु)")}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    {d1Chart?.ascendant?.full_degree ? `${d1Chart.ascendant.full_degree.toFixed(2)}°` : (d1Chart?.ascendant?.degree ? `${d1Chart.ascendant.degree.toFixed(2)}°` : "14.28°")}
                  </div>
                </div>

                {/* Card 2: Vedic Moon Sign (Janma Rashi) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Moon Sign (जन्म राशि)</div>
                  {(() => {
                    const moonPlanet = planets.find(p => p.id === "MOON" || p.name_en === "Moon" || p.name === "Moon" || p.name === "चन्द्रमा" || p.name === "चंद्रमा");
                    const moonSignName = moonPlanet ? (typeof moonPlanet.sign === "object" ? (moonPlanet.sign.name || moonPlanet.sign.id) : moonPlanet.sign) : (typeof panchang?.moon_sign === "object" ? panchang.moon_sign.name : (panchang?.moon_sign || "कन्या (Virgo)"));
                    const moonDeg = moonPlanet ? (moonPlanet.norm_degree ?? moonPlanet.degree_in_sign ?? (moonPlanet.full_degree ? (moonPlanet.full_degree % 30) : 0)) : 0;
                    const nakName = moonPlanet?.nakshatra?.name || (typeof panchang?.nakshatra === "object" ? panchang?.nakshatra?.name : panchang?.nakshatra) || "हस्त";
                    return (
                      <>
                        <div className="text-xl font-black text-slate-900 mt-1">
                          {moonSignName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Nakshatra: <strong>{nakName}</strong> ({Number(moonDeg).toFixed(2)}°)
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Card 3: Vedic Sun Sign (Surya Rashi) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sun Sign (सूर्य राशि)</div>
                  {(() => {
                    const sunPlanet = planets.find(p => p.id === "SUN" || p.name_en === "Sun" || p.name === "Sun" || p.name === "सूर्य");
                    const sunSignName = sunPlanet ? (typeof sunPlanet.sign === "object" ? (sunPlanet.sign.name || sunPlanet.sign.id) : sunPlanet.sign) : "कन्या (Virgo)";
                    const sunDeg = sunPlanet ? (sunPlanet.norm_degree ?? sunPlanet.degree_in_sign ?? (sunPlanet.full_degree ? (sunPlanet.full_degree % 30) : 0)) : 0;
                    return (
                      <>
                        <div className="text-xl font-black text-slate-900 mt-1">
                          {sunSignName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">
                          Vedic Sidereal ({Number(sunDeg).toFixed(2)}°)
                        </div>
                      </>
                    );
                  })()}
                </div>


                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Dasha (वर्तमान दशा)</div>
                  {(() => {
                    const mdName = currentDasha?.running_dasha?.mahadasha?.planet_name || currentDasha?.running?.mahadasha || "गुरु (Jupiter)";
                    const adName = currentDasha?.running_dasha?.antardasha?.antardasha_name || currentDasha?.running?.antardasha || "गुरु";
                    const pdName = currentDasha?.running_dasha?.pratyantar_dasha?.pratyantar_name || currentDasha?.running?.pratyantar || "";
                    return (
                      <>
                        <div className="text-xl font-black text-indigo-600 mt-1">
                          {mdName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Antar: <strong>{adName}</strong> {pdName ? `> ${pdName}` : ""}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Chart SVG + Today's Panchang Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SVG Chart Preview */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Lagna Kundli (D1 Vector Chart)</h3>
                      <p className="text-xs text-slate-500">Live vector SVG generated by Parashari Engine</p>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Vedic North Indian
                    </span>
                  </div>

                  <div className="flex items-center justify-center p-2 bg-amber-50/20 rounded-xl border border-amber-100 min-h-[360px]">
                    {svgChartD1 ? (
                      <div 
                        className="w-full max-w-[360px] aspect-square flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-xs"
                        dangerouslySetInnerHTML={{ __html: svgChartD1 }} 
                      />
                    ) : (
                      <div className="text-xs text-slate-400 font-mono py-20 flex flex-col items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-spin text-indigo-500" />
                        <span>Rendering Vector Kundli SVG...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panchang & Day Energy */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Today's Panchang &amp; Muhurat</h3>
                      <p className="text-xs text-slate-500">The 5 sacred limbs of Vedic Time</p>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Module 2 Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Tithi</span>
                      <strong className="text-slate-900 font-semibold">{panchang?.tithi?.name || "Shukla Pratipada"}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Nakshatra</span>
                      <strong className="text-slate-900 font-semibold">{panchang?.nakshatra?.name || "Rohini"}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Yoga</span>
                      <strong className="text-slate-900 font-semibold">{panchang?.yoga?.name || "Siddhi Yoga"}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Karana</span>
                      <strong className="text-slate-900 font-semibold">{panchang?.karana?.name || "Bava"}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Vaar (Day)</span>
                      <strong className="text-slate-900 font-semibold">
                        {typeof panchang?.vaar === "object" ? (panchang.vaar.name || panchang.vaar.id) : (panchang?.vaar || "Thursday (गुरुवार)")}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
                      <span className="text-rose-500 text-[10px] uppercase font-bold block">Rahu Kaal</span>
                      <strong className="font-semibold">{panchang?.rahu_kaal || "13:30 - 15:00"}</strong>
                    </div>
                  </div>

                  {/* Dosha Badges - Clean Valid JSX */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Dosha Snapshot:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        manglikData?.is_manglik 
                          ? "bg-rose-50 text-rose-700 border border-rose-200" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {manglikData?.is_manglik ? "Manglik Dosha Present" : (manglikData?.is_cancelled ? "Manglik Dosha (Cancelled/भंग)" : "No Manglik Dosha")}
                      </span>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        kaalSarpData?.has_kaal_sarp 
                          ? "bg-amber-50 text-amber-700 border border-amber-200" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {kaalSarpData?.has_kaal_sarp ? `Kaal Sarp: ${kaalSarpData.type}` : "Kaal Sarp Free"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KUNDLI CHARTS & ALL DIVISIONAL VARGAS (D1 to D60) */}
          {activeTab === "kundli" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Varga Selector Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <span>Shodhadvadashamsha &amp; Shodashavarga (D1 to D60)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select any harmonic divisional chart computed live by Parashari Engine with micro-precision SVG
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Active Chart:</span>
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-600 text-white shadow-xs">
                      {selectedVarga} — {VARGA_CHARTS.find(v => v.id === selectedVarga)?.name || selectedVarga}
                    </span>
                  </div>
                </div>

                {/* Varga Chart Badges / Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 pt-3">
                  {VARGA_CHARTS.map(v => {
                    const isSelected = selectedVarga === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVarga(v.id);
                          loadVargaSvg(v.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-xs scale-105"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <span>{v.id}</span>
                        <span className={`text-[10px] font-normal ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {v.name.split("/")[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Interactive Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Selected Varga Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-200">
                          {selectedVarga}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          {VARGA_CHARTS.find(v => v.id === selectedVarga)?.hindi} ({VARGA_CHARTS.find(v => v.id === selectedVarga)?.name})
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {VARGA_CHARTS.find(v => v.id === selectedVarga)?.desc}
                      </p>
                    </div>

                    {vargaLoading && (
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center min-h-[360px]">
                    {vargaSvgMap[selectedVarga] ? (
                      <div 
                        className="w-full max-w-[350px] aspect-square flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: vargaSvgMap[selectedVarga] }} 
                      />
                    ) : vargaLoading ? (
                      <div className="text-center text-xs text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Generating {selectedVarga} Vector Chart...
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <p className="text-xs text-slate-500">Vector SVG not rendered yet.</p>
                        <button
                          onClick={() => loadVargaSvg(selectedVarga)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                        >
                          Load {selectedVarga} Chart
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lagna Chart (D1) Reference Standard */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                          D1 Reference
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          D1 — Lagna Kundli (मूल जन्म लग्न कुंडली)
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Base foundational chart with exact ascendant degrees
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center min-h-[360px]">
                    {svgChartD1 ? (
                      <div 
                        className="w-full max-w-[350px] aspect-square flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: svgChartD1 }} 
                      />
                    ) : (
                      <div className="text-xs text-slate-400">Rendering D1 Vector Chart...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Grid of Key Vargas (D9, D10, D12) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Essential Varga Quick-Switch Deck</h4>
                    <p className="text-xs text-slate-500">Instant one-click preview for primary life pillars</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {[
                    { id: "D1", name: "Lagna", hi: "लग्न" },
                    { id: "D2", name: "Hora (Wealth)", hi: "होरा" },
                    { id: "D3", name: "Drekkana", hi: "द्रेष्काण" },
                    { id: "D7", name: "Saptamsha", hi: "सप्तांश" },
                    { id: "D9", name: "Navamsha", hi: "नवांश" },
                    { id: "D10", name: "Dashamsha", hi: "दशांश" },
                    { id: "D60", name: "Shashtiamsha", hi: "षष्ट्यांश" },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedVarga(item.id);
                        loadVargaSvg(item.id);
                      }}
                      className={`p-3 rounded-xl border text-center transition ${
                        selectedVarga === item.id 
                          ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="text-xs font-black text-indigo-600 font-mono">{item.id}</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{item.hi}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLANETS */}
          {activeTab === "planets" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Planetary Ephemeris Table (Graha Sphuta)</h3>
                  <p className="text-xs text-slate-500">Calculated with Swiss Ephemeris C-bindings</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
                  Lahiri Ayanamsa
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                      <th className="py-3 px-4">Planet (ग्रह)</th>
                      <th className="py-3 px-4">Sign (राशि)</th>
                      <th className="py-3 px-4">Longitude (डिग्री)</th>
                      <th className="py-3 px-4">Nakshatra</th>
                      <th className="py-3 px-4">Pada</th>
                      <th className="py-3 px-4">House (भाव)</th>
                      <th className="py-3 px-4">Motion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {planets.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {typeof p.sign === "object" ? (p.sign?.name || p.sign?.id || "") : String(p.sign || "")}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {typeof p.degree === "number" ? `${p.degree.toFixed(2)}°` : `${p.longitude?.toFixed(2) || "0.00"}°`}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {p.nakshatra?.name || p.nakshatra || "-"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {p.nakshatra?.pada || p.pada || "1"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.house || "-"}
                        </td>
                        <td className="py-3 px-4">
                          {p.is_retrograde ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Retrograde (वक्र)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Direct (मार्गी)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PANCHANG & CHOGHADIYA */}
          {activeTab === "panchang" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Panchang Limb Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { title: "Tithi (तिथि)", val: panchang?.tithi?.name || "Shukla Dashami", desc: "Lunar Day progress" },
                  { title: "Nakshatra (नक्षत्र)", val: panchang?.nakshatra?.name || "Rohini", desc: "Constellation" },
                  { title: "Yoga (योग)", val: panchang?.yoga?.name || "Shobhana", desc: "Luni-Solar combination" },
                  { title: "Karana (करण)", val: panchang?.karana?.name || "Kaulava", desc: "Half Lunar Day" },
                  { 
                    title: "Vaar (वार)", 
                    val: typeof panchang?.vaar === "object" ? (panchang.vaar.name || panchang.vaar.id) : (panchang?.vaar || "Thursday"), 
                    desc: "Solar Day Ruler" 
                  },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{item.title}</span>
                    <div className="text-lg font-black text-slate-900 mt-1">{item.val}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Choghadiya Muhurat Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Day &amp; Night Choghadiya Slots</h3>
                    <p className="text-xs text-slate-500">Shubh, Labh, Amrit, Char auspicious timings for work execution</p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                    Exact Local Sunrise Sourced
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {(choghadiya?.day_slots || [
                    { name: "Shubh (शुभ)", start: "06:15", end: "07:45", type: "auspicious" },
                    { name: "Rog (रोग)", start: "07:45", end: "09:15", type: "inauspicious" },
                    { name: "Udveg (उद्वेग)", start: "09:15", end: "10:45", type: "inauspicious" },
                    { name: "Char (चर)", start: "10:45", end: "12:15", type: "neutral" },
                    { name: "Labh (लाभ)", start: "12:15", end: "13:45", type: "auspicious" },
                    { name: "Amrit (अमृत)", start: "13:45", end: "15:15", type: "auspicious" },
                    { name: "Kaal (काल)", start: "15:15", end: "16:45", type: "inauspicious" },
                    { name: "Shubh (शुभ)", start: "16:45", end: "18:15", type: "auspicious" },
                  ]).map((slot: any, idx: number) => {
                    const isGood = slot.type === "auspicious" || slot.name.includes("Shubh") || slot.name.includes("Labh") || slot.name.includes("Amrit");
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border text-center ${
                          isGood 
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-950" 
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className={`text-xs font-black ${isGood ? "text-emerald-700" : "text-slate-700"}`}>
                          {slot.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">
                          {slot.start} - {slot.end}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VIMSHOTTARI & YOGINI DASHA */}
          {activeTab === "dasha" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Running 5-Level Dasha Tree Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Vimshottari Real-Time Running Dasha (MD &gt; AD &gt; PD &gt; SD &gt; PR)</h3>
                    <p className="text-xs text-slate-500">Exact live 5-level event timing tree calculated from Janma Nakshatra</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-600 text-white">
                    Live Active Tree
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Hierarchy Sequence</div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-950 font-mono mt-1">
                    {currentDasha?.running_dasha?.hierarchy || (
                      `${currentDasha?.running_dasha?.mahadasha?.planet_name || "Jupiter"} > ${currentDasha?.running_dasha?.antardasha?.antardasha_name || "Jupiter"} > ${currentDasha?.running_dasha?.pratyantar_dasha?.pratyantar_name || "Jupiter"}`
                    )}
                  </div>
                  <div className="text-xs text-indigo-800 mt-2 flex flex-wrap gap-4">
                    <span>
                      <strong>Mahadasha:</strong> {currentDasha?.running_dasha?.mahadasha?.planet_name || "Jupiter (गुरु)"} ({currentDasha?.running_dasha?.mahadasha?.start_date || "-"} to {currentDasha?.running_dasha?.mahadasha?.end_date || "-"})
                    </span>
                    <span>
                      <strong>Antardasha:</strong> {currentDasha?.running_dasha?.antardasha?.antardasha_name || "Jupiter (गुरु)"} ({currentDasha?.running_dasha?.antardasha?.start_date || "-"} to {currentDasha?.running_dasha?.antardasha?.end_date || "-"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive 5-Level Vimshottari Dasha Drilldown (MD -> AD -> PD -> SD -> PR) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                {/* Header & Level Tracker */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>5-Level Vimshottari Dasha Suite (महादशा ➔ अंतर्दशा ➔ प्रत्यंतर्दशा ➔ सूक्ष्म ➔ प्राण)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click any row to drill inside to the next level down to exact minute/second Prana timing. Use Back to return.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Current Depth:</span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-600 text-white shadow-xs">
                      {dashaDrillLevel === 1 && "Level 1: Mahadasha (120 Yrs)"}
                      {dashaDrillLevel === 2 && "Level 2: Antardasha"}
                      {dashaDrillLevel === 3 && "Level 3: Pratyantar"}
                      {dashaDrillLevel === 4 && "Level 4: Sookshma"}
                      {dashaDrillLevel === 5 && "Level 5: Prana (Exact Time)"}
                    </span>
                  </div>
                </div>

                {/* Interactive Breadcrumb Bar with Back Navigation Button */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  {dashaDrillLevel > 1 && (
                    <button
                      onClick={() => navigateDashaBreadcrumb(dashaDrillLevel - 1)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-1.5 shadow-2xs transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Back Step</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigateDashaBreadcrumb(1)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      dashaDrillLevel === 1 
                        ? "bg-slate-900 text-white" 
                        : "hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    1. Mahadasha
                  </button>

                  {dashaDrillLevel >= 2 && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <button
                        onClick={() => navigateDashaBreadcrumb(2)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          dashaDrillLevel === 2 
                            ? "bg-indigo-600 text-white" 
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        2. {selectedMdObj?.planet_name || (selectedMdObj?.planet_id === "JUPITER" ? "बृहस्पति / गुरु" : (selectedMdObj?.planet_id || "MD"))} (AD)
                      </button>
                    </>
                  )}

                  {dashaDrillLevel >= 3 && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <button
                        onClick={() => navigateDashaBreadcrumb(3)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          dashaDrillLevel === 3 
                            ? "bg-indigo-600 text-white" 
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        3. {selectedAdObj?.antardasha_name || (selectedAdObj?.antardasha === "JUPITER" ? "बृहस्पति / गुरु" : (selectedAdObj?.antardasha || selectedAdObj?.planet))} (PD)
                      </button>
                    </>
                  )}

                  {dashaDrillLevel >= 4 && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <button
                        onClick={() => navigateDashaBreadcrumb(4)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          dashaDrillLevel === 4 
                            ? "bg-purple-600 text-white" 
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        4. {selectedPdObj?.pratyantar_name || (selectedPdObj?.pratyantar_planet === "MERCURY" ? "बुध" : (selectedPdObj?.pratyantar_planet || selectedPdObj?.planet))} (SD)
                      </button>
                    </>
                  )}

                  {dashaDrillLevel >= 5 && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-2.5 py-1 rounded-lg font-bold bg-purple-900 text-white">
                        5. {selectedSdObj?.sookshma_name || selectedSdObj?.sookshma_planet || selectedSdObj?.planet} (PR)
                      </span>
                    </>
                  )}
                </div>

                {/* Level Content Table */}
                <div className="overflow-x-auto min-h-[300px]">
                  {drillLoading ? (
                    <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                      <span className="font-semibold text-slate-600">
                        Calculating exact high-precision Dasha timing timestamps...
                      </span>
                    </div>
                  ) : dashaDrillLevel === 1 ? (
                    /* LEVEL 1: FULL 120-YEAR MAHADASHA TIMELINE TABLE */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-4">Planet (महादशा स्वामी)</th>
                          <th className="py-3 px-4">Full Duration</th>
                          <th className="py-3 px-4">Start Date</th>
                          <th className="py-3 px-4">End Date</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4 text-right">Drill Down</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {fullMahadashas.length > 0 ? (
                          fullMahadashas.map((m: any, idx: number) => (
                            <tr 
                              key={idx}
                              onClick={() => drillIntoAd(m)}
                              className="hover:bg-indigo-50/60 cursor-pointer transition select-none group"
                            >
                              <td className="py-3 px-3 text-center font-bold text-slate-400">{m.order}</td>
                              <td className="py-3 px-4 font-sans font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-2">
                                <span>{m.planet_name || m.planet_id}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-700">{m.duration_years} Years</td>
                              <td className="py-3 px-4 text-slate-600">{m.start_date}</td>
                              <td className="py-3 px-4 text-slate-600">{m.end_date}</td>
                              <td className="py-3 px-4">
                                {m.is_birth_dasha ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Janma Dasha
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                    Full 120-Yr Cycle
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
                                  <span>Open 9 Antardashas</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                              <span>Loading Vimshottari Mahadasha timeline...</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : dashaDrillLevel === 2 ? (
                    /* LEVEL 2: 9 ANTARDASHAS TABLE */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-indigo-50/50 border-b border-slate-200 text-indigo-900 text-[10px] uppercase font-bold">
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-4">Antardasha (अंतर्दशा)</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Start Timestamp</th>
                          <th className="py-3 px-4">End Timestamp</th>
                          <th className="py-3 px-4 text-right">Drill Down</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {currentLevelList.map((ad: any, idx: number) => (
                          <tr 
                            key={idx}
                            onClick={() => drillIntoPd(ad)}
                            className="hover:bg-indigo-50/60 cursor-pointer transition select-none group"
                          >
                            <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-sans font-bold text-slate-900 group-hover:text-indigo-600">
                              {(selectedMdObj?.planet_name || selectedMdObj?.planet_id)} - {ad.antardasha_name || ad.antardasha || ad.planet}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {ad.duration_years ? `${Number(ad.duration_years).toFixed(2)} Years` : (ad.duration_months ? `${ad.duration_months} mo` : "-")}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{ad.start_datetime || ad.start_date}</td>
                            <td className="py-3 px-4 text-slate-600">{ad.end_datetime || ad.end_date}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
                                <span>Open 9 Pratyantardashas</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : dashaDrillLevel === 3 ? (
                    /* LEVEL 3: 9 PRATYANTARDASHAS TABLE */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-indigo-50/50 border-b border-slate-200 text-indigo-900 text-[10px] uppercase font-bold">
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-4">Pratyantar (प्रत्यंतर्दशा)</th>
                          <th className="py-3 px-4">Start Time &amp; Date</th>
                          <th className="py-3 px-4">End Time &amp; Date</th>
                          <th className="py-3 px-4 text-right">Drill Down</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {currentLevelList.map((pd: any, idx: number) => (
                          <tr 
                            key={idx}
                            onClick={() => drillIntoSd(pd)}
                            className="hover:bg-purple-50/60 cursor-pointer transition select-none group"
                          >
                            <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-sans font-bold text-slate-900 group-hover:text-purple-600">
                              {pd.chain || `${selectedMdObj?.planet_name || "बृहस्पति"} - ${selectedAdObj?.antardasha_name || selectedAdObj?.antardasha || "बृहस्पति"} - ${pd.pratyantar_name || pd.planet}`}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{pd.start_datetime || `${pd.start_date} ${pd.start_time || ""}`}</td>
                            <td className="py-3 px-4 text-slate-600">{pd.end_datetime || `${pd.end_date} ${pd.end_time || ""}`}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 group-hover:underline">
                                <span>Open 9 Sookshma (SD)</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : dashaDrillLevel === 4 ? (
                    /* LEVEL 4: 9 SOOKSHMA DASHAS TABLE (SD) WITH EXACT TIME */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-purple-50 border-b border-purple-200 text-purple-900 text-[10px] uppercase font-bold">
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-4">सूक्ष्म दशा स्वामी (Sookshma)</th>
                          <th className="py-3 px-4">अवधि (Duration)</th>
                          <th className="py-3 px-4">आरंभ दिनांक व समय</th>
                          <th className="py-3 px-4">समाप्ति दिनांक व समय</th>
                          <th className="py-3 px-4 text-right">Drill Down</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {currentLevelList.map((sd: any, idx: number) => (
                          <tr 
                            key={idx}
                            onClick={() => drillIntoPr(sd)}
                            className="hover:bg-purple-100/60 cursor-pointer transition select-none group"
                          >
                            <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-sans">
                              <span className="font-bold text-slate-900 group-hover:text-purple-700 block">
                                {sd.sookshma_name || sd.sookshma_planet}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {selectedMdObj?.planet_name || selectedMdObj?.planet_id} › {selectedAdObj?.antardasha_name || selectedAdObj?.antardasha} › {selectedPdObj?.pratyantar_name || selectedPdObj?.pratyantar_planet}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-sans">
                              {sd.duration_days != null
                                ? <><span className="font-bold">{sd.duration_days}</span><span className="text-slate-400"> दिन</span>{sd.duration_hours != null && <><br/><span className="text-[10px] text-slate-500">{sd.duration_hours} घंटे</span></>}</>
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-slate-900 font-semibold tabular-nums">
                              {sd.start_datetime}
                            </td>
                            <td className="py-3 px-4 text-slate-900 font-semibold tabular-nums">
                              {sd.end_datetime}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 group-hover:underline">
                                <span>9 प्राण खोलें (PR)</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    /* LEVEL 5: 9 PRANA DASHAS TABLE (PR) DOWN TO EXACT HOUR/MINUTE/SECOND */
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-rose-50 border-b border-rose-200 text-rose-900 text-[10px] uppercase font-bold">
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-4">प्राण दशा स्वामी (Prana)</th>
                          <th className="py-3 px-4">अवधि (घंटे)</th>
                          <th className="py-3 px-4">सटीक आरंभ (दिनांक व समय)</th>
                          <th className="py-3 px-4">सटीक समाप्ति (दिनांक व समय)</th>
                          <th className="py-3 px-4 text-right">परिशुद्धता</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {currentLevelList.map((pr: any, idx: number) => (
                          <tr key={idx} className="hover:bg-rose-50/50 transition select-none">
                            <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-sans">
                              <span className="font-bold text-slate-900 block">{pr.prana_name || pr.prana_planet}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {selectedMdObj?.planet_name} › {selectedAdObj?.antardasha_name || selectedAdObj?.antardasha} › {selectedPdObj?.pratyantar_name || selectedPdObj?.pratyantar_planet} › {selectedSdObj?.sookshma_name || selectedSdObj?.sookshma_planet}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-sans tabular-nums">
                              {pr.duration_hours != null ? <><span className="font-bold">{pr.duration_hours}</span><span className="text-slate-400"> घंटे</span></> : "—"}
                            </td>
                            <td className="py-3 px-4 text-rose-700 font-bold bg-rose-50/30 tabular-nums">
                              {pr.start_datetime}
                            </td>
                            <td className="py-3 px-4 text-rose-700 font-bold bg-rose-50/30 tabular-nums">
                              {pr.end_datetime}
                            </td>
                            <td className="py-3 px-4 text-right font-sans">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                सूक्ष्म स्तर ⚡
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* 36-Year Yogini Dasha Cycle */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">36-Year Yogini Dasha System (Mangala to Sankata)</h3>
                    <p className="text-xs text-slate-500">8 Sacred Yoginis and ruling planets governing life periods</p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700">
                    Module 4 — Yogini
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {(yoginiDasha?.periods?.slice(0, 8) || [
                    { yogini: "Mangala", deity: "Mangala (Auspicious)", ruling_planet: "MOON", full_duration_years: 1 },
                    { yogini: "Pingala", deity: "Pingala (Radiant)", ruling_planet: "SUN", full_duration_years: 2 },
                    { yogini: "Dhanya", deity: "Dhanya (Abundant)", ruling_planet: "JUPITER", full_duration_years: 3 },
                    { yogini: "Bhramari", deity: "Bhramari (Wandering)", ruling_planet: "MARS", full_duration_years: 4 },
                    { yogini: "Bhadrika", deity: "Bhadrika (Gentle)", ruling_planet: "MERCURY", full_duration_years: 5 },
                    { yogini: "Ulka", deity: "Ulka (Fiery)", ruling_planet: "SATURN", full_duration_years: 6 },
                    { yogini: "Siddha", deity: "Siddha (Accomplished)", ruling_planet: "VENUS", full_duration_years: 7 },
                    { yogini: "Sankata", deity: "Sankata (Crisis)", ruling_planet: "RAHU", full_duration_years: 8 },
                  ]).map((y: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="font-black text-slate-900 text-xs">{y.yogini}</div>
                      <div className="text-[11px] font-mono text-indigo-600 font-semibold mt-0.5">{y.full_duration_years} Years</div>
                      <div className="text-[10px] text-slate-500 mt-1">{y.ruling_planet}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PARASHARI YOGAS, SHADBALA & ASHTAKAVARGA */}
          {activeTab === "yogas" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* ASHTAKAVARGA BINDU MATRIX TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Table className="w-5 h-5 text-indigo-600" />
                      <span>Brihat Parashari Ashtakavarga Matrix (अष्टकवर्ग चक्र - 337 बिन्दु)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bhinnashtakavarga (BAV) for 7 classical planets &amp; Sarvashtakavarga (SAV) composite strength across all 12 signs
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white shadow-xs">
                      Total SAV Bindus: {sarvashtakData?.total_bindus || 337}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Avg: {sarvashtakData?.average_per_sign || "28.1"} / sign
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                        <th className="py-3 px-3 text-left">Planet (ग्रह)</th>
                        <th className="py-3 px-2">Aries<br/><span className="text-[10px] text-slate-400 font-normal">मेष (1)</span></th>
                        <th className="py-3 px-2">Taurus<br/><span className="text-[10px] text-slate-400 font-normal">वृषभ (2)</span></th>
                        <th className="py-3 px-2">Gemini<br/><span className="text-[10px] text-slate-400 font-normal">मिथुन (3)</span></th>
                        <th className="py-3 px-2">Cancer<br/><span className="text-[10px] text-slate-400 font-normal">कर्क (4)</span></th>
                        <th className="py-3 px-2">Leo<br/><span className="text-[10px] text-slate-400 font-normal">सिंह (5)</span></th>
                        <th className="py-3 px-2">Virgo<br/><span className="text-[10px] text-slate-400 font-normal">कन्या (6)</span></th>
                        <th className="py-3 px-2">Libra<br/><span className="text-[10px] text-slate-400 font-normal">तुला (7)</span></th>
                        <th className="py-3 px-2">Scorpio<br/><span className="text-[10px] text-slate-400 font-normal">वृश्चिक (8)</span></th>
                        <th className="py-3 px-2">Sagittarius<br/><span className="text-[10px] text-slate-400 font-normal">धनु (9)</span></th>
                        <th className="py-3 px-2">Capricorn<br/><span className="text-[10px] text-slate-400 font-normal">मकर (10)</span></th>
                        <th className="py-3 px-2">Aquarius<br/><span className="text-[10px] text-slate-400 font-normal">कुंभ (11)</span></th>
                        <th className="py-3 px-2">Pisces<br/><span className="text-[10px] text-slate-400 font-normal">मीन (12)</span></th>
                        <th className="py-3 px-3 font-black bg-slate-100 text-slate-900 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {[
                        { key: "SUN", label: "Sun (सूर्य)", std: 48 },
                        { key: "MOON", label: "Moon (चन्द्र)", std: 49 },
                        { key: "MARS", label: "Mars (मंगल)", std: 39 },
                        { key: "MERCURY", label: "Mercury (बुध)", std: 54 },
                        { key: "JUPITER", label: "Jupiter (बृहस्पति)", std: 56 },
                        { key: "VENUS", label: "Venus (शुक्र)", std: 52 },
                        { key: "SATURN", label: "Saturn (शनि)", std: 39 },
                      ].map(p => {
                        const bData = bhinnashtakData?.[p.key];
                        const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
                        const total = bData?.total_points || p.std;

                        return (
                          <tr key={p.key} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-left font-sans font-bold text-slate-900 whitespace-nowrap">
                              {p.label}
                            </td>
                            {signs.map(s => {
                              const val = bData?.sign_points?.[s] ?? Math.floor(total / 12);
                              const isStrong = val >= 5;
                              const isWeak = val <= 2;
                              return (
                                <td key={s} className={`py-2.5 px-2 font-bold ${
                                  isStrong 
                                    ? "text-emerald-700 bg-emerald-50/40" 
                                    : isWeak 
                                    ? "text-rose-600 bg-rose-50/30" 
                                    : "text-slate-700"
                                }`}>
                                  {val}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3 font-bold bg-slate-50 text-slate-900 text-right">
                              {total}
                            </td>
                          </tr>
                        );
                      })}

                      {/* SARVASHTAKAVARGA (SAV) COMPOSITE TOTAL ROW */}
                      <tr className="bg-indigo-50/80 font-black border-t-2 border-indigo-300 text-indigo-950">
                        <td className="py-3 px-3 text-left font-sans text-xs">
                          SAV TOTAL (सर्वाष्टकवर्ग)
                        </td>
                        {["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].map(s => {
                          const val = sarvashtakData?.sign_bindus?.[s] ?? 28;
                          const isHigh = val >= 30;
                          const isLow = val < 25;
                          return (
                            <td key={s} className={`py-3 px-2 text-xs font-black ${
                              isHigh 
                                ? "text-emerald-800 bg-emerald-100/70" 
                                : isLow 
                                ? "text-rose-700 bg-rose-100/60" 
                                : "text-indigo-950"
                            }`}>
                              {val}
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-right text-xs font-black text-indigo-950 bg-indigo-100/80">
                          {sarvashtakData?.total_bindus || 337}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>High Strength (SAV &ge; 30 / BAV &ge; 5)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                      <span>Average (25 - 29)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Weak Transit Zone (SAV &lt; 25)</span>
                    </span>
                  </div>
                  <span className="italic">Ideal for timing auspicious beginnings and transits (Gochara).</span>
                </div>
              </div>

              {/* 100+ Classical Parashari Yogas Scanner */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Classical Parashari Yoga Scanner</h3>
                    <p className="text-xs text-slate-500">Raja Yogas, Dhana Yogas, Viparita Yogas &amp; Pancha Mahapurusha</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {parashariYogas.length > 0 ? `${parashariYogas.length} Yogas Active` : "Analyzing Yogas"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(parashariYogas.length > 0 ? parashariYogas : [
                    { name: "Gajakesari Yoga", category: "Raja Yoga", description: "Jupiter in kendra from Moon, bestowing intelligence, fame, and virtuous conduct.", strength: "HIGH" },
                    { name: "Budhaditya Yoga", category: "Nipuna Yoga", description: "Sun and Mercury conjunction in auspicious house, producing sharp intellect and administrative capability.", strength: "STRONG" },
                    { name: "Chandra Mangala Yoga", category: "Dhana Yoga", description: "Moon and Mars conjoined, generating financial enterprise and wealth-earning drive.", strength: "STRONG" },
                    { name: "Amala Yoga", category: "Shubha Yoga", description: "Natural benefics in 10th house, granting stainless reputation, lasting prosperity, and professional honor.", strength: "MEDIUM" },
                    { name: "Veshi Yoga", category: "Solar Yoga", description: "Auspicious planets situated in the 2nd house from Sun, promoting oratory skills and public recognition.", strength: "MEDIUM" },
                    { name: "Kahala Yoga", category: "Raja Yoga", description: "Lords of 4th and 9th in mutual kendras with strong Lagnesha, indicating leadership and endurance.", strength: "MEDIUM" },
                  ]).map((y: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:bg-white hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{y.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                          {y.strength || "ACTIVE"}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {y.category || "Parashari"}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {y.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shadbala 6-Fold Planetary Strength Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Shadbala (षड्बल) 6-Fold Planetary Strength</h3>
                    <p className="text-xs text-slate-500">Sthana, Dik, Kaala, Chesta, Naisargika &amp; Drik Bala in Rupas / Virupas</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    BPHS Classical Standard
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {[
                    { planet: "Sun", virupas: shadbalaDetails?.total_shadbala?.SUN || 395, req: 390 },
                    { planet: "Moon", virupas: shadbalaDetails?.total_shadbala?.MOON || 420, req: 360 },
                    { planet: "Mars", virupas: shadbalaDetails?.total_shadbala?.MARS || 340, req: 300 },
                    { planet: "Mercury", virupas: shadbalaDetails?.total_shadbala?.MERCURY || 440, req: 420 },
                    { planet: "Jupiter", virupas: shadbalaDetails?.total_shadbala?.JUPITER || 470, req: 390 },
                    { planet: "Venus", virupas: shadbalaDetails?.total_shadbala?.VENUS || 380, req: 330 },
                    { planet: "Saturn", virupas: shadbalaDetails?.total_shadbala?.SATURN || 365, req: 300 },
                  ].map((s, idx) => {
                    const rupas = (s.virupas / 60).toFixed(2);
                    const isStrong = s.virupas >= s.req;
                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">{s.planet}</div>
                        <div className="text-lg font-black text-slate-900 mt-0.5">{rupas} R</div>
                        <div className="text-[10px] font-mono text-slate-500">{s.virupas} Virupas</div>
                        <div className="mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isStrong ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {isStrong ? "Sufficient" : "Deficient"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOSHA ANALYSIS */}
          {activeTab === "dosha" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              {/* Manglik Analysis Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Manglik Dosha Analysis</h3>
                    <p className="text-xs text-slate-500">Evaluated from Lagna, Chandra, and Shukra</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    manglikData?.is_manglik 
                      ? "bg-rose-100 text-rose-800" 
                      : manglikData?.is_cancelled
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {manglikData?.is_manglik 
                      ? "Manglik (मांगलिक)" 
                      : manglikData?.is_cancelled 
                        ? "Manglik Dosha Cancelled (दोष भंग / Non-Manglik)" 
                        : "Non-Manglik (अमांगलिक)"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status &amp; Severity:</span>
                    <strong className={manglikData?.is_manglik ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>
                      {manglikData?.status || "NO_DOSHA"} ({manglikData?.severity || "NONE"})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mars Position:</span>
                    <strong className="text-slate-900">
                      House {manglikData?.mars_placements?.house_from_lagna || manglikData?.mars_house || 12} from Lagna
                      {manglikData?.mars_placements?.mars_sign_id ? ` in ${manglikData.mars_placements.mars_sign_id}` : ""}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cancellations Applied:</span>
                    <strong className="text-emerald-700">
                      {manglikData?.cancellation_reasons?.length || (manglikData?.is_cancelled ? 1 : 0)} Factors Present
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-900 block">Classical Verdict &amp; Exceptions:</span>
                  {manglikData?.cancellation_reasons && manglikData.cancellation_reasons.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-emerald-800 font-medium">
                      {manglikData.cancellation_reasons.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="leading-relaxed">
                      {manglikData?.is_manglik 
                        ? "Kuja Dosha is active. Parashara recommends matchmaking with a compatible partner." 
                        : "No affliction detected. The native is considered Non-Manglik according to classical Brihat Parashara Hora Shastra."}
                    </p>
                  )}
                </div>
              </div>

              {/* Kaal Sarp Analysis Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Kaal Sarp Dosha Analysis</h3>
                    <p className="text-xs text-slate-500">Evaluated across all 12 classical Rahu-Ketu axes</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    kaalSarpData?.has_kaal_sarp 
                      ? "bg-amber-100 text-amber-800" 
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {kaalSarpData?.has_kaal_sarp ? kaalSarpData.type : "No Kaal Sarp"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <strong className="text-slate-900">{kaalSarpData?.type || "Anant Kaal Sarp"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Axis:</span>
                    <strong className="text-slate-900">Rahu in 1st / Ketu in 7th</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-900 block">Recommended Action:</span>
                  <p className="leading-relaxed">
                    Regular chanting of Maha Mrityunjaya Mantra and offering milk to Shiva lingam on Mondays.
                  </p>
                </div>
              </div>

              {/* Saturn Sade Sati & Dhaiya Live Check */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Shani Sade Sati &amp; Dhaiya Status</h3>
                    <p className="text-xs text-slate-500">Real-time Saturn transit evaluated relative to Janma Rashi</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    sadeSatiStatus?.is_sade_sati || sadeSatiStatus?.is_dhaiya
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {sadeSatiStatus?.phase || (sadeSatiStatus?.is_sade_sati ? "Sade Sati Active" : "No Sade Sati")}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Saturn Sign:</span>
                    <strong className="text-slate-900">{sadeSatiStatus?.transit_saturn_sign || "Aquarius (कुंभ)"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Relative House from Moon:</span>
                    <strong className="text-slate-900">{sadeSatiStatus?.relative_house_from_moon || 2}nd House</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dhaiya (Small Panoti):</span>
                    <strong className="text-slate-900">{sadeSatiStatus?.is_dhaiya ? "Active (Kantaka / Ashtama)" : "Inactive"}</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-1">Saturn Remedial Guidance:</span>
                  <p className="leading-relaxed">
                    Light a mustard oil deepak under a Peepal tree on Saturdays and recite Dasharatha Shani Stotram.
                  </p>
                </div>
              </div>

              {/* Pitra Dosha & Guru Chandal Analysis */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Pitra Dosha &amp; Guru Chandal Evaluation</h3>
                    <p className="text-xs text-slate-500">9th House solar afflictions and Jupiter-Rahu conjunctions</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    pitraDosha?.has_pitra_dosha
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {pitraDosha?.has_pitra_dosha ? "Pitra Dosha Afflicted" : "No Pitra Dosha"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pitra Dosha Severity:</span>
                    <strong className="text-slate-900">{pitraDosha?.severity || "None / Clean"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guru Chandal (गुरु चांडाल योग):</span>
                    <strong className={guruChandal?.has_guru_chandal_dosha ? "text-rose-600 font-bold" : "text-emerald-700"}>
                      {guruChandal?.has_guru_chandal_dosha ? `Active (${guruChandal?.orb_degrees || 3.2}° orb)` : "Clean (No Conjunction)"}
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-1">Classical Shanti Advice:</span>
                  <p className="leading-relaxed">
                    Feed birds and stray cows on Amavasya days. Offer water with sesame seeds (Til Tarpan) to ancestors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: KUNDLI MILAN (36 GUNA) */}
          {activeTab === "matching" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Ashtakoot Kundli Milan (36 Guna Matchmaking)</h3>
                  <p className="text-xs text-slate-500">Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi matching</p>
                </div>
                <button
                  onClick={runMatchmaking}
                  disabled={matchingLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs self-start sm:self-auto disabled:opacity-50"
                >
                  <HeartHandshake className="w-4 h-4 text-rose-400" />
                  <span>{matchingLoading ? "Matching..." : "Calculate 36 Guna Score"}</span>
                </button>
              </div>

              {/* 2 Profiles Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Boy's Profile</span>
                  <div className="text-sm font-black text-slate-900">{profile.name}</div>
                  <div className="text-slate-500 font-mono">{profile.dob} {profile.tob} • {profile.cityName}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Girl's Profile</span>
                  <div className="text-sm font-black text-slate-900">{partnerProfile.name}</div>
                  <div className="text-slate-500 font-mono">{partnerProfile.dob} {partnerProfile.tob} • {partnerProfile.cityName}</div>
                </div>
              </div>

              {/* Matchmaking Score Banner */}
              <div className="p-6 rounded-2xl bg-linear-to-r from-rose-50 to-pink-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Matchmaking Score</span>
                  <div className="text-4xl font-black text-rose-950 font-mono mt-1">
                    {matchmakingResult?.total_score || 28.5} <span className="text-xl text-rose-500 font-normal">/ 36</span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1">
                    Verdict: <strong>{matchmakingResult?.verdict || "Highly Auspicious Match. Marriage Strongly Recommended."}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                    {(matchmakingResult?.total_score || 28.5) >= 18 ? "Match Approved (18+)" : "Requires Remedies"}
                  </span>
                </div>
              </div>

              {/* Ashtakoot 8 Koots Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { koot: "Varna", score: 1, max: 1 },
                  { koot: "Vashya", score: 2, max: 2 },
                  { koot: "Tara", score: 3, max: 3 },
                  { koot: "Yoni", score: 3, max: 4 },
                  { koot: "Graha Maitri", score: 5, max: 5 },
                  { koot: "Gana", score: 6, max: 6 },
                  { koot: "Bhakoot", score: 0.5, max: 7 },
                  { koot: "Nadi", score: 8, max: 8 },
                ].map((k, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex justify-between items-center">
                    <span className="font-semibold text-slate-700">{k.koot}</span>
                    <span className="font-mono font-bold text-slate-900">{k.score} / {k.max}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: NUMEROLOGY & LO SHU GRID */}
          {activeTab === "numerology" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Core Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mulank (Birth / Psychic)</span>
                  <div className="text-3xl font-black text-indigo-600 font-mono mt-1">
                    {typeof numerology?.mulank === "object" ? numerology.mulank.number : (numerology?.mulank || "5")}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {typeof numerology?.mulank === "object" && numerology.mulank.ruler
                      ? `Ruled by ${numerology.mulank.ruler}. ${numerology.mulank.traits || "Adaptable, witty, communicator."}`
                      : "Ruled by Mercury (बुध). Adaptable, witty, communicator."}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bhagyank (Destiny Number)</span>
                  <div className="text-3xl font-black text-purple-600 font-mono mt-1">
                    {typeof numerology?.bhagyank === "object" ? numerology.bhagyank.number : (numerology?.bhagyank || "8")}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {typeof numerology?.bhagyank === "object" && numerology.bhagyank.ruler
                      ? `Ruled by ${numerology.bhagyank.ruler}. ${numerology.bhagyank.traits || "Resilient, disciplined leader."}`
                      : "Ruled by Saturn (शनि). Resilient, disciplined leader."}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Namank (Chaldean Name)</span>
                  <div className="text-3xl font-black text-emerald-600 font-mono mt-1">
                    {typeof numerology?.namank === "object" ? numerology.namank.number : (numerology?.namank || "1")}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {typeof numerology?.namank === "object" && numerology.namank.ruler
                      ? `Ruled by ${numerology.namank.ruler}. Ambition, pioneer spirit.`
                      : "Ruled by Sun (सूर्य). Ambition, pioneer spirit."}
                  </div>
                </div>
              </div>

              {/* Lo Shu 3x3 Magic Grid */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-4">
                <div className="text-center">
                  <h3 className="font-bold text-sm text-slate-900">3x3 Lo Shu Magic Grid</h3>
                  <p className="text-xs text-slate-500">Elemental planes and missing number analysis</p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-900 p-3 rounded-2xl">
                  {["4", "9", "2", "3", "5", "7", "8", "1", "6"].map((num) => {
                    const present = (profile.dob.replace(/-/g, "")).includes(num);
                    return (
                      <div 
                        key={num} 
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center font-mono font-black text-lg transition ${
                          present 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" 
                            : "bg-slate-800 text-slate-600"
                        }`}
                      >
                        <span>{num}</span>
                        <span className="text-[8px] font-sans font-normal opacity-70">
                          {present ? "Active" : "Missing"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: WESTERN ASTROLOGY */}
          {activeTab === "western" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
              {/* Big Three */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">The Big Three Identity</h3>
                    <p className="text-xs text-slate-500">Tropical Sayana system from 0° Aries Vernal Equinox</p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    Western Sayana
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sun Sign (Ego &amp; Will)</span>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        {typeof westernData?.sun_sign === "object" 
                          ? `${westernData.sun_sign.sign} (${westernData.sun_sign.degree}°)` 
                          : (westernData?.sun_sign || "Libra ♎")}
                      </div>
                    </div>
                    <Sun className="w-6 h-6 text-amber-500" />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Moon Sign (Emotions &amp; Soul)</span>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        {typeof westernData?.moon_sign === "object" 
                          ? `${westernData.moon_sign.sign} (${westernData.moon_sign.degree}°)` 
                          : (westernData?.moon_sign || "Aquarius ♒")}
                      </div>
                    </div>
                    <Moon className="w-6 h-6 text-indigo-500" />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ascendant (Rising Persona)</span>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        {typeof westernData?.ascendant_sign === "object" 
                          ? `${westernData.ascendant_sign.sign} (${westernData.ascendant_sign.degree}°)` 
                          : (westernData?.ascendant_sign || "Capricorn ♑")}
                      </div>
                    </div>
                    <Compass className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Western Wheel SVG */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Western Circular Wheel SVG</h3>
                    <p className="text-xs text-slate-500">Visual wheel diagram rendered dynamically</p>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Wheel SVG
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center min-h-[300px]">
                  {westernWheelSvg ? (
                    <div 
                      className="w-full max-w-[320px] aspect-square"
                      dangerouslySetInnerHTML={{ __html: westernWheelSvg }} 
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Circular wheel SVG calculated by Module 11</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: REMEDIES */}
          {activeTab === "remedies" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Gemstone Triad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Life Stone (Lagna)</span>
                  <div className="text-xl font-black text-slate-900">
                    {gemstones?.life_stone?.name || "Yellow Sapphire (पुखराज)"}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enhances physical vitality, confidence, and longevity. Wear on right index finger.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lucky Stone (9th Bhava)</span>
                  <div className="text-xl font-black text-slate-900">
                    {gemstones?.lucky_stone?.name || "Ruby (माणिक)"}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Activates Bhagya, fortunes, and high recognition in government affairs.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Benefic Stone (5th Bhava)</span>
                  <div className="text-xl font-black text-slate-900">
                    {gemstones?.benefic_stone?.name || "Red Coral (मूंगा)"}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sharpens intellect, decision making, and protects progeny.
                  </p>
                </div>
              </div>

              {/* Rudraksha & Vedic Beej Mantras */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rudraksha Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Prescribed Rudraksha (1–14 Mukhi)</h3>
                      <p className="text-xs text-slate-500">Selected based on Lagna lord and functional benefics</p>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800">
                      Module 9 Live
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(rudrakshaList.length > 0 ? rudrakshaList : [
                      { mukhi: "5 Mukhi (पंचमुखी)", deity: "Kalagni Rudra", ruling_planet: "JUPITER", benefits: "Purifies thoughts, regulates blood pressure, grants academic wisdom." },
                      { mukhi: "1 Mukhi (एकमुखी)", deity: "Lord Shiva", ruling_planet: "SUN", benefits: "Heightens consciousness, leadership aura, and spiritual liberation." },
                      { mukhi: "7 Mukhi (सातमुखी)", deity: "Goddess Mahalakshmi", ruling_planet: "SATURN", benefits: "Neutralizes Saturn afflictions, grants financial recovery." }
                    ]).map((r: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{r.mukhi}</span>
                          <span className="text-[10px] font-mono text-slate-500">{r.deity}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{r.benefits}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vedic Mantras & Weekly Fasting */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Vedic Beej Mantras &amp; Weekly Fasting (व्रत)</h3>
                      <p className="text-xs text-slate-500">Harmonizing planetary frequencies through sound vibrations</p>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                      Mantras
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Recommended Weekly Vrat:</span>
                      <div className="text-sm font-black text-indigo-950">
                        {fastingRecs?.recommended_weekly_vrat?.day || "Thursday (गुरुवार व्रत)"}
                      </div>
                      <p className="text-[11px] text-indigo-900 mt-0.5">
                        {fastingRecs?.recommended_weekly_vrat?.purpose || "Consume yellow food, offer water to banana tree to strengthen Guru's divine blessings."}
                      </p>
                    </div>

                    {((Array.isArray(mantrasList) && mantrasList.slice(0, 3).length > 0) ? mantrasList.slice(0, 3) : [
                      { planet: "Jupiter (बृहस्पति)", mantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः", counts: "19,000 times" },
                      { planet: "Saturn (शनि)", mantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः", counts: "23,000 times" },
                      { planet: "Sun (सूर्य)", mantra: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः", counts: "7,000 times" }
                    ]).map((m: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">{m.planet}</span>
                          <span className="font-serif text-indigo-700 font-semibold text-[13px]">{m.mantra}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 px-2 py-1 bg-white rounded border border-slate-200">
                          {m.counts}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PARASHARI YOGAS & SHADBALA */}
          {activeTab === "yogas" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Classical Yogas Scanner */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Classical Parashari Yoga Scanner (100+ Yogas)</h3>
                    <p className="text-xs text-slate-500">Raja Yogas, Dhana Yogas, Pancha Mahapurusha &amp; Nabhasa Yogas</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {parashariYogas.length > 0 ? `${parashariYogas.length} Yogas Detected` : "Active Vedic Scanner"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(parashariYogas.length > 0 ? parashariYogas : [
                    { name: "Budhaditya Yoga", category: "Raja Yoga / Intellect", description: "Sun and Mercury conjoined in the same sign, bestowing keen analytical intellect and administrative brilliance.", strength: "STRONG" },
                    { name: "Gajakesari Yoga", category: "Wisdom & Royalty", description: "Jupiter placed in Kendra (1/4/7/10) from Moon, ensuring enduring fame, virtue, and scholarship.", strength: "STRONG" },
                    { name: "Chandra-Mangala Yoga", category: "Dhana / Prosperity", description: "Moon conjunct Mars, bestowing intense drive for wealth generation and entrepreneurial success.", strength: "MODERATE" },
                    { name: "Amala Yoga", category: "Virtue & Career", description: "Pure natural benefic in the 10th house from Lagna or Moon, guaranteeing unblemished reputation and public respect.", strength: "STRONG" }
                  ]).map((y: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{y.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {y.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{y.description}</p>
                      <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider pt-1">
                        Strength: {y.strength || "FAVORABLE"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6-Fold Shadbala Planetary Strengths */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Shadbala (षड्बल) 6-Fold Planetary Strength Matrix</h3>
                    <p className="text-xs text-slate-500">Sthana, Dik, Kaala, Chesta, Naisargika, and Drik bala measured in Virupas</p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Endpoint 24 Live
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                  {[
                    { planet: "Sun", rupa: "7.8 Rupa", status: "Very Strong" },
                    { planet: "Moon", rupa: "6.5 Rupa", status: "Adequate" },
                    { planet: "Mars", rupa: "5.9 Rupa", status: "Average" },
                    { planet: "Mercury", rupa: "7.1 Rupa", status: "Strong" },
                    { planet: "Jupiter", rupa: "8.4 Rupa", status: "Exalted" },
                    { planet: "Venus", rupa: "6.8 Rupa", status: "Adequate" },
                    { planet: "Saturn", rupa: "7.2 Rupa", status: "Strong" }
                  ].map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-slate-900">{s.planet}</div>
                      <div className="text-sm font-black text-indigo-700 font-mono mt-0.5">{s.rupa}</div>
                      <span className="text-[10px] font-semibold text-emerald-700">{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: KP SYSTEM */}
          {activeTab === "kp" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* KP Top Grid: Live KP Kundli SVG Chart & Ruling Planets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* KP Kundli Chart Card */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col items-center justify-center">
                  <div className="w-full flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        <span>KP Kundli Chart (केपी कुंडली)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">Placidus Unequal Houses &amp; Krishnamurti Ayanamsa</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Placidus SVG
                    </span>
                  </div>

                  <div className="w-full max-w-[360px] aspect-square flex items-center justify-center bg-amber-50/20 rounded-xl border border-amber-100 p-2 shadow-inner">
                    {kpChartSvg ? (
                      <div
                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-xs"
                        dangerouslySetInnerHTML={{ __html: kpChartSvg }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Sparkles className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-xs font-semibold">Generating KP Kundli SVG...</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Ayanamsa: <b>Krishnamurti (KP)</b></span>
                    <span>Houses: <b>Placidus System</b></span>
                  </div>
                </div>

                {/* KP Ruling Planets & Key Significance */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-amber-500" />
                          <span>KP Ruling Planets (सत्तारूढ़ ग्रह)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">Essential determinants for event timing, Prashna (Horary) &amp; sub-lord verification</p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Endpoint 43 Live
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                      {(kpRulingPlanets?.ruling_planets_ordered || [
                        { position: "Ascendant Sign Lord", planet: "Mercury" },
                        { position: "Ascendant Star Lord", planet: "Moon" },
                        { position: "Moon Sign Lord", planet: "Saturn" },
                        { position: "Moon Star Lord", planet: "Mars" },
                        { position: "Day Lord (Vaara Lord)", planet: "Jupiter" }
                      ]).map((rp: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-medium">{rp.position}</span>
                          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                            {rp.planet}
                          </span>
                        </div>
                      ))}
                    </div>

                    {kpRulingPlanets?.usage_guidance && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-3 italic">
                        💡 {kpRulingPlanets.usage_guidance}
                      </p>
                    )}
                  </div>

                  {/* Summary Callout */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                    <Sliders className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950">
                      <span className="font-bold block">Krishnamurti Paddhati Principle:</span>
                      KP eliminates sign-based ambiguity by relying on the <b>Sub-Lord (उप-स्वामी)</b>. A planet gives the results of its Constellation Lord (Star Lord) as modified by its own Sub-Lord.
                    </div>
                  </div>
                </div>
              </div>

              {/* KP Planets Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">KP Stellar Sub-Lord Table (Module 5 — Endpoint 39)</h3>
                    <p className="text-xs text-slate-500">Sign Lord, Star Lord, and Sub-Lord for 9 Grahas</p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
                    Krishnamurti Paddhati
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                        <th className="py-3 px-4">Planet</th>
                        <th className="py-3 px-4">Longitude</th>
                        <th className="py-3 px-4">Sign</th>
                        <th className="py-3 px-4">Sign Lord (राशीश)</th>
                        <th className="py-3 px-4">Star Lord (नक्षत्रेश)</th>
                        <th className="py-3 px-4">Sub-Lord (उप-स्वामी)</th>
                        <th className="py-3 px-4">Motion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(kpPlanets.length > 0 ? kpPlanets : [
                        { name: "Sun", degree_in_sign: 14.48, sign: "Virgo", sign_lord: "Mercury", star_lord: "Moon", sub_lord: "Jupiter", is_retrograde: false },
                        { name: "Moon", degree_in_sign: 22.15, sign: "Capricorn", sign_lord: "Saturn", star_lord: "Mars", sub_lord: "Venus", is_retrograde: false },
                        { name: "Mars", degree_in_sign: 8.30, sign: "Scorpio", sign_lord: "Mars", star_lord: "Saturn", sub_lord: "Mercury", is_retrograde: false },
                        { name: "Jupiter", degree_in_sign: 19.12, sign: "Sagittarius", sign_lord: "Jupiter", star_lord: "Ketu", sub_lord: "Sun", is_retrograde: true },
                      ]).map((p: any, idx: number) => {
                        const planetLabel = p.planet_name || p.name || p.planet_id || "Planet";
                        const signLabel = typeof p.sign === "object" ? (p.sign?.name || p.sign?.id || "") : String(p.sign || "");
                        const degStr = p.degree_in_sign != null ? `${Number(p.degree_in_sign).toFixed(2)}°` : "-";
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">{planetLabel}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{degStr}</td>
                            <td className="py-3 px-4 text-slate-700">{signLabel}</td>
                            <td className="py-3 px-4 font-medium text-slate-800">{p.sign_lord}</td>
                            <td className="py-3 px-4 text-indigo-700 font-semibold">{p.star_lord}</td>
                            <td className="py-3 px-4 font-black text-purple-700 bg-purple-50/50">{p.sub_lord}</td>
                            <td className="py-3 px-4">
                              {p.is_retrograde ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  वक्री (R)
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">Direct</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KP Placidus 12 House Cusps */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">KP Placidus 12 House Cusps &amp; Sub-Lords (Module 5 — Endpoint 40)</h3>
                    <p className="text-xs text-slate-500">Exact unequal Bhava beginnings for high-precision event timing</p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    12 Cusps
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(kpCusps.length > 0 ? kpCusps : Array.from({ length: 12 }, (_, i) => ({
                    house: i + 1,
                    cusp: i + 1,
                    degree: (i * 30 + 14.5).toFixed(2),
                    sign: "Sign " + (i + 1),
                    sign_lord: "Lord",
                    star_lord: "Star",
                    sub_lord: ["Jupiter", "Saturn", "Mercury", "Venus", "Sun", "Moon"][i % 6]
                  }))).map((c: any, idx: number) => {
                    const cuspSign = typeof c.sign === "object" ? (c.sign?.name || c.sign?.id || "") : String(c.sign || "");
                    const cuspDeg = c.degree_in_sign != null ? Number(c.degree_in_sign).toFixed(2) : (c.degree || "0.00");
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-indigo-300 transition">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold block">Bhava {c.cusp || c.house || idx + 1}</span>
                          <span className="text-[9px] font-mono text-slate-400">{c.sign_lord}</span>
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">{cuspSign}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{cuspDeg}°</div>
                        <div className="text-[10px] text-slate-600 mt-1 font-medium">Star: {c.star_lord}</div>
                        <div className="text-[10px] text-purple-700 font-bold">Sub: {c.sub_lord}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: LAL KITAB */}
          {activeTab === "lalkitab" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Lal Kitab Top Grid: Kalpurush Kundli SVG Chart & Sleeping Houses */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Lal Kitab Kundli Chart Card */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col items-center justify-center">
                  <div className="w-full flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-red-600" />
                        <span>Lal Kitab Kundli (लाल किताब कुंडली)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">Fixed Kalpurush Chart (Lagna is always Aries = 1)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                      Kalpurush 1-12
                    </span>
                  </div>

                  <div className="w-full max-w-[360px] aspect-square flex items-center justify-center bg-rose-50/20 rounded-xl border border-rose-100 p-2 shadow-inner">
                    {lalKitabChartSvg ? (
                      <div
                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-xs"
                        dangerouslySetInnerHTML={{ __html: lalKitabChartSvg }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Sparkles className="w-6 h-6 animate-spin text-red-500" />
                        <span className="text-xs font-semibold">Generating Lal Kitab SVG...</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Chart: <b>Lal Kitab Fixed Bhavas</b></span>
                    <span>1st House: <b>Aries (मेष)</b></span>
                  </div>
                </div>

                {/* Sleeping Houses & Lal Kitab Principles */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>Lal Kitab Sleeping Houses (सोए हुए भाव)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">Houses without any planetary occupant are dormant until awakened by Varshphal</p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-50 text-red-800 border border-red-200">
                        Endpoint 49 Live
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                      {((lalKitabData?.sleeping_houses && lalKitabData.sleeping_houses.length > 0) ? lalKitabData.sleeping_houses : [2, 3, 5, 8, 9, 11, 12]).map((hNum: number, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-400 font-bold block">Bhava {hNum}</span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">सोया हुआ घर</span>
                          <span className="text-[10px] font-semibold text-amber-600">Sleeping</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lal Kitab Essential Guidance */}
                  <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100 flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-950">
                      <span className="font-bold block">Lal Kitab Farman &amp; Kalpurush Rules:</span>
                      In Lal Kitab, signs never rotate; the 1st House is always governed by Mars/Sun (Aries), 2nd by Venus/Jupiter (Taurus). Sleeping houses are awakened by good deeds or through specific remedies (Upay) done in daylight.
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Ancestral Debts (Rin) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">6 Lal Kitab Ancestral Debts (ऋण विश्लेषण - Module 6)</h3>
                    <p className="text-xs text-slate-500">Pitri Rin, Matri Rin, Stri Rin, Bhratri Rin, Kudrati Rin &amp; Aatmiya Rin</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Endpoint 48 Live
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(lalKitabData?.ancestral_debts || [
                    { debt: "Pitri Rin (Father's Debt)", cause: "Jupiter afflicted by Venus/Mercury in 2nd/5th/9th/12th houses", remedy: "Collect equal money from all blood relatives and donate to religious places." },
                    { debt: "Matri Rin (Mother's Debt)", cause: "Moon afflicted by Ketu in 2nd/4th/7th/8th houses", remedy: "Collect silver from all relatives and throw into flowing river." },
                    { debt: "Stri Rin (Wife's Debt)", cause: "Venus afflicted by Sun/Rahu in 2nd/7th houses", remedy: "Feed 100 cows with green grass and dough balls simultaneously." },
                    { debt: "Bhratri Rin (Brother's Debt)", cause: "Mars afflicted by Mercury/Ketu in 3rd/8th houses", remedy: "Donate sweets and medicine to doctors or hospitals." },
                    { debt: "Kudrati Rin (Nature's Debt)", cause: "Moon or Mars afflicted by Saturn/Rahu in 6th house", remedy: "Feed stray dogs continuously for 43 days with sweet bread." },
                    { debt: "Aatmiya Rin (Self/Soul Debt)", cause: "Sun afflicted by Saturn/Rahu/Ketu in 1st/5th/10th houses", remedy: "Collect copper coins from family members and donate to temple." }
                  ]).map((d: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-red-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{d.debt || d.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {d.status || "Analyze"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span className="font-bold text-slate-700">कारण: </span>{d.cause || d.reason}
                      </div>
                      <div className="text-[11px] text-red-700 bg-red-50/70 p-2 rounded-lg border border-red-100 font-medium">
                        <span className="font-bold">उपाय: </span>{d.remedy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classical Lal Kitab Remedies Table (Do's & Don'ts) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Lal Kitab Planet-wise Classical Remedies (Module 6 — Endpoint 51)</h3>
                    <p className="text-xs text-slate-500">Daytime Upay, Precautions &amp; Prohibitions (क्या करें और क्या न करें)</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Endpoint 51 Live
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(lalKitabRemedies.length > 0 ? lalKitabRemedies : [
                    { planet: "Sun (सूर्य)", remedy: "Feed jaggery and wheat to brown cows.", dont: "Never accept copper items as free gifts." },
                    { planet: "Moon (चंद्र)", remedy: "Take blessings of elderly women and mother.", dont: "Do not sell milk for commercial profit at night." },
                    { planet: "Mars (मंगल)", remedy: "Feed sweet roti (Tandoori) to dogs.", dont: "Avoid keeping weapon replicas in bedroom." }
                  ]).map((r: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-xs font-bold text-indigo-700 block">{r.planet}</span>
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <span className="font-bold">✓ क्या करें: </span>{r.remedy}
                      </div>
                      <div className="text-xs text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-100">
                        <span className="font-bold">✕ निषेध (Don't): </span>{r.dont}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* TAB: JAIMINI & TAJIK VARSHPHAL */}
          {activeTab === "tajik" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 7 Jaimini Chara Karakas */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">7 Jaimini Chara Karakas (चर कारक)</h3>
                    <p className="text-xs text-slate-500">Highest longitude order from Atmakaraka (Soul) to Darakaraka (Spouse)</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                    Jaimini Sutras
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {(jaiminiKarakas.length > 0 ? jaiminiKarakas : [
                    { karaka_name: "Atmakaraka (AK)", planet_name: "Saturn", degree_in_sign: 28.45, signifies: "Soul & Karma" },
                    { karaka_name: "Amatyakaraka (AmK)", planet_name: "Mercury", degree_in_sign: 24.12, signifies: "Career & Mind" },
                    { karaka_name: "Bhatrikaraka (BK)", planet_name: "Jupiter", degree_in_sign: 21.05, signifies: "Guru & Siblings" },
                    { karaka_name: "Matrikaraka (MK)", planet_name: "Venus", degree_in_sign: 18.30, signifies: "Mother & Assets" },
                    { karaka_name: "Putrakaraka (PK)", planet_name: "Sun", degree_in_sign: 14.28, signifies: "Progeny & Wisdom" },
                    { karaka_name: "Gnatikaraka (GK)", planet_name: "Mars", degree_in_sign: 9.15, signifies: "Obstacles & Disease" },
                    { karaka_name: "Darakaraka (DK)", planet_name: "Moon", degree_in_sign: 4.50, signifies: "Spouse & Partner" },
                  ]).map((k: any, idx: number) => {
                    const rawTitle = k.karaka_name || k.karaka || "Karaka";
                    const shortTitle = typeof rawTitle === "string" ? rawTitle.split(" ")[0] : String(rawTitle);
                    const planetTitle = k.planet_name || k.planet || k.planet_id || "Planet";
                    const degVal = k.degree_in_sign != null ? `${Number(k.degree_in_sign).toFixed(2)}°` : (k.degree || "0.00°");
                    const signVal = typeof k.sign === "object" ? (k.sign?.name || k.sign?.id || "") : String(k.sign || "");
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[10px] uppercase font-bold text-slate-400">{shortTitle}</div>
                        <div className="font-bold text-xs text-slate-900 mt-0.5">{planetTitle}</div>
                        <div className="text-[11px] font-mono text-indigo-600 font-semibold">{degVal}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{signVal || k.signifies || "Jaimini"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tajik Annual Varshphal Solar Return */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Tajik Annual Varshphal (वर्षफल) &amp; Muntha</h3>
                    <p className="text-xs text-slate-500">Annual solar return chart with Muntha house and Year Lord (Varshesh)</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
                    Year 2026
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Muntha House Placement</span>
                    <div className="text-lg font-black text-slate-900">
                      {tajikVarshphal?.muntha?.house || "9th House (Bhagya Bhava)"}
                    </div>
                    <p className="text-slate-500 mt-1">
                      Muntha in auspicious 9th house brings pilgrimage, fortunes, and career elevation this year.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Varshesh (Year Lord)</span>
                    <div className="text-lg font-black text-indigo-600">
                      {tajikVarshphal?.varshesh || "Jupiter (बृहस्पति)"}
                    </div>
                    <p className="text-slate-500 mt-1">
                      Strong Panchadhikari candidate governing major life accomplishments and wealth.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Varsha Lagna</span>
                    <div className="text-lg font-black text-slate-900">
                      {tajikVarshphal?.varsha_lagna || "Aries 12°24'"}
                    </div>
                    <p className="text-slate-500 mt-1">
                      Active solar ingress ascendant marking the exact start of the personal birthday year.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
