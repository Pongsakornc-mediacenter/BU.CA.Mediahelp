/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Tag,
  Eye,
  EyeOff
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
  readOnly?: boolean;
  currentUser?: any;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  data,
  onEditClick,
  onDeleteClick,
  courses = [],
  readOnly = false,
  currentUser
}) => {
  const [showPhone, setShowPhone] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setShowPhone(false);
    }
  }, [isOpen, data]);

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

  // Format Thai Date - Concise and short without long parentheses
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
      const thaiShortMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      const dayName = dayNames[dateObj.getDay()] || "";
      const shortMonth = thaiShortMonths[m] || "";
      return `${dayName} ${d} ${shortMonth} ${y}`;
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

  // Format masked phone number (064-***-****)
  const maskPhoneNumber = (phoneStr: string) => {
    if (!phoneStr || phoneStr === "-" || phoneStr === "ไม่ระบุ") return phoneStr;
    const clean = phoneStr.trim();
    const digits = clean.replace(/\D/g, '');
    if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-***-****`;
    }
    if (clean.length > 0) {
      return `${clean.slice(0, Math.min(3, clean.length))}-***-****`;
    }
    return '064-***-****';
  };

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

  // Booking Title (ชื่อรายการ)
  let displayBookingTitle = booking?.bookingTitle || "";
  if (!displayBookingTitle && booking?.purpose) {
    const headerMatch = booking.purpose.match(/หัวข้อ:\s*([^|)]+)/i);
    if (headerMatch) {
      displayBookingTitle = headerMatch[1].trim();
    } else {
      const parenMatch = booking.purpose.match(/\((.*?)\)/);
      if (parenMatch) {
        const cleanInside = parenMatch[1].replace(/วัตถุประสงค์:\s*[^|)]+/i, '').replace(/\|/g, '').trim();
        if (cleanInside) {
          displayBookingTitle = cleanInside;
        }
      }
    }
  }
  if (!displayBookingTitle && !isTeacherBooking) {
    // If not found, check data.subject / purpose
    const rawP = data.purpose || "";
    const headerMatch = rawP.match(/หัวข้อ:\s*([^|)]+)/i);
    if (headerMatch) {
      displayBookingTitle = headerMatch[1].trim();
    }
  }

  // Purpose Details
  let rawPurpose =
    booking?.bookingPurpose ||
    booking?.purpose ||
    data.purpose ||
    (isTeacherBooking ? "สำหรับการเรียนการสอนอาจารย์" : "จัดรายการส่งในรายวิชา");

  // Extract pure purpose if formatted with หัวข้อ/วัตถุประสงค์
  let cleanPurpose = rawPurpose;
  const purposeFieldMatch = rawPurpose.match(/วัตถุประสงค์:\s*([^|)]+)/i);
  if (purposeFieldMatch) {
    cleanPurpose = purposeFieldMatch[1].trim();
  } else {
    cleanPurpose = rawPurpose
      .replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '')
      .replace(/หัวข้อ:\s*[^|)]+/gi, '')
      .replace(/\|/g, '')
      .replace(/^[A-Za-z]{2,4}\s*\d{3,4}[\s:-]*/i, '')
      .replace(/^\((.*)\)$/, '$1')
      .trim();
  }

  if (!cleanPurpose) {
    cleanPurpose = isTeacherBooking ? "สำหรับการเรียนการสอนอาจารย์ในชั้นเรียน" : "จัดรายการในรายวิชา / ซ้อมจัดรายการ";
  }

  // Activity Timestamp Logic (submittedAt vs updatedAt)
  const submittedTime = booking?.submittedAt || booking?.createdAt || "";
  const updatedTime = booking?.updatedAt || "";

  let isEdited = false;
  if (updatedTime && submittedTime) {
    const diff = Math.abs(new Date(updatedTime).getTime() - new Date(submittedTime).getTime());
    if (diff > 3000) {
      isEdited = true;
    }
  }

  const latestActivityTimestamp = updatedTime || submittedTime || "";
  const timestampLabel = isEdited ? "แก้ไขล่าสุดเมื่อ" : "เวลาทำรายการล่าสุด";

  const formatTimestampDisplay = (isoStr?: string) => {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      const seconds = pad(d.getSeconds());
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} น.`;
    } catch {
      return isoStr;
    }
  };

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
          className="relative w-full max-w-6xl bg-[#141417] border border-[#2d2d34] rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-left flex flex-col my-auto overflow-hidden text-slate-100 cursor-default"
          id="booking_detail_modal_content"
        >
          {/* Modal Header (Clean Dark, No Yellow Border) */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#25252d] flex items-start justify-between gap-3 bg-[#18181d]">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-3.5 rounded-xl border ${roomConfig.bg} ${roomConfig.border} shrink-0`}>
                {roomConfig.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 
                    className="font-extrabold text-[20px] sm:text-[23px] text-white tracking-tight leading-tight truncate font-display"
                    style={{ color: '#ffffff' }}
                  >
                    รายละเอียดการจองห้อง
                  </h3>
                  {/* Booking Type Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 ${
                      isTeacherBooking
                        ? 'bg-purple-950/80 text-purple-200 border-purple-500/40 shadow-sm'
                        : 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40 shadow-sm'
                    }`}
                  >
                    {isTeacherBooking ? (
                      <>
                        <GraduationCap className="w-4 h-4 text-purple-300" />
                        <span style={{ color: '#e9d5ff' }}>คลาสเรียนอาจารย์</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-emerald-300" />
                        <span style={{ color: '#a7f3d0' }}>นักศึกษา / ทั่วไป</span>
                      </>
                    )}
                  </span>
                </div>
                <p 
                  className={`text-[14px] sm:text-[15px] font-bold mt-1 truncate ${roomConfig.text}`}
                >
                  {roomName}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              style={{ color: '#cbd5e1' }}
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: 60/40 Split Grid Layout + Bottom Full-Width Security Badge */}
          <div className="p-4 sm:p-6 sm:py-5 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

              {/* Left Column (~60% width) - Date & Time and Booker Info */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {/* Left Card 1: วันและเวลาการใช้งานห้อง */}
                <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#e2e8f0' }}>
                    <Calendar className="w-4.5 h-4.5 text-orange-400 shrink-0" />
                    <span style={{ color: '#ffffff' }}>วันและเวลาการใช้งานห้อง</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#141417] p-3.5 sm:p-4 rounded-xl border border-[#26262e] flex flex-col justify-center min-w-0">
                      <span className="text-sm font-semibold mb-1 block" style={{ color: '#94a3b8' }}>วันที่จองใช้งาน</span>
                      <div className="font-extrabold text-base sm:text-[17px] flex items-center gap-2 min-w-0" style={{ color: '#ffffff' }}>
                        <span className="text-orange-400 shrink-0 text-lg">📅</span>
                        <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#ffffff' }} title={displayDateText}>
                          {displayDateText}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#141417] p-3.5 sm:p-4 rounded-xl border border-[#26262e] flex flex-col justify-center min-w-0">
                      <span className="text-sm font-semibold mb-1 block" style={{ color: '#94a3b8' }}>ช่วงเวลาที่เลือก</span>
                      <div className="font-extrabold text-base sm:text-[17px] flex items-center gap-2 min-w-0" style={{ color: '#fde047' }}>
                        <Clock className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                        <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#fde047' }}>
                          {displayTimeSlot}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left Card 2: ข้อมูลผู้จองใช้งาน (4 ช่องย่อย) */}
                <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-4 sm:p-5 shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#e2e8f0' }}>
                    <User className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                    <span style={{ color: '#ffffff' }}>ข้อมูลผู้จองใช้งาน</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div className="bg-[#141417] p-3.5 sm:p-4 rounded-xl border border-[#26262e] flex flex-col justify-center min-w-0">
                      <span className="text-sm font-semibold block mb-1" style={{ color: '#94a3b8' }}>ชื่อ-นามสกุล</span>
                      <div className="font-extrabold text-base leading-snug break-words" style={{ color: '#ffffff' }}>
                        {displayBookerName}
                      </div>
                    </div>

                    <div className="bg-[#141417] p-3.5 sm:p-4 rounded-xl border border-[#26262e] flex flex-col justify-center min-w-0">
                      <span className="text-sm font-semibold block mb-1" style={{ color: '#94a3b8' }}>
                        {isTeacherBooking ? "สถานะ / ตำแหน่ง" : "รหัสนักศึกษา"}
                      </span>
                      <div className="font-extrabold text-base font-mono leading-snug break-words" style={{ color: '#ffffff' }}>
                        {displayBookerId}
                      </div>
                    </div>

                    <div className="bg-[#141417] p-3.5 sm:p-4 rounded-xl border border-[#26262e] flex flex-col justify-center min-w-0">
                      <span className="text-sm font-semibold block mb-1" style={{ color: '#94a3b8' }}>เบอร์โทรศัพท์ติดต่อ</span>
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="font-extrabold text-base flex items-center gap-2 min-w-0" style={{ color: '#ffffff' }}>
                          <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-mono whitespace-nowrap overflow-hidden text-ellipsis select-all" style={{ color: '#ffffff' }}>
                            {showPhone ? displayPhone : maskPhoneNumber(displayPhone)}
                          </span>
                        </div>
                        {displayPhone && displayPhone !== "-" && displayPhone !== "ไม่ระบุ" && (
                          <button
                            type="button"
                            onClick={() => setShowPhone(!showPhone)}
                            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                            title={showPhone ? "ซ่อนเบอร์โทรศัพท์" : "แสดงเบอร์โทรศัพท์"}
                          >
                            {showPhone ? (
                              <EyeOff className="w-4.5 h-4.5 text-emerald-400" />
                            ) : (
                              <Eye className="w-4.5 h-4.5 text-slate-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#141417] p-3.5 sm:p-4 rounded-xl border border-[#26262e] flex flex-col justify-center min-w-0">
                      <span className="text-sm font-semibold block mb-1" style={{ color: '#94a3b8' }}>อีเมลผู้จอง</span>
                      <div className="font-semibold text-base flex items-center gap-2 min-w-0" style={{ color: '#ffffff' }}>
                        <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="font-medium whitespace-nowrap overflow-x-auto select-all" style={{ color: '#ffffff' }} title={displayEmail}>
                          {displayEmail}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (~40% width) - 1. Course, 2. Booking Title, 3. Purpose */}
              <div className="lg:col-span-2 flex flex-col gap-3.5">
                {/* Right Card 1: รายวิชาเรียน (Course) */}
                <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-4 sm:p-4.5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-2.5" style={{ color: '#e2e8f0' }}>
                    <BookOpen className="w-4.5 h-4.5 text-sky-400 shrink-0" />
                    <span style={{ color: '#ffffff' }}>รายวิชาเรียน</span>
                  </div>
                  <div className="bg-[#141417] p-3 sm:p-3.5 rounded-xl border border-[#26262e] space-y-2">
                    <div>
                      <span className="text-xs sm:text-sm font-semibold block mb-1" style={{ color: '#94a3b8' }}>รหัสและชื่อรายวิชา</span>
                      <div className="font-extrabold text-base sm:text-[16px] leading-snug break-words text-sky-200" style={{ color: '#bae6fd' }}>
                        {fullCourseName}
                      </div>
                    </div>
                    {isTeacherBooking && (
                      <div className="pt-2 border-t border-[#26262e] flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold shrink-0" style={{ color: '#94a3b8' }}>อาจารย์ผู้สอน:</span>
                        <span className="text-sm sm:text-base font-bold" style={{ color: '#ffffff' }}>{instructorName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card 2: ชื่อรายการ (Booking Title) - Always shown or fallback for student */}
                {!isTeacherBooking && (
                  <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-4 sm:p-4.5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-2.5" style={{ color: '#e2e8f0' }}>
                      <FileText className="w-4.5 h-4.5 text-orange-400 shrink-0" />
                      <span style={{ color: '#ffffff' }}>ชื่อรายการ</span>
                    </div>
                    <div className="bg-[#141417] p-3 sm:p-3.5 rounded-xl border border-[#26262e]">
                      <span className="text-xs sm:text-sm font-semibold block mb-1" style={{ color: '#94a3b8' }}>หัวข้อ / ชื่อรายการที่จัด</span>
                      <div className="font-extrabold text-base sm:text-[16px] leading-snug break-words text-white" style={{ color: '#ffffff' }}>
                        {displayBookingTitle || "ไม่ระบุชื่อรายการ"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Card 3: วัตถุประสงค์การใช้งาน (Purpose) */}
                <div className="bg-[#1c1c22] border border-[#2b2b33] rounded-2xl p-4 sm:p-4.5 shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-2.5" style={{ color: '#e2e8f0' }}>
                    <FileText className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                    <span style={{ color: '#ffffff' }}>วัตถุประสงค์การใช้งาน</span>
                  </div>
                  <div className="bg-[#141417] p-3 sm:p-3.5 rounded-xl border border-[#26262e] flex-1 flex items-start">
                    <p className="font-semibold text-sm sm:text-base leading-relaxed break-words w-full" style={{ color: '#ffffff' }}>
                      {cleanPurpose}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Info Strip: Latest Activity Timestamp & Security Verification Badge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Activity Timestamp Badge */}
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-[#1c1c22] border border-[#2b2b33] text-sm shadow-sm min-w-0">
                <div className="flex items-center gap-2 text-slate-400 shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-xs sm:text-sm" style={{ color: '#94a3b8' }}>
                    {timestampLabel}:
                  </span>
                </div>
                <span className="font-mono font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: '#fde047' }}>
                  {formatTimestampDisplay(latestActivityTimestamp)}
                </span>
              </div>

              {/* Security & Verification Badge */}
              <div className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#1c1c22] border border-[#2b2b33] text-xs sm:text-sm text-center shadow-sm">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="font-medium" style={{ color: '#ffffff' }}>
                  การจองนี้ได้รับการยืนยันและคุ้มครองด้วยรหัส PIN 4 หลัก
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer: Action Buttons (Only shown when readOnly is false and action handlers exist) */}
          {!readOnly && booking && (onEditClick || onDeleteClick) && (
            <div className="p-4 sm:p-5 pt-3 border-t border-[#25252d] bg-[#17171c] flex flex-col sm:flex-row gap-2.5">
              {onEditClick && (
                <button
                  type="button"
                  onClick={() => {
                    onEditClick(booking);
                  }}
                  className="flex-1 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 font-extrabold rounded-xl py-3 px-4 text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                  style={{ color: '#fdba74' }}
                >
                  <Edit3 className="w-4.5 h-4.5 text-orange-400" />
                  <span style={{ color: '#fdba74' }}>แก้ไข / ย้ายวันเวลา</span>
                </button>
              )}

              {onDeleteClick && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteClick(booking);
                  }}
                  className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 font-extrabold rounded-xl py-3 px-4 text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                  style={{ color: '#fca5a5' }}
                >
                  <Trash2 className="w-4.5 h-4.5 text-red-400" />
                  <span style={{ color: '#fca5a5' }}>ยกเลิกการจอง</span>
                </button>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
