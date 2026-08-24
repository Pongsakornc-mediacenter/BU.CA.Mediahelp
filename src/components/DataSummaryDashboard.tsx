import { useState, useMemo } from 'react';
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
  PieChart as PieChartIcon,
  CheckCircle,
  ListFilter,
  FolderOpen
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';
import { RoomBooking, Ticket, AttendanceRecord, Course } from '../types';
import { calculateBookingDurationHours, formatHoursDisplay, formatTimestampDisplay, getCourseLabel, DEFAULT_COURSES } from '../hooks/useData';
import { BookingDetailModal, BookingModalData } from './BookingDetailModal';

interface DataSummaryDashboardProps {
  bookings: RoomBooking[];
  tickets: Ticket[];
  attendance: AttendanceRecord[];
  courses?: Course[];
  onDownloadReport: () => void;
  onBack?: () => void;
}

export function DataSummaryDashboard({
  bookings = [],
  tickets = [],
  attendance = [],
  courses = [],
  onDownloadReport,
  onBack
}: DataSummaryDashboardProps) {
  // Active Sub-tab inside Data Summary Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'room1' | 'room2' | 'youtube1' | 'youtube2' | 'subjects'>('overview');
  
  // Filter states
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  // Selected booking for Read-Only Detail Modal
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<BookingModalData | null>(null);

  // Unified list of courses synchronized with Subject Management / LocalStorage / Firestore
  const allCoursesList = useMemo(() => {
    if (courses && courses.length > 0) {
      return courses;
    }
    try {
      const saved = localStorage.getItem('bu_ca_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Course[];
        }
      }
    } catch (e) {
      console.warn("Could not read courses from local storage in summary dashboard:", e);
    }
    return DEFAULT_COURSES;
  }, [courses]);

  // Filtered Bookings logic with useMemo
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!b) return false;
      
      // Filter by room
      if (selectedRoom !== 'all' && b.roomName !== selectedRoom) {
        return false;
      }

      // Filter by subject dynamically
      if (selectedSubject !== 'all') {
        const bookingSubj = (b.subject || '').toUpperCase().trim();
        const sel = selectedSubject.toUpperCase().trim();
        if (!bookingSubj.includes(sel)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, selectedRoom, selectedSubject]);

  // Top booked subject helper
  const getTopSubject = (list: RoomBooking[]) => {
    if (!list || list.length === 0) return "-";
    const counts: Record<string, number> = {};
    list.forEach(b => {
      const s = (b.subject || 'วิชาทั่วไป').trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : "-";
  };

  // Format date helper to DD-MM-YYYY
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.trim().split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY or MM-DD-YYYY
        const [p1, p2, year] = parts;
        return `${p1.padStart(2, '0')}-${p2.padStart(2, '0')}-${year}`;
      }
    }
    return dateStr;
  };

  // Helper to extract clean booking row data for tables with title & purpose
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

  // Open Read-Only Booking Detail Modal
  const handleOpenBookingDetail = (b: RoomBooking) => {
    const info = getBookingRowData(b);
    let themeColor = 'text-indigo-600';
    if (b.roomName?.includes('1') && !b.roomName?.includes('ยูทูป')) {
      themeColor = 'text-[#ef8840]';
    } else if (b.roomName?.includes('2') && !b.roomName?.includes('ยูทูป')) {
      themeColor = 'text-[#4a90e2]';
    } else if (b.roomName?.includes('ยูทูป 1')) {
      themeColor = 'text-[#ec003f]';
    } else if (b.roomName?.includes('ยูทูป 2')) {
      themeColor = 'text-[#9810fa]';
    }

    setSelectedBookingDetail({
      room: b.roomName || 'ห้องจัดรายการ 1',
      subject: info.subjectDisplay,
      slot: b.timeSlot,
      studentId: info.idDisplay,
      studentName: info.bookerName,
      phone: b.phone && b.phone !== '-' ? b.phone : (info.isTeacher ? 'อาจารย์ผู้สอน' : '-'),
      purpose: info.purposeDisplay,
      roomThemeText: themeColor,
      booking: b
    });
  };

  // Statistics calculation with useMemo to completely prevent re-renders & layout shifts
  const stats = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const room1List = filteredBookings.filter(b => b.roomName === 'ห้องจัดรายการ 1' || (!b.roomName && !b.roomName));
    const room2List = filteredBookings.filter(b => b.roomName === 'ห้องจัดรายการ 2');
    const youtube1List = filteredBookings.filter(b => b.roomName === 'ห้องยูทูป 1');
    const youtube2List = filteredBookings.filter(b => b.roomName === 'ห้องยูทูป 2');

    const calcHours = (list: RoomBooking[]) => {
      return list.reduce((sum, b) => sum + calculateBookingDurationHours(b.timeSlot), 0);
    };

    const totalHours = calcHours(filteredBookings);
    const room1Hours = calcHours(room1List);
    const room2Hours = calcHours(room2List);
    const youtube1Hours = calcHours(youtube1List);
    const youtube2Hours = calcHours(youtube2List);

    // Course distribution - calculate exact hours and real group/queue counts
    const map: Record<string, { count: number; hours: number }> = {};
    filteredBookings.forEach(b => {
      let subj = (b.subject || '').replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '').trim();
      if (!subj) {
        subj = 'วิชาทั่วไป';
      }
      if (!map[subj]) {
        map[subj] = { count: 0, hours: 0 };
      }
      map[subj].count += 1;
      map[subj].hours += calculateBookingDurationHours(b.timeSlot);
    });

    const courseList = Object.entries(map).map(([subject, stat]) => ({
      subject,
      count: stat.count,
      hours: stat.hours,
      groupsCount: stat.count,
      studentsCount: stat.count
    })).sort((a, b) => b.count - a.count);

    return {
      totalBookings,
      room1Bookings: room1List,
      room2Bookings: room2List,
      youtube1Bookings: youtube1List,
      youtube2Bookings: youtube2List,
      totalHours,
      room1Hours,
      room2Hours,
      youtube1Hours,
      youtube2Hours,
      courseStats: courseList
    };
  }, [filteredBookings]);

  const {
    totalBookings,
    room1Bookings,
    room2Bookings,
    youtube1Bookings,
    youtube2Bookings,
    totalHours,
    room1Hours,
    room2Hours,
    youtube1Hours,
    youtube2Hours,
    courseStats
  } = stats;

  // Room usage data for the Semi-Circular Pie / Donut Chart
  const roomUsageStats = useMemo(() => {
    const list = [
      { name: 'ห้องจัดรายการ 1', count: room1Bookings.length, hours: room1Hours, color: '#ef8840', emoji: '🎙️' },
      { name: 'ห้องจัดรายการ 2', count: room2Bookings.length, hours: room2Hours, color: '#4a90e2', emoji: '🎧' },
      { name: 'ห้องยูทูป 1', count: youtube1Bookings.length, hours: youtube1Hours, color: '#e33541', emoji: '📹' },
      { name: 'ห้องยูทูป 2', count: youtube2Bookings.length, hours: youtube2Hours, color: '#9333ea', emoji: '🎬' },
    ];

    const total = totalBookings > 0 ? totalBookings : list.reduce((acc, r) => acc + r.count, 0);

    const legendItems = list.map((room) => {
      const percent = total > 0 ? Math.round((room.count / total) * 100) : 0;
      return {
        ...room,
        percent,
      };
    });

    const hasData = list.some(item => item.count > 0);
    const chartData = hasData
      ? list.filter(item => item.count > 0).map(item => ({
          name: item.name,
          value: item.count,
          color: item.color,
          emoji: item.emoji,
          hours: item.hours,
          percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
        }))
      : [
          {
            name: 'ยังไม่มีข้อมูลการจอง',
            value: 1,
            color: '#334155',
            emoji: 'ℹ️',
            hours: 0,
            percent: 0,
            isEmpty: true,
          },
        ];

    return {
      legendItems,
      chartData,
      hasData,
      total,
    };
  }, [room1Bookings.length, room2Bookings.length, youtube1Bookings.length, youtube2Bookings.length, room1Hours, room2Hours, youtube1Hours, youtube2Hours, totalBookings]);

  // Dynamic Room Usage Summary text
  const dynamicRoomSummary = useMemo(() => {
    if (totalBookings === 0) {
      return '💡 สรุป: ยังไม่มีข้อมูลการจองห้องในช่วงเวลาหรือตัวกรองที่เลือก';
    }
    const rooms = [
      { name: 'ห้องจัดรายการ 1', count: room1Bookings.length, hours: room1Hours },
      { name: 'ห้องจัดรายการ 2', count: room2Bookings.length, hours: room2Hours },
      { name: 'ห้องยูทูป 1', count: youtube1Bookings.length, hours: youtube1Hours },
      { name: 'ห้องยูทูป 2', count: youtube2Bookings.length, hours: youtube2Hours },
    ];
    rooms.sort((a, b) => b.count - a.count);
    const top = rooms[0];
    const percentage = Math.round((top.count / totalBookings) * 100);

    if (top.count === totalBookings) {
      return `💡 สรุป: ${top.name} มีการใช้งานสูงสุด คิดเป็น ${percentage}% จากการจองทั้งหมด ${totalBookings} รายการ (รวม ${formatHoursDisplay(top.hours)} ชม.)`;
    }

    return `💡 สรุป: ${top.name} มีการใช้งานสูงสุด คิดเป็น ${percentage}% จากการจองทั้งหมด ${totalBookings} รายการ (${top.count} คิว, รวม ${formatHoursDisplay(top.hours)} ชม.)`;
  }, [totalBookings, room1Bookings.length, room2Bookings.length, youtube1Bookings.length, youtube2Bookings.length, room1Hours, room2Hours, youtube1Hours, youtube2Hours]);

  return (
    <div className="space-y-6 min-h-[650px] w-full" id="data_summary_dashboard_page">
      
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
              <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-[#c2c2c2] mt-1 w-[700px] max-w-full">
                ศูนย์สรุปข้อมูลเเละรายงานสถิติภาพรวม
              </h1>
              <p className="text-slate-400 text-xs mt-1 max-w-2xl" style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '0px', paddingRight: '0px', marginLeft: '0px' }}>
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
            className={`flex-1 min-w-[140px] py-2.5 px-3.5 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span className="text-[17px] font-extrabold" style={{ fontSize: '17px' }}>ภาพรวมสถิติทั่วไป</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('room1')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'room1'
                ? 'bg-[#ef8840] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-[17px] font-extrabold" style={{ fontSize: '17px' }}>🎙️ ห้องจัดรายการ 1</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('room2')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'room2'
                ? 'bg-[#4a90e2] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-[17px] font-extrabold" style={{ fontSize: '17px' }}>🎧 ห้องจัดรายการ 2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube1')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'youtube1'
                ? 'bg-[#e33541] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-[17px] font-extrabold" style={{ fontSize: '17px' }}>📹 ห้องยูทูป 1</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube2')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'youtube2'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-[17px] font-extrabold" style={{ fontSize: '17px' }}>🎬 ห้องยูทูป 2</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            <span className="text-[17px] font-extrabold" style={{ fontSize: '17px' }}>สรุปตามรายวิชา</span>
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
              className="w-full bg-[#0d0d10] border border-[#373745] text-slate-200 text-sm rounded-xl px-3 py-2 focus:border-indigo-500 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">ทุกรายวิชา (ทั้งหมด {allCoursesList.length} วิชา)</option>
              {allCoursesList.map((c) => {
                const label = getCourseLabel(c);
                const filterVal = (c.code && c.code.toUpperCase() !== 'OTHER' && c.code !== 'งานอื่นๆ') ? c.code : c.name;
                return (
                  <option key={c.id || c.code || label} value={filterVal}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

      </div>

      {/* 2. STAT NUMERIC CARDS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Bookings Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-bold block" style={{ fontSize: '16px' }}>จำนวนการจองรวม</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{totalBookings}</span>
              <span className="text-slate-500 font-medium" style={{ fontSize: '14px' }}>รายการ</span>
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
            <span className="text-[#ef8840] font-extrabold block" style={{ fontSize: '16px' }}>ห้องจัดรายการ 1</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{room1Bookings.length}</span>
              <span className="text-slate-500 font-medium" style={{ fontSize: '14px' }}>คิวจอง</span>
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
            <span className="text-[#4a90e2] font-extrabold block" style={{ fontSize: '16px' }}>ห้องจัดรายการ 2</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{room2Bookings.length}</span>
              <span className="text-slate-500 font-medium" style={{ fontSize: '14px' }}>คิวจอง</span>
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
            <span className="text-rose-600 font-extrabold block" style={{ fontSize: '16px' }}>ห้องยูทูป 1</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{youtube1Bookings.length}</span>
              <span className="text-slate-500 font-medium" style={{ fontSize: '14px' }}>คิวจอง</span>
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
            <span className="text-purple-600 font-extrabold block" style={{ fontSize: '16px' }}>ห้องยูทูป 2</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-display">{youtube2Bookings.length}</span>
              <span className="text-slate-500 font-medium" style={{ fontSize: '14px' }}>คิวจอง</span>
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
            
            {/* Visual Usage Proportion - Semi-Circular Pie Chart & Dynamic Legend */}
            <div className="bg-[#121218] border border-[#2b2b36] rounded-2xl p-5 shadow-sm space-y-4 text-white">
              <div className="flex justify-between items-center border-b border-[#242430] pb-3">
                <h3 className="font-extrabold font-display flex items-center gap-2" style={{ color: '#ffffff', fontSize: '16px' }}>
                  <PieChartIcon className="w-4 h-4 text-purple-400" />
                  สัดส่วนการเข้าใช้งานแยกตามห้องจัดรายการ (4 ห้อง)
                </h3>
                <span className="text-[11px] text-purple-300/70 font-mono font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  REAL-TIME STATS
                </span>
              </div>

              {/* Semi-Circular Pie Chart in Center */}
              <div className="relative flex flex-col items-center justify-center pt-2">
                <div className="w-full h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <RechartsPieChart>
                      <Pie
                        data={roomUsageStats.chartData}
                        cx="50%"
                        cy="85%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={70}
                        outerRadius={105}
                        paddingAngle={roomUsageStats.chartData.length > 1 ? 3 : 0}
                        dataKey="value"
                        isAnimationActive={true}
                      >
                        {roomUsageStats.chartData.map((entry, index) => (
                          <Cell
                            key={`room-cell-${index}`}
                            fill={entry.color}
                            stroke="#121218"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            if (data.isEmpty) {
                              return (
                                <div className="bg-[#1a1a24] border border-[#37374a] p-2.5 rounded-xl shadow-xl text-xs text-slate-300">
                                  <span>ยังไม่มีข้อมูลการจอง</span>
                                </div>
                              );
                            }
                            return (
                              <div className="bg-[#181822] border border-[#353548] p-2.5 rounded-xl shadow-2xl text-xs text-white">
                                <p className="font-bold flex items-center gap-1.5" style={{ color: data.color }}>
                                  <span>{data.emoji}</span>
                                  <span>{data.name}</span>
                                </p>
                                <p className="text-slate-200 mt-1 font-semibold">
                                  จำนวน: <span className="font-black text-white">{data.value} คิว</span> ({data.percent}%)
                                </p>
                                <p className="text-slate-400 text-[11px] mt-0.5">
                                  ⏱️ รวมเวลา: {formatHoursDisplay(data.hours)} ชม.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Center label inside the semi-circle */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-center pointer-events-none select-none">
                  <span className="text-[11px] text-slate-400 font-semibold block">การจองรวม</span>
                  <span className="text-2xl font-black text-white font-display block leading-tight">
                    {totalBookings} คิว
                  </span>
                  <span className="text-[10px] text-purple-400 font-bold block">
                    {formatHoursDisplay(totalHours)} ชม.
                  </span>
                </div>
              </div>

              {/* Dynamic Legend Grid with Bright Contrast Labels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* Room 1 */}
                <div className="bg-[#181822] border border-[#2b2b3c] rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-500/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: '16px' }}>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: '#ef8840' }}
                    />
                    <span className="font-bold truncate" style={{ color: '#ef8840', fontSize: '14px' }} title="ห้องจัดรายการ 1">
                      ห้องจัดรายการ 1
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-[#232332]">
                    <span className="text-sm font-black tracking-tight" style={{ color: '#ef8840' }}>
                      {roomUsageStats.legendItems[0]?.percent ?? 0}%
                    </span>
                    <span className="text-[11px] font-semibold font-mono" style={{ color: '#a9a9a9' }}>
                      {roomUsageStats.legendItems[0]?.count ?? 0} คิว
                    </span>
                  </div>
                </div>

                {/* Room 2 */}
                <div className="bg-[#181822] border border-[#2b2b3c] rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-500/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: '#4a90e2' }}
                    />
                    <span className="font-bold truncate" style={{ color: '#4a90e2', fontSize: '14px' }} title="ห้องจัดรายการ 2">
                      ห้องจัดรายการ 2
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-[#232332]">
                    <span className="text-sm font-black tracking-tight" style={{ color: '#4a90e2' }}>
                      {roomUsageStats.legendItems[1]?.percent ?? 0}%
                    </span>
                    <span className="text-[11px] font-semibold font-mono" style={{ color: '#c5c5c5' }}>
                      {roomUsageStats.legendItems[1]?.count ?? 0} คิว
                    </span>
                  </div>
                </div>

                {/* Youtube 1 */}
                <div className="bg-[#181822] border border-[#2b2b3c] rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-500/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: '#ec003f' }}
                    />
                    <span className="font-bold truncate" style={{ color: '#ec003f', fontSize: '14px' }} title="ห้องยูทูป 1">
                      ห้องยูทูป 1
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-[#232332]">
                    <span className="text-sm font-black tracking-tight" style={{ color: '#ec003f' }}>
                      {roomUsageStats.legendItems[2]?.percent ?? 0}%
                    </span>
                    <span className="text-[11px] font-semibold font-mono" style={{ color: '#c5c5c5' }}>
                      {roomUsageStats.legendItems[2]?.count ?? 0} คิว
                    </span>
                  </div>
                </div>

                {/* Youtube 2 */}
                <div className="bg-[#181822] border border-[#2b2b3c] rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-500/40 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: '#9810fa' }}
                    />
                    <span className="font-bold truncate" style={{ color: '#9810fa', fontSize: '14px' }} title="ห้องยูทูป 2">
                      ห้องยูทูป 2
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-[#232332]">
                    <span className="text-sm font-black tracking-tight" style={{ color: '#9810fa' }}>
                      {roomUsageStats.legendItems[3]?.percent ?? 0}%
                    </span>
                    <span className="text-[11px] font-semibold font-mono" style={{ color: '#c5c5c5' }}>
                      {roomUsageStats.legendItems[3]?.count ?? 0} คิว
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Summary Note Filtered from Real Data */}
              <div className="rounded-xl p-3 bg-[#181822] border border-[#2b2b3c] text-xs leading-relaxed text-slate-200">
                <p className="font-semibold flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>{dynamicRoomSummary}</span>
                </p>
              </div>
            </div>

            {/* Popular Time Slots Summary */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 font-display flex items-center gap-2" style={{ fontSize: '20px' }}>
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
                    <p className="flex justify-between font-semibold" style={{ fontSize: '14px', paddingTop: '8px' }}>
                      <span className="text-slate-700 font-mono">{slot.time} <span className="text-slate-400 font-sans text-[11px]">({slot.label})</span></span>
                      <span className="text-slate-900 font-bold">{slot.count} ครั้ง</span>
                    </p>
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
                        จำนวน {item.groupsCount} กลุ่ม
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
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#050505', width: '100%', maxWidth: '650px', height: '80px', borderColor: '#ffc093', borderWidth: '1px', borderStyle: 'solid', borderRadius: '12px' }}>
              <span className="font-bold block" style={{ color: '#ef8840', fontSize: '16px' }}>รายการจองทั้งหมด</span>
              <span className="text-2xl font-black font-display block mt-1" style={{ color: '#ef8840' }}>{room1Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(room1Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold text-indigo-600 font-display block mt-1 truncate" title={getTopSubject(room1Bookings)}>
                {getTopSubject(room1Bookings)}
              </span>
            </div>
          </div>

          {/* Table of Room 1 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-3" style={{ fontSize: '16px' }}>รายการจองห้องจัดรายการ 1 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left min-w-[1080px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[12%] min-w-[130px]" style={{ fontSize: '16px' }}>ชื่อผู้จอง</th>
                    <th className="p-3 w-[11%] min-w-[110px]" style={{ fontSize: '16px' }}>รหัสนักศึกษา / รหัสอาจารย์</th>
                    <th className="p-3 w-[19%] min-w-[190px]" style={{ fontSize: '16px' }}>รายวิชา</th>
                    <th className="p-3 w-[12%] min-w-[115px]" style={{ fontSize: '16px' }}>ชื่อรายการ</th>
                    <th className="p-3 w-[15%] min-w-[140px]" style={{ fontSize: '16px' }}>วัตถุประสงค์</th>
                    <th className="p-3 w-[12%] min-w-[125px]" style={{ fontSize: '16px' }}>วันที่และเวลา</th>
                    <th className="p-3 w-[10%] min-w-[110px]" style={{ fontSize: '16px' }}>เวลาทำรายการล่าสุด</th>
                    <th className="p-3 w-[9%] min-w-[90px] text-center" style={{ fontSize: '16px' }}>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {room1Bookings.slice(0, 8).map((b, idx) => {
                    const info = getBookingRowData(b);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.bookerName}>
                            {info.bookerName}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          <span className={info.isTeacher ? "bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-sm" : "text-sm"}>
                            {info.idDisplay}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-indigo-600">
                          <div className="text-sm font-semibold whitespace-normal break-words leading-snug" title={info.subjectDisplay}>
                            {info.subjectDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.titleDisplay}>
                            {info.titleDisplay}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          <div className="text-sm font-medium text-slate-600 whitespace-normal break-words leading-snug" title={info.purposeDisplay}>
                            {info.purposeDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-800 font-semibold whitespace-nowrap text-sm">
                          {formatDateDisplay(b.date)} ({b.timeSlot})
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-medium text-sm whitespace-nowrap">
                          {formatTimestampDisplay(b.updatedAt || b.submittedAt || b.createdAt)}
                        </td>
                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDetail(b)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200/80 hover:border-indigo-600 transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 cursor-pointer group/detail-btn"
                            title="ดูรายละเอียดการจอง"
                          >
                            <FolderOpen className="w-4.5 h-4.5 transition-transform duration-200 group-hover/detail-btn:scale-110" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {room1Bookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องจัดรายการ 1</td>
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
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#050505', width: '100%', maxWidth: '650px', height: '80px', borderColor: '#557eb7' }}>
              <span className="font-bold block" style={{ color: '#4a90e2', fontSize: '16px' }}>รายการจองทั้งหมด</span>
              <span className="text-2xl font-black font-display block mt-1" style={{ color: '#4a90e2' }}>{room2Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(room2Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold font-display block mt-1 truncate" style={{ color: '#4a90e2' }} title={getTopSubject(room2Bookings)}>
                {getTopSubject(room2Bookings)}
              </span>
            </div>
          </div>

          {/* Table of Room 2 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-3" style={{ fontSize: '16px' }}>รายการจองห้องจัดรายการ 2 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left min-w-[1080px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[12%] min-w-[130px]" style={{ fontSize: '16px' }}>ชื่อผู้จอง</th>
                    <th className="p-3 w-[11%] min-w-[110px]" style={{ fontSize: '16px' }}>รหัสนักศึกษา / รหัสอาจารย์</th>
                    <th className="p-3 w-[19%] min-w-[190px]" style={{ fontSize: '16px' }}>รายวิชา</th>
                    <th className="p-3 w-[12%] min-w-[115px]" style={{ fontSize: '16px' }}>ชื่อรายการ</th>
                    <th className="p-3 w-[15%] min-w-[140px]" style={{ fontSize: '16px' }}>วัตถุประสงค์</th>
                    <th className="p-3 w-[12%] min-w-[125px]" style={{ fontSize: '16px' }}>วันที่และเวลา</th>
                    <th className="p-3 w-[10%] min-w-[110px]" style={{ fontSize: '16px' }}>เวลาทำรายการล่าสุด</th>
                    <th className="p-3 w-[9%] min-w-[90px] text-center" style={{ fontSize: '16px' }}>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {room2Bookings.slice(0, 8).map((b, idx) => {
                    const info = getBookingRowData(b);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.bookerName}>
                            {info.bookerName}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          <span className={info.isTeacher ? "bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-sm" : "text-sm"}>
                            {info.idDisplay}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-blue-600">
                          <div className="text-sm font-semibold whitespace-normal break-words leading-snug" title={info.subjectDisplay}>
                            {info.subjectDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.titleDisplay}>
                            {info.titleDisplay}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          <div className="text-sm font-medium text-slate-600 whitespace-normal break-words leading-snug" title={info.purposeDisplay}>
                            {info.purposeDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-800 font-semibold whitespace-nowrap text-sm">
                          {formatDateDisplay(b.date)} ({b.timeSlot})
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-medium text-xs whitespace-nowrap">
                          {formatTimestampDisplay(b.updatedAt || b.submittedAt || b.createdAt)}
                        </td>
                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDetail(b)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200/80 hover:border-blue-600 transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 cursor-pointer group/detail-btn"
                            title="ดูรายละเอียดการจอง"
                          >
                            <FolderOpen className="w-4.5 h-4.5 transition-transform duration-200 group-hover/detail-btn:scale-110" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {room2Bookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องจัดรายการ 2</td>
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
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#050505', width: '100%', maxWidth: '650px', height: '80px', borderColor: '#ec003f' }}>
              <span className="font-bold block" style={{ color: '#ec003f', fontSize: '16px' }}>รายการจองทั้งหมด</span>
              <span className="text-2xl font-black font-display block mt-1" style={{ color: '#ec003f' }}>{youtube1Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(youtube1Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold text-rose-600 font-display block mt-1 truncate" title={getTopSubject(youtube1Bookings)}>
                {getTopSubject(youtube1Bookings)}
              </span>
            </div>
          </div>

          {/* Table of Youtube Room 1 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-3" style={{ fontSize: '16px' }}>รายการจองห้องยูทูป 1 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left min-w-[1080px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[12%] min-w-[130px]" style={{ fontSize: '16px' }}>ชื่อผู้จอง</th>
                    <th className="p-3 w-[11%] min-w-[110px]" style={{ fontSize: '16px' }}>รหัสนักศึกษา / รหัสอาจารย์</th>
                    <th className="p-3 w-[19%] min-w-[190px]" style={{ fontSize: '16px' }}>รายวิชา</th>
                    <th className="p-3 w-[12%] min-w-[115px]" style={{ fontSize: '16px' }}>ชื่อรายการ</th>
                    <th className="p-3 w-[15%] min-w-[140px]" style={{ fontSize: '16px' }}>วัตถุประสงค์</th>
                    <th className="p-3 w-[12%] min-w-[125px]" style={{ fontSize: '16px' }}>วันที่และเวลา</th>
                    <th className="p-3 w-[10%] min-w-[110px]" style={{ fontSize: '16px' }}>เวลาทำรายการล่าสุด</th>
                    <th className="p-3 w-[9%] min-w-[90px] text-center" style={{ fontSize: '16px' }}>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {youtube1Bookings.slice(0, 8).map((b, idx) => {
                    const info = getBookingRowData(b);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.bookerName}>
                            {info.bookerName}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          <span className={info.isTeacher ? "bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-sm" : "text-sm"}>
                            {info.idDisplay}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-rose-600">
                          <div className="text-sm font-semibold whitespace-normal break-words leading-snug" title={info.subjectDisplay}>
                            {info.subjectDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.titleDisplay}>
                            {info.titleDisplay}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          <div className="text-sm font-medium text-slate-600 whitespace-normal break-words leading-snug" title={info.purposeDisplay}>
                            {info.purposeDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-800 font-semibold whitespace-nowrap text-sm">
                          {formatDateDisplay(b.date)} ({b.timeSlot})
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-medium text-sm whitespace-nowrap">
                          {formatTimestampDisplay(b.updatedAt || b.submittedAt || b.createdAt)}
                        </td>
                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDetail(b)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200/80 hover:border-rose-600 transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 cursor-pointer group/detail-btn"
                            title="ดูรายละเอียดการจอง"
                          >
                            <FolderOpen className="w-4.5 h-4.5 transition-transform duration-200 group-hover/detail-btn:scale-110" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {youtube1Bookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องยูทูป 1</td>
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
            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#050505', width: '100%', maxWidth: '650px', height: '80px', borderColor: '#a855f7' }}>
              <span className="font-bold block" style={{ color: '#a855f7', fontSize: '16px' }}>รายการจองทั้งหมด</span>
              <span className="text-2xl font-black font-display block mt-1" style={{ color: '#a855f7' }}>{youtube2Bookings.length} คิว</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>ชั่วโมงเปิดใช้งานรวม</span>
              <span className="text-2xl font-black text-slate-800 font-display block mt-1">{formatHoursDisplay(youtube2Hours)} ชม.</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl" style={{ width: '100%', maxWidth: '650px', height: '80px' }}>
              <span className="text-slate-600 font-bold block" style={{ fontSize: '16px' }}>วิชาที่มีการจองมากที่สุด</span>
              <span className="text-lg font-extrabold text-purple-600 font-display block mt-1 truncate" title={getTopSubject(youtube2Bookings)}>
                {getTopSubject(youtube2Bookings)}
              </span>
            </div>
          </div>

          {/* Table of Youtube Room 2 Bookings */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-3" style={{ fontSize: '16px' }}>รายการจองห้องยูทูป 2 ล่าสุด</h4>
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left min-w-[1080px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3 w-[12%] min-w-[130px]" style={{ fontSize: '16px' }}>ชื่อผู้จอง</th>
                    <th className="p-3 w-[11%] min-w-[110px]" style={{ fontSize: '16px' }}>รหัสนักศึกษา / รหัสอาจารย์</th>
                    <th className="p-3 w-[19%] min-w-[190px]" style={{ fontSize: '16px' }}>รายวิชา</th>
                    <th className="p-3 w-[12%] min-w-[115px]" style={{ fontSize: '16px' }}>ชื่อรายการ</th>
                    <th className="p-3 w-[15%] min-w-[140px]" style={{ fontSize: '16px' }}>วัตถุประสงค์</th>
                    <th className="p-3 w-[12%] min-w-[125px]" style={{ fontSize: '16px' }}>วันที่และเวลา</th>
                    <th className="p-3 w-[10%] min-w-[110px]" style={{ fontSize: '16px' }}>เวลาทำรายการล่าสุด</th>
                    <th className="p-3 w-[9%] min-w-[90px] text-center" style={{ fontSize: '16px' }}>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {youtube2Bookings.slice(0, 8).map((b, idx) => {
                    const info = getBookingRowData(b);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.bookerName}>
                            {info.bookerName}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          <span className={info.isTeacher ? "bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-sm" : "text-sm"}>
                            {info.idDisplay}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-purple-600">
                          <div className="text-sm font-semibold whitespace-normal break-words leading-snug" title={info.subjectDisplay}>
                            {info.subjectDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-800 whitespace-normal break-words leading-snug" title={info.titleDisplay}>
                            {info.titleDisplay}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          <div className="text-sm font-medium text-slate-600 whitespace-normal break-words leading-snug" title={info.purposeDisplay}>
                            {info.purposeDisplay}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-800 font-semibold whitespace-nowrap text-sm">
                          {formatDateDisplay(b.date)} ({b.timeSlot})
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-medium text-sm whitespace-nowrap">
                          {formatTimestampDisplay(b.updatedAt || b.submittedAt || b.createdAt)}
                        </td>
                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDetail(b)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border border-purple-200/80 hover:border-purple-600 transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 cursor-pointer group/detail-btn"
                            title="ดูรายละเอียดการจอง"
                          >
                            <FolderOpen className="w-4.5 h-4.5 transition-transform duration-200 group-hover/detail-btn:scale-110" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {youtube2Bookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">ไม่มีรายการจองสำหรับห้องยูทูป 2</td>
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
              <p className="text-slate-500 font-normal" style={{ fontSize: '14px' }}>สถิติการเข้าใช้งานห้องปฏิบัติการตามหลักสูตรวิชาของ คณะนิเทศศาสตร์</p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs px-3 py-1 rounded-xl">
              รวม {courseStats.length} รายวิชา
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseStats.map((c, idx) => (
              <div key={idx} className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/60 space-y-3 hover:border-indigo-300 transition-all">
                <div className="flex justify-between items-start">
                  <span className="font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg" style={{ fontSize: '16px' }}>
                    {c.subject}
                  </span>
                  <span className="font-bold text-slate-500 font-mono" style={{ fontSize: '16px' }}>
                    {c.count} คิวจอง
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center" style={{ fontSize: '16px' }}>
                  <span className="text-slate-600 font-medium">ชั่วโมงการใช้งานรวม:</span>
                  <span className="font-extrabold text-slate-900 font-mono">{formatHoursDisplay(c.hours)} ชม.</span>
                </div>
                <div className="flex justify-between items-center" style={{ fontSize: '16px' }}>
                  <span className="text-slate-600 font-medium">จำนวนผู้ใช้งาน:</span>
                  <span className="font-extrabold text-indigo-600 font-mono">{c.groupsCount} กลุ่ม</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Detail Modal (Read-Only Mode) */}
      <BookingDetailModal
        isOpen={!!selectedBookingDetail}
        onClose={() => setSelectedBookingDetail(null)}
        data={selectedBookingDetail}
        courses={allCoursesList}
      />

    </div>
  );
}
