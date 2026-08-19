/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  Phone, 
  Mail, 
  KeyRound, 
  FileText, 
  AlertCircle, 
  Send, 
  GraduationCap,
  Users
} from 'lucide-react';
import { Course, RoomBooking } from '../types';
import { getCourseLabel, isTimeOverlapping, AVAILABLE_TIMESLOTS } from '../hooks/useData';

interface UnifiedBookingFormProps {
  courses: Course[];
  bookings: RoomBooking[];
  currentUser: any;
  onBookingSuccess: () => void;
  createBooking: (
    roomName: string, 
    date: string, 
    timeSlot: string, 
    purpose: string, 
    studentIdInput?: string, 
    phone?: string, 
    studentNameInput?: string,
    emailInput?: string,
    pinCodeInput?: string
  ) => Promise<{ success: boolean; message?: string }>;
  isSameDate: (dateA?: string, dateB?: string) => boolean;
  isSameRoom: (roomA?: string, roomB?: string) => boolean;
  selectedRoom?: string;
  onRoomChange?: (room: string) => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

const AVAILABLE_ROOMS = [
  { 
    name: "ห้องจัดรายการ 1", 
    icon: "🎙️", 
    color: "#ef8840", 
    textClass: "text-[#ef8840]",
    activeBg: "bg-[#ef8840]/20",
    activeBorder: "border-[#ef8840]",
    activeRing: "ring-2 ring-[#ef8840]/50",
    badgeBg: "bg-[#ef8840]"
  },
  { 
    name: "ห้องจัดรายการ 2", 
    icon: "🎧", 
    color: "#4a90e2", 
    textClass: "text-[#4a90e2]",
    activeBg: "bg-[#4a90e2]/20",
    activeBorder: "border-[#4a90e2]",
    activeRing: "ring-2 ring-[#4a90e2]/50",
    badgeBg: "bg-[#4a90e2]"
  },
  { 
    name: "ห้องยูทูป 1", 
    icon: "📹", 
    color: "#e33541", 
    textClass: "text-[#e33541]",
    activeBg: "bg-[#e33541]/20",
    activeBorder: "border-[#e33541]",
    activeRing: "ring-2 ring-[#e33541]/50",
    badgeBg: "bg-[#e33541]"
  },
  { 
    name: "ห้องยูทูป 2", 
    icon: "🎬", 
    color: "#9810fa", 
    textClass: "text-[#9810fa]",
    activeBg: "bg-[#9810fa]/20",
    activeBorder: "border-[#9810fa]",
    activeRing: "ring-2 ring-[#9810fa]/50",
    badgeBg: "bg-[#9810fa]"
  }
];

const TEACHER_SLOT_PRESETS = [
  { label: "คาบเช้า (08:30 - 12:30)", value: "08:30 - 12:30" },
  { label: "คาบบ่าย (13:00 - 17:00)", value: "13:00 - 17:00" },
  { label: "เหมาทั้งวัน (08:30 - 17:00)", value: "08:30 - 17:00" },
  { label: "08:30 - 09:30", value: "08:30 - 09:30" },
  { label: "09:30 - 10:30", value: "09:30 - 10:30" },
  { label: "10:30 - 11:30", value: "10:30 - 11:30" },
  { label: "11:30 - 12:30", value: "11:30 - 12:30" },
  { label: "13:00 - 14:00", value: "13:00 - 14:00" },
  { label: "14:00 - 15:00", value: "14:00 - 15:00" },
  { label: "15:00 - 16:00", value: "15:00 - 16:00" },
  { label: "16:00 - 17:00", value: "16:00 - 17:00" }
];

export const UnifiedBookingForm: React.FC<UnifiedBookingFormProps> = ({
  courses,
  bookings,
  currentUser,
  onBookingSuccess,
  createBooking,
  isSameDate,
  isSameRoom,
  selectedRoom,
  onRoomChange,
  selectedDate,
  onDateChange
}) => {
  // Mode switcher: 'student' | 'teacher'
  const [mode, setMode] = useState<'student' | 'teacher'>('student');

  // Today string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Form states - synchronized with props if provided
  const [room, setRoom] = useState<string>(() => selectedRoom || "ห้องจัดรายการ 1");
  const [date, setDate] = useState<string>(() => selectedDate || todayStr);
  const [timeSlot, setTimeSlot] = useState<string>("08:30 - 09:30");
  const [subject, setSubject] = useState<string>(courses[0]?.code || "BRS311");
  const [customSubject, setCustomSubject] = useState<string>("");

  // Student specific fields - ALL EMPTY DEFAULTS
  const [studentName, setStudentName] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [pinCode, setPinCode] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");

  // Teacher specific fields - ALL EMPTY DEFAULTS
  const [teacherName, setTeacherName] = useState<string>("");
  const [teacherEmail, setTeacherEmail] = useState<string>("");
  const [teacherNote, setTeacherNote] = useState<string>("");

  // Loading & error feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  // Synchronize room selection when selectedRoom prop changes
  useEffect(() => {
    if (selectedRoom && selectedRoom !== room) {
      setRoom(selectedRoom);
    }
  }, [selectedRoom]);

  // Synchronize date selection when selectedDate prop changes
  useEffect(() => {
    if (selectedDate && selectedDate !== date) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  // Handle Room Selection with Real-time synchronization
  const handleRoomSelect = (newRoom: string) => {
    setRoom(newRoom);
    if (onRoomChange) {
      onRoomChange(newRoom);
    }
  };

  // Handle Date Selection with Real-time synchronization
  const handleDateSelect = (newDate: string) => {
    setDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  // Real-time Conflict Detection Logic (isConflict)
  const conflictingBooking = useMemo(() => {
    if (!room || !date || !timeSlot || !bookings || bookings.length === 0) return null;

    return bookings.find(b => {
      if (!b || b.status === 'rejected') return false;
      if (!isSameRoom(b.roomName, room)) return false;
      if (!isSameDate(b.date, date)) return false;
      return isTimeOverlapping(b.timeSlot || '', timeSlot);
    }) || null;
  }, [bookings, room, date, timeSlot, isSameRoom, isSameDate]);

  const isConflict = Boolean(conflictingBooking);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Rule: "ห้ามเคลียร์ค่าในฟอร์ม ห้ามส่งอีเมล และห้ามรีเซ็ตหน้าจอเด็ดขาด เมื่อเวลาซ้ำ"
    if (isConflict) {
      setFormError("⚠️ ช่วงเวลานี้ถูกจองไว้แล้ว กรุณาเลือกช่วงเวลาหรือวันที่อื่น");
      return;
    }

    if (!room) {
      setFormError("กรุณาเลือกห้องจัดรายการ");
      return;
    }
    if (!date) {
      setFormError("กรุณาเลือกวันที่ต้องการจอง");
      return;
    }
    if (!timeSlot) {
      setFormError("กรุณาเลือกช่วงเวลา");
      return;
    }

    // Resolve course / subject
    let finalSubject = subject;
    if (subject === "OTHER") {
      finalSubject = customSubject.trim() || "วิชาทั่วไป / กิจกรรมพิเศษ";
    } else {
      const c = courses.find(item => item.code === subject);
      if (c) {
        finalSubject = `${c.code} - ${c.name}`;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'student') {
        if (!studentName.trim()) {
          setFormError("กรุณากรอกชื่อ-นามสกุล");
          setIsSubmitting(false);
          return;
        }
        if (!studentId.trim()) {
          setFormError("กรุณากรอกรหัสนักศึกษา");
          setIsSubmitting(false);
          return;
        }
        if (!email.trim()) {
          setFormError("กรุณากรอกอีเมลสำหรับรับการยืนยัน");
          setIsSubmitting(false);
          return;
        }
        if (!pinCode.trim() || pinCode.trim().length < 4) {
          setFormError("กรุณากำหนดรหัส PIN 4 หลัก (ตัวเลข)");
          setIsSubmitting(false);
          return;
        }

        const compositePurpose = purpose.trim()
          ? `${finalSubject} (${purpose.trim()})`
          : finalSubject;

        const res = await createBooking(
          room,
          date,
          timeSlot,
          compositePurpose,
          studentId.trim(),
          phone.trim() || "-",
          studentName.trim(),
          email.trim(),
          pinCode.trim()
        );

        if (!res.success) {
          setFormError(res.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Teacher mode
        if (!teacherName.trim()) {
          setFormError("กรุณากรอกชื่ออาจารย์ผู้สอน");
          setIsSubmitting(false);
          return;
        }
        if (!teacherEmail.trim()) {
          setFormError("กรุณากรอกอีเมลแจ้งเตือนของอาจารย์");
          setIsSubmitting(false);
          return;
        }

        const noteText = teacherNote.trim() || "สำหรับการเรียนการสอนอาจารย์";
        const compositePurpose = `${finalSubject} (${noteText}) (สำหรับการเรียนการสอนอาจารย์)`;

        const res = await createBooking(
          room,
          date,
          timeSlot,
          compositePurpose,
          "TEACHER",
          "-",
          teacherName.trim(),
          teacherEmail.trim(),
          "1234"
        );

        if (!res.success) {
          setFormError(res.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
          setIsSubmitting(false);
          return;
        }
      }

      // Trigger success popup animation
      onBookingSuccess();

      // ONLY RESET form values upon guaranteed successful booking
      setStudentName("");
      setStudentId("");
      setPhone("");
      setEmail("");
      setPinCode("");
      setPurpose("");
      setTeacherName("");
      setTeacherEmail("");
      setTeacherNote("");
      setCustomSubject("");
      setFormError("");
    } catch (err: any) {
      setFormError(err?.message || "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRoomTheme = useMemo(() => {
    return AVAILABLE_ROOMS.find(r => r.name === room) || AVAILABLE_ROOMS[0];
  }, [room]);

  return (
    <div id="unified-booking-form-container" className="bg-[#111115] border border-[#2d2d34] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 text-white relative">
      
      {/* 1. Header & Tab Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${currentRoomTheme.activeBg} ${currentRoomTheme.textClass} flex items-center justify-center border ${currentRoomTheme.activeBorder} shadow-sm transition-colors`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[20px] text-[#b8b8b8] tracking-tight">
                แบบฟอร์มการจองห้องจัดรายการ
              </h3>
              <p className="text-[11px] text-slate-400">
                ระบบส่วนกลางสำหรับนักศึกษาและคลาสเรียนอาจารย์
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-[#09090b] p-1 rounded-xl border border-[#27272a] shadow-inner gap-1 min-h-[45px] items-center">
          <button
            type="button"
            onClick={() => {
              setMode('student');
              setFormError("");
              if (timeSlot.startsWith("คาบ") || timeSlot.startsWith("เหมา")) {
                setTimeSlot("08:30 - 09:30");
              }
            }}
            className={`py-2 px-2.5 rounded-lg text-[15px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer h-full ${
              mode === 'student'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[15px]">👨‍🎓 จองสำหรับนักศึกษา/ทั่วไป</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('teacher');
              setFormError("");
              if (timeSlot === "08:30 - 09:30") {
                setTimeSlot("08:30 - 12:30");
              }
            }}
            className={`py-2 px-2.5 rounded-lg text-[15px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer h-full ${
              mode === 'teacher'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[15px]">👨‍🏫 จองสำหรับอาจารย์ (คลาสเรียน)</span>
          </button>
        </div>
      </div>

      {/* 2. Main Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        
        {/* Room Selection with distinctive color coding and real-time sync */}
        <div>
          <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1.5">
            <span>🎙️</span> เลือกห้องจัดรายการ <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {AVAILABLE_ROOMS.map((r) => {
              const isSelected = room === r.name;
              return (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => handleRoomSelect(r.name)}
                  className={`py-2 px-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? `${r.activeBg} ${r.activeBorder} ${r.textClass} shadow-md ${r.activeRing}`
                      : 'bg-[#16161a] border-[#27272a] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">{r.icon}</span>
                    <span className="truncate text-[15px]">{r.name}</span>
                  </div>
                  {isSelected && (
                    <span className={`w-2 h-2 rounded-full ${r.badgeBg} shadow-sm shrink-0`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Date Picker */}
          <div>
            <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
              <Calendar className="w-4 h-4 text-orange-400" />
              {mode === 'teacher' ? 'วันที่ต้องการสอน' : 'วันที่ต้องการจอง'} <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => handleDateSelect(e.target.value)}
              className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-orange-500 font-semibold"
              style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
            />
          </div>

          {/* Time Slot Picker with High Visibility Dropdown Styling */}
          <div>
            <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-orange-400" />
              {mode === 'teacher' ? 'ช่วงเวลา / คาบเรียน' : 'ช่วงเวลาที่ต้องการ'} <span className="text-red-400">*</span>
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-2.5 text-[14px] text-white focus:outline-none focus:border-orange-500 font-semibold cursor-pointer"
              style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
            >
              {mode === 'teacher' ? (
                TEACHER_SLOT_PRESETS.map((slot) => (
                  <option 
                    key={slot.value} 
                    value={slot.value} 
                    style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                    className="bg-[#1a1d24] text-white py-1"
                  >
                    {slot.label}
                  </option>
                ))
              ) : (
                AVAILABLE_TIMESLOTS.map((slot) => (
                  <option 
                    key={slot} 
                    value={slot} 
                    style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                    className="bg-[#1a1d24] text-white py-1"
                  >
                    {slot}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Subject / Course Selection with High Visibility Dropdown Styling */}
        <div>
          <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
            <BookOpen className="w-4 h-4 text-orange-400" />
            {mode === 'teacher' ? 'รายวิชาที่สอน / กลุ่มเรียน' : 'รายวิชาเรียน'} <span className="text-red-400">*</span>
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-2.5 text-[15px] text-white focus:outline-none focus:border-orange-500 font-semibold cursor-pointer"
            style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
          >
            {courses.map((c) => (
              <option 
                key={c.id} 
                value={c.code} 
                style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                className="bg-[#1a1d24] text-white py-1"
              >
                {getCourseLabel(c)}
              </option>
            ))}
          </select>
          {subject === "OTHER" && (
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder=""
              className="w-full h-9 mt-1.5 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-orange-500"
              style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
            />
          )}
        </div>

        {/* MODE: STUDENT FIELDS */}
        {mode === 'student' && (
          <>
            {/* Student Name & Student ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                  <User className="w-4 h-4 text-orange-400" />
                  ชื่อ-นามสกุล <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder=""
                  className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-orange-500 font-medium"
                  style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                />
              </div>

              <div>
                <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                  <span className="text-orange-400 text-sm">#</span>
                  รหัสนักศึกษา <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder=""
                  className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-orange-500 font-medium"
                  style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                />
              </div>
            </div>

            {/* Phone & PIN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                  <Phone className="w-4 h-4 text-orange-400" />
                  เบอร์โทรศัพท์ <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder=""
                  className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-orange-500 font-medium"
                  style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                />
              </div>

              <div>
                <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  รหัส PIN 4 หลัก <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder=""
                  className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-orange-500 font-mono tracking-widest text-center"
                  style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                <Mail className="w-4 h-4 text-orange-400" />
                อีเมลผู้แจ้งจอง (รับใบยืนยัน) <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-orange-500 font-medium"
                style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-orange-400" />
                วัตถุประสงค์การใช้งาน
              </label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder=""
                className="w-full bg-[#1a1d24] border border-[#2d2d34] rounded-xl p-2.5 text-[14px] text-white focus:outline-none focus:border-orange-500 font-medium resize-none"
                style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
              />
            </div>
          </>
        )}

        {/* MODE: TEACHER FIELDS */}
        {mode === 'teacher' && (
          <>
            {/* Teacher Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                  <User className="w-4 h-4 text-blue-400" />
                  ชื่ออาจารย์ผู้สอน <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder=""
                  className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-blue-500 font-medium"
                  style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                />
              </div>

              <div>
                <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                  <Mail className="w-4 h-4 text-blue-400" />
                  อีเมลแจ้งเตือน <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder=""
                  className="w-full h-9 bg-[#1a1d24] border border-[#2d2d34] rounded-xl px-3 text-[14px] text-white focus:outline-none focus:border-blue-500 font-medium"
                  style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
                />
              </div>
            </div>

            {/* Class Notes */}
            <div>
              <label className="text-[#b8b8b8] text-[14px] font-bold flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-blue-400" />
                หมายเหตุคลาสเรียน / วัตถุประสงค์
              </label>
              <textarea
                rows={2}
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder=""
                className="w-full bg-[#1a1d24] border border-[#2d2d34] rounded-xl p-2.5 text-[14px] text-white focus:outline-none focus:border-blue-500 font-medium resize-none"
                style={{ color: '#ffffff', backgroundColor: '#1a1d24' }}
              />
            </div>
          </>
        )}

        {/* 3. Conflict Warning Banner (Persistent Bright Red Alert Box) */}
        {isConflict && (
          <div 
            id="booking-conflict-alert-box"
            className="p-3 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-200 text-xs font-bold flex items-start gap-2.5 shadow-lg shadow-red-500/10 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-snug">
              <div className="text-red-300 font-extrabold text-[13px]">
                ⚠️ ไม่สามารถจองได้ เนื่องจากช่วงเวลานี้ถูกจองไว้แล้ว กรุณาเลือกช่วงเวลาอื่น
              </div>
              {conflictingBooking && (
                <div className="text-[11.5px] text-red-300/90 font-medium">
                  (ชนกับคิว: <span className="font-bold text-white">{conflictingBooking.subject || conflictingBooking.purpose}</span> • ผู้จอง: <span className="font-bold text-white">{conflictingBooking.studentName || conflictingBooking.studentIdInput || "มีผู้จองแล้ว"}</span> • เวลา: <span className="font-bold text-white">{conflictingBooking.timeSlot}</span>)
                </div>
              )}
            </div>
          </div>
        )}

        {/* General Form Error */}
        {formError && !isConflict && (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 4. Submit Button (Disabled and Grayed out on Conflict) */}
        <button
          type="submit"
          disabled={isConflict || isSubmitting}
          id="submit-unified-booking-btn"
          className={`w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            isConflict
              ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed shadow-none opacity-60 select-none"
              : mode === 'teacher'
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer active:scale-[0.99]"
                : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-600/30 cursor-pointer active:scale-[0.99]"
          }`}
        >
          {isSubmitting ? (
            <span>กำลังส่งข้อมูลคำขอ...</span>
          ) : isConflict ? (
            <span>⚠️ ช่วงเวลาซ้ำ (กรุณาเปลี่ยนเวลา)</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{mode === 'teacher' ? 'บันทึกการจองสำหรับคลาสเรียนอาจารย์' : 'ส่งคำขอจองห้องจัดรายการ'}</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
};
