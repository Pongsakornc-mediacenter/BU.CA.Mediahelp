/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet, 
  Camera, 
  Mic, 
  Lightbulb, 
  PenTool, 
  HelpCircle,
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  User,
  ExternalLink,
  MessageSquare,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon
} from 'lucide-react';
import { Ticket, AttendanceRecord, HelpCategory, ClassSession, RoomBooking, BroadcastProgram } from '../types';
import { AVAILABLE_CLASSES, AVAILABLE_STUDIO_ROOMS, AVAILABLE_TIMESLOTS } from '../hooks/useData';

interface AdminDashboardProps {
  tickets: Ticket[];
  attendance: AttendanceRecord[];
  onSubmitReply: (ticketId: string, replyText: string) => Promise<void>;
  onDownloadReport: () => void;
  currentUserEmail: string;
  bookings: RoomBooking[];
  programs: BroadcastProgram[];
  onUpdateBookingStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onCreateProgram: (
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
  onUpdateProgramStatus: (id: string, status: 'upcoming' | 'active' | 'completed') => Promise<void>;
  onDeleteProgram: (id: string) => Promise<void>;
  onCreateBooking?: (roomName: string, date: string, timeSlot: string, purpose: string, studentIdInput?: string, phone?: string) => Promise<void>;
  roomImages?: { [key: string]: string };
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
  onDeleteBooking,
  onCreateProgram,
  onUpdateProgramStatus,
  onDeleteProgram,
  onCreateBooking,
  roomImages = {}
}: AdminDashboardProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tickets' | 'bookings' | 'student_schedule'>('tickets');
  const [categoryFilter, setCategoryFilter] = useState<HelpCategory | 'all'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [draftStatus, setDraftStatus] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, 'approved' | 'rejected'>>({});

