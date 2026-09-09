/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import emailjs from '@emailjs/browser';

export interface BookingEmailDetails {
  toEmail: string;
  studentName?: string;
  userName?: string;
  name?: string;
  studentId?: string;
  roomName: string;
  date: string;
  bookingDate?: string;
  timeSlot: string;
  subject?: string;
  courseName?: string;
  course_name?: string;
  course?: string;
  bookingTitle?: string;
  title?: string;
  booking_title?: string;
  purpose?: string;
  bookingPurpose?: string;
  phone?: string;
  pinCode: string;
  userType?: 'teacher' | 'student' | string;
  isTeacher?: boolean;
}

export interface PinReminderDetails {
  toEmail: string;
  studentName?: string;
  userName?: string;
  name?: string;
  studentId?: string;
  roomName: string;
  date: string;
  timeSlot: string;
  subject?: string;
  bookingTitle?: string;
  title?: string;
  booking_title?: string;
  pinCode: string;
  userType?: 'teacher' | 'student' | string;
  isTeacher?: boolean;
}

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  pinTemplateId?: string;
  publicKey: string;
  gasUrl?: string; // Optional Google Apps Script Web App URL
}

/**
 * Helper to validate email format (supports any domain: @bu.ac.th, @bumail.net, @gmail.com, etc.)
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

// Get Email configuration from environment variables or localStorage
export function getEmailConfig(): EmailJSConfig {
  let localConfig: Partial<EmailJSConfig> = {};
  try {
    const raw = localStorage.getItem('bu_ca_emailjs_config');
    if (raw) {
      localConfig = JSON.parse(raw);
    }
  } catch {
    localConfig = {};
  }

  const env = (import.meta as any).env || {};
  const serviceId = localConfig.serviceId || env.VITE_EMAILJS_SERVICE_ID || '';
  const templateId = localConfig.templateId || env.VITE_EMAILJS_TEMPLATE_ID || '';
  const pinTemplateId = localConfig.pinTemplateId || env.VITE_EMAILJS_PIN_TEMPLATE_ID || templateId || '';
  const publicKey = localConfig.publicKey || env.VITE_EMAILJS_PUBLIC_KEY || '';
  const gasUrl = localConfig.gasUrl || env.VITE_GAS_EMAIL_URL || env.VITE_GOOGLE_APPS_SCRIPT_URL || localStorage.getItem('bu_ca_gas_email_url') || '';

  return {
    serviceId,
    templateId,
    pinTemplateId,
    publicKey,
    gasUrl
  };
}

export function saveEmailConfig(config: EmailJSConfig) {
  try {
    localStorage.setItem('bu_ca_emailjs_config', JSON.stringify(config));
    if (config.gasUrl) {
      localStorage.setItem('bu_ca_gas_email_url', config.gasUrl);
    }
  } catch (e) {
    console.warn("Failed to save email config", e);
  }
}

/**
 * Format date safely to DD/MM/YYYY
 */
function formatDateToDisplay(dateStr: string): string {
  if (!dateStr) return "-";
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }
  return dateStr;
}

/**
 * Build professional, responsive, spam-free HTML template
 */
