/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  onCreateProgram: (programName: string, hosts: string, category: 'radio' | 'tv' | 'podcast' | 'other', roomName: string, date: string, timeSlot: string) => Promise<void>;
  onUpdateProgramStatus: (id: string, status: 'upcoming' | 'active' | 'completed') => Promise<void>;
  onDeleteProgram: (id: string) => Promise<void>;
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
  onDeleteProgram
}: AdminDashboardProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tickets' | 'bookings'>('tickets');
  const [categoryFilter, setCategoryFilter] = useState<HelpCategory | 'all'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');

  // Program Scheduling Admin Form States
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [newProgName, setNewProgName] = useState("");
  const [newProgHosts, setNewProgHosts] = useState("");
  const [newProgCategory, setNewProgCategory] = useState<'radio' | 'tv' | 'podcast' | 'other'>("radio");
  const [newProgRoom, setNewProgRoom] = useState(AVAILABLE_STUDIO_ROOMS[0]);
  const [newProgDate, setNewProgDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProgTime, setNewProgTime] = useState(AVAILABLE_TIMESLOTS[0]);
  const [submittingProg, setSubmittingProg] = useState(false);

  // Find currently opened ticket
  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  const handleProgramFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName.trim() || !newProgHosts.trim()) {
      alert("กรุณากรอกชื่อรายการและนามแฝงดีเจ/พิธีกรด้วยค่ะ");
      return;
    }
    setSubmittingProg(true);
    try {
      await onCreateProgram(
        newProgName.trim(),
        newProgHosts.trim(),
        newProgCategory,
        newProgRoom,
        newProgDate,
        newProgTime
      );
      setNewProgName("");
      setNewProgHosts("");
      setIsAddingProgram(false);
      alert("➕ เพิ่มตารางจัดรายการใหม่เข้าระบบสำเร็จ!");
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถละเลงตารางรายการได้");
    } finally {
      setSubmittingProg(false);
    }
  };

  // Statistics calculation for help categories
  const categoriesMap: Record<HelpCategory, { name: string; value: number; color: string }> = {
    camera: { name: 'กล้อง/เลนส์ (Camera)', value: 0, color: '#F27D26' },
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
    if (!selectedTicketId || !replyText.trim()) return;

    setReplyLoading(true);
    try {
      await onSubmitReply(selectedTicketId, replyText.trim());
      setReplyText("");
      // Refresh active ticket view
    } catch (e) {
      console.error(e);
    } finally {
      setReplyLoading(false);
    }
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
                        
                        {/* Embedded payload Image (Features 10 base64 displayer) */}
                        {activeTicket.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 max-w-full bg-white">
                            <img 
                              src={activeTicket.imageUrl} 
                              alt="Student Attachments" 
                              referrerPolicy="no-referrer"
                              className="max-h-60 object-contain w-full"
                            />
                            <div className="p-1.5 bg-slate-50 text-[10px] text-slate-500 text-center font-mono border-t border-slate-100">
                              📷 ภาพประกอบปัญหาจากอุปกรณ์ของนักศึกษา
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
                          {!isMe && idx === 0 && activeTicket.imageUrl && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 bg-white max-w-full">
                              <img 
                                src={activeTicket.imageUrl} 
                                alt="Student Attachments" 
                                referrerPolicy="no-referrer"
                                className="max-h-60 object-contain w-full"
                              />
                              <div className="p-1.5 bg-slate-50 text-[10px] text-slate-500 text-center font-mono border-t border-slate-100">
                                📷 ภาพประกอบปัญหาจากอุปกรณ์ของนักศึกษา
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
                คำขอจองห้องสตูดิโอจากนักศึกษา (Studio Room Bookings Queue)
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                ตรวจสอบ ตรวจพิจารณาอนุมัติ หรือปฏิเสธคำขอจองห้องจัดรายการและสตูดิโอโทรทัศน์ CA-BU ของนักเรียน
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs text-slate-700">
              <span>อนุมัติสะสม: {bookings.filter(b => b.status === 'approved').length} คำขอ</span>
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
                    <th className="py-3 px-4 font-display">นักศึกษาผู้ขอ</th>
                    <th className="py-3 px-4 font-display">ห้องสตูดิโอ</th>
                    <th className="py-3 px-4 font-display">วันทำการจอง</th>
                    <th className="py-3 px-4 font-display">ช่วงเวลากริด (Timeslot)</th>
                    <th className="py-3 px-4 font-display">วัตถุประสงค์ (Purpose)</th>
                    <th className="py-3 px-4 font-display text-center">สถานะคำขอ (Status)</th>
                    <th className="py-3 px-4 font-display text-right">ดำเนินการ (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{booking.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{booking.studentEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          {booking.roomName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-650">{booking.date}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{booking.timeSlot}</td>
                      <td className="py-3 px-4 max-w-[180px] truncate" title={booking.purpose}>
                        <span className="font-medium text-slate-600">{booking.purpose}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          booking.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-850'
                            : booking.status === 'rejected'
                            ? 'bg-rose-100 text-rose-850'
                            : 'bg-amber-100 text-amber-850 border border-amber-200'
                        }`}>
                          {booking.status === 'approved' && '✓ อนุมัติ'}
                          {booking.status === 'rejected' && '✕ ปฏิเสธ'}
                          {booking.status === 'pending' && '⏳ รอตรวจ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          {booking.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateBookingStatus(booking.id, 'approved')}
                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-550 hover:text-white px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200 transition-colors"
                              >
                                อนุมัติ
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateBookingStatus(booking.id, 'rejected')}
                                className="bg-rose-50 text-rose-600 hover:bg-rose-550 hover:text-white px-2 py-1 rounded-md text-[10px] font-bold border border-rose-200 transition-colors"
                              >
                                ปฏิเสธ
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("ลบคำจองห้องวิทยานี้ออกไปถาวร?")) {
                                onDeleteBooking(booking.id);
                              }
                            }}
                            className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-650 p-1 rounded-md border border-slate-200 transition-colors"
                            title="ลบคำขอจอง"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                📌 กรอกข้อมูลลงทะเบียนรายการดีเจ/พิธีกน
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ชื่อรายการจัดรายการ (Program Name)</label>
                  <input
                    type="text"
                    value={newProgName}
                    onChange={(e) => setNewProgName(e.target.value)}
                    placeholder="เช่น BU Morning News, CA Space Talk"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ดีเจ / พิธีกรผู้จัด (Hosts)</label>
                  <input
                    type="text"
                    value={newProgHosts}
                    onChange={(e) => setNewProgHosts(e.target.value)}
                    placeholder="เช่น นศ.อนุพงศ์ & อลินดา"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ประเภทรายการ (Media Category)</label>
                  <select
                    value={newProgCategory}
                    onChange={(e: any) => setNewProgCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="radio">📻 สถานีวิทยุออนไลน์ (Radio)</option>
                    <option value="tv">📺 โทรทัศน์กระแสหลัก (Television)</option>
                    <option value="podcast">🎙️ พอดแคสต์เสียงใส (Podcast)</option>
                    <option value="other">🎬 สื่ออื่นๆ (Other media)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">สตูดิโดที่ใช้จัด (Studio Room)</label>
                  <select
                    value={newProgRoom}
                    onChange={(e) => setNewProgRoom(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    {AVAILABLE_STUDIO_ROOMS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">วันที่จัด (Date)</label>
                  <input
                    type="date"
                    value={newProgDate}
                    onChange={(e) => setNewProgDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">กริดคาบจัด (Timeslot Grid)</label>
                  <select
                    value={newProgTime}
                    onChange={(e) => setNewProgTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none font-mono"
                  >
                    {AVAILABLE_TIMESLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
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
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm"
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
                    
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      program.status === 'active' 
                        ? 'bg-rose-500 text-white font-bold animate-pulse'
                        : program.status === 'completed'
                        ? 'bg-slate-150 text-slate-500'
                        : 'bg-sky-100 text-sky-850'
                    }`}>
                      {program.status === 'active' && '🔴 LIVE / ON-AIR!'}
                      {program.status === 'completed' && '✓ เสร็จรายการ'}
                      {program.status === 'upcoming' && '⏳ เตรียมตัว'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-850 text-xs font-display">{program.programName}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">พิธีกร: <span className="font-semibold text-slate-800">{program.hosts}</span></p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {program.roomName} / {program.date} ({program.timeSlot})
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

  </div>
);
}
