/**
 * Google Apps Script (GAS) Web App สำหรับส่งอีเมลยืนยันการจองห้องจัดรายการ BU CA
 * -----------------------------------------------------------------------------
 * วิธีติดตั้ง (Deployment Instructions):
 * 1. ไปที่ https://script.google.com/ แล้วกด "New project"
 * 2. คัดลอกโค้ดทั้งหมดนี้ไปวางแทนที่ Code.gs เดิม
 * 3. กด Deploy > New deployment
 * 4. เลือก type เป็น "Web app"
 * 5. ตั้งค่า:
 *    - Description: "BU CA Studio Booking Email Service"
 *    - Execute as: "Me" (อีเมลของคุณ)
 *    - Who has access: "Anyone" (ทุกคน เพื่อให้เว็บส่งเข้ามาได้)
 * 6. กด Deploy และคัดลอก "Web app URL" (ลงท้ายด้วย /exec)
 * 7. นำ URL มาใส่ใน .env ของโปรเจกต์:
 *    VITE_GAS_EMAIL_URL="https://script.google.com/macros/s/.../exec"
 *    GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 */

function doPost(e) {
  var responseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing request body / postData"
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Invalid JSON format in request body: " + parseErr.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    // 0. ตรวจสอบ Action ลบรายการจอง (Delete Booking from Database / Google Sheets)
    var action = (data.action || "").toString().toLowerCase().trim();
    if (action === "delete" || action === "delete_booking") {
      try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet() ? SpreadsheetApp.getActiveSpreadsheet().getActiveSheet() : null;
        if (sheet) {
          var values = sheet.getDataRange().getValues();
          var targetId = (data.id || data.bookingId || "").toString().trim();
          var targetRoom = (data.roomName || "").toString().trim();
          var targetDate = (data.bookingDate || data.date || "").toString().trim();
          var targetTime = (data.bookingTime || data.timeSlot || "").toString().trim();

          for (var r = values.length - 1; r >= 1; r--) {
            var rowStr = values[r].join(" ");
            var matchId = targetId && rowStr.indexOf(targetId) !== -1;
            var matchDateTime = targetRoom && targetDate && targetTime && 
                                rowStr.indexOf(targetRoom) !== -1 && 
                                rowStr.indexOf(targetDate) !== -1 && 
                                rowStr.indexOf(targetTime) !== -1;
            if (matchId || matchDateTime) {
              sheet.deleteRow(r + 1);
              break;
            }
          }
        }
      } catch (sheetErr) {
        // Continue and return success
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "ลบรายการจองเรียบร้อยแล้ว",
        id: data.id || data.bookingId,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. ตรวจสอบการรับค่าอีเมลผู้รับ (Recipient Email Handling)
    var to = (data.userEmail || data.to || data.toEmail || data.recipient || "").toString().toLowerCase().trim();
    if (!to) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing required recipient email ('userEmail', 'to' or 'toEmail')"
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    // ตรวจสอบรูปแบบอีเมลเบื้องต้น รองรับทุกโดเมน (@bu.ac.th, @bumail.net, @gmail.com, @hotmail.com ฯลฯ)
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Invalid email format: " + to
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ปรับปรุงหัวข้ออีเมล (Subject) และชื่อผู้ส่ง (From/Name) เพื่อป้องกัน Spam
    var roomName = data.roomName || (data.details && data.details.roomName) || "ห้องจัดรายการ";
    var defaultSubject = "ยืนยันการจองห้องจัดรายการ - " + roomName;
    var subject = (data.subject && data.subject.trim()) ? data.subject.trim() : defaultSubject;
    var senderName = data.fromName || data.name || "BU CA Equipment Help Desk";

    // 3. จัดเตรียมเนื้อหาข้อความ (Clean HTML + Plain text fallback)
    var htmlBody = data.htmlBody || "";
    var textBody = data.textBody || data.body || ("ยืนยันการจอง " + roomName + " โดย " + (data.userName || "ผู้จอง"));

    // หากไม่มี htmlBody ส่งมา ให้สร้าง default template ที่สวยงามและไม่ถูกตีกรองเป็นสแปม
    if (!htmlBody) {
      var dateStr = data.bookingDate || data.date || (data.details && data.details.date) || "-";
      var timeSlotStr = data.bookingTime || data.timeSlot || (data.details && data.details.timeSlot) || "-";
      var userNameStr = data.userName || data.studentName || "-";
      var studentIdStr = data.studentId || "-";
      var pinCodeStr = data.pinCode || "1234";

      htmlBody = '<div style="font-family:sans-serif;max-width:580px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;background:#ffffff;">' +
        '<div style="background:#1e1b4b;color:#ffffff;padding:16px;border-radius:8px;text-align:center;">' +
          '<h2 style="margin:0;font-size:18px;">BU CA Equipment Help Desk</h2>' +
          '<p style="margin:4px 0 0 0;font-size:12px;color:#a5b4fc;">คณะนิเทศศาสตร์ มหาวิทยาลัยกรุงเทพ</p>' +
        '</div>' +
        '<div style="padding:16px 0;">' +
          '<p style="font-size:15px;color:#1e293b;">เรียนคุณ <b>' + userNameStr + '</b> (' + studentIdStr + ')</p>' +
          '<p style="color:#475569;font-size:14px;">ระบบได้ทำการบันทึกข้อมูลการจองห้องสตูดิโอของคุณเรียบร้อยแล้ว:</p>' +
          '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">' +
            '<tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#64748b;">ห้องจัดรายการ:</td><td style="padding:8px 12px;font-weight:bold;color:#1e293b;">' + roomName + '</td></tr>' +
            '<tr><td style="padding:8px 12px;color:#64748b;">วันที่:</td><td style="padding:8px 12px;color:#1e293b;">' + dateStr + '</td></tr>' +
            '<tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#64748b;">ช่วงเวลา:</td><td style="padding:8px 12px;font-weight:bold;color:#4338ca;">' + timeSlotStr + '</td></tr>' +
          '</table>' +
          '<div style="background:#f5f3ff;border:1px dashed #8b5cf6;border-radius:8px;padding:16px;text-align:center;margin-top:16px;">' +
            '<div style="font-size:12px;color:#6d28d9;font-weight:bold;">รหัส PIN สำหรับแก้ไขหรือยกเลิกการจอง</div>' +
            '<div style="font-size:26px;font-weight:900;letter-spacing:4px;color:#4c1d95;margin-top:4px;">' + pinCodeStr + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;text-align:center;">' +
          'อีเมลแจ้งเตือนอัตโนมัติจากระบบบริการอุปกรณ์และการจองห้องสตูดิโอ BU CA' +
        '</div>' +
      '</div>';
    }

    // 4. ส่งอีเมลผ่าน MailApp (รองรับผู้รับภายนอกและทุกโดเมน) พร้อม fallback ไปยัง GmailApp
    var mailSuccess = false;
    var sendErrorMsg = "";

    try {
      MailApp.sendEmail({
        to: to,
        subject: subject,
        name: senderName,
        body: textBody,
        htmlBody: htmlBody
      });
      mailSuccess = true;
    } catch (mailAppErr) {
      sendErrorMsg = "MailApp error: " + mailAppErr.toString();
      // ลองส่งผ่าน GmailApp เป็น Fallback
      try {
        GmailApp.sendEmail(to, subject, textBody, {
          name: senderName,
          htmlBody: htmlBody
        });
        mailSuccess = true;
      } catch (gmailAppErr) {
        sendErrorMsg += " | GmailApp error: " + gmailAppErr.toString();
      }
    }

    // 5. ส่งผลลัพธ์ชัดเจน (Clear Return Response)
    if (mailSuccess) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Email sent successfully to " + to,
        recipient: to,
        subject: subject,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Failed to dispatch email: " + sendErrorMsg,
        recipient: to
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (globalErr) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Unexpected server error in Google Apps Script: " + globalErr.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// รองรับ HTTP GET สำหรับเช็ก Health Check ของ Web App
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "BU CA Studio Booking Email Service",
    timestamp: new Date().toISOString()
  }))
  .setMimeType(ContentService.MimeType.JSON);
}
