import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToPDF = (reportData: any, dateRange: { start: string; end: string }) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text("Ignited Minds - Monthly Interview Report", 14, 22);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Period: ${dateRange.start} to ${dateRange.end} | Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  // KPIs
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Interviews: ${reportData.total}`, 14, 45);
  doc.text(`Completed: ${reportData.completed}`, 14, 52);
  doc.text(`Success Rate: ${reportData.successRate}%`, 14, 59);

  // Table
  const tableData = reportData.interviews.map((i: any) => [
    i.candidateName,
    i.companyName || "N/A",
    i.role || "N/A",
    new Date(i.interviewDate).toLocaleDateString(),
    `${i.startTime} - ${i.endTime}`,
    i.interviewerName,
    i.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: 70,
    head: [["Candidate", "Company", "Role", "Date", "Time", "Interviewer", "Status"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }, // Blue
    styles: { font: "helvetica", fontSize: 8 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'PASSED') data.cell.styles.textColor = [16, 185, 129]; // Emerald
        if (data.cell.raw === 'FAILED') data.cell.styles.textColor = [239, 68, 68]; // Rose
      }
    }
  });

  doc.save(`Ignited_Minds_Report_${dateRange.start}_${dateRange.end}.pdf`);
};
