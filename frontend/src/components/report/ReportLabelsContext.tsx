"use client";

import { createContext, useContext } from "react";
import { getReportText, type ReportLabels } from "@/lib/reportText";

const fallback = getReportText("en").labels;

export const ReportLabelsContext = createContext<ReportLabels>(fallback);

export function useReportLabels(): ReportLabels {
  return useContext(ReportLabelsContext);
}
