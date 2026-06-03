import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToExcel = async (
  reportData: any,
  chartsBase64: { [key: string]: string },
  dateRange: { start: string; end: string }
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ignited Minds Enterprise";
  workbook.lastModifiedBy = "Ignited Minds Enterprise";
  workbook.created = new Date();
  
  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  
  const headerFont: ExcelJS.Font = {
    color: { argb: 'FFFFFFFF' },
    bold: true,
    size: 12,
    name: 'Inter'
  };

  const createSheetWithHeader = (name: string) => {
    const sheet = workbook.addWorksheet(name);
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Ignited Minds - ${name}`;
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF4F46E5' }, name: 'Inter' };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    
    sheet.mergeCells('A2:F2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Report Period: ${dateRange.start} to ${dateRange.end} | Generated on: ${new Date().toLocaleString()}`;
    subtitleCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } };
    
    sheet.getRow(1).height = 30;
    sheet.getRow(2).height = 20;
    return sheet;
  };

  // 1. Executive Summary Sheet
  const summarySheet = createSheetWithHeader("Executive Summary");
  summarySheet.getColumn('A').width = 30;
  summarySheet.getColumn('B').width = 20;
  
  const kpis = [
    ["Total Interviews", reportData.total],
    ["Completed", reportData.completed],
    ["Selected Candidates", reportData.passed],
    ["Rejected Candidates", reportData.failed],
    ["Success Rate", `${reportData.successRate}%`],
  ];
  
  summarySheet.addRow([]); // Row 3
  summarySheet.addRow(["Key Performance Indicator", "Value"]); // Row 4
  const sumHeaderRow = summarySheet.getRow(4);
  sumHeaderRow.fill = headerFill;
  sumHeaderRow.font = headerFont;
  
  kpis.forEach((kpi) => {
    const row = summarySheet.addRow(kpi);
    row.font = { name: 'Inter', size: 11 };
    row.getCell(2).alignment = { horizontal: 'right' };
  });

  // Embed charts if available
  let chartRowStart = 12;
  if (chartsBase64.trend) {
    const imageId = workbook.addImage({ base64: chartsBase64.trend, extension: 'png' });
    summarySheet.addImage(imageId, {
      tl: { col: 0, row: chartRowStart },
      ext: { width: 600, height: 300 }
    });
    chartRowStart += 16;
  }
  if (chartsBase64.pie) {
    const imageId = workbook.addImage({ base64: chartsBase64.pie, extension: 'png' });
    summarySheet.addImage(imageId, {
      tl: { col: 0, row: chartRowStart },
      ext: { width: 400, height: 300 }
    });
  }

  // 2. Interview Details Sheet
  const detailSheet = createSheetWithHeader("Interview Details");
  detailSheet.addRow([]);
  
  const columns = [
    { header: "Candidate Name", key: "candidateName", width: 25 },
    { header: "Company", key: "companyName", width: 20 },
    { header: "Role", key: "role", width: 25 },
    { header: "Round", key: "round", width: 15 },
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 20 },
    { header: "Interviewer", key: "interviewerName", width: 25 },
    { header: "Status", key: "status", width: 15 },
  ];
  
  const headerRowDetail = detailSheet.addRow(columns.map(c => c.header));
  headerRowDetail.fill = headerFill;
  headerRowDetail.font = headerFont;
  detailSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
  
  detailSheet.columns = columns.map(c => ({ key: c.key, width: c.width }));
  
  reportData.interviews.forEach((interview: any, index: number) => {
    const dateObj = new Date(interview.interviewDate);
    const row = detailSheet.addRow({
      candidateName: interview.candidateName,
      companyName: interview.companyName || "N/A",
      role: interview.role || "N/A",
      round: interview.round,
      date: dateObj.toLocaleDateString(),
      time: `${interview.startTime} - ${interview.endTime}`,
      interviewerName: interview.interviewerName,
      status: interview.status.toUpperCase(),
    });
    row.font = { name: 'Inter', size: 10 };
    if (index % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Light gray for alternate rows
    }
    
    const statusCell = row.getCell(8);
    if (interview.status === "passed") statusCell.font = { color: { argb: 'FF10B981' }, bold: true };
    if (interview.status === "failed") statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
    if (interview.status === "scheduled") statusCell.font = { color: { argb: 'FF3B82F6' }, bold: true };
  });
  
  detailSheet.autoFilter = `A4:H${reportData.interviews.length + 4}`;

  // 3. Interviewer Performance
  const intSheet = createSheetWithHeader("Interviewer Performance");
  intSheet.addRow([]);
  intSheet.addRow(["Interviewer", "Total Interviews", "Passed", "Failed"]);
  intSheet.getRow(4).fill = headerFill;
  intSheet.getRow(4).font = headerFont;
  
  // 4. Company-wise Hiring
  const compSheet = createSheetWithHeader("Company-wise Hiring");
  compSheet.addRow([]);
  compSheet.addRow(["Company", "Total Interviews", "Selected Candidates"]);
  compSheet.getRow(4).fill = headerFill;
  compSheet.getRow(4).font = headerFont;

  // 5. Monthly Trends
  const trendSheet = createSheetWithHeader("Monthly Trends");
  trendSheet.addRow([]);
  trendSheet.addRow(["Date", "Volume"]);
  trendSheet.getRow(4).fill = headerFill;
  trendSheet.getRow(4).font = headerFont;

  // 6. Audit Logs
  const auditSheet = createSheetWithHeader("Audit Logs");
  auditSheet.addRow([]);
  auditSheet.addRow(["Timestamp", "Action", "User"]);
  auditSheet.getRow(4).fill = headerFill;
  auditSheet.getRow(4).font = headerFont;

  // Save the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Ignited_Minds_Report_${dateRange.start}_${dateRange.end}.xlsx`);
};
