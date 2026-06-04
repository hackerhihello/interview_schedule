import { saveAs } from "file-saver";
import { generateExcelBuffer } from "./excel-generator";

export const exportToExcel = async (
  reportData: any,
  chartsBase64: any, // Ignored in simplified version
  dateRange: { start: string; end: string }
) => {
  const buffer = await generateExcelBuffer(reportData, dateRange);
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Ignited_Minds_Report_${dateRange.start}_${dateRange.end}.xlsx`);
};
