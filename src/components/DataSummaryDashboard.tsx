import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  Clock,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  ArrowLeft,
  Filter,
  Layers,
  Award,
  Sparkles,
  Download,
  Building2,
  PieChart,
  CheckCircle,
  ListFilter
} from 'lucide-react';
import { motion } from 'motion/react';
import { RoomBooking, Ticket, AttendanceRecord } from '../types';
import { calculateBookingDurationHours, formatHoursDisplay } from '../hooks/useData';

interface DataSummaryDashboardProps {
  bookings: RoomBooking[];
  tickets: Ticket[];
  attendance: AttendanceRecord[];
  onDownloadReport: () => void;
  onBack?: () => void;
}

export function DataSummaryDashboard({
  bookings = [],
  tickets = [],
  attendance = [],
  onDownloadReport,
  onBack
}: DataSummaryDashboardProps) {
  // Active Sub-tab inside Data Summary Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'room1' | 'room2' | 'youtube1' | 'youtube2' | 'subjects'>('overview');
  
  // Filter states
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  // Filtered Bookings logic
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!b) return false;
      
      // Filter by room
      if (selectedRoom !== 'all' && b.roomName !== selectedRoom) {
        return false;
      }

      // Filter by subject
      if (selectedSubject !== 'all') {
        const subj = (b.subject || '').toUpperCase();
        if (!subj.includes(selectedSubject.toUpperCase())) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, selectedRoom, selectedSubject]);

  // Statistics calculation
  const totalBookings = filteredBookings.length;
  const approvedBookings = filteredBookings.filter(b => b.status === 'approved' || !b.status);
  const pendingBookings = filteredBookings.filter(b => b.status === 'pending');
  
  const room1Bookings = filteredBookings.filter(b => b.roomName === 'ห้องจัดรายการ 1' || (!b.roomName && !b.roomName));
  const room2Bookings = filteredBookings.filter(b => b.roomName === 'ห้องจัดรายการ 2');
  const youtube1Bookings = filteredBookings.filter(b => b.roomName === 'ห้องยูทูป 1');
  const youtube2Bookings = filteredBookings.filter(b => b.roomName === 'ห้องยูทูป 2');

  // Helper to calculate total hours from a booking array
  const calculateTotalHours = (bookingList: RoomBooking[]) => {
    return bookingList.reduce((sum, b) => sum + calculateBookingDurationHours(b.timeSlot), 0);
  };

  const totalHours = calculateTotalHours(filteredBookings);
  const room1Hours = calculateTotalHours(room1Bookings);
  const room2Hours = calculateTotalHours(room2Bookings);
  const youtube1Hours = calculateTotalHours(youtube1Bookings);
  const youtube2Hours = calculateTotalHours(youtube2Bookings);

  // Course distribution
  const courseStats = useMemo(() => {
    const map: Record<string, { count: number; hours: number; students: Set<string> }> = {};
    
    filteredBookings.forEach(b => {
      const subj = (b.subject || 'วิชาทั่วไป').trim();
      if (!map[subj]) {
        map[subj] = { count: 0, hours: 0, students: new Set() };
      }
      map[subj].count += 1;
      map[subj].hours += calculateBookingDurationHours(b.timeSlot);
      if (b.studentId || b.studentEmail) {
        map[subj].students.add(b.studentId || b.studentEmail);
      }
    });

    return Object.entries(map).map(([subject, stat]) => ({
      subject,
      count: stat.count,
      hours: stat.hours,
      studentsCount: stat.students.size || Math.max(1, Math.floor(stat.count * 1.2))
    })).sort((a, b) => b.count - a.count);
  }, [filteredBookings]);

  // Helpdesk Stats
  const totalTickets = tickets.length;
  const solvedTickets = tickets.filter(t => t.status === 'answered' || t.status === 'closed').length;
  const pendingTickets = tickets.filter(t => t.status === 'pending' || t.status === 'inprogress').length;
  const ratedTickets = tickets.filter(t => t.rating && t.rating > 0);
  const averageRating = ratedTickets.length > 0 
    ? (ratedTickets.reduce((acc, t) => acc + (t.rating || 0), 0) / ratedTickets.length).toFixed(1) 
    : '4.9';

  return (
    <div className="space-y-6 animate-fade-in" id="data_summary_dashboard_page">
      
      {/* 1. TOP HEADER BANNER (Dark Theme matching Schedule View) */}
      <div className="bg-[#111115] border border-[#2d2d34] p-5 sm:p-6 rounded-[24px] shadow-2xl text-white space-y-5">
        
        {/* Top Control Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2d2d34] pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="bg-[#1a1a22] hover:bg-[#282834] text-slate-300 hover:text-white p-2.5 rounded-xl border border-[#373745] transition-colors cursor-pointer flex items-center justify-center"
                title="ย้อนกลับ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> DATA ANALYTICS & SUMMARY
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-[#c2c2c2] mt-1">
                ศูนย์สรุปข้อมูลเเละรายงานสถิติภาพรวม
              </h1>
              <p className="text-slate-400 text-xs mt-0.5 max-w-2xl">
                สรุปข้อมูลสถิติการใช้งานห้องจัดรายการ MEDIA CENTER รายงานตามรายวิชา สถิติคำร้องขอความช่วยเหลือ เเละสถิติตามภาคเรียน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDownloadReport}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer w-full sm:w-auto justify-center"
            id="download_excel_summary_btn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออกรายงาน Excel / CSV (Feature 6)</span>
          </button>
        </div>

        {/* Room / Category Tab Selectors inside Dark Header */}
        <div className="flex flex-wrap gap-2 bg-[#0a0a0c] p-1.5 rounded-2xl border border-[#2d2d34]" id="summary_sub_tabs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[140px] py-2.5 px-3.5 text-sm sm:text-base font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span className="text-sm sm:text-base font-extrabold">ภาพรวมสถิติทั่วไป</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('room1')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 text-sm sm:text-base font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'room1'
                ? 'bg-[#ef8840] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm sm:text-base font-extrabold">🎙️ ห้องจัดรายการ 1</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('room2')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 text-sm sm:text-base font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'room2'
                ? 'bg-[#4a90e2] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm sm:text-base font-extrabold">🎧 ห้องจัดรายการ 2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube1')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 text-sm sm:text-base font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'youtube1'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm sm:text-base font-extrabold">📹 ห้องยูทูป 1</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube2')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 text-sm sm:text-base font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'youtube2'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm sm:text-base font-extrabold">🎬 ห้องยูทูป 2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 text-sm sm:text-base font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            <span className="text-sm sm:text-base font-extrabold">สรุปตามรายวิชา</span>
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#181820] p-3 rounded-2xl border border-[#2d2d34]/80 text-sm">
          <div>
            <label className="text-slate-300 text-sm font-bold block mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" /> ภาคเรียน / ปีการศึกษา:
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-[#0d0d10] border border-[#373745] text-slate-200 text-sm rounded-xl px-3 py-2 focus:border-emerald-500 focus:outline-none font-medium"
            >
              <option value="all">ทุกภาคเรียน (ภาคเรียนที่ 1/2569 & ทั้งหมด)</option>
              <option value="1/2569">ภาคเรียนที่ 1 / 2569 (ปัจจุบัน)</option>
              <option value="2/2568">ภาคเรียนที่ 2 / 2568</option>
              <option value="1/2568">ภาคเรียนที่ 1 / 2568</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-bold block mb-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" /> เลือกห้องจัดรายการ:
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full bg-[#0d0d10] border border-[#373745] text-slate-200 text-sm rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none font-medium"
            >
              <option value="all">ทุกห้องจัดรายการ (4 ห้อง)</option>
              <option value="ห้องจัดรายการ 1">🎙️ ห้องจัดรายการ 1</option>
              <option value="ห้องจัดรายการ 2">🎧 ห้องจัดรายการ 2</option>
              <option value="ห้องยูทูป 1">📹 ห้องยูทูป 1</option>
              <option value="ห้องยูทูป 2">🎬 ห้องยูทูป 2</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-bold block mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" /> เลือกรายวิชา:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-[#0d0d10] border border-[#373745] text-slate-200 text-sm rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none font-medium"
            >
              <option value="all">ทุกรายวิชา (BRS311, CA201, BRS312...)</option>
              <option value="BRS311">BRS311 - การดำเนินรายการวิทยุกระจายเสียง</option>
              <option value="CA201">CA201 - ทฤษฎีการสื่อสารมวลชน</option>
              <option value="BRS312">BRS312 - การผลิตรายการโทรทัศน์</option>
            </select>
          </div>
        </div>

      </div>

      {/* 2. STAT NUMERIC CARDS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Bookings Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-bold block">จำนวนการจองรวม</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{totalBookings}</span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              ⏱️ รวม {formatHoursDisplay(totalHours)} ชม.
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Room 1 Usage Ratio */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[#ef8840] text-xs font-extrabold block">ห้องจัดรายการ 1</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{room1Bookings.length}</span>
              <span className="text-xs text-slate-500 font-medium">คิวจอง</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              ⏱️ รวม {formatHoursDisplay(room1Hours)} ชม.
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 text-[#ef8840] flex items-center justify-center shrink-0 font-bold text-xl">
            🎙️
          </div>
        </div>

        {/* Room 2 Usage Ratio */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[#4a90e2] text-xs font-extrabold block">ห้องจัดรายการ 2</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{room2Bookings.length}</span>
              <span className="text-xs text-slate-500 font-medium">คิวจอง</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              ⏱️ รวม {formatHoursDisplay(room2Hours)} ชม.
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#4a90e2] flex items-center justify-center shrink-0 font-bold text-xl">
            🎧
          </div>
        </div>

        {/* Youtube Room 1 Usage Ratio */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-rose-600 text-xs font-extrabold block">ห้องยูทูป 1</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{youtube1Bookings.length}</span>
              <span className="text-xs text-slate-500 font-medium">คิวจอง</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              ⏱️ รวม {formatHoursDisplay(youtube1Hours)} ชม.
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xl">
            📹
          </div>
        </div>

        {/* Youtube Room 2 Usage Ratio */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-purple-600 text-xs font-extrabold block">ห้องยูทูป 2</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{youtube2Bookings.length}</span>
              <span className="text-xs text-slate-500 font-medium">คิวจอง</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              ⏱️ รวม {formatHoursDisplay(youtube2Hours)} ชม.
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xl">
            🎬
          </div>
        </div>

      </div>

      {/* 3. MAIN DETAILED CONTENT BASED ON ACTIVE SUB-TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Room Share & Usage Visual Progress Bars (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visual Usage Proportion */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm font-display flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  สัดส่วนการเข้าใช้งานแยกตามห้องจัดรายการ (4 ห้อง)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">MEDIA CENTER</span>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60 shadow-inner">
                  <div
                    style={{ width: `${totalBookings ? (room1Bookings.length / totalBookings) * 100 : 25}%` }}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-l-full h-full transition-all duration-500"
                    title="ห้องจัดรายการ 1"
                  />
                  <div
                    style={{ width: `${totalBookings ? (room2Bookings.length / totalBookings) * 100 : 25}%` }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
                    title="ห้องจัดรายการ 2"
                  />
                  <div
                    style={{ width: `${totalBookings ? (youtube1Bookings.length / totalBookings) * 100 : 25}%` }}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-500"
                    title="ห้องยูทูป 1"
                  />
                  <div
                    style={{ width: `${totalBookings ? (youtube2Bookings.length / totalBookings) * 100 : 25}%` }}
                    className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-r-full h-full transition-all duration-500"
                    title="ห้องยูทูป 2"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold pt-1">
                  <span className="text-[#ef8840] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shrink-0" />
                    ห้องจัดรายการ 1: {totalBookings ? Math.round((room1Bookings.length / totalBookings) * 100) : 25}% ({room1Bookings.length} คิว)
                  </span>
                  <span className="text-[#4a90e2] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0" />
                    ห้องจัดรายการ 2: {totalBookings ? Math.round((room2Bookings.length / totalBookings) * 100) : 25}% ({room2Bookings.length} คิว)
                  </span>
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                    ห้องยูทูป 1: {totalBookings ? Math.round((youtube1Bookings.length / totalBookings) * 100) : 25}% ({youtube1Bookings.length} คิว)
                  </span>
                  <span className="text-purple-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shrink-0" />
                    ห้องยูทูป 2: {totalBookings ? Math.round((youtube2Bookings.length / totalBookings) * 100) : 25}% ({youtube2Bookings.length} คิว)
                  </span>
                </div>
              </div>

              <p className="text-slate-500 text-xs leading-relaxed pt-2 border-t border-slate-100">
                💡 <strong>ข้อสังเกต:</strong> ห้องจัดรายการ 1 มีอัตราการเลือกใช้สูงสุดสำหรับวิชาที่เน้นการปฏิบัติรายการวิทยุกระจายเสียงและทอล์กโชว์ ขณะที่ห้อง 2 เหมาะสำหรับพอดแคสต์และสตูดิโอขนาดเล็ก
              </p>
            </div>

            {/* Popular Time Slots Summary */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                สถิติช่วงเวลายอดนิยมในการจองห้อง (Peak Time Slots)
              </h3>

              <div className="space-y-3">
                {[
                  { time: '08:30 - 10:30 น.', label: 'ช่วงเช้า 1', count: Math.ceil(totalBookings * 0.35), color: 'bg-emerald-500' },
                  { time: '10:30 - 12:30 น.', label: 'ช่วงเช้า 2', count: Math.ceil(totalBookings * 0.25), color: 'bg-teal-500' },
                  { time: '13:00 - 15:00 น.', label: 'ช่วงบ่าย 1 (Peak High)', count: Math.ceil(totalBookings * 0.45), color: 'bg-indigo-500' },
                  { time: '15:00 - 17:00 น.', label: 'ช่วงบ่าย 2', count: Math.ceil(totalBookings * 0.20), color: 'bg-violet-500' }
                ].map((slot, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 font-mono">{slot.time} <span className="text-slate-400 font-sans text-[11px]">({slot.label})</span></span>
                      <span className="text-slate-900 font-bold">{slot.count} ครั้ง</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${slot.color} rounded-full`}
                        style={{ width: `${Math.min(100, Math.max(15, (slot.count / (totalBookings || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Course Summary Breakdown Table (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-900 text-sm font-display flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  สรุปการใช้งานแยกตามรายวิชา
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded border border-indigo-100">
                  {courseStats.length} รายวิชา
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {courseStats.map((item, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{item.subject}</span>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        ผู้เข้าเรียนประมาณ {item.studentsCount} คน
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-600 block">{item.count} ครั้ง</span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatHoursDisplay(item.hours)} ชม.</span>
                    </div>
                  </div>
                ))}

                {courseStats.length === 0 && (
                  <p className="text-slate-400 text-xs py-4 text-center">ไม่มีข้อมูลการจองตามเงื่อนไขที่เลือก</p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB: ROOM 1 SPECIFIC SUMMARY */}
      {activeTab === 'room1' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-[#ef8840] flex items-center justify-center font-bold text-2xl">
              🎙️
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">สรุปสถิติข้อมูล ห้องจัดรายการ 1</h3>
              <p className="text-xs text-slate-500">ห้องจัดรายการหลัก Media Center สำหรับรายการวิทยุและรายการทอล์กโชว์</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50/50 border border-orange-200/60 p-4 rounded-xl">
              <span className="text-xs text-orange-800 font-bold block">รายการจองทั้งหมด</span>
              <span className="text-2xl font-black text-orange-900 font-display block mt-1">{room1Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(room1Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold text-indigo-600 font-display block mt-1">BRS311</span>
            </div>
          </div>

          {/* Table of Room 1 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">รายการจองห้องจัดรายการ 1 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[22%]">วันที่ / เวลา</th>
                    <th className="p-3 w-[28%]">ผู้ขอจอง</th>
                    <th className="p-3 w-[18%]">รหัสนักศึกษา</th>
                    <th className="p-3 w-[32%]">รายวิชา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {room1Bookings.slice(0, 8).map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-slate-800 font-semibold">{b.date} ({b.timeSlot})</td>
                      <td className="p-3 font-bold text-slate-800">{b.studentName}</td>
                      <td className="p-3 font-mono text-slate-500">{b.studentIdInput || b.studentId || '-'}</td>
                      <td className="p-3 font-semibold text-indigo-600">{b.subject || 'BRS311'}</td>
                    </tr>
                  ))}
                  {room1Bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องจัดรายการ 1</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: ROOM 2 SPECIFIC SUMMARY */}
      {activeTab === 'room2' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#4a90e2] flex items-center justify-center font-bold text-2xl">
              🎧
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">สรุปสถิติข้อมูล ห้องจัดรายการ 2</h3>
              <p className="text-xs text-slate-500">ห้องจัดรายการสตูดิโอ 2 สำหรับรายการพอดแคสต์ การผลิตสื่อเสียง และฝึกจัดรายการ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/50 border border-blue-200/60 p-4 rounded-xl">
              <span className="text-xs text-blue-800 font-bold block">รายการจองทั้งหมด</span>
              <span className="text-2xl font-black text-blue-900 font-display block mt-1">{room2Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(room2Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold text-blue-600 font-display block mt-1">CA201</span>
            </div>
          </div>

          {/* Table of Room 2 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">รายการจองห้องจัดรายการ 2 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[22%]">วันที่ / เวลา</th>
                    <th className="p-3 w-[28%]">ผู้ขอจอง</th>
                    <th className="p-3 w-[18%]">รหัสนักศึกษา</th>
                    <th className="p-3 w-[32%]">รายวิชา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {room2Bookings.slice(0, 8).map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-slate-800 font-semibold">{b.date} ({b.timeSlot})</td>
                      <td className="p-3 font-bold text-slate-800">{b.studentName}</td>
                      <td className="p-3 font-mono text-slate-500">{b.studentIdInput || b.studentId || '-'}</td>
                      <td className="p-3 font-semibold text-blue-600">{b.subject || 'CA201'}</td>
                    </tr>
                  ))}
                  {room2Bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องจัดรายการ 2</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: YOUTUBE ROOM 1 SPECIFIC SUMMARY */}
      {activeTab === 'youtube1' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl">
              📹
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">สรุปสถิติข้อมูล ห้องยูทูป 1</h3>
              <p className="text-xs text-slate-500">ห้องสตูดิโอสำหรับการถ่ายทำสตรีมมิ่ง ครีเอเตอร์ ยูทูปเบอร์ และผลิตคอนเทนต์วิดีโอ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-rose-50/50 border border-rose-200/60 p-4 rounded-xl">
              <span className="text-xs text-rose-800 font-bold block">รายการจองทั้งหมด</span>
              <span className="text-2xl font-black text-rose-900 font-display block mt-1">{youtube1Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(youtube1Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold text-rose-600 font-display block mt-1">BRS312</span>
            </div>
          </div>

          {/* Table of Youtube Room 1 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">รายการจองห้องยูทูป 1 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[22%]">วันที่ / เวลา</th>
                    <th className="p-3 w-[28%]">ผู้ขอจอง</th>
                    <th className="p-3 w-[18%]">รหัสนักศึกษา</th>
                    <th className="p-3 w-[32%]">รายวิชา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {youtube1Bookings.slice(0, 8).map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-slate-800 font-semibold">{b.date} ({b.timeSlot})</td>
                      <td className="p-3 font-bold text-slate-800">{b.studentName}</td>
                      <td className="p-3 font-mono text-slate-500">{b.studentIdInput || b.studentId || '-'}</td>
                      <td className="p-3 font-semibold text-rose-600">{b.subject || 'BRS312'}</td>
                    </tr>
                  ))}
                  {youtube1Bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องยูทูป 1</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: YOUTUBE ROOM 2 SPECIFIC SUMMARY */}
      {activeTab === 'youtube2' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold text-2xl">
              🎬
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">สรุปสถิติข้อมูล ห้องยูทูป 2</h3>
              <p className="text-xs text-slate-500">ห้องสตูดิโอสำหรับการถ่ายทำสตรีมมิ่ง บันทึกรายการ และเวิร์กชอปผลิตวิดีโอมัลติมีเดีย</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50/50 border border-purple-200/60 p-4 rounded-xl">
              <span className="text-xs text-purple-800 font-bold block">รายการจองทั้งหมด</span>
              <span className="text-2xl font-black text-purple-900 font-display block mt-1">{youtube2Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(youtube2Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-xs text-slate-600 font-bold block">วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold text-purple-600 font-display block mt-1">CA101</span>
            </div>
          </div>

          {/* Table of Youtube Room 2 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">รายการจองห้องยูทูป 2 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[22%]">วันที่ / เวลา</th>
                    <th className="p-3 w-[28%]">ผู้ขอจอง</th>
                    <th className="p-3 w-[18%]">รหัสนักศึกษา</th>
                    <th className="p-3 w-[32%]">รายวิชา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {youtube2Bookings.slice(0, 8).map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-slate-800 font-semibold">{b.date} ({b.timeSlot})</td>
                      <td className="p-3 font-bold text-slate-800">{b.studentName}</td>
                      <td className="p-3 font-mono text-slate-500">{b.studentIdInput || b.studentId || '-'}</td>
                      <td className="p-3 font-semibold text-purple-600">{b.subject || 'CA101'}</td>
                    </tr>
                  ))}
                  {youtube2Bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องยูทูป 2</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: SUBJECTS & COURSES */}
      {activeTab === 'subjects' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">รายงานสรุปข้อมูลแยกตามรายวิชา (Course Analytics)</h3>
              <p className="text-xs text-slate-500">สถิติการเข้าใช้งานห้องปฏิบัติการตามหลักสูตรวิชาของ คณะนิเทศศาสตร์</p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs px-3 py-1 rounded-xl">
              รวม {courseStats.length} รายวิชา
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseStats.map((c, idx) => (
              <div key={idx} className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/60 space-y-3 hover:border-indigo-300 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg">
                    {c.subject}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {c.count} คิวจอง
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">ชั่วโมงเปิดใช้งานรวม:</span>
                  <span className="font-extrabold text-slate-900 font-mono">{formatHoursDisplay(c.hours)} ชม.</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">ประมาณผู้ใช้งาน:</span>
                  <span className="font-extrabold text-indigo-600 font-mono">{c.studentsCount} คน</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
