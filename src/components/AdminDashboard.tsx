/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  Users, 
  Layers, 
  MessageSquareOff,
  ClipboardList,
  Calendar,
  FileSpreadsheet, 
  Camera, 
  Mic, 
  Lightbulb, 
  PenTool, 
  HelpCircle,
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  User,
  ExternalLink,
  MessageSquare,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Ticket, AttendanceRecord, HelpCategory, RoomBooking, BroadcastProgram, Course } from '../types';
import { AVAILABLE_STUDIO_ROOMS, AVAILABLE_TIMESLOTS, getCourseLabel } from '../hooks/useData';
import { DataSummaryDashboard } from './DataSummaryDashboard';
import { EditBookingModal } from './EditBookingModal';
import { DeleteBookingConfirmModal } from './DeleteBookingConfirmModal';
import { VerifyBookingPinModal } from './VerifyBookingPinModal';
import { UnifiedBookingForm } from './UnifiedBookingForm';
import { BookingDetailModal } from './BookingDetailModal';
import { SuccessNotificationModal, SuccessModalType } from './SuccessNotificationModal';

const getRoomTheme = (room: string) => {
  switch (room) {
    case "ห้องจัดรายการ 1":
      return {
        text: "text-[#ef8840]",
        bg: "bg-[#ef8840]",
        bgLight: "bg-[#ef8840]/10",
        bgHoverLight: "hover:bg-[#ef8840]/20",
        borderOutline: "border-[#ef8840]/60",
        borderLight: "border-[#ef8840]/20",
        cardBg: "bg-gradient-to-br from-[#251307] via-[#1c0f06] to-[#120a04] hover:from-[#2e1809] hover:to-[#221206]",
        cardBorder: "border-[#ef8840]/60 hover:border-[#ef8840]",
        cardGlow: "shadow-[0_0_12px_rgba(239,136,64,0.22)] ring-1 ring-orange-500/40",
        cardBar: "bg-gradient-to-b from-amber-300 via-[#ef8840] to-orange-600",
        cardSubject: "text-[#ef8840]",
        cardTitle: "text-amber-100/90",
        cardDivider: "bg-orange-500/25",
        cardFooter: "text-amber-300/85",
        cardBadge: "bg-orange-950/80 border border-orange-500/40 text-orange-200",
      };
    case "ห้องจัดรายการ 2":
      return {
        text: "text-[#4a90e2]",
        bg: "bg-[#4a90e2]",
        bgLight: "bg-[#4a90e2]/10",
        bgHoverLight: "hover:bg-[#4a90e2]/20",
        borderOutline: "border-[#4a90e2]/60",
        borderLight: "border-[#4a90e2]/20",
        cardBg: "bg-gradient-to-br from-[#0a182c] via-[#071223] to-[#050d18] hover:from-[#0f233f] hover:to-[#0b1b30]",
        cardBorder: "border-[#4a90e2]/60 hover:border-[#4a90e2]",
        cardGlow: "shadow-[0_0_12px_rgba(74,144,226,0.22)] ring-1 ring-blue-500/40",
        cardBar: "bg-gradient-to-b from-sky-300 via-[#4a90e2] to-blue-600",
        cardSubject: "text-[#4a90e2]",
        cardTitle: "text-sky-100/90",
        cardDivider: "bg-blue-500/25",
        cardFooter: "text-sky-300/85",
        cardBadge: "bg-blue-950/80 border border-blue-500/40 text-blue-200",
      };
    case "ห้องยูทูป 1":
      return {
        text: "text-[#e33541]",
        bg: "bg-[#e33541]",
        bgLight: "bg-[#e33541]/10",
        bgHoverLight: "hover:bg-[#e33541]/20",
        borderOutline: "border-[#e33541]/60",
        borderLight: "border-[#e33541]/20",
        cardBg: "bg-gradient-to-br from-[#280c16] via-[#1d0810] to-[#12050a] hover:from-[#330f1c] hover:to-[#240a13]",
        cardBorder: "border-[#e33541]/60 hover:border-[#e33541]",
        cardGlow: "shadow-[0_0_12px_rgba(227,53,65,0.22)] ring-1 ring-[#e33541]/40",
        cardBar: "bg-gradient-to-b from-rose-300 via-[#e33541] to-red-600",
        cardSubject: "text-[#e33541]",
        cardTitle: "text-rose-100/90",
        cardDivider: "bg-[#e33541]/25",
        cardFooter: "text-rose-300/85",
        cardBadge: "bg-rose-950/80 border border-[#e33541]/40 text-rose-200",
      };
    case "ห้องยูทูป 2":
      return {
        text: "text-[#9810fa]",
        bg: "bg-[#9810fa]",
        bgLight: "bg-[#9810fa]/10",
        bgHoverLight: "hover:bg-[#9810fa]/20",
        borderOutline: "border-[#9810fa]/60",
        borderLight: "border-[#9810fa]/20",
        cardBg: "bg-gradient-to-br from-[#24053d] via-[#170329] to-[#0c0117] hover:from-[#2e074e] hover:to-[#1e0433]",
        cardBorder: "border-[#9810fa]/60 hover:border-[#9810fa]",
        cardGlow: "shadow-[0_0_12px_rgba(152,16,250,0.25)] ring-1 ring-[#9810fa]/40",
        cardBar: "bg-gradient-to-b from-[#d896ff] via-[#9810fa] to-[#6705ab]",
        cardSubject: "text-[#b85eff]",
        cardTitle: "text-purple-100/90",
        cardDivider: "bg-[#9810fa]/25",
        cardFooter: "text-[#d896ff]/90",
        cardBadge: "bg-[#24053d]/90 border border-[#9810fa]/40 text-purple-200",
      };
    default:
      return {
        text: "text-[#ef8840]",
        bg: "bg-[#ef8840]",
        bgLight: "bg-[#ef8840]/10",
        bgHoverLight: "hover:bg-[#ef8840]/20",
        borderOutline: "border-[#ef8840]/60",
        borderLight: "border-[#ef8840]/20",
        cardBg: "bg-gradient-to-br from-[#251307] via-[#1c0f06] to-[#120a04] hover:from-[#2e1809] hover:to-[#221206]",
        cardBorder: "border-[#ef8840]/60 hover:border-[#ef8840]",
        cardGlow: "shadow-[0_0_12px_rgba(239,136,64,0.22)] ring-1 ring-orange-500/40",
        cardBar: "bg-gradient-to-b from-amber-300 via-[#ef8840] to-orange-600",
        cardSubject: "text-[#ef8840]",
        cardTitle: "text-amber-100/90",
        cardDivider: "bg-orange-500/25",
        cardFooter: "text-amber-300/85",
        cardBadge: "bg-orange-950/80 border border-orange-500/40 text-orange-200",
      };
  }
};

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return '-';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      }
      const [p1, p2, year] = parts;
      return `${p1.padStart(2, '0')}-${p2.padStart(2, '0')}-${year}`;
    }
  }
  return dateStr;
};