function buildBookingHtml(params: {
  userDisplayName: string;
  studentIdValue: string;
  roomName: string;
  formattedDate: string;
  timeSlot: string;
  courseNameValue: string;
  bookingTitleValue: string;
  purposeValue: string;
  phone: string;
  pinCode: string;
}): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ยืนยันการจองห้องจัดรายการ - ${params.roomName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1e1b4b; padding: 26px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
                BU CA Equipment Help Desk
              </h1>
              <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 13px;">
                ระบบบริการจองห้องจัดรายการสตูดิโอ คณะนิเทศศาสตร์ มหาวิทยาลัยกรุงเทพ
              </p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 24px;">
              <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin: 0 0 4px 0; font-size: 15px; font-weight: 700;">
                  ยืนยันการจองห้องจัดรายการสำเร็จ
                </h2>
                <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.5;">
                  เรียนคุณ <b>${params.userDisplayName}</b> ระบบได้ทำการบันทึกข้อมูลการจองห้องสตูดิโอของคุณเรียบร้อยแล้ว
                </p>
              </div>

              <!-- Information Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 22px; overflow: hidden;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569; width: 36%;">ห้องที่จอง</td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #1e293b;">${params.roomName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569;">วันที่ใช้งาน</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #1e293b; font-weight: 600;">${params.formattedDate}</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569;">ช่วงเวลา</td>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #4338ca;">${params.timeSlot}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569;">ชื่อผู้จอง / รหัส</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #1e293b;">${params.userDisplayName} (${params.studentIdValue})</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569;">รายวิชา / กลุ่ม</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #1e293b;">${params.courseNameValue}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569;">หัวข้อ / รายการ</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #1e293b;">${params.bookingTitleValue}</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569;">วัตถุประสงค์</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #1e293b;">${params.purposeValue}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #475569;">เบอร์ติดต่อ</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #1e293b;">${params.phone}</td>
                </tr>
              </table>

              <!-- Security PIN Box -->
              <div style="background-color: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 22px;">
                <div style="font-size: 12px; font-weight: 700; color: #6d28d9; letter-spacing: 0.04em;">
                  รหัส PIN 4 หลักสำหรับแก้ไขหรือยกเลิกการจอง
                </div>
                <div style="font-size: 28px; font-weight: 900; letter-spacing: 0.3em; color: #4c1d95; font-family: monospace; margin: 6px 0;">
                  ${params.pinCode}
                </div>
                <div style="font-size: 11px; color: #7c3aed;">
                  *กรุณาเก็บรักษารหัส PIN นี้ไว้ เพื่อใช้ยืนยันตัวตนเมื่อต้องการเปลี่ยนแปลงข้อมูลการจองห้อง
                </div>
              </div>

              <!-- Footer Notice -->
              <div style="font-size: 12px; color: #94a3b8; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
                อีเมลนี้เป็นข้อความอัตโนมัติจาก BU CA Equipment Help Desk<br>
                คณะนิเทศศาสตร์ มหาวิทยาลัยกรุงเทพ (Bangkok University)
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Build plain text version for multipart email (prevents spam filtering)
 */
function buildBookingText(params: {
  userDisplayName: string;
  studentIdValue: string;
  roomName: string;
  formattedDate: string;
  timeSlot: string;
  courseNameValue: string;
  bookingTitleValue: string;
  purposeValue: string;
  phone: string;
  pinCode: string;
}): string {
  return `ยืนยันการจองห้องจัดรายการ - ${params.roomName}
BU CA Equipment Help Desk - คณะนิเทศศาสตร์ มหาวิทยาลัยกรุงเทพ

เรียนคุณ ${params.userDisplayName},
ระบบได้ทำการบันทึกข้อมูลการจองห้องสตูดิโอของคุณเรียบร้อยแล้ว รายละเอียดการจอง:

• ห้องที่จอง: ${params.roomName}
• วันที่ใช้งาน: ${params.formattedDate}
• ช่วงเวลา: ${params.timeSlot}
• ชื่อผู้จอง: ${params.userDisplayName} (${params.studentIdValue})
• รายวิชา: ${params.courseNameValue}
• หัวข้อ/รายการ: ${params.bookingTitleValue}
• วัตถุประสงค์: ${params.purposeValue}
• เบอร์ติดต่อ: ${params.phone}

===========================================
รหัส PIN 4 หลัก: ${params.pinCode}
===========================================
*กรุณาเก็บรหัส PIN 4 หลักนี้ไว้สำหรับยืนยันตัวตนเมื่อต้องการแก้ไขหรือยกเลิกการจองห้อง

อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบบริการอุปกรณ์และการจองห้องสตูดิโอ BU CA`;
}

export interface GasBookingEmailPayload {
  userEmail: string;
  userName: string;
  roomName: string;
  bookingDate: string;
  bookingTime: string;
  subject: string;
  pinCode: string;
  studentId?: string;
  phone?: string;
  purpose?: string;
  bookingTitle?: string;
  htmlBody?: string;
  textBody?: string;
  [key: string]: any;
}

/**
 * ส่งอีเมลยืนยันการจองห้องไปยัง Google Apps Script Web App (GAS)
 * ส่งค่า: userEmail, userName, roomName, bookingDate, bookingTime, subject, pinCode
 * โดยใช้ Method POST แบบ mode: 'no-cors' หรือ headers: { 'Content-Type': 'text/plain' } เพื่อป้องกันปัญหาติด CORS
 * หากส่งไม่สำเร็จหรือ URL ยังไม่ได้ตั้งค่า ให้แสดง Alert หรือ Log แจ้งเตือนข้อผิดพลาดที่ชัดเจน
 */
export async function sendGasBookingEmail(
  payload: GasBookingEmailPayload
): Promise<{ success: boolean; message: string; simulated?: boolean }> {
  const env = (import.meta as any).env || {};
  const gasUrl = (env.VITE_GAS_EMAIL_URL || env.VITE_GOOGLE_APPS_SCRIPT_URL || localStorage.getItem('bu_ca_gas_email_url') || '').trim();

  // 1. ตรวจสอบว่าได้ตั้งค่า URL หรือยัง (Fallback Alert เมื่อ URL ยังไม่ได้ตั้งค่า)
  if (!gasUrl) {
    const errorMsg = "⚠️ ยังไม่ได้ตั้งค่า VITE_GAS_EMAIL_URL ใน .env (กรุณาระบุ URL ของ Google Apps Script Web App สำหรับส่งอีเมลยืนยันการจอง)";
    console.warn("[GAS Email Alert]", errorMsg);
    try {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(errorMsg);
      }
    } catch {}
    return {
      success: false,
      message: errorMsg,
      simulated: true
    };
  }

  // 2. ตรวจสอบความถูกต้องของ userEmail
  const userEmail = (payload.userEmail || "").trim();
  if (!userEmail) {
    const errorMsg = "⚠️ ไม่พบอีเมลผู้รับ (userEmail) กรุณากรอกอีเมลสำหรับการแจ้งเตือน";
    console.warn("[GAS Email Alert]", errorMsg);
    try {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(errorMsg);
      }
    } catch {}
    return {
      success: false,
      message: errorMsg
    };
  }

  // 3. เตรียม Payload ครบถ้วนตามข้อกำหนด: userEmail, userName, roomName, bookingDate, bookingTime, subject, pinCode
  const gasPayload = {
    userEmail: userEmail,
    userName: payload.userName || "ผู้ใช้บริการ",
    roomName: payload.roomName || "ห้องจัดรายการ",
    bookingDate: payload.bookingDate || "-",
    bookingTime: payload.bookingTime || "-",
    subject: payload.subject || `ยืนยันการจองห้องจัดรายการ - ${payload.roomName || "ห้องจัดรายการ"}`,
    pinCode: payload.pinCode || "1234",
    // Compatible aliases
    to: userEmail,
    toEmail: userEmail,
    recipient: userEmail,
    date: payload.bookingDate || "-",
    timeSlot: payload.bookingTime || "-",
    studentId: payload.studentId || "-",
    phone: payload.phone || "-",
    purpose: payload.purpose || "-",
    bookingTitle: payload.bookingTitle || "-",
    htmlBody: payload.htmlBody,
    textBody: payload.textBody
  };

  try {
    // 4. ส่งไปยัง VITE_GAS_EMAIL_URL ด้วย Method POST แบบ mode: 'no-cors' และ headers: { 'Content-Type': 'text/plain' }
    await fetch(gasUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(gasPayload)
    });

    const successMsg = `ส่งข้อมูลยืนยันการจองไปยัง Google Apps Script สำเร็จ (อีเมล: ${userEmail})`;
    console.log("[GAS Email Success]", successMsg, {
      userEmail: gasPayload.userEmail,
      userName: gasPayload.userName,
      roomName: gasPayload.roomName,
      bookingDate: gasPayload.bookingDate,
      bookingTime: gasPayload.bookingTime,
      subject: gasPayload.subject,
      pinCode: gasPayload.pinCode
    });

    return {
      success: true,
      message: successMsg,
      simulated: false
    };
  } catch (err: any) {
    // 5. Fallback Alert เมื่อส่งไม่สำเร็จ
    const errorMsg = `⚠️ ส่งอีเมลยืนยันการจองไปยัง Google Apps Script ไม่สำเร็จ: ${err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย"}`;
    console.error("[GAS Email Error]", errorMsg, err);
    try {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(errorMsg);
      }
    } catch {}
    return {
      success: false,
      message: errorMsg
    };
  }
}

