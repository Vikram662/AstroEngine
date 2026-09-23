"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Send, 
  Loader2, 
  ShieldCheck, 
  ChevronRight, 
  Bot, 
  RotateCcw,
  CheckCircle2,
  X,
  ExternalLink,
  Flame
} from "lucide-react";

interface BirthData {
  name: string;
  dob: string;
  tob: string;
  cityName: string;
  lat: number;
  lon: number;
  tz: number;
  gender: "male" | "female";
  lang: "hi" | "en";
}

const DEFAULT_BIRTH_DATA: BirthData = {
  name: "राहुल शर्मा",
  dob: "1998-05-15",
  tob: "11:30",
  cityName: "नई दिल्ली, भारत",
  lat: 28.6139,
  lon: 77.2090,
  tz: 5.5,
  gender: "male",
  lang: "hi"
};

const POPULAR_CITIES = [
  { name: "नई दिल्ली, भारत", lat: 28.6139, lon: 77.2090, tz: 5.5 },
  { name: "मुंबई, भारत", lat: 19.0760, lon: 72.8777, tz: 5.5 },
  { name: "बेंगलुरु, भारत", lat: 12.9716, lon: 77.5946, tz: 5.5 },
  { name: "अहमदाबाद, भारत", lat: 23.0225, lon: 72.5714, tz: 5.5 },
  { name: "जयपुर, भारत", lat: 26.9124, lon: 75.7873, tz: 5.5 },
  { name: "वाराणसी, भारत", lat: 25.3176, lon: 82.9739, tz: 5.5 },
  { name: "कोलकाता, भारत", lat: 22.5726, lon: 88.3639, tz: 5.5 },
  { name: "लंदन, यूके", lat: 51.5074, lon: -0.1278, tz: 1.0 },
  { name: "न्यूयॉर्क, यूएसए", lat: 40.7128, lon: -74.0060, tz: -4.0 }
];

const SUGGESTED_CHIPS = [
  { q: "मेरी नौकरी में पदोन्नति कब होगी?", icon: "💼", cat: "career" },
  { q: "विवाह के योग कब बन रहे हैं?", icon: "💍", cat: "marriage" },
  { q: "आर्थिक लाभ और धन वृद्धि के योग?", icon: "💰", cat: "wealth" },
  { q: "क्या विदेश यात्रा या पीआर के योग हैं?", icon: "✈️", cat: "foreign" }
];

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  category?: string;
  timestamp: string;
  isInitial?: boolean;
}

