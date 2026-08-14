/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, BookOpen, User, Phone, FileText, Check, AlertCircle } from 'lucide-react';
import { RoomBooking, Course } from '../types';
import { DEFAULT_COURSES, getCourseLabel } from '../hooks/useData';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: RoomBooking | null;
  courses?: Course[];
  onSave: (id: string, updates: Partial<RoomBooking>) => Promise<void>;
  onAfterSaveSuccess?: (newRoom: string, newDate: string) => void;
}

const AVAILABLE_ROOMS = [
  "ห้องจัดรายการ 1",
  "ห้องจัดรายการ 2",
  "ห้องยูทูป 1",
  "ห้องยูทูป 2"
];

const STANDARD_TIMESLOTS = [
  { label: "08:30 - 09:30", value: "08:30 - 09:30" },
  { label: "09:30 - 10:30", value: "09:30 - 10:30" },
  { label: "10:30 - 11:30", value: "10:30 - 11:30" },
  { label: "11:30 - 12:30", value: "11:30 - 12:30" },
  { label: "13:00 - 14:00", value: "13:00 - 14:00" },
  { label: "14:00 - 15:00", value: "14:00 - 15:00" },
  { label: "15:00 - 16:00", value: "15:00 - 16:00" },
  { label: "16:00 - 17:00", value: "16:00 - 17:00" },
  { label: "08:30 - 12:30 (คาบเช้า)", value: "08:30 - 12:30" },
  { label: "13:00 - 17:00 (คาบบ่าย)", value: "13:00 - 17:00" },
  { label: "08:30 - 17:00 (เหมาทั้งวัน)", value: "08:30 - 17:00" }
];

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  courses = DEFAULT_COURSES,
  onSave,
  onAfterSaveSuccess
}) => {
  const [roomName, setRoomName] = useState<string>("ห้องจัดรายการ 1");
  const [date, setDate] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<string>("08:30 - 09:30");
  const [customTimeSlot, setCustomTimeSlot] = useState<string>("");
  const [isCustomSlot, setIsCustomSlot] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("BRS311");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [studentIdInput, setStudentIdInput] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Populate data whenever the booking to edit changes
  useEffect(() => {
    if (booking && isOpen) {
      setRoomName(booking.roomName || "ห้องจัดรายการ 1");
      setDate(booking.date || "");
      
      const normalizedSlot = (booking.timeSlot || "").replace(/\./g, ':').trim();
      const matchedSlot = STANDARD_TIMESLOTS.find(s => s.value === normalizedSlot || s.label.includes(normalizedSlot));
      
      if (matchedSlot) {
        setTimeSlot(matchedSlot.value);
        setIsCustomSlot(false);
        setCustomTimeSlot("");
      } else if (booking.timeSlot) {
        setTimeSlot(booking.timeSlot);
        setIsCustomSlot(true);
        setCustomTimeSlot(booking.timeSlot);
      } else {
        setTimeSlot("08:30 - 09:30");
        setIsCustomSlot(false);
      }

      // Course and subject extraction
      let subj = booking.subject || "";
      if (!subj && booking.purpose) {
        const match = booking.purpose.match(/^([A-Za-z]{2,4}\d{3,4})[\s:-]*(.*)$/);
        if (match) {
          subj = match[1].toUpperCase();
        } else {
          subj = booking.purpose;
        }
      }

      const foundCourse = courses.find(c => c.code === subj || subj.startsWith(c.code));
      if (foundCourse) {
        setSelectedCourse(foundCourse.code);
        setCustomSubject("");
      } else if (subj) {
        setSelectedCourse("OTHER");
        setCustomSubject(subj);
      } else {
        setSelectedCourse("BRS311");
        setCustomSubject("");
      }

      setStudentName(booking.studentNameInput || booking.studentName || "");
      setStudentIdInput(booking.studentIdInput || booking.studentId || "");
      setPhone(booking.phone || "");
      
      let cleanPurp = booking.bookingPurpose || booking.purpose || "";
      cleanPurp = cleanPurp.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/, '').trim();
      setPurpose(cleanPurp);
      setErrorMessage("");
    }
  }, [booking, isOpen, courses]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!date) {
      setErrorMessage("กรุณาเลือกวันที่ต้องการจอง");
      return;
    }

    const finalSlot = isCustomSlot ? customTimeSlot.trim() : timeSlot;
    if (!finalSlot) {
      setErrorMessage("กรุณาระบุช่วงเวลา");
      return;
    }

    let finalSubject = selectedCourse;
    if (selectedCourse === "OTHER") {
      finalSubject = customSubject.trim() || "วิชาทั่วไป / กิจกรรมพิเศษ";
    } else {
      const c = courses.find(item => item.code === selectedCourse);
      if (c) {
        finalSubject = `${c.code} - ${c.name}`;
      }
    }

    setSaving(true);
    try {
      const isTeacher = booking.userType === "TEACHER" || (booking.purpose && booking.purpose.includes("สำหรับการเรียนการสอนอาจารย์"));
      
      let compositePurpose = purpose.trim() || "จัดรายการ";
      if (isTeacher) {
        compositePurpose = `${finalSubject} (${compositePurpose}) (สำหรับการเรียนการสอนอาจารย์)`;
      } else {
        compositePurpose = `${finalSubject} (${compositePurpose})`;
      }

      const updates: Partial<RoomBooking> = {
        roomName,
        date,
        timeSlot: finalSlot,
        subject: finalSubject,
        bookingPurpose: purpose.trim() || "จัดรายการ",
        purpose: compositePurpose,
        studentName: studentName.trim() || booking.studentName,
        studentNameInput: studentName.trim(),
        studentIdInput: studentIdInput.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString()
      };

      await onSave(booking.id, updates);
      
      if (onAfterSaveSuccess) {
        onAfterSaveSuccess(roomName, date);
      }
      onClose();
    } catch (err: any) {
      console.error("Error updating booking:", err);
      const msg = err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง";
      setErrorMessage(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#18181a] border border-[#3f3f46] rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] cursor-default my-auto text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#3f3f46]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center text-lg">
                ✏️
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-100 font-display">
                  แก้ไข / ย้ายวันเวลาการจอง
                </h3>
                <p className="text-[11px] text-slate-400">
                  อัปเดตข้อมูลและย้ายช่องเวลาบนตารางทันที
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {/* 1. ห้องจัดรายการ */}
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                <span>🎙️</span> 1. เลือกห้องจัดรายการ
              </label>
              <select
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
              >
                {AVAILABLE_ROOMS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* 2. วันที่ต้องการจอง (Date) & 3. ช่วงเวลา (Timeslot) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" /> 2. วันที่ต้องการจอง
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" /> 3. ช่วงเวลา
                </label>
                <select
                  value={isCustomSlot ? "CUSTOM" : timeSlot}
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") {
                      setIsCustomSlot(true);
                    } else {
                      setIsCustomSlot(false);
                      setTimeSlot(e.target.value);
                    }
                  }}
                  className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                >
                  <optgroup label="ช่วงเวลารายชั่วโมง (1 ชั่วโมง)">
                    {STANDARD_TIMESLOTS.slice(0, 8).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="ช่วงเวลาแบบบล็อก / อาจารย์">
                    {STANDARD_TIMESLOTS.slice(8).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </optgroup>
                  <option value="CUSTOM">กำหนดเวลาเอง...</option>
                </select>
              </div>
            </div>

            {/* Custom Timeslot input if selected */}
            {isCustomSlot && (
              <div>
                <label className="text-xs font-semibold text-orange-300 block mb-1">
                  ระบุช่วงเวลาเอง (เช่น 09:00 - 11:00)
                </label>
                <input
                  type="text"
                  value={customTimeSlot}
                  onChange={(e) => setCustomTimeSlot(e.target.value)}
                  placeholder="เช่น 10:00 - 12:00"
                  className="w-full h-10 bg-[#27272a] border border-orange-500/50 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                  required
                />
              </div>
            )}

            {/* 4. รายวิชา (Course/Subject) */}
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" /> 4. รายวิชา
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
              >
                {courses.map(c => (
                  <option key={c.id || c.code} value={c.code}>
                    {getCourseLabel(c)}
                  </option>
                ))}
                <option value="OTHER">งานอื่นๆ / ระบุวิชาเอง...</option>
              </select>
              {selectedCourse === "OTHER" && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="ระบุชื่อวิชาหรือหัวข้อ..."
                  className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold mt-1.5"
                  required
                />
              )}
            </div>

            {/* 5. ข้อมูลผู้จอง (ชื่อ & รหัส & เบอร์โทร) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-orange-400" /> ชื่อ-นามสกุล ผู้จอง
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  รหัสนักศึกษา / รหัสอาจารย์
                </label>
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="รหัสนักศึกษา 10 หลัก"
                  className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>
            </div>

            {/* เบอร์โทรศัพท์ & วัตถุประสงค์ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-orange-400" /> เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08XXXXXXXX"
                  className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-orange-400" /> วัตถุประสงค์การใช้งาน
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="เช่น ฝึกจัดรายการสด, อัดพอดแคสต์"
                  className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-[#3f3f46]">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-[#27272a] hover:bg-[#323238] text-slate-300 font-bold rounded-xl py-2.5 text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold rounded-xl py-2.5 text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกการแก้ไข / ย้ายเวลา</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
