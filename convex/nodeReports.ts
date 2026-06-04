"use node";

import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Resend } from "resend";
import { generateExcelBuffer } from "../lib/excel-generator";

export const sendMonthlyWhatsAppReport = action({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch Monthly Data
    const data = await ctx.runQuery(internal.reports.getMonthlyData);
    
    // 2. Generate Excel Buffer in Node.js
    const dateRange = {
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    };
    
    const excelBuffer = await generateExcelBuffer(data, dateRange);

    // 3. Store in Convex Storage for WhatsApp MediaUrl
    const storageId = await ctx.storage.store(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const fileUrl = await ctx.storage.getUrl(storageId);

    // 4. Get Settings
    const settings = await ctx.runQuery(api.reports.getSettings);
    
    // 5. Send Email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const reportEmailTo = settings?.emailTo || process.env.REPORT_EMAIL_TO;

    if (resendApiKey && reportEmailTo) {
      const resend = new Resend(resendApiKey);
      try {
        await resend.emails.send({
          from: "Reports <reports@ignitedminds.com>", // Update with verified domain if needed
          to: [reportEmailTo],
          subject: `Monthly Interview Report - ${data.monthName} ${data.year}`,
          text: `Please find the attached Excel report for ${data.monthName} ${data.year}. \n\nTotal Interviews: ${data.total}\nSelected: ${data.passed}\nSuccess Rate: ${data.successRate}%`,
          attachments: [
            {
              filename: `Report_${data.monthName}_${data.year}.xlsx`,
              content: Buffer.from(excelBuffer)
            }
          ]
        });
        console.log("Monthly Email report sent successfully.");
      } catch (error) {
        console.error("Failed to send Email via Resend:", error);
      }
    } else {
      console.warn("Skipping Email: RESEND_API_KEY or REPORT_EMAIL_TO not found.");
    }

    // 6. Send WhatsApp via Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;
    const twilioTo = settings?.whatsappTo || process.env.WHATSAPP_TO;
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioFrom || !twilioTo) {
      console.warn("Skipping WhatsApp: Missing Twilio credentials or phone numbers in environment variables.");
      return;
    }

    const messageBody = `*Ignited Minds Monthly Report*\n\n*Period:* ${data.monthName} ${data.year}\n*Total Interviews:* ${data.total}\n*Completed:* ${data.completed}\n*Selected:* ${data.passed}\n*Rejected:* ${data.failed}\n*Success Rate:* ${data.successRate}%\n\nThe Excel report is attached below!`;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const params = new URLSearchParams({
      From: twilioFrom,
      To: twilioTo,
      Body: messageBody
    });

    // Attach the file URL if we generated it
    if (fileUrl) {
      params.append("MediaUrl", fileUrl);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send WhatsApp message via Twilio:", errorText);
      throw new Error("Failed to send WhatsApp message");
    }

    console.log("Monthly WhatsApp report sent successfully.");
  }
});