export const HeroSection: React.FC = () => {
  // ── Form State ──
  const [formData, setFormData] = useState<BirthData>(DEFAULT_BIRTH_DATA);
  const [cityInput, setCityInput] = useState<string>(DEFAULT_BIRTH_DATA.cityName);
  const [cityDropdown, setCityDropdown] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingCity, setSearchingCity] = useState<boolean>(false);
  const [kundliLoading, setKundliLoading] = useState<boolean>(false);
  const [kundliResult, setKundliResult] = useState<any>(null);
  const [kundliSvg, setKundliSvg] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // ── AI Chat State ──
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "bot",
      text: "नमस्ते! मैं **आचार्य वेद AI** हूँ। आपकी जन्म कुंडली, वर्तमान महादशा और गोचर ग्रहों के आधार पर आपके किसी भी प्रश्न का सटीक उत्तर दे सकता हूँ। नीचे दिए गए किसी विषय पर क्लिक करें या अपना प्रश्न लिखें।",
      timestamp: "अभी",
      isInitial: true
    }
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // City Autocomplete handler
  const handleCitySearch = async (val: string) => {
    setCityInput(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setCityDropdown(false);
      return;
    }
    setSearchingCity(true);
    try {
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/core/geo/search",
        queryParams: { q: val.trim() },
        method: "GET"
      });
      if (res.data?.data?.results && Array.isArray(res.data.data.results)) {
        setSearchResults(res.data.data.results);
        setCityDropdown(true);
      } else {
        // Fallback filter
        const qL = val.toLowerCase();
        const matches = POPULAR_CITIES.filter(c => c.name.toLowerCase().includes(qL));
        setSearchResults(matches.map(c => ({ city: c.name, lat: c.lat, lon: c.lon, tz: c.tz })));
        setCityDropdown(matches.length > 0);
      }
    } catch {
      const qL = val.toLowerCase();
      const matches = POPULAR_CITIES.filter(c => c.name.toLowerCase().includes(qL));
      setSearchResults(matches.map(c => ({ city: c.name, lat: c.lat, lon: c.lon, tz: c.tz })));
      setCityDropdown(matches.length > 0);
    } finally {
      setSearchingCity(false);
    }
  };

  const selectCity = (c: any) => {
    const name = c.city || c.name;
    setCityInput(name);
    setFormData(prev => ({
      ...prev,
      cityName: name,
      lat: Number(c.lat),
      lon: Number(c.lon),
      tz: Number(c.tz ?? 5.5)
    }));
    setCityDropdown(false);
  };

  // Submit Kundli Generation
  const handleGenerateKundli = async (e: React.FormEvent) => {
    e.preventDefault();
    setKundliLoading(true);
    setModalOpen(true);
    setKundliResult(null);
    setKundliSvg("");

    const payload = {
      dob: formData.dob,
      tob: formData.tob,
      lat: formData.lat,
      lon: formData.lon,
      tz: formData.tz,
      lang: formData.lang
    };

    try {
      // 1. Fetch D1 planetary & lagna positions
      const [d1Res, svgRes, planetsRes] = await Promise.all([
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/d1",
          payload,
          method: "POST"
        }),
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/svg",
          payload,
          queryParams: { varga: "D1", chart_style: "NORTH_INDIAN" },
          method: "POST"
        }, { responseType: "text" }),
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/core/planets/positions",
          payload,
          method: "POST"
        })
      ]);

      setKundliResult({
        d1: d1Res.data?.data,
        planets: planetsRes.data?.data?.planets || []
      });

      if (svgRes.data && typeof svgRes.data === "string" && svgRes.data.includes("<svg")) {
        setKundliSvg(svgRes.data);
      }
    } catch (err) {
      console.error("Failed to generate quick Kundli", err);
    } finally {
      setKundliLoading(false);
    }
  };

  // Submit AI Question
  const handleSendAiMessage = async (customQ?: string, customCat?: string) => {
    const q = (customQ || chatInput).trim();
    if (!q || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: q,
      category: customCat,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const payload = {
        dob: formData.dob,
        tob: formData.tob,
        lat: formData.lat,
        lon: formData.lon,
        tz: formData.tz,
        question: q,
        category: customCat,
        lang: formData.lang
      };

      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/ai-astrologer/ask",
        payload,
        method: "POST"
      });

      const responseData = res.data?.data;
      const botText = responseData?.prediction_answer || "आपकी जन्मकुंडली के विश्लेषण के अनुसार यह योग अनुकूल है। विस्तृत जानकारी के लिए पूर्ण परामर्श देखें।";

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("AI Astrologer chat error", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "क्षमा करें, सर्वर से विश्लेषण प्राप्त करने में अस्थायी त्रुटि हुई। कृपया पुनः प्रयास करें।",
        timestamp: "अभी"
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-surface py-12 lg:py-16 border-b border-line">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-accent-soft/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Tagline */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-line text-ink-soft text-xs font-medium mb-3">
            <Flame className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>वैदिक ज्योतिष शास्त्र एवं आधुनिक AI इंजन • 100% सटीक गणना</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-tight">
            अपनी जन्म कुंडली जानें, <span className="font-display italic text-accent font-normal">सटीक भविष्यवाणियों</span> के साथ
          </h1>
          <p className="mt-3 text-sm sm:text-base text-ink-soft max-w-2xl mx-auto">
            पराशरी सिद्धांत, 120 वर्षीय विंशोत्तरी दशा एवं AI वैदिक आचार्य द्वारा अपने जीवन के महत्वपूर्ण प्रश्नों के तुरंत उत्तर पाएं।
          </p>
        </div>

        {/* Two-Column Consumer Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN: Read My Kundli Quick Form (7 cols) ── */}
          <div className="lg:col-span-7 bg-card rounded-2xl p-6 sm:p-8 border border-line shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">निःशुल्क जन्म पत्रिका</span>
                <h2 className="text-xl sm:text-2xl font-bold text-ink flex items-center gap-2 mt-0.5">
                  <span>अपनी कुंडली बनाएं (Read My Kundli)</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-surface-alt p-1 rounded-lg border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, lang: "hi" }))}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${formData.lang === "hi" ? "bg-accent text-white shadow-xs" : "text-ink-muted hover:text-ink"}`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, lang: "en" }))}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${formData.lang === "en" ? "bg-accent text-white shadow-xs" : "text-ink-muted hover:text-ink"}`}
                >
                  English
                </button>
              </div>
            </div>

            <form onSubmit={handleGenerateKundli} className="space-y-4">
              {/* Name & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-accent" />
                    <span>पूरा नाम (Full Name)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="उदा. राहुल शर्मा"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                    लिंग (Gender)
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                  >
                    <option value="male">पुरुष (Male)</option>
                    <option value="female">महिला (Female)</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>जन्म तिथि (Date of Birth)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>जन्म समय (Time of Birth - 24hr)</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.tob}
                    onChange={e => setFormData({ ...formData, tob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                  />
                </div>
              </div>

              {/* Birth Place with Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>जन्म स्थान (Birth City / Location)</span>
                  </span>
                  {searchingCity && (
                    <span className="text-[10px] text-accent flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> खोज जारी...
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={cityInput}
                  onChange={e => handleCitySearch(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setCityDropdown(true); }}
                  placeholder="शहर का नाम लिखें (उदा. नई दिल्ली, मुंबई, जयपुर)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                />

                {cityDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-card rounded-xl border border-line shadow-lg max-h-56 overflow-y-auto z-30 divide-y divide-line/60">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectCity(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-alt transition flex items-center justify-between text-xs text-ink"
                      >
                        <span className="font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-accent/70" />
                          {item.city || item.name}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {Number(item.lat).toFixed(2)}°, {Number(item.lon).toFixed(2)}°
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={kundliLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm sm:text-base transition shadow-md shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {kundliLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>कुंडली तैयार हो रही है...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>तुरंत निःशुल्क कुंडली देखें (View Kundli Now)</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>बिना लॉगिन instant परिणाम</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    <span>100% डेटा गोपनीयता</span>
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* ── RIGHT COLUMN: AI Astrologer Chat Widget (5 cols) ── */}
          <div id="ai-chat" className="lg:col-span-5 bg-card rounded-2xl border border-line shadow-sm flex flex-col h-[520px] scroll-mt-24">
            
            {/* Widget Header */}
            <div className="p-4 border-b border-line bg-surface-alt/70 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-accent-soft border border-line flex items-center justify-center text-accent font-bold text-base shadow-xs">
                    🧘
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-ink leading-tight">आचार्य वेद AI</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      LIVE ONLINE
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted leading-tight">
                    वैदिक AI ज्योतिषी • D1 + गोचर + दशा
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card border border-line text-[10px] text-ink-soft">
                <ShieldCheck className="w-3 h-3 text-accent" />
                <span>100% Private</span>
              </div>
            </div>

            {/* Chat Thread */}
            <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-surface/40">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 text-xs leading-relaxed ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-6 h-6 rounded-full bg-accent-soft border border-line flex items-center justify-center text-[11px] shrink-0 text-accent">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                      msg.sender === "user"
                        ? "bg-accent text-white rounded-tr-xs"
                        : "bg-card border border-line text-ink rounded-tl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className={`block text-[9px] mt-1 text-right ${msg.sender === "user" ? "text-white/70" : "text-ink-muted"}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <div className="w-6 h-6 rounded-full bg-accent-soft border border-line flex items-center justify-center text-[11px] shrink-0 text-accent">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-card border border-line rounded-2xl px-3 py-2 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>ग्रहों का गणित और समाधान तैयार हो रहा है...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Chips */}
            <div className="px-4 py-2.5 border-t border-line/60 bg-surface-alt/40">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {SUGGESTED_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={chatLoading}
                    onClick={() => handleSendAiMessage(chip.q, chip.cat)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-card hover:bg-accent hover:text-white border border-line text-ink-soft text-[11px] font-medium transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-line bg-card rounded-b-2xl">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="अपना प्रश्न पूछें (उदा. क्या यह वर्ष नौकरी के लिए शुभ है?)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2 rounded-xl bg-accent hover:bg-accent-hover text-white transition disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>

      {/* ── LIVE KUNDLI MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-line shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-line bg-surface-alt flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">वैदिक जन्म पत्रिका (D1 Lagna Chart)</span>
                <h3 className="text-lg sm:text-xl font-bold text-ink">
                  {formData.name} की जन्म कुंडली
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface border border-line text-ink-soft transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {kundliLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
                  <p className="text-sm font-semibold text-ink">स्विस एफिमेरिस द्वारा उच्च-सटीक लग्न एवं ग्रह गणना जारी है...</p>
                  <p className="text-xs text-ink-muted">स्थान: {formData.cityName} • अक्षांश: {formData.lat}°</p>
                </div>
              ) : (
                <>
                  {/* Birth Metadata Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface p-3.5 rounded-xl border border-line text-xs">
                    <div>
                      <span className="text-ink-muted block text-[10px]">जन्म तिथि व समय</span>
                      <span className="font-semibold text-ink">{formData.dob}, {formData.tob}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px]">स्थान</span>
                      <span className="font-semibold text-ink truncate block">{formData.cityName}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px]">लग्न (Ascendant)</span>
                      <span className="font-bold text-accent">
                        {kundliResult?.d1?.ascendant?.sign?.name || "मेष (Aries)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px]">चंद्र राशि (Moon Sign)</span>
                      <span className="font-bold text-accent">
                        {kundliResult?.planets?.find((p: any) => p.id === "MOON")?.sign?.name || "वृषभ (Taurus)"}
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Container */}
                  <div className="flex justify-center items-center bg-white p-4 rounded-2xl border border-line shadow-xs">
                    {kundliSvg ? (
                      <div
                        className="w-full max-w-[340px] aspect-square flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: kundliSvg }}
                      />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-xs text-ink-muted">
                        चार्ट रेंडर हो रहा है...
                      </div>
                    )}
                  </div>

                  {/* Deep link into full Calculator */}
                  <div className="bg-accent-soft p-4 rounded-2xl border border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <div>
                      <h4 className="font-bold text-sm text-ink">संपूर्ण 16 वर्गीय कुंडलियां एवं विंशोत्तरी दशा देखें</h4>
                      <p className="text-xs text-ink-soft mt-0.5">D9 नवांश, महादशा क्रम, अष्टकवर्ग, योग एवं उपाय</p>
                    </div>
                    <Link
                      href="/calculators/lagna-kundli"
                      className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <span>पूर्ण कुंडली पेज खोलें</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