const formatTimestampDisplay = (ts?: string) => {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins} น.`;
  } catch {
    return ts;
  }
};

const getBookingRowData = (b: RoomBooking) => {
  const isTeacher =
    b.userType === 'teacher' ||
    b.studentId === 'TEACHER' ||
    b.studentIdInput === 'TEACHER' ||
    (b.purpose && b.purpose.includes('สำหรับการเรียนการสอนอาจารย์')) ||
    b.studentName === 'อาจารย์ผู้สอน' ||
    b.studentIdInput === 'อาจารย์ประจำวิชา';

  // 1. Booker Name
  let bookerName = b.studentName || b.studentNameInput || (isTeacher ? 'อาจารย์ผู้สอน' : '-');
  if (isTeacher && (!bookerName || bookerName === '-')) {
    bookerName = 'อาจารย์ผู้สอน';
  }

  // 2. Student / Teacher ID
  let idDisplay = b.studentIdInput || b.studentId || (isTeacher ? 'อาจารย์ประจำวิชา' : '-');
  if (isTeacher && (!idDisplay || idDisplay === '-')) {
    idDisplay = 'อาจารย์ประจำวิชา';
  }

  // 3. Subject / Course
  let subjectDisplay = b.subject || 'BRS311';
  subjectDisplay = subjectDisplay.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '').trim();

  // 4. Booking Title (ชื่อรายการ)
  let titleDisplay = b.bookingTitle ? b.bookingTitle.trim() : '';
  if (!titleDisplay && b.purpose) {
    const headerMatch = b.purpose.match(/หัวข้อ:\s*([^|)]+)/i);
    if (headerMatch) {
      titleDisplay = headerMatch[1].trim();
    } else {
      const parenMatch = b.purpose.match(/\((.*?)\)/);
      if (parenMatch) {
        const cleanInside = parenMatch[1].replace(/วัตถุประสงค์:\s*[^|)]+/i, '').replace(/\|/g, '').trim();
        if (cleanInside) {
          titleDisplay = cleanInside;
        }
      }
    }
  }

  if (isTeacher) {
    if (!titleDisplay || titleDisplay === 'จัดรายการ') {
      titleDisplay = 'สำหรับการเรียนการสอน';
    }
  } else {
    if (!titleDisplay) {
      titleDisplay = 'จัดรายการ';
    }
  }

  // 5. Purpose (วัตถุประสงค์)
  let purposeDisplay = b.bookingPurpose ? b.bookingPurpose.trim() : '';
  if (!purposeDisplay && b.purpose) {
    const purposeFieldMatch = b.purpose.match(/วัตถุประสงค์:\s*([^|)]+)/i);
    if (purposeFieldMatch) {
      purposeDisplay = purposeFieldMatch[1].trim();
    } else {
      purposeDisplay = b.purpose
        .replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '')
        .replace(/หัวข้อ:\s*[^|)]+/gi, '')
        .replace(/\|/g, '')
        .replace(/^[A-Za-z]{2,4}\s*\d{3,4}[\s:-]*/i, '')
        .replace(/^\((.*)\)$/, '$1')
        .trim();
    }
  }

  if (isTeacher) {
    if (!purposeDisplay) {
      purposeDisplay = 'สำหรับการเรียนการสอน';
    }
  } else {
    if (!purposeDisplay) {
      purposeDisplay = 'ฝึกปฏิบัติการจัดรายการ';
    }
  }

  return {
    isTeacher,
    bookerName,
    idDisplay,
    subjectDisplay,
    titleDisplay,
    purposeDisplay
  };
};

interface AdminDashboardProps {
  tickets: Ticket[];
  attendance: AttendanceRecord[];
  onSubmitReply: (ticketId: string, replyText: string) => Promise<void>;
  onDownloadReport: () => void;
  currentUserEmail: string;
  bookings: RoomBooking[];
  programs?: BroadcastProgram[];
  onUpdateBookingStatus?: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  onUpdateBooking?: (id: string, updates: Partial<RoomBooking>) => Promise<{ success: boolean; message?: string } | void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onCreateProgram?: (
    programName: string, 
    hosts: string, 
    category: 'radio' | 'tv' | 'podcast' | 'other', 
    roomName: string, 
    date: string, 
    timeSlot: string,
    subject?: string,
    purpose?: string,
    studentIdInput?: string,
    phone?: string
  ) => Promise<void>;
  onUpdateProgramStatus?: (id: string, status: 'upcoming' | 'active' | 'completed') => Promise<void>;
  onDeleteProgram?: (id: string) => Promise<void>;
  onCreateBooking?: (roomName: string, date: string, timeSlot: string, purpose: string, studentIdInput?: string, phone?: string, studentNameInput?: string, emailInput?: string, pinCodeInput?: string) => Promise<{ success: boolean; message?: string } | void>;
  roomImages?: { [key: string]: string | string[] };
  courses?: Course[];
  activeTabProp?: 'student_schedule' | 'summary' | 'tickets' | 'bookings';
  onTabChangeProp?: (tab: 'student_schedule' | 'summary' | 'tickets' | 'bookings') => void;
}

export default function AdminDashboard({
  tickets,
  attendance,
  onSubmitReply,
  onDownloadReport,
  currentUserEmail,
  bookings = [],
  programs = [],
  onUpdateBookingStatus,
  onUpdateBooking,
  onDeleteBooking,
  onCreateProgram,
  onUpdateProgramStatus,
  onDeleteProgram,
  onCreateBooking,
  roomImages = {},
  courses = [],
  activeTabProp,
  onTabChangeProp
}: AdminDashboardProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeTabState, setActiveTabState] = useState<'student_schedule' | 'summary' | 'tickets' | 'bookings'>('student_schedule');

  const activeTab = activeTabProp || activeTabState;

  const handleTabChange = (tab: 'student_schedule' | 'summary' | 'tickets' | 'bookings') => {

    setActiveTabState(tab);
    if (onTabChangeProp) {
      onTabChangeProp(tab);
    }
  };
  const [categoryFilter, setCategoryFilter] = useState<HelpCategory | 'all'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [draftStatus, setDraftStatus] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, 'approved' | 'rejected'>>({});

  // Student booking schedule states for the new teacher tab
  const [activeScheduleRoom, setActiveScheduleRoom] = useState<string>("ห้องจัดรายการ 1");
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Reset active image index when switching rooms
  useEffect(() => {
    setActiveImageIdx(0);
  }, [activeScheduleRoom]);

  const [scheduleBaseDate, setScheduleBaseDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [bookingRoom, setBookingRoom] = useState("ห้องจัดรายการ 1");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("08:30 - 09:30");
  const [bookingSubject, setBookingSubject] = useState("BRS311");
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [bookingStudentName, setBookingStudentName] = useState("");
  const [bookingStudentId, setBookingStudentId] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPinCode, setBookingPinCode] = useState("");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  const [successModalConfig, setSuccessModalConfig] = useState<{
    isOpen: boolean;
    type: SuccessModalType;
  }>({
    isOpen: false,
    type: 'booking'
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [myBookingFilter, setMyBookingFilter] = useState("");

  useEffect(() => {
    if (currentUserEmail) {
      setBookingEmail(prev => prev || currentUserEmail);
    }
  }, [currentUserEmail]);

  // Sync course selection with real-time courses from Firestore / useData
  useEffect(() => {
    if (courses && courses.length > 0) {
      const validCodes = courses.map(c => c.code || getCourseLabel(c));
      setBookingSubject(prev => {
        if (!prev || !validCodes.includes(prev)) {
          return validCodes[0] || "BRS311";
        }
        return prev;
      });

      const validTeacherLabels = courses.map(c => getCourseLabel(c));
      setTeacherSubject(prev => {
        if (!prev || !validTeacherLabels.includes(prev)) {
          return validTeacherLabels[0] || "BRS311 - การจัดรายการวิทยุกระจายเสียง";
        }
        return prev;
      });
    }
  }, [courses]);

  const myBookings = bookings.filter(b => {
    if (!b) return false;
    const filter = myBookingFilter.trim().toLowerCase();
    if (filter) {
      const idInput = (b.studentIdInput || "").toLowerCase();
      const stId = (b.studentId || "").toLowerCase();
      const name = (b.studentName || "").toLowerCase();
      const email = (b.studentEmail || "").toLowerCase();
      const phone = (b.phone || "").toLowerCase();
      const room = (b.roomName || "").toLowerCase();
      const subj = (b.subject || "").toLowerCase();
      const purp = (b.purpose || "").toLowerCase();
      return idInput.includes(filter) || stId.includes(filter) || name.includes(filter) || email.includes(filter) || phone.includes(filter) || room.includes(filter) || subj.includes(filter) || purp.includes(filter);
    }
    const currentStId = (bookingStudentId || "").trim().toLowerCase();
    const currentStName = (bookingStudentName || "").trim().toLowerCase();

    if (currentStId) {
      return (b.studentIdInput || "").toLowerCase().includes(currentStId) || (b.studentId || "").toLowerCase().includes(currentStId);
    }
    if (currentStName) {
      return (b.studentName || "").toLowerCase().includes(currentStName);
    }
    return true;
  });

  // Teacher Class Booking Modal States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [teacherRoom, setTeacherRoom] = useState<string>("ห้องจัดรายการ 1");
  const [teacherDate, setTeacherDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [teacherTimeSlot, setTeacherTimeSlot] = useState<string>("08:30 - 17:00");
  const [teacherSubject, setTeacherSubject] = useState<string>("BRS311 - การจัดรายการวิทยุกระจายเสียง");
  const [teacherName, setTeacherName] = useState<string>("");
  const [teacherEmail, setTeacherEmail] = useState<string>("");
  const [teacherPinCode, setTeacherPinCode] = useState<string>("1234");
  const [submittingTeacherBooking, setSubmittingTeacherBooking] = useState<boolean>(false);

  useEffect(() => {
    if (currentUserEmail && !teacherEmail) {
      setTeacherEmail(currentUserEmail);
    }
  }, [currentUserEmail]);

  const handleTeacherBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherSubject.trim()) {
      alert("กรุณาระบุรหัสวิชา / กลุ่มเรียน (Section)");
      return;
    }
    const finalEmail = teacherEmail.trim() || currentUserEmail || "pongsakorn.c@bu.ac.th";
    const finalPin = teacherPinCode.trim() || "1234";

    if (finalPin.length !== 4 || !/^\d{4}$/.test(finalPin)) {
      alert("⚠️ กรุณากำหนดรหัส PIN เป็นตัวเลข 4 หลัก (เช่น 1234)");
      return;
    }

    if (!onCreateBooking) return;
    setSubmittingTeacherBooking(true);
    try {
      const instructorName = teacherName.trim() || currentUserEmail.split('@')[0] || "อาจารย์ผู้สอน";
      await onCreateBooking(
        teacherRoom,
        teacherDate,
        teacherTimeSlot,
        `${teacherSubject.trim()} (สำหรับการเรียนการสอนอาจารย์)`,
        "TEACHER",
        "-",
        instructorName,
        finalEmail,
        finalPin
      );

      setIsTeacherModalOpen(false);
      setActiveScheduleRoom(teacherRoom);
      setScheduleBaseDate(teacherDate);
      setTeacherSubject("BRS311 - การจัดรายการวิทยุกระจายเสียง");
      setTeacherPinCode("1234");
      alert("🎓 บันทึกการจองห้องสำหรับอาจารย์สอนเรียบร้อยแล้ว! ข้อมูลปูเต็มช่วงเวลาในตารางทันที");
    } catch (err: any) {
      console.error("Teacher booking error:", err);
      alert(err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmittingTeacherBooking(false);
    }
  };

  const [selectedScheduleBookingModal, setSelectedScheduleBookingModal] = useState<{
    room: string;
    subject: string;
    slot: string;
    studentId: string;
    studentName?: string;
    phone: string;
    purpose: string;
    roomThemeText: string;
    booking?: RoomBooking;
  } | null>(null);

  // Edit / Delete Modals state
  const [bookingToEdit, setBookingToEdit] = useState<RoomBooking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [bookingToDelete, setBookingToDelete] = useState<RoomBooking | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // PIN Verification Modal State
  const [isVerifyPinModalOpen, setIsVerifyPinModalOpen] = useState<boolean>(false);
  const [pinActionType, setPinActionType] = useState<'edit' | 'delete'>('edit');
  const [targetBookingForPin, setTargetBookingForPin] = useState<RoomBooking | null>(null);

  // Helper to retrieve the week's dates (Monday to Saturday) based on a given date (YYYY-MM-DD)
  const getWeekDates = (dateStr: string) => {
    let baseDate = new Date();
    if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    const day = baseDate.getDay(); // 0 is Sun, 1 is Mon, etc.
    const diffToMon = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(baseDate);
    monday.setDate(diffToMon);

    const dayNames = ["จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];
    const dates: { dayName: string; dateStr: string; displayDate: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;
      
      const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const displayDate = `${d.getDate()} ${thaiMonths[d.getMonth()]}`;
      dates.push({
        dayName: dayNames[i],
        dateStr: dateString,
        displayDate
      });
    }
    return dates;
  };

  const findBookingForCell = (roomName: string, dateStr: string, slotStr: string) => {
    if (slotStr === "พักเที่ยง") return null;

    const parseHours = (s: string) => {
      if (!s) return null;
      const normalized = s.replace(/\./g, ':').trim();
      const match = normalized.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
      if (match) {
        const startMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        const endMin = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
        return { startMin, endMin };
      }
      return null;
    };

    const cellTime = parseHours(slotStr);
    if (!cellTime) return null;

    return bookings.find(b => {
      if (b.roomName !== roomName || b.date !== dateStr || b.status === 'rejected') {
        return false;
      }
      const bTime = parseHours(b.timeSlot);
      if (bTime) {
        // Match if the cell's timeslot is completely within or overlaps with the booking timeslot
        return Math.max(cellTime.startMin, bTime.startMin) < Math.min(cellTime.endMin, bTime.endMin);
      }
      const normalize = (str: string) => {
        let res = str.replace(/\./g, ':').trim();
        if (/^\d:/.test(res)) res = '0' + res;
        return res;
      };
      return normalize(b.timeSlot) === normalize(slotStr);
    });
  };

  const handleRoomBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      alert("กรุณาเลือกวันที่ต้องการจอง");
      return;
    }
    if (!bookingSubject.trim()) {
      alert("กรุณาระบุรายวิชา");
      return;
    }
    if (!bookingPurpose.trim()) {
      alert("กรุณาระบุวัตถุประสงค์");
      return;
    }
    if (!bookingStudentName.trim()) {
      alert("กรุณาระบุชื่อ-นามสกุล");
      return;
    }
    if (!bookingStudentId.trim()) {
      alert("กรุณาระบุรหัสนักศึกษา");
      return;
    }
    if (!bookingPhone.trim()) {
      alert("กรุณาระบุเบอร์โทร");
      return;
    }

    const finalEmail = bookingEmail.trim() || currentUserEmail || "";
    if (!finalEmail) {
      alert("⚠️ กรุณาระบุอีเมลผู้แจ้งจองเพื่อใช้สำหรับรับอีเมลยืนยันการจองและกู้คืน PIN");
      return;
    }

    const finalPin = bookingPinCode.trim();
    if (!finalPin || finalPin.length !== 4 || !/^\d{4}$/.test(finalPin)) {
      alert("⚠️ กรุณากำหนดรหัส PIN กลุ่มเป็นตัวเลข 4 หลัก (เช่น 1234) สำหรับยืนยันตัวตนตอนแก้ไขหรือลบการจอง");
      return;
    }

    try {
      const combinedPurpose = `${bookingSubject.trim()} (${bookingPurpose.trim()})`;
      if (onCreateBooking) {
        await onCreateBooking(
          bookingRoom, 
          bookingDate, 
          bookingSlot, 
          combinedPurpose, 
          bookingStudentId.trim(), 
          bookingPhone.trim(),
          bookingStudentName.trim(),
          finalEmail,
          finalPin
        );
        setIsBookingModalOpen(false);
        setBookingSubject("BRS311");
        setBookingPurpose("");
        setBookingStudentName("");
        setBookingStudentId("");
        setBookingPhone("");
        setBookingPinCode("");
        setSuccessModalConfig({ isOpen: true, type: 'booking' });
        setBookingSuccessMsg("🎉 ยืนยันการจองห้องจัดรายการเสร็จสิ้นเรียบร้อยแล้วค่ะ! ข้อมูลแสดงในตารางจัดรายการเรียบร้อยแล้ว");
        setTimeout(() => setBookingSuccessMsg(""), 6000);
      } else {
        alert("ระบบหลักไม่พร้อมใช้งานฟังก์ชันการจองในขณะนี้");
      }
    } catch (err: any) {
      console.error("Booking error details:", err);
      alert(err?.message || "เกิดข้อผิดพลาดในการยื่นระบบคำจอง");
    }
  };

  useEffect(() => {
    setOptimisticStatus(prev => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const b = bookings.find(x => x.id === id);
        if (b && b.status === next[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [bookings]);

  // Program Scheduling Admin Form States
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [newProgRoom, setNewProgRoom] = useState("ห้องจัดรายการ 1");
  const [newProgDate, setNewProgDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProgSlot, setNewProgSlot] = useState("08:30 - 09:30");
  const [newProgSubject, setNewProgSubject] = useState("");
  const [newProgPurpose, setNewProgPurpose] = useState("");
  const [newProgStudentId, setNewProgStudentId] = useState("");
  const [newProgPhone, setNewProgPhone] = useState("");
  const [newProgCategory, setNewProgCategory] = useState<'radio' | 'tv' | 'podcast' | 'other'>("radio");
  const [submittingProg, setSubmittingProg] = useState(false);

  // Find currently opened ticket
  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  // Lightbox Image Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handleProgramFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgDate) {
      alert("กรุณาเลือกวันที่ต้องการจัดรายการ");
      return;
    }
    if (!newProgSubject.trim()) {
      alert("กรุณาระบุรายวิชา");
      return;
    }
    if (!newProgPurpose.trim()) {
      alert("กรุณาระบุวัตถุประสงค์");
      return;
    }
    if (!newProgStudentId.trim()) {
      alert("กรุณาระบุรหัสนักศึกษา");
      return;
    }
    if (!newProgPhone.trim()) {
      alert("กรุณาระบุเบอร์โทร");
      return;
    }

    setSubmittingProg(true);
    try {
      await onCreateProgram(
        newProgSubject.trim(), 
        "ผู้จอง (รหัส: " + newProgStudentId.trim() + ")", 
        newProgCategory, 
        newProgRoom, 
        newProgDate, 
        newProgSlot,
        newProgSubject.trim(),
        newProgPurpose.trim(),
        newProgStudentId.trim(),
        newProgPhone.trim()
      );
      setNewProgSubject("");
      setNewProgPurpose("");
      setNewProgStudentId("");
      setNewProgPhone("");
      setIsAddingProgram(false);
      alert("➕ เพิ่มตารางจัดรายการใหม่เข้าระบบสำเร็จ!");
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถบันทึกตารางรายการได้");
    } finally {
      setSubmittingProg(false);
    }
  };

  const handleCreateSampleBooking = async () => {
    if (onCreateBooking) {
      try {
        await onCreateBooking(
          "ห้องจัดรายการ 2",
          "2026-06-13",
          "13:00 - 14:00",
          "CA102 อัดประเด็นบันทึกหัวข้อวิทยาศาสตร์เสียง",
          "1661234567",
          "089-876-5432"
        );
        alert("🎉 เพิ่มตัวอย่างคำขอจองห้องจัดรายการ 2 เรียบร้อยแล้วค่ะ!");
      } catch (err) {
        console.error(err);
        alert("ไม่สามารถเพิ่มรายการตัวอย่างได้");
      }
    } else {
      alert("ไม่พบฟังก์ชันส่งคำขอจอง โปรดติดตั้งในหน้าจอหลัก");
    }
  };

  // Statistics calculation for help categories
  const categoriesMap: Record<HelpCategory, { name: string; value: number; color: string }> = {
    camera: { name: 'กล้อง/เลนส์ (Camera)', value: 0, color: '#ef8840' },
    microphone: { name: 'เสียง/ไมค์ (Audio)', value: 0, color: '#52b788' },
    lighting: { name: 'การจัดแสง (Lighting)', value: 0, color: '#ffd166' },
    editing: { name: 'เทคนิคตัดต่อ (Editing)', value: 0, color: '#e053a1' },
    other: { name: 'อื่นๆ (Other)', value: 0, color: '#a5a5a5' }
  };

  tickets.forEach(ticket => {
    if (categoriesMap[ticket.category]) {
      categoriesMap[ticket.category].value += 1;
    }
  });

  const categoriesChartData = Object.values(categoriesMap).filter(c => c.value > 0);

  // Statistics calculation for tickets status
  const statusStats = [
    { name: 'รอการตอบกลับ', เคส: tickets.filter(t => t.status === 'pending' || t.status === 'inprogress').length, color: '#f59e0b' },
    { name: 'ตอบกลับแล้ว', เคส: tickets.filter(t => t.status === 'answered').length, color: '#6366f1' },
    { name: 'ปิดเคสถาวร', เคส: tickets.filter(t => t.status === 'closed').length, color: '#10b981' }
  ];

  // Calculate high level metrics
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => t.status === 'pending' || t.status === 'inprogress').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;
  const solvedTickets = tickets.filter(t => t.status === 'answered').length;
  const ratedTickets = tickets.filter(t => t.rating && t.rating > 0);
  const averageRating = ratedTickets.length > 0
    ? Math.round((ratedTickets.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTickets.length) * 10) / 10
    : 5.0;

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesStatus = ticketStatusFilter === 'all' || 
      (ticketStatusFilter === 'pending' && (ticket.status === 'pending' || ticket.status === 'inprogress')) ||
      (ticketStatusFilter === 'answered' && ticket.status === 'answered') ||
      (ticketStatusFilter === 'closed' && ticket.status === 'closed');
    return matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (category: HelpCategory) => {
    switch (category) {
      case 'camera': return <Camera className="w-4 h-4 text-indigo-600" />;
      case 'microphone': return <Mic className="w-4 h-4 text-emerald-600" />;
      case 'lighting': return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'editing': return <PenTool className="w-4 h-4 text-pink-500" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (category: HelpCategory) => {
    switch (category) {
      case 'camera': return 'กล้อง/เลนส์';
      case 'microphone': return 'ไมค์/ระบบเสียง';
      case 'lighting': return 'จัดแสงสตูดิโอ';
      case 'editing': return 'ตัดต่อ/ซอฟต์แวร์';
      default: return 'ข้อสอบถามทั่วไป';
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = replyText.trim();
    if (!selectedTicketId || !textToSend) return;

    // Reset input instantly like standard chat!
    setReplyText("");
    setReplyLoading(true);

    onSubmitReply(selectedTicketId, textToSend)
      .catch((error) => {
        console.error("Error sending response in background:", error);
      })
      .finally(() => {
        setReplyLoading(false);
      });
  };

  return (
    <div className="space-y-6" id="admin_dashboard_root">
      
      {/* Top Admin Segment Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs gap-1.5" id="admin_segment_tabs">
        <button
          type="button"
          onClick={() => handleTabChange('student_schedule')}
          className={`flex-1 h-10 px-4 text-sm sm:text-base font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'student_schedule'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-5 h-5 text-orange-500 shrink-0" />
          <span className="text-sm sm:text-base font-extrabold">📅 ตารางจองห้องจัดรายการ</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('summary')}
          className={`flex-1 h-10 px-4 text-sm sm:text-base font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <BarChart className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="text-sm sm:text-base font-extrabold">📊 สรุปข้อมูล & รายงานสถิติ</span>
        </button>
      </div>

      {activeTab === 'summary' && (
        <DataSummaryDashboard
          bookings={bookings}
          tickets={tickets}
          attendance={attendance}
          courses={courses}
          onDownloadReport={onDownloadReport}
          onBack={() => handleTabChange('student_schedule')}
        />
      )}

      {activeTab === 'tickets' && (
        <>
          {/* 2. Numeric Status Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats_numeric_cards">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-medium block">ขอความช่วยเหลือสะสม</span>
            <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{totalTickets} เคส</span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-medium block">รอการตอบกลับด่วน</span>
            <span className={`text-2xl font-bold mt-1 block font-display ${pendingTickets > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {pendingTickets} เคส
            </span>
          </div>
          <div className={`p-2.5 rounded-lg ${pendingTickets > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-medium block">ตอบแล้วและปิดเคสแล้ว</span>
            <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{closedTickets + solvedTickets} เคส</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-medium block">คะแนนความพึงพอใจเฉลี่ย</span>
            <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">★ {averageRating} / 5</span>
          </div>
          <div className="bg-amber-50 text-amber-500 p-2.5 rounded-lg">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* 3. Analytics Charts Section (Feature 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard_analytics_charts">
        {/* Support Ticket Status Breakdown Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 font-display">
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            สรุปสถานะเคสขอความช่วยเหลือ (Support Cases Status Breakdown)
          </h3>
          
          <div className="h-64">
            {tickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <MessageSquareOff className="w-8 h-8 mb-2 opacity-50" />
                ยังไม่มีข้อมูลเคสความช่วยเหลือในระบบขณะนี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="เคส" radius={[4, 4, 0, 0]}>
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Support Category Problems Pie */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 font-display">
            <Layers className="w-4 h-4 text-indigo-600" />
            สถิติหัวข้อที่นักศึกษาขอความช่วยเหลือบ่อยที่สุด (Issue Dist.)
          </h3>

          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
            {tickets.length === 0 ? (
              <div className="text-slate-400 text-xs flex flex-col items-center justify-center h-full w-full">
                <MessageSquareOff className="w-8 h-8 mb-2 opacity-50" />
                ยังไม่มีการส่งข้อความขอความช่วยเหลือ
              </div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriesChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoriesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  {Object.values(categoriesMap).map((cat, idx) => {
                    if (cat.value === 0) return null;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                          <span className="text-slate-600 font-medium">{cat.name.split(' (')[0]}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                          {cat.value} เคส
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Split Layout: List on Left (5 Cols), Selective Detail on Right (7 Cols - Discord style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="tickets_chat_layout">
        
        {/* Tickets Feed Panel - 5 Cols */}
        <div className="col-span-1 lg:col-span-5 flex flex-col bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-[540px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                ตั๋วขอความเข้าช่วยเหลือทั้งหมด ({filteredTickets.length})
              </h3>
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1">
              <button
                type="button"
                onClick={() => setTicketStatusFilter('all')}
                className={`text-[10px] px-2 py-1 rounded-full font-bold transition-all ${
                  ticketStatusFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setTicketStatusFilter('pending')}
                className={`text-[10px] px-2 py-1 rounded-full font-bold transition-all ${
                  ticketStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                ยังไม่ตอบ
              </button>
              <button
                type="button"
                onClick={() => setTicketStatusFilter('answered')}
                className={`text-[10px] px-2 py-1 rounded-full font-bold transition-all ${
                  ticketStatusFilter === 'answered'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                เสร็จสิ้นแล้ว
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-55 select-none">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                <MessageSquareOff className="w-12 h-12 mb-2 line opacity-40" />
                <span>ไม่พบรายการหัวข้อขอความช่วยเหลือที่ระบุ</span>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicketId === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    id={`admin_ticket_item_${ticket.id}`}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setReplyText("");
                    }}
                    className={`p-4 text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-50/65 border-l-4 border-indigo-600' 
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-[10px] bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 font-bold flex items-center gap-1">
                        {getCategoryIcon(ticket.category)}
                        {getCategoryLabel(ticket.category)}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        ticket.status === 'pending' || ticket.status === 'inprogress'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : ticket.status === 'answered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ticket.status === 'pending' || ticket.status === 'inprogress' ? 'รอความช่วยเหลือ' : ticket.status === 'answered' ? 'ตอบแล้ว' : 'ปิดเคส'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-xs line-clamp-1 truncate">{ticket.title}</h4>
                    <p className="text-slate-500 text-[11px] line-clamp-2 mt-1 leading-snug">{ticket.description}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                      <span className="font-semibold text-slate-600 truncate max-w-[120px]">{ticket.studentName}</span>
                      <span className="font-mono">{new Date(ticket.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Discord thread selective answering - 7 Cols */}
        <div className="col-span-1 lg:col-span-7 flex flex-col bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-[540px]">
          {activeTicket ? (
            <div className="flex flex-col h-full">
              {/* Selective Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">ประเภท: {getCategoryLabel(activeTicket.category)}</span>
                  <h3 className="font-bold text-slate-800 text-sm mt-0.5">{activeTicket.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{activeTicket.studentName}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{activeTicket.studentEmail}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono text-right shrink-0">
                  <span>{new Date(activeTicket.createdAt).toLocaleString('th-TH')}</span>
                </div>
              </div>

              {/* Chat Thread Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {(!activeTicket.messages || activeTicket.messages.length === 0) ? (
                  <>
                    {/* Fallback backward compatibility */}
                    {/* 1. Student Question Box */}
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 font-bold text-xs text-slate-600">
                        ST
                      </div>
                      <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-none p-3.5 shadow-sm text-xs leading-relaxed">
                        <p className="font-medium whitespace-pre-wrap">{activeTicket.description}</p>
                        
                        {/* Embedded payload Images (Up to 5 images supported) */}
                        {((activeTicket.imageUrls && activeTicket.imageUrls.length > 0) || activeTicket.imageUrl) && (
                          <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              {(activeTicket.imageUrls && activeTicket.imageUrls.length > 0 ? activeTicket.imageUrls : [activeTicket.imageUrl]).filter(Boolean).map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                                  <img 
                                    src={imgUrl} 
                                    alt={`Student Attachment ${imgIdx + 1}`} 
                                    referrerPolicy="no-referrer"
                                    className="max-h-60 object-contain w-full cursor-zoom-in"
                                    onClick={() => setPreviewImageUrl(imgUrl)}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="p-1.5 bg-slate-50 rounded-md text-[10px] text-slate-500 text-center font-mono border border-slate-100">
                              📷 ภาพถ่ายอุปกรณ์พัง/ขัดข้อง ({activeTicket.imageUrls?.length || 1} รูป)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Admin Reply Box (If already has answer) */}
                    {activeTicket.replyText && (
                      <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
                          AD
                        </div>
                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-sm text-xs leading-relaxed text-left">
                          <span className="text-[10px] text-indigo-200 font-semibold block mb-1">อาจารย์ผู้ดูแลตอบกลับ:</span>
                          <p className="whitespace-pre-wrap">{activeTicket.replyText}</p>
                          <span className="text-[9px] text-indigo-200 block text-right mt-1.5 font-mono">
                            โดย {activeTicket.repliedBy} • {new Date(activeTicket.repliedAt || '').toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  activeTicket.messages.map((msg, idx) => {
                    const isMe = msg.senderRole === 'admin';
                    return (
                      <div key={msg.id || idx} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 border border-slate-200 text-slate-600'
                        }`}>
                          {isMe ? 'AD' : 'ST'}
                        </div>
                        <div className={`rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none text-left' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        }`}>
                          <span className={`text-[10px] font-semibold block mb-1 ${
                            isMe ? 'text-indigo-200' : 'text-slate-500'
                          }`}>
                            {msg.senderName} ({msg.senderRole === 'admin' ? 'ผู้สอน' : 'นักศึกษา'}):
                          </span>
                          <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                          
                          {/* If first message of student and there is an attachment image, render it */}
                          {!isMe && idx === 0 && ((activeTicket.imageUrls && activeTicket.imageUrls.length > 0) || activeTicket.imageUrl) && (
                            <div className="mt-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                {(activeTicket.imageUrls && activeTicket.imageUrls.length > 0 ? activeTicket.imageUrls : [activeTicket.imageUrl]).filter(Boolean).map((imgUrl, imgIdx) => (
                                  <div key={imgIdx} className="rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                                    <img 
                                      src={imgUrl} 
                                      alt={`Student Attachment ${imgIdx + 1}`} 
                                      referrerPolicy="no-referrer"
                                      className="max-h-60 object-contain w-full cursor-zoom-in"
                                      onClick={() => setPreviewImageUrl(imgUrl)}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="p-1.5 bg-slate-50 text-[10px] text-slate-500 text-center font-mono border-t border-slate-100">
                                📷 ภาพประกอบปัญหาจากอุปกรณ์ของนักศึกษา ({activeTicket.imageUrls?.length || 1} รูป)
                              </div>
                            </div>
                          )}

                          <span className={`text-[8px] block text-right mt-1.5 font-mono ${
                            isMe ? 'text-indigo-300' : 'text-slate-400'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* 3. Rating Review Box */}
                {activeTicket.rating && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 max-w-md mx-auto text-center text-xs space-y-1.5">
                    <div className="flex justify-center text-amber-500 font-bold text-sm">
                      {"★".repeat(activeTicket.rating)}
                      {"☆".repeat(5 - activeTicket.rating)}
                      <span className="ml-1.5 text-slate-700 font-bold text-xs">({activeTicket.rating} คะแนน)</span>
                    </div>
                    <p className="text-slate-600 italic">" {activeTicket.ratingFeedback || 'นักศึกษาไม่ได้พิมพ์ความคิดเห็นเพิ่มเติม'} "</p>
                    <span className="text-[10px] text-slate-400 block font-mono">ปิดตั๋วคำร้องขอความช่วยเหลือเสร็จสิ้นสมบูรณ์</span>
                  </div>
                )}

              </div>

              {/* Chat Text Input Form */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/75">
                {activeTicket.status === 'closed' ? (
                  <div className="bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-3 text-center text-xs font-semibold">
                    🔒 เคสนี้ได้รับการแก้ไขและให้คะแนนความพึงพอใจปิดระบบแล้ว
                  </div>
                ) : (
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      placeholder="พิมพ์ข้อความตอบกลับเพื่อส่งถึงนักศึกษา..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span>ส่งคำตอบ</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
                <span className="text-[10px] text-slate-400 block mt-1.5 pl-1">
                  💡 เมื่ออัปลิ้งค์ตอบกลับ ระบบของนักศึกษาจะสั่นหรือเด้งป๊อปอัปแจ้งเตือนผลแสดงหน้าจอทันที
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageSquareOff className="w-16 h-16 text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">ยังไม่ได้เลือกหัวข้อ</h4>
              <p className="text-[11px] text-center mt-1 text-slate-500 max-w-xs font-medium">
                กรุณาคลิกเลือกหัวข้อคำถามจากรายการซ้ายมือเพื่อตรวจสอบภาพกล้องเเละให้ความช่วยเหลือแบบเรียลไทม์
              </p>
            </div>
          )}
        </div>
      </div>
      </>
    )}

    {activeTab === 'bookings' && (
      <div className="space-y-6 animate-fade-in" id="bookings_broadcasts_admin_tabs">
        
        {/* UPPER: Studio Rooms Bookings Approval Board */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 font-display">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                ตารางประวัติและรายการจองห้องจัดรายการ
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                ระบบบันทึกและจัดการประวัติการจองห้องปฏิบัติการมีเดียเซ็นเตอร์
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateSampleBooking}
                className="bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 hover:text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                📥 ขอตัวอย่าง จองห้องจัดรายการ 2 (1 รายการ)
              </button>
              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs text-slate-700">
                <span>จำนวนการจองทั้งหมด: {bookings.length} รายการ</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <BookOpen className="w-10 h-10 text-slate-200" />
                <p className="font-bold text-slate-700">ไม่มีสถิติคำขอจองห้องในขณะนี้</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1020px]">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-600 font-bold bg-slate-50/80">
                    <th className="py-3 px-3 font-display w-[13%] min-w-[140px]" style={{ fontSize: '15px' }}>ชื่อผู้จอง</th>
                    <th className="py-3 px-3 font-display w-[12%] min-w-[120px]" style={{ fontSize: '15px' }}>รหัสนักศึกษา / รหัสอาจารย์</th>
                    <th className="py-3 px-3 font-display w-[22%] min-w-[220px]" style={{ fontSize: '15px' }}>รายวิชา</th>
                    <th className="py-3 px-3 font-display w-[13%] min-w-[125px]" style={{ fontSize: '15px' }}>ชื่อรายการ</th>
                    <th className="py-3 px-3 font-display w-[18%] min-w-[160px]" style={{ fontSize: '15px' }}>วัตถุประสงค์</th>
                    <th className="py-3 px-3 font-display w-[12%] min-w-[130px]" style={{ fontSize: '15px' }}>วันที่และเวลา</th>
                    <th className="py-3 px-3 font-display w-[10%] min-w-[110px]" style={{ fontSize: '15px' }}>เวลาทำรายการล่าสุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {bookings.map((booking) => {
                    const info = getBookingRowData(booking);
                    const theme = getRoomTheme(booking.roomName);
                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800 text-sm whitespace-normal break-words leading-snug" title={info.bookerName}>
                            {info.bookerName}
                          </div>
                          {booking.studentEmail && (
                            <div className="text-[13px] text-slate-400 font-mono mt-0.5 whitespace-normal break-all leading-tight" title={booking.studentEmail}>
                              {booking.studentEmail}
                            </div>
                          )}
                          {booking.phone && (
                            <div className="text-[12px] text-indigo-600 font-semibold mt-0.5 font-mono">
                              📞 {booking.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          <span className={info.isTeacher ? "bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-sm inline-block" : "text-sm"}>
                            {info.idDisplay}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-indigo-600">
                          <div className="text-sm font-semibold whitespace-normal break-words leading-snug" title={info.subjectDisplay}>
                            {info.subjectDisplay}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.titleDisplay}>
                            {info.titleDisplay}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          <div className="text-sm font-medium text-slate-600 whitespace-normal break-words leading-snug" title={info.purposeDisplay}>
                            {info.purposeDisplay}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${theme.bgLight} ${theme.text} border ${theme.borderLight}`}>
                              {booking.roomName}
                            </span>
                          </div>
                          <div className="font-mono text-slate-800 font-semibold whitespace-nowrap text-sm">
                            {formatDateDisplay(booking.date)}
                          </div>
                          <div className="text-[13px] text-slate-500 font-mono mt-0.5">
                            {booking.timeSlot}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 font-medium text-sm whitespace-nowrap">
                          {formatTimestampDisplay(booking.updatedAt || booking.submittedAt || booking.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* LOWER: Station Broadcast Programming Board */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-50 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 font-display">
                <Users className="w-5 h-5 text-emerald-600" />
                ตารางจัดรายการโทรทัศน์-วิทยุสถานี CO-CA FM/TV
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                กำกับกำหนดปฏิทินแสดงรายการ ควบคุมจังหวะออกอากาศแบบสดๆ ในรูปอัพเดตสถานะ (เตรียมตัว - ออนแอร์พรีวิว - เสร็จรายการ)
              </p>
            </div>
            {!isAddingProgram ? (
              <button
                type="button"
                onClick={() => setIsAddingProgram(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มตารางจัดรายการ (Add Schedule)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingProgram(false)}
                className="text-slate-500 hover:text-slate-700 text-xs font-bold"
              >
                ✕ ปิดฟอร์มร่าง
              </button>
            )}
          </div>

          {isAddingProgram && (
            <form onSubmit={handleProgramFormSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                📌 แบบร่างลงทะเบียนจัดรายการ (ข้อมูลเทียบเท่าแบบฟอร์มจองของนักศึกษา)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">1. เลือกห้องจัดรายการ</label>
                  <select
                    value={newProgRoom}
                    onChange={(e) => setNewProgRoom(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                  >
                    <option value="ห้องจัดรายการ 1">ห้องจัดรายการ 1</option>
                    <option value="ห้องจัดรายการ 2">ห้องจัดรายการ 2</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">2. วันที่จัดรายการ (Date)</label>
                  <input
                    type="date"
                    value={newProgDate}
                    onChange={(e) => setNewProgDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">3. ช่วงเวลา (Timeslot Grid)</label>
                  <select
                    value={newProgSlot}
                    onChange={(e) => setNewProgSlot(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                  >
                    <option value="08:30 - 09:30">08:30 - 09:30</option>
                    <option value="09:30 - 10:30">09:30 - 10:30</option>
                    <option value="10:30 - 11:30">10:30 - 11:30</option>
                    <option value="11:30 - 12:30">11:30 - 12:30</option>
                    <option value="13:00 - 14:00">13:00 - 14:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                    <option value="15:00 - 16:00">15:00 - 16:00</option>
                    <option value="16:00 - 17:00">16:00 - 17:00</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">4. รายวิชา (Subject / Program Theme)</label>
                  <input
                    type="text"
                    value={newProgSubject}
                    onChange={(e) => setNewProgSubject(e.target.value)}
                    placeholder="เช่น CA102 การผลิตรายการวิทยุ"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
                <div className="md:col-span-7">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">วัตถุประสงค์ (Purpose)</label>
                  <input
                    type="text"
                    value={newProgPurpose}
                    onChange={(e) => setNewProgPurpose(e.target.value)}
                    placeholder="ระบุวัตถุประสงค์การใช้ห้อง เช่น ฝึกหัดจัดรายการสด / อัดผลงานวิชาเรียน"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">5. รหัสนักศึกษา (Student ID)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={newProgStudentId}
                    onChange={(e) => setNewProgStudentId(e.target.value)}
                    placeholder="ระบุรหัสนักศึกษา 10 หลัก"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">6. เบอร์โทรติดต่อ (Phone)</label>
                  <input
                    type="tel"
                    maxLength={12}
                    value={newProgPhone}
                    onChange={(e) => setNewProgPhone(e.target.value)}
                    placeholder="เบอร์โทรศัพท์ติดต่อ เช่น 089xxxxxxx"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingProgram(false)}
                  className="bg-white border border-slate-200 text-slate-600 text-xs px-4 py-2 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingProg}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm"
                >
                  {submittingProg ? 'กำลังเพิ่มบันทึก...' : '💾 บันทึกเวลาจัดรายการ'}
                </button>
              </div>
            </form>
          )}

          {/* Programs Admin Console List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <div 
                key={program.id}
                className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 bg-slate-50/20 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-[9px] ${
                      program.category === 'radio'
                        ? 'bg-amber-100 text-amber-800'
                        : program.category === 'tv'
                        ? 'bg-indigo-100 text-indigo-800'
                        : program.category === 'podcast'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {program.category.toUpperCase()}
                    </span>
                    
                    {program.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] shadow-sm animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping"></span>
                        🔴 LIVE / ON-AIR!
                      </span>
                    ) : program.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-500 shadow-sm">
                        ✓ เสร็จรายการ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#f59e0b] shadow-sm">
                        ⏳ เตรียมตัว
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-850 text-xs font-display">
                      {program.subject ? program.subject : program.programName}
                    </h4>
                    {program.purpose && (
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        วัตถุประสงค์: <span className="font-semibold text-slate-700">{program.purpose}</span>
                      </p>
                    )}
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      ผู้จัด/พิธีกร: <span className="font-semibold text-slate-800">{program.hosts}</span>
                      {program.studentIdInput && ` • รหัสนักศึกษา: ${program.studentIdInput}`}
                    </p>
                    {program.phone && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        เบอร์โทร: <span className="font-semibold text-slate-600">{program.phone}</span>
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                      📍 {program.roomName} • 📅 {program.date} ({program.timeSlot})
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateProgramStatus(program.id, 'upcoming')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                        program.status === 'upcoming'
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200'
                      }`}
                    >
                      เตรียมตัว
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateProgramStatus(program.id, 'active')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                        program.status === 'active'
                          ? 'bg-rose-600 text-white border-rose-605'
                          : 'bg-white hover:bg-rose-50 text-rose-650 border-rose-200'
                      }`}
                    >
                      LIVE ON-AIR
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateProgramStatus(program.id, 'completed')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                        program.status === 'completed'
                          ? 'bg-slate-400 text-white border-slate-400'
                          : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200'
                      }`}
                    >
                      เสร็จสิ้น
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("คุณแน่ใจว่าต้องการลบกำหนดรายการออกอากาศนี้ทิ้ง?")) {
                        onDeleteProgram(program.id);
                      }
                    }}
                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-red-650 rounded-lg border border-slate-100 transition-colors"
                    title="ลบตารางออกอากาศ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {programs.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-10 bg-slate-50 border border-dashed rounded-xl border-slate-200 text-slate-450 text-xs">
                ไม่มีกำหนดการออกอากาศทางสื่อโทรทัศน์หรือวิทยุในส่วนนี้ขณะนี้
              </div>
            )}
          </div>
        </div>

      </div>
    )}

    {activeTab === 'student_schedule' && (
      <div className="space-y-3 animate-fade-in text-white" id="student_booking_schedule_tab">
        {/* Submitting Success feedback banner */}
        {bookingSuccessMsg && (
          <div className="bg-emerald-500/15 text-emerald-400 text-xs font-bold p-3 rounded-xl border border-emerald-500/20 animate-pulse">
            {bookingSuccessMsg}
          </div>
        )}

        {/* Centered Dark Header Section with Room selectors */}
        <div className="bg-[#111115] border border-[#2d2d34] p-3.5 sm:p-5 rounded-[20px] shadow-2xl text-center space-y-4 relative mb-8 pb-2" style={{ marginBottom: '32px' }}>
          <div className="space-y-2">
            <div className="text-center space-y-1">
              <h4 className={`text-[20px] font-extrabold ${getRoomTheme(activeScheduleRoom).text} tracking-tight font-display flex items-center justify-center gap-1.5`}>
                📅 ตารางห้องจัดรายการ MEDIA CENTER
              </h4>
              <p className="text-slate-400 text-[13px] max-w-xl mx-auto leading-tight">
                กรุณาตรวจสอบตารางการจองด้านล่างเพื่อตรวจสอบคิวที่ว่างก่อนกรอกแบบฟอร์มจองห้องจัดรายการต่อ
              </p>
            </div>

            {/* Room selectors (tabs like in the user's Excel mockup) */}
            <div className="flex max-w-2xl mx-auto bg-[#0a0a0c] border border-[#2d2d34] rounded-xl overflow-hidden shadow-inner p-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveScheduleRoom("ห้องจัดรายการ 1");
                  setBookingRoom("ห้องจัดรายการ 1");
                }}
                className={`flex-1 h-[39px] px-1.5 py-1.5 text-center text-[16px] font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                  activeScheduleRoom === "ห้องจัดรายการ 1"
                    ? "bg-[#ef8840] text-white shadow-md"
                    : "hover:bg-white/5 text-slate-400"
                }`}
              >
                🎙️ ห้องจัดรายการ 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveScheduleRoom("ห้องจัดรายการ 2");
                  setBookingRoom("ห้องจัดรายการ 2");
                }}
                className={`flex-1 h-[39px] px-1.5 py-1.5 text-center text-[16px] font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                  activeScheduleRoom === "ห้องจัดรายการ 2"
                    ? "bg-[#4a90e2] text-white shadow-md"
                    : "hover:bg-white/5 text-slate-400"
                }`}
              >
                🎧 ห้องจัดรายการ 2
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveScheduleRoom("ห้องยูทูป 1");
                  setBookingRoom("ห้องยูทูป 1");
                }}
                className={`flex-1 h-[39px] px-1.5 py-1.5 text-center text-[16px] font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                  activeScheduleRoom === "ห้องยูทูป 1"
                    ? "bg-[#e33541] text-white shadow-md"
                    : "hover:bg-white/5 text-slate-400"
                }`}
              >
                📹 ห้องยูทูป 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveScheduleRoom("ห้องยูทูป 2");
                  setBookingRoom("ห้องยูทูป 2");
                }}
                className={`flex-1 h-[39px] px-1.5 py-1.5 text-center text-[16px] font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                  activeScheduleRoom === "ห้องยูทูป 2"
                    ? "bg-[#9810fa] text-white shadow-md"
                    : "hover:bg-white/5 text-slate-400"
                }`}
              >
                🎬 ห้องยูทูป 2
              </button>
            </div>
          </div>

          {/* Top Banner Image Preview */}
          <div className="w-full max-w-6xl mx-auto pt-1 relative">
            <div className="w-full h-[520px] sm:h-[560px] md:h-[600px] lg:h-[640px] bg-[#111115] border border-[#2d2d34] rounded-2xl overflow-hidden shadow-2xl relative group">
              {(() => {
                const val = roomImages?.[activeScheduleRoom];
                let images: string[] = [];
                if (Array.isArray(val)) {
                  images = val.filter(Boolean);
                } else if (typeof val === "string" && val) {
                  images = [val];
                }
                
                if (images.length === 0) {
                  images = [
                    activeScheduleRoom === "ห้องจัดรายการ 1"
                      ? "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=90&w=2560"
                      : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=90&w=2560"
                  ];
                }

                const currentImgIdx = Math.min(activeImageIdx, images.length - 1);
                let currentImg = images[currentImgIdx] || images[0];
                if (currentImg && currentImg.includes("images.unsplash.com")) {
                  currentImg = currentImg.replace(/w=\d+/, 'w=2560').replace(/q=\d+/, 'q=90');
                }

                return (
                  <>
                    <img 
                      src={currentImg} 
                      alt={activeScheduleRoom}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-contain mx-auto transition-transform duration-700 hover:scale-105"
                    />
                    
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-md z-10 cursor-pointer backdrop-blur-xs"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-md z-10 cursor-pointer backdrop-blur-xs"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full z-10">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx(idx);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentImgIdx ? "bg-orange-500 scale-125" : "bg-white/60 hover:bg-white"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 2. MAIN CONTENT SECTION: Two-Column Layout (Form & Calendar Table) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start relative mt-6 pt-2" style={{ marginTop: '24px' }}>
          
          {/* LEFT COLUMN: Unified Booking Form */}
          <div className="lg:col-span-3 w-full relative m-0 p-0">
            <UnifiedBookingForm
              courses={courses}
              bookings={bookings}
              currentUser={currentUserEmail ? { email: currentUserEmail, role: 'admin' } : null}
              selectedRoom={activeScheduleRoom}
              onRoomChange={(newRoom) => {
                setActiveScheduleRoom(newRoom);
              }}
              selectedDate={scheduleBaseDate}
              onDateChange={(newDate) => {
                setScheduleBaseDate(newDate);
              }}
              onBookingSuccess={() => {
                setSuccessModalConfig({ isOpen: true, type: 'booking' });
                setBookingSuccessMsg("🎉 บันทึกการจองสำเร็จและส่งอีเมลยืนยันเรียบร้อยแล้ว!");
                setTimeout(() => setBookingSuccessMsg(null), 4000);
              }}
              createBooking={async (room, date, slot, purpose, stId, phone, name, email, pin) => {
                if (onCreateBooking) {
                  const res = await onCreateBooking(room, date, slot, purpose, stId, phone, name, email, pin);
                  if (res && typeof res === 'object') return res;
                }
                return { success: true };
              }}
              isSameDate={(a, b) => {
                if (!a || !b) return false;
                return a.trim() === b.trim();
              }}
              isSameRoom={(a, b) => {
                if (!a || !b) return false;
                return a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();
              }}
            />
          </div>

          {/* RIGHT COLUMN: Table representation (lg:col-span-9 - Expanded Width +20-25%) */}
          <div 
            className="lg:col-span-9 bg-[#111115] border border-[#2d2d34] lg:border-l-0 p-3 rounded-[16px] lg:rounded-l-none shadow-2xl space-y-3 overflow-y-auto m-0"
            style={{ height: '880px' }}
          >
            {/* Navigation controls for weeks */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const base = new Date(scheduleBaseDate);
                    base.setDate(base.getDate() - 7);
                    const yyyy = base.getFullYear();
                    const mm = String(base.getMonth() + 1).padStart(2, '0');
                    const dd = String(base.getDate()).padStart(2, '0');
                    setScheduleBaseDate(`${yyyy}-${mm}-${dd}`);
                  }}
                  className="bg-[#16161a] hover:bg-[#1e1e24] border border-[#2d2d34] text-[#ffffff] px-3 py-1.5 rounded-lg text-[16px] font-bold transition-colors cursor-pointer"
                >
                  ◀ สัปดาห์ก่อนหน้า
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const base = new Date();
                    const yyyy = base.getFullYear();
                    const mm = String(base.getMonth() + 1).padStart(2, '0');
                    const dd = String(base.getDate()).padStart(2, '0');
                    const todayStr = `${yyyy}-${mm}-${dd}`;
                    setScheduleBaseDate(todayStr);
                    setBookingDate(todayStr);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[16px] font-bold transition-colors cursor-pointer border ${getRoomTheme(activeScheduleRoom).bgLight} ${getRoomTheme(activeScheduleRoom).bgHoverLight} ${getRoomTheme(activeScheduleRoom).text} ${getRoomTheme(activeScheduleRoom).borderLight}`}
                >
                  วันนี้ / สัปดาห์นี้
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const base = new Date(scheduleBaseDate);
                    base.setDate(base.getDate() + 7);
                    const yyyy = base.getFullYear();
                    const mm = String(base.getMonth() + 1).padStart(2, '0');
                    const dd = String(base.getDate()).padStart(2, '0');
                    setScheduleBaseDate(`${yyyy}-${mm}-${dd}`);
                  }}
                  className="bg-[#16161a] hover:bg-[#1e1e24] border border-[#2d2d34] text-[#ffffff] px-3 py-1.5 rounded-lg text-[16px] font-bold transition-colors cursor-pointer"
                >
                  สัปดาห์ถัดไป ▶
                </button>
              </div>

              <div className="text-[16px] text-[#ffffff] font-bold bg-[#16161a] px-3 py-1.5 rounded-lg border border-[#2d2d34] flex items-center gap-1.5">
                📅 สัปดาห์ประจำวันที่: <span className={`font-extrabold ${getRoomTheme(activeScheduleRoom).text}`}>{getWeekDates(scheduleBaseDate)[0].displayDate} - {getWeekDates(scheduleBaseDate)[5].displayDate}</span>
              </div>
            </div>

            {/* Main Grid Table representation */}
            <div className="rounded-2xl overflow-hidden border border-orange-500/40 shadow-[0_0_18px_rgba(249,115,22,0.3)] ring-1 ring-orange-500/50 bg-[#0e0e11]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-xs text-center table-fixed bg-[#0e0e11]">
                <thead>
                  {/* Elegant dark grey row for วิชา */}
                  <tr className="border-b border-[#2d2d34]">
                    <th colSpan={9} className={`py-3 bg-[#111113] ${getRoomTheme(activeScheduleRoom).text} font-extrabold text-[20px] tracking-wide shadow-sm`}>
                      📚 รายวิชาเรียนประจำสัปดาห์ (Scheduled Class Subjects)
                    </th>
                  </tr>
                  {/* Table Headers in unified slate dark styling for professional contrast */}
                  <tr className="bg-[#16161a] text-[#ffffff] font-bold border-b border-[#2d2d34]">
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] bg-[#0e0e11] text-[#ffffff] font-extrabold text-[20px] w-[12%]">วัน / เวลา</th>
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[11%]">08.30 - 09.30</th>
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[11%]">09.30 - 10.30</th>
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[11%]">10.30 - 11.30</th>
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[11%]">11.30 - 12.30</th>
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[11%]">13.00 - 14.00</th>
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[11%]">14.00 - 15.00</th>
                    <th className="py-2.5 px-1 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[11%]">15.00 - 16.00</th>
                    <th className="py-2.5 px-1 text-[#ffffff] font-extrabold w-[11%]">16.00 - 17.00</th>
                  </tr>
                </thead>
                <tbody>
                  {getWeekDates(scheduleBaseDate).map((dayInfo) => {
                    const slots = [
                      "08:30 - 09:30",
                      "09:30 - 10:30",
                      "10:30 - 11:30",
                      "11:30 - 12:30",
                      "13:00 - 14:00",
                      "14:00 - 15:00",
                      "15:00 - 16:00",
                      "16:00 - 17:00"
                    ];

                    return (
                      <tr key={dayInfo.dayName} className="border-b border-[#2d2d34] bg-[#16161a] hover:bg-[#1b1b21] transition-colors h-[116px]">
                        <td className="py-1 px-1 border-r border-[#2d2d34] font-bold bg-[#111113] text-slate-100 h-[116px] max-h-[116px] w-[12%] align-middle box-border">
                          <div className="flex flex-col justify-center items-center h-full w-full overflow-hidden gap-1">
                            <div className={`text-[17px] uppercase font-extrabold truncate w-full ${getRoomTheme(activeScheduleRoom).text}`}>{dayInfo.dayName}</div>
                            <div className="text-[14px] text-[#ffffff] font-semibold truncate w-full">{dayInfo.displayDate}</div>
                          </div>
                        </td>

                      {(() => {
                        const renderedCells: React.ReactNode[] = [];
                        let i = 0;
                        while (i < slots.length) {
                          const slot = slots[i];
                          const b = findBookingForCell(activeScheduleRoom, dayInfo.dateStr, slot);

                          if (b) {
                            // Calculate span if same booking spans multiple consecutive slots
                            let spanCount = 1;
                            const bookingKey = b.id || (b.date + '_' + b.roomName + '_' + b.timeSlot + '_' + b.studentId);
                            
                            while (i + spanCount < slots.length) {
                              const nextB = findBookingForCell(activeScheduleRoom, dayInfo.dateStr, slots[i + spanCount]);
                              if (nextB) {
                                const nextKey = nextB.id || (nextB.date + '_' + nextB.roomName + '_' + nextB.timeSlot + '_' + nextB.studentId);
                                if (nextKey === bookingKey) {
                                  spanCount++;
                                  continue;
                                }
                              }
                              break;
                            }

                            const isTeacherBooking = b.userType === "TEACHER" || 
                              (b.purpose && b.purpose.includes("สำหรับการเรียนการสอนอาจารย์")) ||
                              (b.studentId === "อาจารย์ผู้สอน") ||
                              (b.studentName && b.studentName.includes("อาจารย์"));

                            if (isTeacherBooking || spanCount > 1) {
                              // MERGED CELL (Teacher / Multi-slot booking)
                              let displaySubject = b.subject || b.purpose || "วิชาสำหรับการเรียนการสอน";
                              displaySubject = displaySubject
                                .replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '')
                                .replace(/สำหรับการเรียนการสอนอาจารย์/g, '')
                                .trim();
                              if (!displaySubject) displaySubject = "วิชาสำหรับการเรียนการสอน";

                              const rawInstructorName = b.studentName || b.studentIdInput || "อาจารย์ผู้สอน";
                              let cleanTeacherName = rawInstructorName
                                .replace(/^อาจารย์ผู้สอน[:\s]*/, '')
                                .replace(/^อาจารย์[:\s]*/, '')
                                .trim();
                              if (!cleanTeacherName) {
                                cleanTeacherName = "อาจารย์ผู้สอน";
                              }

                              let slotSpanText = b.timeSlot || `${slots[i].split('-')[0].trim()} - ${slots[i + spanCount - 1].split('-')[1].trim()}`;
                              if (slotSpanText.includes("08:30 - 17:00") || slotSpanText.includes("8.30 - 17.00") || slotSpanText.includes("09:00 - 16:00") || slotSpanText.includes("9.00 - 16.00")) {
                                slotSpanText = "08:30 - 17:00 (เหมาทั้งวัน)";
                              } else if (slotSpanText.includes("08:30 - 12:30") || slotSpanText.includes("8.30 - 12.30") || slotSpanText.includes("09:00 - 12:00") || slotSpanText.includes("9.00 - 12.00")) {
                                slotSpanText = "08:30 - 12:30 (คาบเช้า)";
                              } else if (slotSpanText.includes("13:00 - 17:00") || slotSpanText.includes("13.00 - 17.00") || slotSpanText.includes("13:00 - 16:00") || slotSpanText.includes("13.00 - 16.00")) {
                                slotSpanText = "13:00 - 17:00 (คาบบ่าย)";
                              }

                              const purposeText = b.purpose ? b.purpose.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/, '').trim() : "สำหรับการเรียนการสอนอาจารย์";

                              renderedCells.push(
                                <td
                                  key={`${slot}_span_${i}`}
                                  colSpan={spanCount}
                                  className="p-1 border-r border-[#2d2d34] text-left align-middle bg-[#16161a] transition-all relative group h-[116px] max-h-[116px] box-border"
                                >
                                  {isTeacherBooking ? (
                                    /* TEACHER LUXURY GOLD & WHITE CARD */
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedScheduleBookingModal({
                                          room: activeScheduleRoom,
                                          subject: displaySubject,
                                          slot: slotSpanText,
                                          studentId: "อาจารย์ผู้สอน",
                                          studentName: cleanTeacherName,
                                          phone: b.phone && b.phone !== "-" ? b.phone : "อาจารย์ผู้สอน",
                                          purpose: purposeText || "สำหรับการเรียนการสอนอาจารย์",
                                          roomThemeText: "text-[#c59324]",
                                          booking: b
                                        });
                                      }}
                                      style={{ backgroundColor: '#ffffff' }}
                                      className="teacher-schedule-card relative rounded-2xl border-[3.5px] border-[#d8a735] p-2 sm:px-2.5 sm:py-2 text-left flex flex-col justify-between h-[106px] min-h-[106px] max-h-[106px] w-full transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(216,167,53,0.35)] overflow-hidden cursor-pointer group/teachercard"
                                    >
                                      {/* Top-Right Badge: 'อาจารย์' */}
                                      <div className="teacher-gold-badge absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-xl shadow-sm flex items-center gap-1 z-10">
                                        <User className="w-3 h-3 stroke-[2.5]" />
                                        <span className="text-[11px] font-extrabold tracking-wide leading-none">อาจารย์</span>
                                      </div>

                                      {/* 3 Content Rows with gold dividers */}
                                      <div className="flex flex-col justify-between h-full w-full min-w-0">
                                        {/* Row 1: Calendar Icon + Subject */}
                                        <div className="flex items-center gap-2 min-w-0 pr-16" style={{ marginLeft: '0px' }}>
                                          <Calendar className="teacher-gold-icon w-3.5 h-3.5 shrink-0 stroke-[2.2]" style={{ marginTop: '1px', marginLeft: '0px' }} />
                                          <span 
                                            className="teacher-gold-value font-black truncate leading-tight tracking-tight" 
                                            title={displaySubject}
                                            style={{ 
                                              fontSize: '15px', 
                                              height: '18.25px', 
                                              width: '200px', 
                                              paddingTop: '0px', 
                                              paddingBottom: '0px', 
                                              paddingLeft: '0px', 
                                              marginLeft: '8px', 
                                              marginTop: '4px' 
                                            }}
                                          >
                                            {displaySubject}
                                          </span>
                                        </div>

                                        {/* Row 2: User Icon + 'ชื่อ' + Teacher Name */}
                                        <div className="teacher-gold-divider flex items-center gap-2 min-w-0 pt-1">
                                          <User className="teacher-gold-icon w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                                          <span 
                                            className="teacher-gold-label font-bold shrink-0"
                                            style={{ fontSize: '15px', marginTop: '2px', marginLeft: '0px' }}
                                          >
                                            ชื่อ
                                          </span>
                                          <span 
                                            className="teacher-gold-value font-extrabold truncate leading-tight" 
                                            title={cleanTeacherName}
                                            style={{ fontSize: '15px', marginTop: '3px', marginLeft: '0px' }}
                                          >
                                            {cleanTeacherName}
                                          </span>
                                        </div>

                                        {/* Row 3: Clock Icon + 'เวลา' + Time Slot */}
                                        <div className="teacher-gold-divider flex items-center gap-2 min-w-0 pt-1">
                                          <Clock className="teacher-gold-icon w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
                                          <span 
                                            className="teacher-gold-label font-bold shrink-0"
                                            style={{ fontSize: '15px' }}
                                          >
                                            เวลา
                                          </span>
                                          <span 
                                            className="teacher-gold-value font-extrabold truncate font-mono leading-tight"
                                            style={{ fontSize: '15px', marginTop: '2px' }}
                                          >
                                            {slotSpanText}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* MULTI-SLOT STUDENT MERGED CARD */
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedScheduleBookingModal({
                                          room: activeScheduleRoom,
                                          subject: displaySubject,
                                          slot: slotSpanText,
                                          studentId: b.studentIdInput || b.studentId || "นักศึกษา",
                                          studentName: rawInstructorName,
                                          phone: b.phone && b.phone !== "-" ? b.phone : "-",
                                          purpose: purposeText || "จองใช้งานต่อเนื่อง",
                                          roomThemeText: "text-purple-400",
                                          booking: b
                                        });
                                      }}
                                      style={{ padding: '6px 10px 6px 12px' }}
                                      className="relative px-2.5 py-1.5 pl-3 rounded-xl border-2 border-purple-400/90 bg-gradient-to-r from-[#2a0c44] via-[#1a0833] to-[#2a0c44] hover:from-[#361056] hover:to-[#220a42] text-center flex flex-col justify-between items-center h-[106px] min-h-[106px] max-h-[106px] w-full transition-all duration-300 shadow-[0_0_18px_rgba(168,85,247,0.4)] overflow-hidden cursor-pointer group-hover:border-purple-300 ring-1 ring-purple-400/60"
                                    >
                                      <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl bg-gradient-to-b from-fuchsia-400 via-purple-300 to-indigo-400" />
                                      <div className="flex flex-col items-center justify-between h-full w-full min-w-0 px-1 overflow-hidden py-0.5">
                                        <div 
                                          className="flex items-center gap-1 font-black !text-[14px] text-purple-100 truncate w-full justify-center leading-[1.2]"
                                          style={{ fontSize: '14px', lineHeight: '1.2' }}
                                        >
                                          <span className="text-[14px] shrink-0">🎓</span>
                                          <span className="truncate !text-[14px]" style={{ fontSize: '14px' }}>{displaySubject}</span>
                                        </div>
                                        <div 
                                          className="font-bold !text-[13px] text-[#ef8840] truncate w-full leading-[1.2]"
                                          style={{ fontSize: '13px', lineHeight: '1.2' }}
                                        >
                                          ผู้จอง: {rawInstructorName}
                                        </div>
                                        <div 
                                          className="inline-flex items-center gap-1 bg-purple-900/90 border border-purple-400/50 text-purple-200 !text-[12px] font-extrabold px-2 py-0.5 rounded-full shadow-sm leading-tight max-w-[95%] truncate"
                                          style={{ fontSize: '12px' }}
                                        >
                                          <span className="truncate">⏱️ {slotSpanText}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );

                              i += spanCount;
                            } else {
                              // STANDARD SINGLE-SLOT STUDENT BOOKING
                              const roomTheme = getRoomTheme(activeScheduleRoom);
                              // Extract exact 4-line fields for student booking card
                              let displayCourseCode = "BRS 122";
                              const fullSubjectRaw = b.subject || b.purpose || "";
                              const codeMatch = fullSubjectRaw.match(/([A-Za-z]{2,4}\s*\d{3,4})/i);
                              if (codeMatch) {
                                displayCourseCode = codeMatch[1].toUpperCase();
                              } else if (b.subject && b.subject.trim().length <= 10) {
                                displayCourseCode = b.subject.trim().toUpperCase();
                              }

                              let displayProgramTitle = "";
                              if (b.bookingTitle && b.bookingTitle.trim()) {
                                displayProgramTitle = b.bookingTitle.trim();
                              } else if (b.purpose) {
                                const headerMatch = b.purpose.match(/หัวข้อ:\s*([^|)]+)/i);
                                if (headerMatch) {
                                  displayProgramTitle = headerMatch[1].trim();
                                } else {
                                  const parenMatch = b.purpose.match(/\((.*?)\)/);
                                  if (parenMatch) {
                                    const cleanInside = parenMatch[1].replace(/วัตถุประสงค์:\s*[^|)]+/i, '').replace(/\|/g, '').trim();
                                    if (cleanInside) {
                                      displayProgramTitle = cleanInside;
                                    }
                                  }
                                }
                              }
                              if (!displayProgramTitle) {
                                const stripped = (b.purpose || "").replace(/^[A-Za-z]{2,4}\s*\d{3,4}[\s:-]*/i, '').trim();
                                if (stripped && !stripped.startsWith("(") && stripped !== displayCourseCode) {
                                  displayProgramTitle = stripped;
                                } else if (b.bookingPurpose && b.bookingPurpose.trim()) {
                                  displayProgramTitle = b.bookingPurpose.trim();
                                } else {
                                  displayProgramTitle = "จัดรายการ";
                                }
                              }

                              const displayStudentFullName = (b.studentNameInput || b.studentName || "นักศึกษา").trim();
                              const cleanSlot = slot ? slot.replace(/\s*-\s*/g, '-') : '';
                              const displayTimeText = (cleanSlot || slot || "").replace(/:/g, '.').replace(/\s*-\s*/, ' – ');
                              const studentIdStr = b.studentIdInput || b.studentId || b.studentName || '-';

                              renderedCells.push(
                                <td 
                                  key={slot} 
                                  className="p-1 border-r border-[#2d2d34] text-left align-top bg-[#16161a] transition-all relative group h-[116px] max-h-[116px] w-[11%] box-border"
                                >
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedScheduleBookingModal({
                                        room: activeScheduleRoom,
                                        subject: `${displayCourseCode}: ${displayProgramTitle}`,
                                        slot: cleanSlot,
                                        studentId: studentIdStr,
                                        studentName: displayStudentFullName,
                                        phone: b.phone || '-',
                                        purpose: displayProgramTitle,
                                        roomThemeText: roomTheme.text,
                                        booking: b
                                      });
                                    }}
                                    className={`relative p-2 pl-3 rounded-2xl border-[1.5px] ${roomTheme.cardBorder} ${roomTheme.cardBg} ${roomTheme.cardGlow} text-left flex flex-col justify-between h-[106px] min-h-[106px] max-h-[106px] w-full transition-all duration-200 overflow-hidden cursor-pointer group/card`}
                                  >
                                    {/* Dynamic Theme Left Accent Bar - Flush to left edge with rounded-l-2xl */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-[4.5px] rounded-l-2xl ${roomTheme.cardBar}`} />

                                    {/* Top Section: Line 1 (Course Code) & Line 2 (Booking Title) */}
                                    <div className="flex flex-col min-w-0 overflow-hidden">
                                      {/* Line 1: Course Code only (Room Theme Color) */}
                                      <div className={`font-black text-[15px] sm:text-[16px] ${roomTheme.cardSubject} tracking-tight uppercase leading-tight truncate`}>
                                        {displayCourseCode}
                                      </div>
                                      {/* Line 2: Booking Title / Program Name (Solid Bright White) */}
                                      <div 
                                        className="font-bold text-[12.5px] sm:text-[13px] text-[#ffffff] leading-tight truncate mt-0.5" 
                                        style={{ color: '#ffffff' }}
                                        title={displayProgramTitle}
                                      >
                                        {displayProgramTitle}
                                      </div>
                                    </div>

                                    {/* Dynamic Room Theme Divider */}
                                    <div className={`h-[1px] ${roomTheme.cardDivider} w-full my-0.5 shrink-0`} />

                                    {/* Bottom Section: Line 3 (Full Name) & Line 4 (Time Slot) */}
                                    <div className="flex flex-col min-w-0 overflow-hidden">
                                      {/* Line 3: Student Full Name (Solid Bright White) */}
                                      <div 
                                        className="font-bold text-[12px] sm:text-[12.5px] text-[#ffffff] leading-tight truncate" 
                                        style={{ color: '#ffffff' }}
                                        title={displayStudentFullName}
                                      >
                                        {displayStudentFullName}
                                      </div>
                                      {/* Line 4: Booking Time Slot (Room Theme Color) */}
                                      <div className={`font-bold text-[11.5px] sm:text-[12px] ${roomTheme.cardSubject} font-mono tracking-tight leading-tight mt-0.5`}>
                                        {displayTimeText}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              );

                              i++;
                            }
                          } else {
                            // EMPTY SLOT
                            renderedCells.push(
                              <td 
                                key={slot} 
                                className="p-1 border-r border-[#2d2d34] group bg-[#16161a] transition-all duration-300 text-center h-[116px] max-h-[116px] w-[11%] box-border"
                              >
                                <div className="p-1 rounded-xl border border-dashed border-[#2d2d34] bg-[#0e0e11]/30 text-center flex flex-col items-center justify-center h-[106px] min-h-[106px] max-h-[106px] w-full transition-all duration-300 group-hover:border-slate-500/40 group-hover:bg-[#1c1c24] shadow-sm overflow-hidden gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-slate-800/60 flex items-center justify-center text-xs opacity-60 group-hover:scale-110 group-hover:bg-slate-700/80 transition-all duration-300">
                                    🗓️
                                  </div>
                                  <span className="text-[12px] text-slate-400 font-bold tracking-wider group-hover:text-slate-300 transition-colors">
                                    ว่าง
                                  </span>
                                </div>
                              </td>
                            );
                            i++;
                          }
                        }

                        return renderedCells;
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

        </div>
      </div>

        {/* Centered Booking Form Modal for teacher's view too */}
        <AnimatePresence>
          {isBookingModalOpen && (
            <div 
              className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
              onClick={() => setIsBookingModalOpen(false)}
              id="student_booking_modal_backdrop_teacher"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative w-full max-w-lg bg-white border border-slate-100 rounded-[24px] p-6 sm:p-7 shadow-2xl cursor-default my-auto"
                onClick={(e) => e.stopPropagation()}
                id="student_booking_modal_content_teacher"
              >
                {/* Close Button */}
                <button 
                  type="button"
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer font-bold"
                  onClick={() => setIsBookingModalOpen(false)}
                  title="ปิดหน้าต่าง"
                >
                  ✕
                </button>

                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="bg-indigo-50 text-indigo-650 p-2.5 rounded-xl border border-indigo-100/50">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-850 text-base font-display">
                        ยืนยันการจอง
                      </h3>
                    </div>
                  </div>

                  <form onSubmit={handleRoomBookingSubmit} className="space-y-4 pt-1">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-700 block mb-1">1. ห้องจัดรายการวิทยุ/โทรทัศน์</label>
                      <select
                        value={bookingRoom}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-bold appearance-none cursor-default select-none focus:outline-none"
                      >
                        <option value="ห้องจัดรายการ 1">🎙️ ห้องจัดรายการ 1</option>
                        <option value="ห้องจัดรายการ 2">🎧 ห้องจัดรายการ 2</option>
                        <option value="ห้องยูทูป 1">📹 ห้องยูทูป 1</option>
                        <option value="ห้องยูทูป 2">🎬 ห้องยูทูป 2</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">2. วันที่จอง</label>
                        <input
                          type="date"
                          value={bookingDate}
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 font-bold cursor-default select-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">3. ช่วงเวลา (Timeslot)</label>
                        <select
                          value={bookingSlot}
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all font-mono font-bold text-slate-500 appearance-none cursor-default select-none"
                        >
                          <option value="08:30 - 09:30">08:30 - 09:30</option>
                          <option value="09:30 - 10:30">09:30 - 10:30</option>
                          <option value="10:30 - 11:30">10:30 - 11:30</option>
                          <option value="11:30 - 12:30">11:30 - 12:30</option>
                          <option value="13:00 - 14:00">13:00 - 14:00</option>
                          <option value="14:00 - 15:00">14:00 - 15:00</option>
                          <option value="15:00 - 16:00">15:00 - 16:00</option>
                          <option value="16:00 - 17:00">16:00 - 17:00</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                          4. รายวิชาเรียน <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={bookingSubject}
                          onChange={(e) => setBookingSubject(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-semibold cursor-pointer"
                          required
                        >
                          {courses.map((c) => {
                            const lbl = getCourseLabel(c);
                            return (
                              <option key={c.id || c.code} value={c.code || lbl}>
                                {lbl}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">วัตถุประสงค์การใช้งาน</label>
                        <textarea
                          rows={2.5}
                          value={bookingPurpose}
                          onChange={(e) => setBookingPurpose(e.target.value)}
                          required
                          placeholder="จัดรายการรายวิชาเรียน / ฝึกจัดรายการ"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-medium resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">5. ชื่อ-นามสกุลผู้จอง</label>
                        <input
                          type="text"
                          value={bookingStudentName}
                          onChange={(e) => setBookingStudentName(e.target.value)}
                          required
                          placeholder="ชื่อ-นามสกุล"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-850 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">6. รหัสนักศึกษาผู้จอง</label>
                        <input
                          type="text"
                          maxLength={15}
                          value={bookingStudentId}
                          onChange={(e) => setBookingStudentId(e.target.value)}
                          required
                          placeholder="รหัสนักศึกษา 10 หลัก"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-850 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">7. เบอร์โทรศัพท์ติดต่อ</label>
                        <input
                          type="tel"
                          maxLength={12}
                          value={bookingPhone}
                          onChange={(e) => setBookingPhone(e.target.value)}
                          required
                          placeholder="เช่น 089XXXXXXX"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-850 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Email & 4-digit PIN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                          8. อีเมลผู้แจ้งจอง <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          required
                          placeholder="เช่น user@bu.ac.th"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-850 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                          9. กำหนดรหัส PIN (4 หลัก) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={bookingPinCode}
                          onChange={(e) => setBookingPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          required
                          placeholder="เช่น 1234"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-850 font-mono font-bold tracking-widest"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsBookingModalOpen(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl py-3 text-xs transition-colors cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl py-3 text-xs transition-colors shadow-md shadow-indigo-600/15 cursor-pointer"
                      >
                        ⚡ ยืนยันการจอง
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )}

    {/* Lightbox Image Preview Modal */}
    {previewImageUrl && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-pointer animate-fade-in"
        onClick={() => setPreviewImageUrl(null)}
      >
        <div 
          className="relative max-w-[1366px] w-full max-h-[95vh] bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden p-2 flex flex-col items-center cursor-default shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="absolute top-4 right-4 bg-black/80 hover:bg-black text-rose-500 hover:text-rose-600 rounded-full p-2 cursor-pointer shadow-lg transition-colors z-10 w-10 h-10 flex items-center justify-center font-bold text-xl"
            onClick={() => setPreviewImageUrl(null)}
            title="ปิดการแสดงภาพ"
          >
            ✕
          </button>
          <div className="w-full flex items-center justify-center overflow-auto p-1">
            <img 
              src={previewImageUrl} 
              alt="Enlarged preview" 
              className="max-w-full max-h-[88vh] object-contain rounded-lg shadow-inner"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="py-2.5 px-4 text-slate-400 text-xs text-center font-medium bg-slate-950/40 w-full border-t border-slate-800/50">
            คลิกพื้นที่สีดำรอบข้างหรือกดปุ่ม ✕ เพื่อปิดหน้าต่างนี้
          </div>
        </div>
      </div>
    )}

    {/* Modal Dialog for Schedule Booking Details */}
    <BookingDetailModal
      isOpen={!!selectedScheduleBookingModal}
      onClose={() => setSelectedScheduleBookingModal(null)}
      data={selectedScheduleBookingModal}
      courses={courses}
      readOnly={false}
      onEditClick={(booking) => {
        setTargetBookingForPin(booking);
        setPinActionType('edit');
        setIsVerifyPinModalOpen(true);
        setSelectedScheduleBookingModal(null);
      }}
      onDeleteClick={(booking) => {
        setTargetBookingForPin(booking);
        setPinActionType('delete');
        setIsVerifyPinModalOpen(true);
        setSelectedScheduleBookingModal(null);
      }}
    />

    {/* Verify Booking PIN Modal */}
    <VerifyBookingPinModal
      isOpen={isVerifyPinModalOpen}
      onClose={() => {
        setIsVerifyPinModalOpen(false);
        setTargetBookingForPin(null);
      }}
      booking={targetBookingForPin}
      actionType={pinActionType}
      onSuccess={() => {
        setIsVerifyPinModalOpen(false);
        if (pinActionType === 'edit') {
          setBookingToEdit(targetBookingForPin);
          setIsEditModalOpen(true);
        } else if (pinActionType === 'delete') {
          setBookingToDelete(targetBookingForPin);
          setIsDeleteModalOpen(true);
        }
      }}
      onVerified={() => {
        setIsVerifyPinModalOpen(false);
        if (pinActionType === 'edit') {
          setBookingToEdit(targetBookingForPin);
          setIsEditModalOpen(true);
        } else if (pinActionType === 'delete') {
          setBookingToDelete(targetBookingForPin);
          setIsDeleteModalOpen(true);
        }
      }}
    />

    {/* Edit / Reschedule Booking Modal */}
    <EditBookingModal
      isOpen={isEditModalOpen}
      onClose={() => {
        setIsEditModalOpen(false);
        setBookingToEdit(null);
      }}
      booking={bookingToEdit}
      courses={courses}
      bookings={bookings}
      onSave={async (id, updates) => {
        if (onUpdateBooking) {
          await onUpdateBooking(id, updates);
        }
      }}
      onAfterSaveSuccess={(newRoom, newDate) => {
        setActiveScheduleRoom(newRoom);
        setScheduleBaseDate(newDate);
        setBookingDate(newDate);
        setSuccessModalConfig({ isOpen: true, type: 'edit' });
      }}
    />

    {/* Delete Booking Confirmation Modal */}
    <DeleteBookingConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => {
        setIsDeleteModalOpen(false);
        setBookingToDelete(null);
      }}
      booking={bookingToDelete}
      onConfirmDelete={async (id) => {
        await onDeleteBooking(id);
        alert("🗑️ ยกเลิกและลบรายการจองสำเร็จ คืนช่องเวลาว่างบนตารางเรียบร้อยแล้ว");
      }}
    />

    {/* Success Animation Pop-up Modal */}
    <SuccessNotificationModal
      isOpen={successModalConfig.isOpen}
      onClose={() => setSuccessModalConfig(prev => ({ ...prev, isOpen: false }))}
      type={successModalConfig.type}
    />

  </div>
);
}
