/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  BookOpen,
  GraduationCap,
  FileText,
  CheckCircle2,
  Edit3,
  Trash2,
  Radio,
  Video,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { RoomBooking, Course } from '../types';

export interface BookingModalData {
  room: string;
  subject?: string;
  slot?: string;
  studentId?: string;
  studentName?: string;
  phone?: string;
  purpose?: string;
  roomThemeText?: string;
  booking?: RoomBooking;
}

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BookingModalData | null;
  onEditClick?: (booking: RoomBooking) => void;
  onDeleteClick?: (booking: RoomBooking) => void;
  courses?: Course[];
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  data,
  onEditClick,
  onDeleteClick,
  courses = []
}) => {
  if (!isOpen || !data) return null;

  const booking = data.booking;

  // Determine Room Theme & Icons
  const roomName = booking?.roomName || data.room || "ห้องจัดรายการ 1";
  const getRoomBadgeConfig = (room: string) => {
    if (room.includes("1") && room.includes("ห้องจัดรายการ")) {
      return {
        bg: "bg-orange-500/15",
        border: "border-orange-500/30",
        text: "text-orange-400",
        pillBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
        icon: <Radio className="w-5 h-5 text-orange-400" />,
        name: "ห้องจัดรายการ 1 (On-Air Studio 1)"
      };
    }
    if (room.includes("2") && room.includes("ห้องจัดรายการ")) {
      return {
        bg: "bg-sky-500/15",
        border: "border-sky-500/30",
        text: "text-sky-400",
        pillBg: "bg-sky-500/20 text-sky-300 border-sky-500/40",
        icon: <Radio className="w-5 h-5 text-sky-400" />,
        name: "ห้องจัดรายการ 2 (On-Air Studio 2)"
      };
    }
    if (room.includes("1") && room.includes("ยูทูป")) {
      return {
        bg: "bg-rose-500/15",
        border: "border-rose-500/30",
        text: "text-rose-400",
        pillBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        icon: <Video className="w-5 h-5 text-rose-400" />,
        name: "ห้องยูทูป 1 (Live & Podcast Studio 1)"
      };
    }
    if (room.includes("2") && room.includes("ยูทูป")) {
      return {
        bg: "bg-purple-500/15",
        border: "border-purple-500/30",
        text: "text-purple-400",
        pillBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        icon: <Video className="w-5 h-5 text-purple-400" />,
        name: "ห้องยูทูป 2 (Live & Podcast Studio 2)"
      };
    }
    return {
      bg: "bg-slate-700/30",
      border: "border-slate-600/40",
      text: "text-slate-200",
      pillBg: "bg-slate-700/50 text-slate-300 border-slate-600",
      icon: <Radio className="w-5 h-5 text-slate-300" />,
      name: room
    };
  };

  const roomConfig = getRoomBadgeConfig(roomName);

  // Determine Booking Type: Teacher vs Student
  const isTeacherBooking =
    booking?.userType === 'teacher' ||
    booking?.studentId === 'TEACHER' ||
    booking?.studentIdInput === 'TEACHER' ||
    (booking?.purpose && booking.purpose.includes('สำหรับการเรียนการสอนอาจารย์')) ||
    (data.studentId === 'อาจารย์ผู้สอน');

  // Format Thai Date
  const rawDate = booking?.date || "";
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return "ระบุตามตารางประจำสัปดาห์";
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d);
      const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
      const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      const thaiShortMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      const dayName = dayNames[dateObj.getDay()] || "";
      const monthName = thaiMonths[m] || "";
      const shortMonth = thaiShortMonths[m] || "";
      return `${dayName} ${d} ${shortMonth} ${y} (${d} ${monthName} ${y + 543})`;
    }
    return dateStr;
  };

  const displayDateText = formatThaiDate(rawDate);
  const displayTimeSlot = booking?.timeSlot || data.slot || "08:30 - 09:30";

  // Booker Details
  const displayBookerName =
    booking?.studentNameInput ||
    booking?.studentName ||
    data.studentName ||
    (isTeacherBooking ? "อาจารย์ผู้สอนประจำวิชา" : "ไม่ระบุชื่อ");

  let displayBookerId =
    booking?.studentIdInput ||
    (booking?.studentId && booking.studentId !== "TEACHER" ? booking.studentId : "") ||
    (data.studentId && data.studentId !== "อาจารย์ผู้สอน" && data.studentId !== "TEACHER" ? data.studentId : "");

  if (!displayBookerId) {
    displayBookerId = isTeacherBooking ? "อาจารย์ประจำวิชา (Instructor)" : "-";
  }

  const displayPhone =
    booking?.phone && booking.phone !== "-"
      ? booking.phone
      : (data.phone && data.phone !== "-" && data.phone !== "อาจารย์ผู้สอน" ? data.phone : "-");

  const displayEmail =
    booking?.email ||
    booking?.studentEmail ||
    (isTeacherBooking ? "bu.instructor@bu.ac.th" : "-");

  // Course Details
  let rawSubject = booking?.subject || data.subject || "BRS311";
  // Clean up if it contains teacher parenthetical note
  rawSubject = rawSubject.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '').trim();

  // Try to match with courses catalog for official course title if needed
  let fullCourseName = rawSubject;
  if (courses.length > 0) {
    const matched = courses.find(c => 
      c.code.toLowerCase() === rawSubject.toLowerCase() || 
      `${c.code} - ${c.name}`.toLowerCase() === rawSubject.toLowerCase()
    );
    if (matched) {
      fullCourseName = `${matched.code} - ${matched.name}`;
    }
  }

  // Instructor Name (if Teacher Booking)
  let instructorName = isTeacherBooking ? displayBookerName : "";
  if (!instructorName && isTeacherBooking) {
    instructorName = "อาจารย์ผู้สอนประจำวิชา";
  }

  // Purpose Details
  let rawPurpose =
    booking?.bookingPurpose ||
    booking?.purpose ||
    data.purpose ||
    (isTeacherBooking ? "สำหรับการเรียนการสอนอาจารย์" : "ฝึกจัดรายการวิทยุ");

  // Remove internal flags from purpose
  const cleanPurpose = rawPurpose
    .replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '')
    .trim() || (isTeacherBooking ? "สำหรับการเรียนการสอนอาจารย์ในชั้นเรียน" : "ฝึกซ้อมจัดรายการวิทยุและสื่อเสียง");

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-200"
        onClick={onClose}
        id="booking_detail_modal_backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[540px] bg-[#141417] border border-[#32323a] rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-left flex flex-col my-auto overflow-hidden text-slate-100 cursor-default"
          id="booking_detail_modal_content"
        >
          {/* Top Decorative Color Line */}
          <div className={`h-1.5 w-full ${isTeacherBooking ? 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-500' : 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500'}`} />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-[#25252d] flex items-start justify-between gap-3 bg-[#19191e]/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl border ${roomConfig.bg} ${roomConfig.border} shrink-0`}>
                {roomConfig.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-[18px] sm:text-[20px] text-white tracking-tight leading-tight truncate font-display">
                    รายละเอียดการจองห้อง
                  </h3>
                  {/* Booking Type Pill */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shrink-0 ${
                      isTeacherBooking
                        ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-sm'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm'
                    }`}
                  >
                    {isTeacherBooking ? (
                      <>
                        <GraduationCap className="w-3 h-3 text-purple-300" />
                        <span>คลาสเรียนอาจารย์</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-emerald-300" />
                        <span>นักศึกษา / ทั่วไป</span>
                      </>
                    )}
                  </span>
                </div>
                <p className={`text-[13px] font-bold mt-1 truncate ${roomConfig.text}`}>
                  {roomName}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Organized Cards & Sections */}
          <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">

            {/* Card 1: วันที่และเวลาการใช้งาน (Date & Time Schedule) */}
            <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-600/40 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>วันและเวลาการใช้งานห้อง</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#141417] p-2.5 rounded-xl border border-[#26262e] flex flex-col justify-center">
                  <span className="text-[11px] font-semibold text-slate-400 mb-0.5">วันที่จองใช้งาน</span>
                  <div className="font-extrabold text-[14px] text-white flex items-center gap-1.5 truncate">
                    <span className="text-orange-400">📅</span>
                    <span className="truncate">{displayDateText}</span>
                  </div>
                </div>

                <div className="bg-[#141417] p-2.5 rounded-xl border border-[#26262e] flex flex-col justify-center">
                  <span className="text-[11px] font-semibold text-slate-400 mb-0.5">ช่วงเวลาที่เลือก</span>
                  <div className="font-extrabold text-[14px] text-amber-300 flex items-center gap-1.5 truncate">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{displayTimeSlot}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: รายวิชา & อาจารย์ผู้สอน (Course & Instructor) */}
            <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-600/40 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>รายวิชา / ข้อมูลวิชาเรียน</span>
              </div>
              <div className="bg-[#141417] p-3 rounded-xl border border-[#26262e] space-y-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">วิชา / กลุ่มการเรียน</span>
                  <div className="font-extrabold text-[15px] text-white leading-snug break-words">
                    {fullCourseName}
                  </div>
                </div>
                {isTeacherBooking && (
                  <div className="pt-2 border-t border-[#26262e] flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">อาจารย์ผู้สอน:</span>
                    <span className="text-[13px] font-bold text-purple-300 truncate">{instructorName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: ข้อมูลผู้แจ้งจอง (Booker Information) */}
            <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-600/40 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span>ข้อมูลผู้แจ้งจองใช้งาน</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-[#141417] p-2.5 rounded-xl border border-[#26262e]">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">ชื่อ-นามสกุล</span>
                  <div className="font-extrabold text-[13px] sm:text-[14px] text-white truncate" title={displayBookerName}>
                    {displayBookerName}
                  </div>
                </div>

                <div className="bg-[#141417] p-2.5 rounded-xl border border-[#26262e]">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                    {isTeacherBooking ? "สถานะ / ตำแหน่ง" : "รหัสนักศึกษา"}
                  </span>
                  <div className="font-extrabold text-[13px] sm:text-[14px] text-white font-mono truncate">
                    {displayBookerId}
                  </div>
                </div>

                <div className="bg-[#141417] p-2.5 rounded-xl border border-[#26262e]">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">เบอร์โทรศัพท์ติดต่อ</span>
                  <div className="font-extrabold text-[13px] sm:text-[14px] text-white flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono">{displayPhone}</span>
                  </div>
                </div>

                <div className="bg-[#141417] p-2.5 rounded-xl border border-[#26262e]">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">อีเมลผู้แจ้งจอง</span>
                  <div className="font-extrabold text-[13px] sm:text-[14px] text-white flex items-center gap-1.5 truncate" title={displayEmail}>
                    <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{displayEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: วัตถุประสงค์การใช้งาน (Purpose of Booking) */}
            <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-slate-600/40 transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>วัตถุประสงค์การใช้งาน</span>
              </div>
              <div className="bg-[#141417] p-3 rounded-xl border border-[#26262e] min-h-[48px] flex items-center">
                <p className="font-bold text-[13px] sm:text-[14px] text-slate-200 leading-relaxed break-words w-full">
                  {cleanPurpose}
                </p>
              </div>
            </div>

            {/* Security & Verification Hint */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>การจองนี้ได้รับการยืนยันและคุ้มครองความปลอดภัยด้วยรหัส PIN 4 หลัก</span>
            </div>

          </div>

          {/* Modal Footer: Action Buttons */}
          <div className="p-4 sm:p-5 pt-3 border-t border-[#25252d] bg-[#17171c] flex flex-col sm:flex-row gap-2.5">
            {booking && onEditClick && (
              <button
                type="button"
                onClick={() => {
                  onEditClick(booking);
                }}
                className="flex-1 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 hover:text-orange-200 font-extrabold rounded-xl py-2.5 px-3 text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-orange-400" />
                <span>แก้ไข / ย้ายวันเวลา</span>
              </button>
            )}

            {booking && onDeleteClick && (
              <button
                type="button"
                onClick={() => {
                  onDeleteClick(booking);
                }}
                className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 hover:text-red-200 font-extrabold rounded-xl py-2.5 px-3 text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>ยกเลิกการจอง (ลบ)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center"
            >
              ปิด
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
