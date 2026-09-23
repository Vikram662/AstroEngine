"use client";

import React, { useState } from "react";
import axios from "axios";
import { MapPin, Calendar, Clock, User, Loader2 } from "lucide-react";
import { useDictionary } from "@/hooks/useDictionary";

export interface BirthDataValue {
  name: string;
  gender: "male" | "female";
  dob: string;
  tob: string;
  cityName: string;
  lat: number;
  lon: number;
  tz: number;
}

export const DEFAULT_BIRTH_DATA: BirthDataValue = {
  name: "",
  gender: "male",
  dob: "",
  tob: "12:00",
  cityName: "नई दिल्ली, भारत",
  lat: 28.6139,
  lon: 77.209,
  tz: 5.5,
};

const POPULAR_CITIES = [
  { name: "नई दिल्ली, भारत", lat: 28.6139, lon: 77.209, tz: 5.5 },
  { name: "मुंबई, भारत", lat: 19.076, lon: 72.8777, tz: 5.5 },
  { name: "बेंगलुरु, भारत", lat: 12.9716, lon: 77.5946, tz: 5.5 },
  { name: "अहमदाबाद, भारत", lat: 23.0225, lon: 72.5714, tz: 5.5 },
  { name: "जयपुर, भारत", lat: 26.9124, lon: 75.7873, tz: 5.5 },
  { name: "वाराणसी, भारत", lat: 25.3176, lon: 82.9739, tz: 5.5 },
  { name: "कोलकाता, भारत", lat: 22.5726, lon: 88.3639, tz: 5.5 },
  { name: "लंदन, यूके", lat: 51.5074, lon: -0.1278, tz: 1.0 },
  { name: "न्यूयॉर्क, यूएसए", lat: 40.7128, lon: -74.006, tz: -4.0 },
];

interface Props {
  value: BirthDataValue;
  onChange: (next: BirthDataValue) => void;
  requireName?: boolean;
  requireGender?: boolean;
  requireTime?: boolean;
  requireCity?: boolean;
  dateLabel?: string;
  personLabel?: string;
  idPrefix?: string;
}

export const BirthDataFields: React.FC<Props> = ({
  value,
  onChange,
  requireName = true,
  requireGender = true,
  requireTime = true,
  requireCity = true,
  dateLabel,
  personLabel,
  idPrefix = "",
}) => {
  const t = useDictionary().birthDataFields;
  const [cityDropdown, setCityDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);

  const handleCitySearch = async (val: string) => {
    onChange({ ...value, cityName: val });
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
        method: "GET",
      });
      if (res.data?.data?.results && Array.isArray(res.data.data.results)) {
        setSearchResults(res.data.data.results);
        setCityDropdown(true);
      } else {
        const qL = val.toLowerCase();
        const matches = POPULAR_CITIES.filter((c) => c.name.toLowerCase().includes(qL));
        setSearchResults(matches.map((c) => ({ city: c.name, lat: c.lat, lon: c.lon, tz: c.tz })));
        setCityDropdown(matches.length > 0);
      }
    } catch {
      const qL = val.toLowerCase();
      const matches = POPULAR_CITIES.filter((c) => c.name.toLowerCase().includes(qL));
      setSearchResults(matches.map((c) => ({ city: c.name, lat: c.lat, lon: c.lon, tz: c.tz })));
      setCityDropdown(matches.length > 0);
    } finally {
      setSearchingCity(false);
    }
  };

  const selectCity = (c: any) => {
    onChange({
      ...value,
      cityName: c.city || c.name,
      lat: Number(c.lat),
      lon: Number(c.lon),
      tz: Number(c.tz ?? 5.5),
    });
    setCityDropdown(false);
  };

  const id = (suffix: string) => `${idPrefix}${suffix}`;

  return (
    <div className="space-y-4">
      {personLabel && (
        <div className="text-xs font-bold uppercase tracking-wider text-accent">{personLabel}</div>
      )}

      {(requireName || requireGender) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {requireName && (
            <div className="sm:col-span-2">
              <label htmlFor={id("name")} className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                <span>{t.fullName}</span>
              </label>
              <input
                id={id("name")}
                type="text"
                required
                value={value.name}
                onChange={(e) => onChange({ ...value, name: e.target.value })}
                placeholder={t.namePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>
          )}
          {requireGender && (
            <div>
              <label htmlFor={id("gender")} className="block text-xs font-semibold text-ink-soft mb-1.5">
                {t.gender}
              </label>
              <select
                id={id("gender")}
                value={value.gender}
                onChange={(e) => onChange({ ...value, gender: e.target.value as "male" | "female" })}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              >
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className={`grid grid-cols-1 ${requireTime ? "sm:grid-cols-2" : ""} gap-4`}>
        <div>
          <label htmlFor={id("dob")} className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>{dateLabel || t.dob}</span>
          </label>
          <input
            id={id("dob")}
            type="date"
            required
            value={value.dob}
            onChange={(e) => onChange({ ...value, dob: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
          />
        </div>
        {requireTime && (
          <div>
            <label htmlFor={id("tob")} className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>{t.tob}</span>
            </label>
            <input
              id={id("tob")}
              type="time"
              required
              value={value.tob}
              onChange={(e) => onChange({ ...value, tob: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
            />
          </div>
        )}
      </div>

      {requireCity && (
        <div className="relative">
          <label htmlFor={id("city")} className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>{t.city}</span>
            </span>
            {searchingCity && (
              <span className="text-[10px] text-accent flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> {t.searching}
              </span>
            )}
          </label>
          <input
            id={id("city")}
            type="text"
            required
            value={value.cityName}
            onChange={(e) => handleCitySearch(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setCityDropdown(true);
            }}
            placeholder={t.cityPlaceholder}
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
      )}
    </div>
  );
};