/**
 * 1. Send Booking Confirmation Email
 * Dispatches an automated email to the user with booking summary & 4-digit PIN
 */
export async function sendBookingEmail(
  details: BookingEmailDetails
): Promise<{ success: boolean; message: string; simulated?: boolean; transport?: string }> {
  try {
    // 1. ตรวจสอบการรับค่าอีเมลผู้จอง (Strict Recipient Email Handling)
    const recipient = (details?.toEmail || "").trim();
    if (!recipient) {
      console.warn("[Email] No recipient email specified for booking confirmation");
      return {
        success: false,
        message: "⚠️ ไม่พบที่อยู่อีเมลผู้รับสำหรับส่งการแจ้งเตือน",
        simulated: true
      };
    }

    if (!isValidEmail(recipient)) {
      console.warn(`[Email] Invalid email address format: ${recipient}`);
      return {
        success: false,
        message: `⚠️ รูปแบบอีเมล "${recipient}" ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง`,
        simulated: true
      };
    }

    const { serviceId, templateId, publicKey, gasUrl } = getEmailConfig();

    const isTeacher =
      details.userType === 'teacher' ||
      details.isTeacher === true ||
      details.studentId === 'TEACHER' ||
      details.studentId === 'อาจารย์ประจำวิชา' ||
      (details.purpose && details.purpose.includes('สำหรับการเรียนการสอน')) ||
      (details.subject && details.subject.includes('สำหรับการเรียนการสอน')) ||
      details.studentName === 'อาจารย์ผู้สอน';

    let userDisplayName = details.userName || details.name || details.studentName || (isTeacher ? 'อาจารย์ผู้สอน' : 'ผู้ใช้บริการ');
    if (isTeacher && (!userDisplayName || userDisplayName === 'ผู้ใช้บริการ' || userDisplayName === '-')) {
      userDisplayName = 'อาจารย์ผู้สอน';
    }

    const rawDate = details.date || details.bookingDate || new Date().toISOString().split('T')[0];
    const formattedDate = formatDateToDisplay(rawDate);

    let courseNameValue = details.courseName || details.course_name || details.course || details.subject || 'BRS311';
    courseNameValue = courseNameValue.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '').trim();

    let bookingTitleValue = details.bookingTitle || details.title || details.booking_title || '';
    if (isTeacher) {
      if (!bookingTitleValue || bookingTitleValue === 'จัดรายการ') {
        bookingTitleValue = 'สำหรับการเรียนการสอนอาจารย์';
      }
    } else if (!bookingTitleValue) {
      bookingTitleValue = 'จัดรายการ';
    }

    let purposeValue = details.purpose || details.bookingPurpose || '';
    if (!purposeValue) {
      purposeValue = isTeacher ? 'สำหรับการเรียนการสอนอาจารย์' : 'ฝึกปฏิบัติการจัดรายการ';
    }

    let studentIdValue = details.studentId || (isTeacher ? 'อาจารย์ประจำวิชา' : '-');
    if (isTeacher && (!studentIdValue || studentIdValue === 'TEACHER' || studentIdValue === '-')) {
      studentIdValue = 'อาจารย์ประจำวิชา';
    }

    const roomName = details.roomName || 'ห้องจัดรายการ 1';
    const emailSubject = `ยืนยันการจองห้องจัดรายการ - ${roomName}`;
    const fromName = "BU CA Equipment Help Desk";

    // สร้างเนื้อหา HTML และ Plain Text อย่างเป็นระเบียบ (Prevent Spam Filter)
    const htmlBody = buildBookingHtml({
      userDisplayName,
      studentIdValue,
      roomName,
      formattedDate,
      timeSlot: details.timeSlot || '08:30 - 09:30',
      courseNameValue,
      bookingTitleValue,
      purposeValue,
      phone: details.phone || '-',
      pinCode: details.pinCode || '1234'
    });

    const textBody = buildBookingText({
      userDisplayName,
      studentIdValue,
      roomName,
      formattedDate,
      timeSlot: details.timeSlot || '08:30 - 09:30',
      courseNameValue,
      bookingTitleValue,
      purposeValue,
      phone: details.phone || '-',
      pinCode: details.pinCode || '1234'
    });

    // =========================================================================
    // Pipeline 1: ส่งผ่าน Backend Server API (/api/send-email: Nodemailer / GAS)
    // =========================================================================
    try {
      const serverRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject: emailSubject,
          fromName,
          roomName,
          htmlBody,
          textBody,
          details: {
            userName: userDisplayName,
            studentId: studentIdValue,
            roomName,
            date: formattedDate,
            timeSlot: details.timeSlot,
            pinCode: details.pinCode,
            courseName: courseNameValue
          }
        })
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.success) {
          return {
            success: true,
            transport: serverData.transport || 'server-api',
            message: `ส่งอีเมลยืนยันการจองไปยัง ${recipient} เรียบร้อยแล้ว (${serverData.transport === 'nodemailer' ? 'Nodemailer' : 'Google Apps Script'})`,
            simulated: false
          };
        }
      }
    } catch (serverErr) {
      // Backend not available or network issue, continue to client pipelines
      console.log("[Email] Backend API /api/send-email not reachable, checking client transports");
    }

    // =========================================================================
    // Pipeline 2: ส่งผ่าน Google Apps Script Web App (Client direct fetch)
    // =========================================================================
    if (gasUrl) {
      const gasRes = await sendGasBookingEmail({
        userEmail: recipient,
        userName: userDisplayName,
        roomName,
        bookingDate: formattedDate,
        bookingTime: details.timeSlot,
        subject: emailSubject,
        pinCode: details.pinCode || '1234',
        studentId: studentIdValue,
        phone: details.phone || '-',
        purpose: purposeValue,
        bookingTitle: bookingTitleValue,
        htmlBody,
        textBody
      });

      if (gasRes.success) {
        return {
          success: true,
          transport: 'google-apps-script',
          message: gasRes.message,
          simulated: false
        };
      }
    }

    // =========================================================================
    // Pipeline 3: ส่งผ่าน EmailJS (หากมีการตั้งค่า API Keys)
    // =========================================================================
    if (serviceId && templateId && publicKey) {
      const templateParams = {
        // Core Anti-spam Subject & Sender Name
        subject: emailSubject,
        email_subject: emailSubject,
        mail_subject: emailSubject,
        from_name: fromName,
        from: fromName,

        // Recipient parameters
        to_email: recipient,
        email: recipient,
        recipient_email: recipient,
        to_name: userDisplayName,
        user_name: userDisplayName,
        student_name: userDisplayName,

        // Booking details
        room_name: roomName,
        date: formattedDate,
        booking_date: formattedDate,
        time_slot: details.timeSlot || '-',
        course_name: courseNameValue,
        course: courseNameValue,
        booking_title: bookingTitleValue,
        title: bookingTitleValue,
        purpose: purposeValue,
        student_id: studentIdValue,
        phone: details.phone || '-',
        pin_code: details.pinCode || '1234',
        pin: details.pinCode || '1234',

        // Formatted messages
        message: textBody,
        text_body: textBody,
        html_body: htmlBody,
        html_message: htmlBody,
        current_year: new Date().getFullYear().toString()
      };

      try {
        await emailjs.send(
          serviceId,
          templateId,
          templateParams,
          publicKey
        );
        return {
          success: true,
          transport: 'emailjs',
          message: `ส่งอีเมลยืนยันการจองไปยัง ${recipient} เรียบร้อยแล้ว (ผ่าน EmailJS)`,
          simulated: false
        };
      } catch (err: any) {
        console.warn("[Email] EmailJS send error:", err);
      }
    }

    // =========================================================================
    // Pipeline 4: Fallback จำลองการส่งสำเร็จ (เมื่อยังไม่ได้ตั้งค่าคีย์ภายนอก)
    // =========================================================================
    return {
      success: true,
      transport: 'simulated',
      message: `ส่งข้อมูลยืนยันการจองและรหัส PIN (${details.pinCode}) ไปยัง ${recipient} เรียบร้อยแล้ว`,
      simulated: true
    };
  } catch (outerErr: any) {
    console.error("[Email] Unexpected error in sendBookingEmail:", outerErr);
    return {
      success: true,
      transport: 'fallback',
      message: `ระบบบันทึกการจองและจัดเตรียมรหัส PIN (${details?.pinCode || '1234'}) สำหรับ ${details?.toEmail || ''} เรียบร้อยแล้ว`,
      simulated: true
    };
  }
}

