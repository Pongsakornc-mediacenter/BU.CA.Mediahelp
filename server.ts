import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: "5mb" }));

  // API Health check for Cloud Run
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Email Dispatch endpoint (Nodemailer & Google Apps Script Forwarder)
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, htmlBody, textBody, fromName, details, roomName } = req.body;
      const recipient = (to || "").trim();

      if (!recipient) {
        return res.status(400).json({
          success: false,
          error: "Missing required recipient email ('to')"
        });
      }

      // 1. Google Apps Script Web App (MailApp / GmailApp)
      const gasUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.VITE_GAS_EMAIL_URL || process.env.GAS_EMAIL_URL;
      if (gasUrl) {
        try {
          const gasResponse = await fetch(gasUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              to: recipient,
              toEmail: recipient,
              subject: subject || `ยืนยันการจองห้องจัดรายการ - ${roomName || "ห้องจัดรายการ"}`,
              fromName: fromName || "BU CA Equipment Help Desk",
              htmlBody,
              textBody,
              details
            })
          });

          const gasText = await gasResponse.text();
          let parsed: any = null;
          try {
            parsed = JSON.parse(gasText);
          } catch {
            parsed = { raw: gasText };
          }

          if (!gasResponse.ok || (parsed && parsed.success === false)) {
            return res.status(502).json({
              success: false,
              transport: "google-apps-script",
              error: (parsed && parsed.error) || `Google Apps Script returned HTTP ${gasResponse.status}`,
              details: parsed
            });
          }

          return res.json({
            success: true,
            transport: "google-apps-script",
            message: `ส่งอีเมลสำเร็จผ่าน Google Apps Script ไปยัง ${recipient}`,
            response: parsed
          });
        } catch (gasErr: any) {
          console.error("[Email] Error calling Google Apps Script:", gasErr);
          // If GAS failed, continue to check SMTP if configured
        }
      }

      // 2. Nodemailer (SMTP / Gmail App Password)
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

      if (smtpHost || (smtpUser && smtpPass)) {
        try {
          const transporter = nodemailer.createTransport(
            smtpHost
              ? {
                  host: smtpHost,
                  port: Number(process.env.SMTP_PORT) || 587,
                  secure: process.env.SMTP_PORT === "465",
                  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
                  tls: { rejectUnauthorized: false }
                }
              : {
                  service: "gmail",
                  auth: { user: smtpUser, pass: smtpPass }
                }
          );

          const sender = process.env.SMTP_FROM || `"${fromName || "BU CA Equipment Help Desk"}" <${smtpUser || "no-reply@bu.ac.th"}>`;

          const info = await transporter.sendMail({
            from: sender,
            to: recipient,
            subject: subject || `ยืนยันการจองห้องจัดรายการ - ${roomName || "ห้องจัดรายการ"}`,
            text: textBody || "ยืนยันการจองห้องจัดรายการ คณะนิเทศศาสตร์ มหาวิทยาลัยกรุงเทพ",
            html: htmlBody,
            headers: {
              "X-Mailer": "BU-CA-Studio-Booking-System",
              "X-Entity-Ref-ID": `BU-CA-${Date.now()}`
            }
          });

          return res.json({
            success: true,
            transport: "nodemailer",
            messageId: info.messageId,
            message: `ส่งอีเมลสำเร็จผ่าน Nodemailer ไปยัง ${recipient}`
          });
        } catch (smtpErr: any) {
          console.error("[Email] Nodemailer send error:", smtpErr);
          return res.status(500).json({
            success: false,
            transport: "nodemailer",
            error: smtpErr.message || "Failed to send email via SMTP"
          });
        }
      }

      // 3. No server-side transport configured -> notify client to use EmailJS or client GAS
      return res.json({
        success: false,
        code: "NO_SERVER_TRANSPORT",
        message: "No server-side SMTP or Google Apps Script configured. Client-side transport will be attempted."
      });
    } catch (err: any) {
      console.error("[Email API] Unexpected server error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Internal server error during email dispatch"
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
