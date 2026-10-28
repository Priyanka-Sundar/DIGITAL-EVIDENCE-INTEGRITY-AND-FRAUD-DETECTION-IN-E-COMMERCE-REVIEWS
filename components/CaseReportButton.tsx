"use client";

import { buildCaseReport, downloadText } from "@/lib/report";
import { DerivedFactor } from "@/lib/caseFactors";
import { VerdictCase } from "@/lib/types";

export default function CaseReportButton({
  caseData,
  factors,
  className
}: {
  caseData: VerdictCase;
  factors: DerivedFactor[];
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className || "btn-ghost !py-2 !px-4 !text-xs"}
      onClick={() =>
        downloadText(`case_report_${caseData.case_id}.txt`, buildCaseReport(caseData, factors))
      }
    >
      Download case report
    </button>
  );
}