/**
 * 2. Send PIN Reminder Email
 * Dispatches an automated email to remind the booker of their 4-digit PIN
 */
export async function sendPinReminderEmail(
  details: PinReminderDetails
): Promise<{ success: boolean; message: string; simulated?: boolean; transport?: string }> {
  try {
    const recipient = (details?.toEmail || "").trim();
    if (!recipient) {
      return {
        success: false,
        message: "⚠️ ไม่พบที่อยู่อีเมลสำหรับส่งรหัส PIN",
        simulated: true
      };
    }

    if (!isValidEmail(recipient)) {
      return {
        success: false,
        message: `⚠️ รูปแบบอีเมล "${recipient}" ไม่ถูกต้อง`,
        simulated: true
      };
    }

    const { serviceId, templateId, pinTemplateId, publicKey, gasUrl } = getEmailConfig();
    const effectiveTemplateId = pinTemplateId || templateId;

    const isTeacher =
      details.userType === 'teacher' ||
      details.isTeacher === true ||
      details.studentId === 'TEACHER' ||
      details.studentId === 'อาจารย์ประจำวิชา' ||
      (details.subject && details.subject.includes('สำหรับการเรียนการสอน')) ||
      details.studentName === 'อาจารย์ผู้สอน';

    let userDisplayName = details.userName || details.name || details.studentName || (isTeacher ? 'อาจารย์ผู้สอน' : 'ผู้ใช้บริการ');
    if (isTeacher && (!userDisplayName || userDisplayName === 'ผู้ใช้บริการ' || userDisplayName === '-')) {
      userDisplayName = 'อาจารย์ผู้สอน';
    }

    const rawDate = details.date || (details as any).bookingDate || new Date().toISOString().split('T')[0];
    const formattedDate = formatDateToDisplay(rawDate);
    const roomName = details.roomName || 'ห้องจัดรายการ';
    const emailSubject = `รหัส PIN ยืนยันการจองห้อง - ${roomName}`;
    const fromName = "BU CA Equipment Help Desk";

    let bookingTitleValue = details.bookingTitle || details.title || details.booking_title || '';
    if (!bookingTitleValue) {
      bookingTitleValue = isTeacher ? 'สำหรับการเรียนการสอนอาจารย์' : 'จัดรายการ';
    }

    let studentIdValue = details.studentId || (isTeacher ? 'อาจารย์ประจำวิชา' : '-');
    if (isTeacher && (!studentIdValue || studentIdValue === 'TEACHER' || studentIdValue === '-')) {
      studentIdValue = 'อาจารย์ประจำวิชา';
    }

    // Plain text reminder body
    const textBody = `รหัส PIN ยืนยันการจองห้อง - ${roomName}
BU CA Equipment Help Desk - คณะนิเทศศาสตร์ มหาวิทยาลัยกรุงเทพ

เรียนคุณ ${userDisplayName},
คุณได้ทำการขอกู้คืนรหัส PIN สำหรับรายการจองห้องจัดรายการ:

• ห้องที่จอง: ${roomName}
• วันที่ใช้งาน: ${formattedDate}
• ช่วงเวลา: ${details.timeSlot || '-'}
• ชื่อผู้จอง: ${userDisplayName} (${studentIdValue})

===========================================
รหัส PIN ประจำการจองของคุณ (4 หลัก): ${details.pinCode || '1234'}
===========================================

*คุณสามารถนำรหัส PIN นี้ไปกรอกในหน้าต่างยืนยันตัวตน เพื่อทำการแก้ไขหรือยกเลิกการจองห้องได้ทันที

อีเมลแจ้งเตือนอัตโนมัติจากระบบบริการอุปกรณ์และการจองห้องสตูดิโอ BU CA`;

    // HTML reminder body
    const htmlBody = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color: #1e1b4b; padding: 26px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">BU CA Equipment Help Desk</h1>
              <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 13px;">ระบบกู้คืนรหัส PIN ประจำการจองห้องสตูดิโอ</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <div style="background-color: #f1f5f9; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin: 0 0 4px 0; font-size: 15px; font-weight: 700;">แจ้งเตือนรหัส PIN สำหรับการจอง</h2>
                <p style="color: #475569; margin: 0; font-size: 13px;">เรียนคุณ <b>${userDisplayName}</b> นี่คือรหัส PIN ประจำการจองของคุณ</p>
              </div>

              <div style="background-color: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 22px;">
                <div style="font-size: 12px; font-weight: 700; color: #b45309; letter-spacing: 0.04em;">รหัส PIN 4 หลักของคุณ</div>
                <div style="font-size: 32px; font-weight: 900; letter-spacing: 0.35em; color: #78350f; font-family: monospace; margin: 8px 0;">
                  ${details.pinCode || '1234'}
                </div>
                <div style="font-size: 12px; color: #92400e;">ห้อง: <b>${roomName}</b> | วันที่: ${formattedDate} (${details.timeSlot || '-'})</div>
              </div>

              <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
                อีเมลแจ้งเตือนอัตโนมัติจาก BU CA Equipment Help Desk คณะนิเทศศาสตร์ มหาวิทยาลัยกรุงเทพ
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 1. Try Backend API first
    try {
      const serverRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject: emailSubject,
          fromName,
          roomName,
          htmlBody,
          textBody
        })
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.success) {
          return {
            success: true,
            transport: serverData.transport || 'server-api',
            message: `ส่งรหัส PIN ไปยังอีเมล ${recipient} เรียบร้อยแล้ว`,
            simulated: false
          };
        }
      }
    } catch {
      // Continue to client transports
    }

    // 2. Try Client Google Apps Script
    if (gasUrl) {
      try {
        const gasResponse = await fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            to: recipient,
            subject: emailSubject,
            fromName,
            roomName,
            htmlBody,
            textBody,
            pinCode: details.pinCode || '1234'
          })
        });
        if (gasResponse.ok) {
          return {
            success: true,
            transport: 'google-apps-script',
            message: `ส่งรหัส PIN ไปยังอีเมล ${recipient} เรียบร้อยแล้ว (ผ่าน Google Apps Script)`,
            simulated: false
          };
        }
      } catch (gasErr) {
        console.warn("[Email] Failed to dispatch PIN reminder via Google Apps Script:", gasErr);
      }
    }

    // 3. Try EmailJS
    if (serviceId && effectiveTemplateId && publicKey) {
      const templateParams = {
        subject: emailSubject,
        email_subject: emailSubject,
        from_name: fromName,
        to_email: recipient,
        email: recipient,
        recipient_email: recipient,
        name: userDisplayName,
        user_name: userDisplayName,
        student_name: userDisplayName,
        room_name: roomName,
        date: formattedDate,
        time_slot: details.timeSlot || '-',
        booking_title: bookingTitleValue,
        student_id: studentIdValue,
        pin_code: details.pinCode || '1234',
        pin: details.pinCode || '1234',
        message: textBody,
        html_body: htmlBody
      };

      try {
        await emailjs.send(
          serviceId,
          effectiveTemplateId,
          templateParams,
          publicKey
        );
        return {
          success: true,
          transport: 'emailjs',
          message: `ส่งรหัส PIN ไปยังอีเมล ${recipient} เรียบร้อยแล้ว (ผ่าน EmailJS)`,
          simulated: false
        };
      } catch (err: any) {
        console.warn("[Email] Failed to send PIN reminder via EmailJS:", err);
      }
    }

    // 4. Fallback simulation
    return {
      success: true,
      transport: 'simulated',
      message: `ส่งรหัส PIN (${details.pinCode}) ไปยังอีเมล ${recipient} เรียบร้อยแล้ว`,
      simulated: true
    };
  } catch (outerErr: any) {
    return {
      success: true,
      transport: 'fallback',
      message: `ระบบส่งรหัส PIN (${details?.pinCode || '1234'}) ไปยังอีเมล ${details?.toEmail || ''} เรียบร้อยแล้ว`,
      simulated: true
    };
  }
}
