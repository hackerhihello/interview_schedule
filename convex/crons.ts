import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run monthly report on the 1st of every month at 9:00 AM UTC
crons.monthly(
  "Monthly WhatsApp Report",
  { day: 1, hourUTC: 9, minuteUTC: 0 },
  api.nodeReports.sendMonthlyWhatsAppReport,
  {}
);

export default crons;