  // Student booking schedule states for the new teacher tab
  const [activeScheduleRoom, setActiveScheduleRoom] = useState<string>("ห้องจัดรายการ 1");
  const [scheduleBaseDate, setScheduleBaseDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [bookingRoom, setBookingRoom] = useState("ห้องจัดรายการ 1");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("09:00 - 10:00");
  const [bookingSubject, setBookingSubject] = useState("");
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [bookingStudentId, setBookingStudentId] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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
    const normalizedSlot = slotStr === "9.00 - 10.00" ? "09:00 - 10:00" : slotStr;
    return bookings.find(b => 
      b.roomName === roomName && 
      b.date === dateStr && 
      (b.timeSlot === normalizedSlot || b.timeSlot === slotStr) &&
      b.status !== 'rejected'
    );
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
    if (!bookingStudentId.trim()) {
      alert("กรุณาระบุรหัสนักศึกษา");
      return;
    }
    if (!bookingPhone.trim()) {
      alert("กรุณาระบุเบอร์โทร");
      return;
    }

    // Close the modal immediately for instant, responsive UI feedback
    setIsBookingModalOpen(false);

    try {
      const combinedPurpose = `${bookingSubject.trim()} (${bookingPurpose.trim()})`;
      if (onCreateBooking) {
        await onCreateBooking(
          bookingRoom, 
          bookingDate, 
          bookingSlot, 
          combinedPurpose, 
          bookingStudentId.trim(), 
          bookingPhone.trim()
        );
        setBookingSubject("");
        setBookingPurpose("");
        setBookingStudentId("");
        setBookingPhone("");
        setBookingSuccessMsg("🎉 ยืนยันการจองห้องจัดรายการเสร็จสิ้นเรียบร้อยแล้วค่ะ! ข้อมูลแสดงในตารางจัดรายการเรียบร้อยแล้ว");
        setTimeout(() => setBookingSuccessMsg(""), 6000);
      } else {
        alert("ระบบหลักไม่พร้อมใช้งานฟังก์ชันการจองในขณะนี้");
      }
    } catch (err) {
      console.error("Booking error details:", err);
      alert("เกิดข้อผิดพลาดในการยื่นระบบคำจอง");
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
  const [newProgSlot, setNewProgSlot] = useState("09:00 - 10:00");
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
      
      {/* 1. Header Profile & Seeding */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800" id="admin_profile_section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-xl border border-indigo-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display">ระบบจัดการสำหรับอาจารย์ผู้ดูแล</h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  ADMIN LEVEL
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">{currentUserEmail} (อ.พงศกร CO-CA บล็อกเกอร์อุปกรณ์)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDownloadReport}
            id="download_report_btn"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs px-4 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-600/10 transition-colors w-full sm:w-auto justify-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ออกรายงาน Excel / CSV (Feature 6)
          </button>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm" id="admin_tabs">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          ระบบสนับสนุนและตั๋วตอบคำถามนักเรียน ({tickets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          ระบบอนุมัติจองห้อง & ตารางจัดรายการ ({bookings.length} จอง / {programs.length} รายการ)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('student_schedule')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'student_schedule'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-orange-500" />
          จองห้องสตูดิโอ & ตารางออกอากาศ ของนักศึกษา
        </button>
      </div>

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
                รายการรออนุมัติ การจองห้องจัดรายการ
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                ระบบจัดการและควบคุมคำเเนะนำพร้อมตรวจพิจารณาอนุมัติคำขอเข้าใช้งานพื้นที่จอง
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
                <span>อนุมัติสะสม: {bookings.filter(b => b.status === 'approved').length} คำขอ</span>
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
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-550 font-bold bg-slate-50/50">
                    <th className="py-3 px-4 font-display">ชื่อ-นักศึกษา</th>
                    <th className="py-3 px-4 font-display">ห้อง</th>
                    <th className="py-3 px-4 font-display">ช่วงเวลา</th>
                    <th className="py-3 px-4 font-display">วิชา</th>
                    <th className="py-3 px-4 font-display text-center">รออนุมัติ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((booking) => {
                    const displayStatus = optimisticStatus[booking.id] || booking.status;
                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{booking.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{booking.studentEmail}</div>
                          {booking.studentIdInput && booking.phone && (
                            <div className="text-[10px] text-indigo-500 font-bold mt-0.5 font-mono">
                              ID: {booking.studentIdInput} • โทร: {booking.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px]">
                            {booking.roomName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-700">{booking.timeSlot}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{booking.date}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[180px] truncate" title={booking.purpose}>
                          <span className="font-medium text-slate-600">{booking.purpose}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {displayStatus === 'pending' || draftStatus[booking.id] !== undefined ? (
                            <div className="flex items-center justify-center gap-2">
                              {/* Approved Button */}
                              <button
                                type="button"
                                onClick={() => setDraftStatus(prev => ({ ...prev, [booking.id]: 'approved' }))}
                                className={`px-5 py-2 rounded-xl text-xs font-extrabold border transition-all select-none ${
                                  (draftStatus[booking.id] !== undefined ? draftStatus[booking.id] : displayStatus) === 'approved'
                                    ? 'bg-[#00c58d] border-[#00a877] text-black shadow-sm scale-105'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-250'
                                }`}
                              >
                                อนุมัติ
                              </button>

                              {/* Rejected Button */}
                              <button
                                type="button"
                                onClick={() => setDraftStatus(prev => ({ ...prev, [booking.id]: 'rejected' }))}
                                className={`px-5 py-2 rounded-xl text-xs font-extrabold border transition-all select-none ${
                                  (draftStatus[booking.id] !== undefined ? draftStatus[booking.id] : displayStatus) === 'rejected'
                                    ? 'bg-[#ff2d55] border-[#df183e] text-black shadow-sm scale-105'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-250'
                                }`}
                              >
                                ไม่อนุมัติ
                              </button>

                              {/* Confirm Button */}
                              {draftStatus[booking.id] !== undefined ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const target = draftStatus[booking.id];
                                    // Set optimistic status instantly to trigger UI transition immediately
                                    setOptimisticStatus(prev => ({ ...prev, [booking.id]: target }));
                                    // Clear draft status instantly to switch layout
                                    setDraftStatus(prev => {
                                      const next = { ...prev };
                                      delete next[booking.id];
                                      return next;
                                    });
                                    
                                    try {
                                      await onUpdateBookingStatus(booking.id, target);
                                    } catch (error) {
                                      console.error("Failed to update status on server", error);
                                      // Revert optimistic state on failure
                                      setOptimisticStatus(prev => {
                                        const next = { ...prev };
                                        delete next[booking.id];
                                        return next;
                                      });
                                    }
                                  }}
                                  className="bg-[#f59e0b] hover:bg-[#d97706] border border-[#b45309] text-black font-extrabold px-5 py-2 rounded-xl text-xs transition-all shadow-md shrink-0"
                                  title="คลิกเพื่อยืนยันคำขอ"
                                >
                                  ยืนยัน
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="bg-slate-50 text-slate-350 border border-slate-100 px-5 py-2 rounded-xl text-xs font-bold opacity-35 cursor-not-allowed select-none"
                                >
                                  ยืนยัน
                                </button>
                              )}

                              {draftStatus[booking.id] !== undefined && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftStatus(prev => {
                                      const next = { ...prev };
                                      delete next[booking.id];
                                      return next;
                                    });
                                  }}
                                  className="bg-[#2d3748] hover:bg-[#1a202c] text-white font-extrabold px-5 py-2 rounded-xl text-xs transition-all shrink-0"
                                >
                                  ยกเลิก
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-3">
                              {displayStatus === 'approved' ? (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#00c58d]/10 border border-[#00c58d]/30 text-[#00a877]">
                                  <span className="w-2 h-2 rounded-full bg-[#00c58d] animate-pulse"></span>
                                  อนุมัติแล้ว
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#ff2d55]/10 border border-[#ff2d55]/30 text-[#df183e]">
                                  <span className="w-2 h-2 rounded-full bg-[#ff2d55]"></span>
                                  ไม่อนุมัติ
                                </span>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => setDraftStatus(prev => ({ ...prev, [booking.id]: displayStatus }))}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 hover:border-slate-300 border border-slate-200 transition-colors text-[11px] px-3 py-1.5 rounded-lg font-bold select-none"
                              >
                                แก้ไขสถานะ
                              </button>
                            </div>
                          )}
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
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:00 - 12:00">11:00 - 12:00</option>
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
        <div className="bg-[#111115] border border-[#2d2d34] p-3 sm:p-4 rounded-[20px] shadow-2xl text-center space-y-2">
          <div className="text-center space-y-1">
            <h4 className={`text-base sm:text-lg font-extrabold ${activeScheduleRoom === "ห้องจัดรายการ 1" ? "text-[#ef8840]" : "text-[#4a90e2]"} tracking-tight font-display flex items-center justify-center gap-1.5`}>
              📅 ตารางห้องจัดรายการ
            </h4>
            <p className="text-slate-400 text-[11px] max-w-xl mx-auto leading-tight">
              กรุณาตรวจสอบตารางการจองด้านล่างเพื่อตรวจสอบคิวที่ว่างก่อนกรอกแบบฟอร์มจองห้องจัดรายการต่อ
            </p>
          </div>

          {/* Room selectors (tabs like in the user's Excel mockup) */}
          <div className="flex max-w-md mx-auto bg-[#0a0a0c] border border-[#2d2d34] rounded-xl overflow-hidden shadow-inner p-0.5">
            <button
              type="button"
              onClick={() => {
                setActiveScheduleRoom("ห้องจัดรายการ 1");
                setBookingRoom("ห้องจัดรายการ 1");
              }}
              className={`flex-1 py-1.5 text-center text-[11px] font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 py-1.5 text-center text-[11px] font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1.5 ${
                activeScheduleRoom === "ห้องจัดรายการ 2"
                  ? "bg-[#4a90e2] text-white shadow-md"
                  : "hover:bg-white/5 text-slate-400"
              }`}
            >
              🎧 ห้องจัดรายการ 2
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          
          {/* LEFT COLUMN: Room Image Preview (Fills height to match table on desktop) */}
          <div className="xl:col-span-5 flex flex-col justify-start">
            <div className="w-full mx-auto aspect-[3/2] bg-[#111115] border border-[#2d2d34] rounded-[16px] overflow-hidden shadow-2xl relative group">
              <img 
                src={roomImages?.[activeScheduleRoom] || (activeScheduleRoom === "ห้องจัดรายการ 1" ? "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000" : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000")} 
                alt={activeScheduleRoom}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {/* Elegant overlay gradient at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111115]/80 to-transparent pointer-events-none" />
            </div>
            {/* Caption underneath the image */}
            <div className="pt-1.5 text-center">
              <p className="text-[#94a3b8] text-[11px] font-semibold tracking-wide">
                มุมมองบรรยากาศห้อง/สถานที่จอง (Atmospheric Preview)
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Table representation (xl:col-span-7) */}
          <div className="xl:col-span-7 bg-[#111115] border border-[#2d2d34] p-3 rounded-[16px] shadow-2xl space-y-3">
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
                  className="bg-[#16161a] hover:bg-[#1e1e24] border border-[#2d2d34] text-[#ffffff] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    activeScheduleRoom === "ห้องจัดรายการ 1"
                      ? "bg-[#ef8840]/10 hover:bg-[#ef8840]/20 text-[#ef8840] border-[#ef8840]/20"
                      : "bg-[#4a90e2]/10 hover:bg-[#4a90e2]/20 text-[#4a90e2] border-[#4a90e2]/20"
                  }`}
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
                  className="bg-[#16161a] hover:bg-[#1e1e24] border border-[#2d2d34] text-[#ffffff] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  สัปดาห์ถัดไป ▶
                </button>
              </div>

              <div className="text-xs text-[#ffffff] font-bold bg-[#16161a] px-3 py-1.5 rounded-lg border border-[#2d2d34] flex items-center gap-1.5">
                📅 สัปดาห์ประจำวันที่: <span className={`font-extrabold ${activeScheduleRoom === "ห้องจัดรายการ 1" ? "text-[#ef8840]" : "text-[#4a90e2]"}`}>{getWeekDates(scheduleBaseDate)[0].displayDate} - {getWeekDates(scheduleBaseDate)[5].displayDate}</span>
              </div>
            </div>

            {/* Main Grid Table representation */}
            <div className="overflow-x-auto border border-[#2d2d34] rounded-xl shadow-2xl bg-[#0e0e11]">
              <table className="w-full border-collapse text-xs text-center table-fixed bg-[#0e0e11]">
                <thead>
                  {/* Elegant dark grey row for วิชา */}
                  <tr className="border-b border-[#2d2d34]">
                    <th colSpan={8} className={`py-3 bg-[#111113] ${activeScheduleRoom === "ห้องจัดรายการ 1" ? "text-[#ef8840]" : "text-[#4a90e2]"} font-extrabold text-xs sm:text-sm tracking-wide shadow-sm`}>
                      📚 รายวิชาเรียนประจำสัปดาห์ (Scheduled Class Subjects)
                    </th>
                  </tr>
                  {/* Table Headers in unified slate dark styling for professional contrast */}
                  <tr className="bg-[#16161a] text-[#ffffff] font-bold border-b border-[#2d2d34]">
                    <th className="py-2.5 px-2 border-r border-[#2d2d34] bg-[#0e0e11] text-[#ffffff] font-extrabold w-[11%]">วัน / เวลา</th>
                    <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[13%]">9.00 - 10.00</th>
                    <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[13%]">10.00 - 11.00</th>
                    <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[13%]">11.00 - 12.00</th>
                    <th className="py-2.5 px-2 border-r border-[#2d2d34] bg-[#e27329] text-[#ffffff] w-[9%] font-black">พักเที่ยง</th>
                    <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[13%]">13.00 - 14.00</th>
                    <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[13%]">14.00 - 15.00</th>
                    <th className="py-2.5 px-2 text-[#ffffff] font-extrabold w-[15%]">15.00 - 16.00</th>
                  </tr>
                </thead>
                <tbody>
                  {getWeekDates(scheduleBaseDate).map((dayInfo) => {
                    const slots = [
                      "9.00 - 10.00",
                      "10.00 - 11.00",
                      "11.00 - 12.00",
                      "พักเที่ยง",
                      "13.00 - 14.00",
                      "14.00 - 15.00",
                      "15.00 - 16.00"
                    ];

                    return (
                      <tr key={dayInfo.dayName} className="border-b border-[#2d2d34] bg-[#16161a] hover:bg-[#1b1b21] transition-colors">
                        <td className="py-1.5 px-1 border-r border-[#2d2d34] font-bold bg-[#111113] text-slate-100">
                          <div className={`text-[11px] uppercase font-extrabold ${activeScheduleRoom === "ห้องจัดรายการ 1" ? "text-[#ef8840]" : "text-[#4a90e2]"}`}>{dayInfo.dayName}</div>
                          <div className="text-[9px] text-slate-400 font-semibold mt-0.5">{dayInfo.displayDate}</div>
                        </td>

                      {slots.map((slot) => {
                        if (slot === "พักเที่ยง") {
                          return (
                            <td key={slot} className="py-1.5 px-1 border-r border-[#2d2d34] bg-[#111113] text-slate-400 font-bold text-[10px] select-none">
                              🍛 พัก
                            </td>
                          );
                        }

                        const b = findBookingForCell(activeScheduleRoom, dayInfo.dateStr, slot);

                        if (b) {
                          const isApproved = b.status === "approved";
                          const isRoom1 = activeScheduleRoom === "ห้องจัดรายการ 1";

                          return (
                            <td 
                              key={slot} 
                              className="p-1 border-r border-[#2d2d34] text-left align-top bg-[#16161a] transition-all relative group"
                            >
                              {(() => {
                                let displaySubject = b.subject || "";
                                let displayPurpose = b.bookingPurpose || "";
                                if (!displaySubject && b.purpose) {
                                  if (b.purpose.includes("(")) {
                                    const match = b.purpose.match(/^(.*?)\s*\((.*?)\)\s*$/);
                                    if (match) {
                                      displaySubject = match[1].trim();
                                      displayPurpose = match[2].trim();
                                    } else {
                                      displaySubject = b.purpose;
                                    }
                                  } else {
                                    displaySubject = b.purpose;
                                  }
                                }
                                return (
                                  <>
                                    {/* Visible Compact Card */}
                                    <div className={`p-1.5 rounded-lg border text-left flex flex-col justify-center h-full min-h-[54px] gap-0.5 transition-all duration-300 shadow-sm ${
                                      isApproved 
                                        ? (isRoom1 
                                          ? "bg-[#0e0e11] border-[#ef8840]/30 border-l-[3px] border-l-[#ef8840]" 
                                          : "bg-[#0e0e11] border-[#4a90e2]/30 border-l-[3px] border-l-[#4a90e2]")
                                        : "bg-[#0e0e11] border-amber-500/30 border-l-[3px] border-l-amber-500"
                                    }`}>
                                      <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                                        {/* Header: Subject */}
                                        <div className="font-extrabold text-[10.5px] text-[#e2e8f0] tracking-tight uppercase truncate" title={displaySubject}>
                                          {displaySubject}
                                        </div>
                                        
                                        {/* Booker Name */}
                                        <div className="text-[9.5px] font-bold text-[#cbd5e1] truncate leading-tight" title={b.studentName}>
                                          {(b.studentName || "").toLowerCase()}
                                        </div>

                                        {/* Student ID */}
                                        <div className="text-[8.5px] font-mono font-bold text-[#94a3b8] tracking-wider leading-none">
                                          {b.studentIdInput || "-"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Hover Details Card Popup */}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[85%] mb-1 w-[250px] pointer-events-none opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 z-50 bg-[#0e0e11] border border-[#2d2d34] rounded-xl shadow-[0_0_25px_rgba(0,0,0,0.85)] p-3.5 flex flex-col gap-2">
                                      <div className="text-left">
                                        <div className="flex justify-between items-center mb-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                          <span>{activeScheduleRoom}</span>
                                          <span>⏱️ {slot}</span>
                                        </div>
                                        <div className="font-extrabold text-[12px] leading-tight text-white mb-2">
                                          {displaySubject} {displayPurpose && <span className="font-semibold text-slate-300 text-[10.5px]">({displayPurpose})</span>}
                                        </div>
                                        <hr className="border-[#2d2d34] my-1.5" />
                                        <div className="space-y-1 text-slate-300">
                                          <div className="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
                                            <span className="text-xs select-none">👤</span>
                                            <span>{b.studentName}</span>
                                          </div>
                                          {b.studentIdInput && (
                                            <div className="flex items-center gap-1.5 font-mono font-medium text-slate-300 text-[10px]">
                                              <span className="text-xs select-none">🆔</span>
                                              <span>{b.studentIdInput}</span>
                                            </div>
                                          )}
                                          {b.phone && (
                                            <div className="flex items-center gap-1.5 font-mono font-medium text-slate-300 text-[10px]">
                                              <span className="text-xs select-none">📞</span>
                                              <span>{b.phone}</span>
                                            </div>
                                          )}
                                          {b.purpose && (
                                            <div className="text-[10px] text-slate-400 border-t border-[#2d2d34] pt-1.5 mt-1 bg-[#16161a]/30 p-1 rounded-md">
                                              <span className="font-semibold text-slate-300">วัตถุประสงค์: </span>
                                              <span>{b.purpose}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={slot} 
                            className="p-1 border-r border-[#2d2d34] group bg-[#16161a] transition-all duration-300 text-center"
                          >
                            {/* Empty card container that matches the booked card dimensions and style */}
                            <div className="p-1 rounded-lg border border-dashed border-[#2d2d34] bg-[#0e0e11]/20 text-center flex items-center justify-center h-full min-h-[54px] transition-all duration-300 group-hover:border-slate-500/30 group-hover:bg-[#1c1c24] shadow-sm">
                              <div className="relative flex items-center justify-center select-none w-full gap-1">
                                <span className="text-xs opacity-30 group-hover:scale-110 transition-transform duration-300">🗓️</span>
                                <span className="text-[10px] text-slate-500 font-bold tracking-wide group-hover:text-slate-400 transition-colors">
                                  ว่าง
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Booking submission form (5-cols) */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleRoomBookingSubmit} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                จองห้องจัดรายการ MEDIA CENTER
              </h4>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">1. เลือกห้องจัดรายการ</label>
                <select
                  value={bookingRoom}
                  onChange={(e) => {
                    setBookingRoom(e.target.value);
                    setActiveScheduleRoom(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:bg-white focus:outline-none transition-all font-bold"
                >
                  <option value="ห้องจัดรายการ 1">ห้องจัดรายการ 1</option>
                  <option value="ห้องจัดรายการ 2">ห้องจัดรายการ 2</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">2. วันที่ต้องการจอง</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      if (e.target.value) {
                        setScheduleBaseDate(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-750 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">3. ช่วงเวลา (Timeslot)</label>
                  <select
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none transition-all font-mono font-medium text-slate-750"
                  >
                    <option value="09:00 - 10:00">09:00 - 10:00</option>
                    <option value="10:00 - 11:00">10:00 - 11:00</option>
                    <option value="11:00 - 12:00">11:00 - 12:00</option>
                    <option value="13:00 - 14:00">13:00 - 14:00</option>
                    <option value="14:00 - 15:00">14:00 - 15:00</option>
                    <option value="15:00 - 16:00">15:00 - 16:00</option>
                    <option value="16:00 - 17:00">16:00 - 17:00</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pb-1 border-b border-slate-50">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">4. รายวิชา</label>
                  <input
                    type="text"
                    value={bookingSubject}
                    onChange={(e) => setBookingSubject(e.target.value)}
                    placeholder="ระบุชื่อวิชา เช่น CA102 การผลิตรายการวิทยุ"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">วัตถุประสงค์</label>
                  <textarea
                    rows={2}
                    value={bookingPurpose}
                    onChange={(e) => setBookingPurpose(e.target.value)}
                    placeholder="ระบุวัตถุประสงค์การใช้ห้อง เช่น ฝึกหัดจัดรายการสด / อัดผลงานวิชาเรียน..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-medium resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">5. รหัสนักศึกษา</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={bookingStudentId}
                    onChange={(e) => setBookingStudentId(e.target.value)}
                    placeholder="รหัสนักศึกษา 10 หลัก"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-750 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">6. เบอร์โทร</label>
                  <input
                    type="tel"
                    maxLength={12}
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="เช่น 089XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-750 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl py-3 text-xs transition-colors shadow-md shadow-indigo-600/15"
              >
                ⚡ ส่งคำขอจองห้องจัดรายการ
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Active Room Bookings tracking & scheduling view (7-cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active bookings list board */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-xs border-b border-slate-50 pb-2 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  กระดานคิวและสถานะยืนยันการจองสตูดิโอ (Room Booking Queue)
                </span>
                <span className="bg-slate-100 font-mono text-[9px] text-slate-500 px-2 py-0.5 rounded-full">
                  ทั้งหมด {bookings.length} คำขอ
                </span>
              </h4>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {bookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                    <Clock className="w-8 h-8 text-slate-200" />
                    <p className="font-medium text-slate-500">ยังไม่มีผู้ใดยื่นจองสตูดิโอในระบบ</p>
                  </div>
                ) : (
                  bookings.map((b) => (
                    <div key={b.id} className="border border-slate-50 rounded-xl p-3 bg-slate-50/15 hover:bg-slate-50/40 transition-colors flex justify-between items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-800">{b.roomName}</span>
                          <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            {b.timeSlot}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-980/70 font-medium">
                          โดย {b.studentName} ใน {b.date}
                        </p>
                        {b.studentIdInput && b.phone && (
                          <p className="text-[9px] text-slate-400 font-mono">
                            รหัสนักศึกษา: {b.studentIdInput} • เบอร์โทร: {b.phone}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 font-medium italic mt-0.5">
                          "{b.purpose}"
                        </p>
                      </div>

                      <div className="shrink-0">
                        {b.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#00c58d]/15 border border-[#00c58d]/30 text-[#00c58d] shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00c58d] animate-pulse"></span>
                            อนุมัติแล้ว
                          </span>
                        ) : b.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#ff2d55]/15 border border-[#ff2d55]/30 text-[#ff2d55] shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d55]"></span>
                            ปฏิเสธแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#f59e0b] shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse"></span>
                            รออนุมัติ
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Broadcasting schedule schedule for students to inspect */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-xs border-b border-slate-50 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-pink-600 animate-pulse" />
                  ผังรายการสดสถานีสื่อโทรทัศน์/วิทยุ (Broadcasting Schedules)
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                    🔴 LIVE {programs.filter(p => p.status === 'active').length}
                  </span>
                </div>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[280px] overflow-y-auto pr-1">
                {programs.map((prog) => (
                  <div key={prog.id} className="border border-slate-50 hover:bg-slate-50/20 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="bg-slate-100 text-[9px] font-mono font-bold text-slate-500 px-1.5 py-0.2 rounded uppercase">
                          {prog.category}
                        </span>
                        {prog.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#ef4444]/12 border border-[#ef4444]/25 text-[#ef4444] animate-pulse">
                            <span className="w-1 h-1 rounded-full bg-[#ef4444]"></span>
                            🔴 LIVE NOW
                          </span>
                        ) : prog.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-400">
                            ✓ เสร็จสิ้น
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#f59e0b]">
                            ⏳ เตรียมพร้อม
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-slate-850 font-display line-clamp-1">
                        {prog.subject ? prog.subject : prog.programName}
                      </h5>
                      {prog.purpose && (
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          วัตถุประสงค์: <span className="font-semibold text-slate-700">{prog.purpose}</span>
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400">
                        ผู้จัด: <span className="font-semibold text-slate-600">{prog.hosts}</span>
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>{prog.roomName}</span>
                      <span>{prog.timeSlot}</span>
                    </div>
                  </div>
                ))}

                {programs.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 text-center py-6 text-slate-400 text-xs">
                    ยังไม่ได้จัดผังรายการการออกอากาศในระบบ
                  </div>
                )}
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
                          <option value="09:00 - 10:00">09:00 - 10:00</option>
                          <option value="10:00 - 11:00">10:00 - 11:00</option>
                          <option value="11:00 - 12:00">11:00 - 12:00</option>
                          <option value="13:00 - 14:00">13:00 - 14:00</option>
                          <option value="14:00 - 15:00">14:00 - 15:00</option>
                          <option value="15:00 - 16:00">15:00 - 16:00</option>
                          <option value="16:00 - 17:00">16:00 - 17:00</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">4. รายวิชาเรียน</label>
                        <input
                          type="text"
                          value={bookingSubject}
                          onChange={(e) => setBookingSubject(e.target.value)}
                          required
                          placeholder="ระบุรหัสวิชา/ชื่อวิชา เช่น CA102 วิทยุกระจายเสียง"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">วัตถุประสงค์การใช้งาน</label>
                        <textarea
                          rows={2.5}
                          value={bookingPurpose}
                          onChange={(e) => setBookingPurpose(e.target.value)}
                          required
                          placeholder="เช่น ซ้อมจัดรายการเพลงสั้น / อัดเทปส่งอาจารย์กลุ่ม / งานสัมมนาพอดแคสต์..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-medium resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">5. รหัสนักศึกษาผู้จอง</label>
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
                        <label className="text-[11px] font-extrabold text-slate-700 block mb-1">6. เบอร์โทรศัพท์ติดต่อ</label>
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

  </div>
);
}
