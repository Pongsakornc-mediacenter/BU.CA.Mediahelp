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
import { Ticket, AttendanceRecord, HelpCategory, ClassSession, KnowledgeCabinet, KnowledgeTip } from '../types';
import { AVAILABLE_CLASSES } from '../hooks/useData';

interface AdminDashboardProps {
  tickets: Ticket[];
  attendance: AttendanceRecord[];
  onSubmitReply: (ticketId: string, replyText: string) => Promise<void>;
  onDownloadReport: () => void;
  currentUserEmail: string;
  cabinets: KnowledgeCabinet[];
  onCreateCabinet: (cabinet: Omit<KnowledgeCabinet, 'id'>) => Promise<void>;
  onUpdateCabinet: (id: string, cabinet: Partial<KnowledgeCabinet>) => Promise<void>;
  onDeleteCabinet: (id: string) => Promise<void>;
}

export default function AdminDashboard({
  tickets,
  attendance,
  onSubmitReply,
  onDownloadReport,
  currentUserEmail,
  cabinets = [],
  onCreateCabinet,
  onUpdateCabinet,
  onDeleteCabinet
}: AdminDashboardProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tickets' | 'cabinets'>('tickets');
  const [categoryFilter, setCategoryFilter] = useState<HelpCategory | 'all'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');

  // Cabinets Admin UI State
  const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null);
  const [isAddingNewCabinet, setIsAddingNewCabinet] = useState(false);
  const [cabinetFormTitle, setCabinetFormTitle] = useState("");
  const [cabinetFormSummary, setCabinetFormSummary] = useState("");
  const [cabinetFormTag, setCabinetFormTag] = useState("");
  const [cabinetFormIcon, setCabinetFormIcon] = useState("camera");
  const [cabinetFormImage, setCabinetFormImage] = useState<string | null>(null);
  const [cabinetFormTips, setCabinetFormTips] = useState<{ q: string; a: string }[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // Find currently opened ticket
  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  // File upload compression helper for cabinet image
  const handleCabinetImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 450;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        setCabinetFormImage(compressedBase64);
      };
    };
  };

  const handleAddTip = () => {
    setCabinetFormTips([...cabinetFormTips, { q: "", a: "" }]);
  };

  const handleRemoveTip = (index: number) => {
    const updated = [...cabinetFormTips];
    updated.splice(index, 1);
    setCabinetFormTips(updated);
  };

  const handleTipChange = (index: number, field: 'q' | 'a', value: string) => {
    const updated = [...cabinetFormTips];
    updated[index] = { ...updated[index], [field]: value };
    setCabinetFormTips(updated);
  };

  const handleCabinetFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabinetFormTitle.trim() || !cabinetFormSummary.trim() || !cabinetFormTag.trim()) {
      alert("กรุณากรอกหัวข้อตู้อธิบายย่อ และหมวดหมู่ป้ายด้วยค่ะ");
      return;
    }

    setFormLoading(true);
    const cabinetPayload = {
      title: cabinetFormTitle.trim(),
      summary: cabinetFormSummary.trim(),
      tag: cabinetFormTag.trim(),
      icon: cabinetFormIcon,
      imageUrl: cabinetFormImage || undefined,
      tips: cabinetFormTips.filter(t => t.q.trim() !== "" && t.a.trim() !== "").map(t => ({
        q: t.q.trim(),
        a: t.a.trim()
      })),
      accent: getAccentClasses(cabinetFormIcon),
      badgeBg: getBadgeClasses(cabinetFormIcon),
    };

    try {
      if (editingCabinetId) {
        await onUpdateCabinet(editingCabinetId, cabinetPayload);
        alert("💾 อัปเดตตู้ความรู้สำเร็จ!");
      } else {
        await onCreateCabinet(cabinetPayload);
        alert("➕ เพิ่มตู้ความรู้ใหม่สำเร็จ!");
      }
      resetCabinetForm();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดำเนินการตู้ความรู้");
    } finally {
      setFormLoading(false);
    }
  };

  const startEditCabinet = (cab: KnowledgeCabinet) => {
    setEditingCabinetId(cab.id);
    setCabinetFormTitle(cab.title);
    setCabinetFormSummary(cab.summary);
    setCabinetFormTag(cab.tag);
    setCabinetFormIcon(cab.icon || "camera");
    setCabinetFormImage(cab.imageUrl || null);
    setCabinetFormTips(cab.tips || [{ q: "", a: "" }]);
    setIsAddingNewCabinet(true);
  };

  const startAddNewCabinet = () => {
    resetCabinetForm();
    setIsAddingNewCabinet(true);
  };

  const resetCabinetForm = () => {
    setEditingCabinetId(null);
    setIsAddingNewCabinet(false);
    setCabinetFormTitle("");
    setCabinetFormSummary("");
    setCabinetFormTag("");
    setCabinetFormIcon("camera");
    setCabinetFormImage(null);
    setCabinetFormTips([{ q: "", a: "" }]);
  };

  const handleDeleteCabinetClick = async (id: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าจะลบ "${name}" ออกจากสารระบบ? การลบนี้จะไม่สามารถกู้คืนกลับมาได้`)) {
      try {
        await onDeleteCabinet(id);
        alert("🗑️ ลบตู้ความรู้สำเร็จเรียบร้อยแล้วค่ะ");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getAccentClasses = (icon: string) => {
    switch (icon) {
      case 'camera': return 'border-orange-100 bg-orange-50/20 text-orange-950';
      case 'mic': return 'border-emerald-100 bg-emerald-50/20 text-emerald-950';
      case 'lighting': return 'border-amber-100 bg-amber-50/20 text-amber-955';
      case 'editing': return 'border-pink-100 bg-pink-50/20 text-pink-950';
      default: return 'border-indigo-100 bg-indigo-50/20 text-indigo-950';
    }
  };

  const getBadgeClasses = (icon: string) => {
    switch (icon) {
      case 'camera': return 'bg-orange-100 text-orange-850';
      case 'mic': return 'bg-emerald-100 text-emerald-800';
      case 'lighting': return 'bg-amber-100 text-amber-850';
      case 'editing': return 'bg-pink-100 text-pink-850';
      default: return 'bg-indigo-100 text-indigo-850';
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
          onClick={() => setActiveTab('cabinets')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'cabinets'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          ระบบตั้งค่าหน้าเว็บ & จัดการตู้ความรู้ ({cabinets.length})
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
                      value={replyText}
                      id="reply_input_field"
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={activeTicket.replyText ? "พิมพ์คำอธิบายเพิ่มเติมเพื่อส่งข้อความแก้ไขคำตอบเดิม..." : "พิมพ์คำตอบและข้อแนะนำส่งด่วนให้นักศึกษา..."}
                      className="flex-1 bg-white border border-slate-200 focus:outline-none focus:border-indigo-600 rounded-xl px-4 py-2 text-xs"
                      disabled={replyLoading}
                    />
                    <button
                      type="submit"
                      disabled={replyLoading || !replyText.trim()}
                      id="send_reply_btn"
                      className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 text-white rounded-xl px-4 flex items-center justify-center text-xs font-semibold transition-colors gap-1.5 shrink-0"
                    >
                      {replyLoading ? 'กำลังส่ง...' : (
                        <>
                          <span>ส่งคำตอบ</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
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
              <p className="text-[11px] text-center mt-1 text-slate-500 max-w-xs">
                กรุณาคลิกเลือกหัวข้อขวาความช่วยเหลือจากรายการซ้ายมือ เพื่อตรวจสอบปัญหา ภาพของกล้อง และตอบคำถามนักศึกษารายบุคคลแบบเรียลไทม์
              </p>
            </div>
          )}
        </div>
      </div>
      </>
    )}

    {activeTab === 'cabinets' && (
      <div className="space-y-6" id="cabinets_admin_tab">
        {/* Action and Title Bar */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 font-display">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              ระบบตั้งค่าเนื้อหาและรูปภาพตู้ความรู้ (Knowledge Cabinets Configuration)
            </h3>
            <p className="text-slate-505 text-xs mt-1">
              แก้ไขข้อมูล ตัวหนังสือ หัวข้อ หรืออัปโหลดรูปภาพใหม่ลงตู้ความรู้โดยตรง ข้อมูลนี้จะสอดประสานแสดงผลไปยังมุมมองของนักศึกษาทันที
            </p>
          </div>
          {!isAddingNewCabinet && (
            <button
              type="button"
              onClick={startAddNewCabinet}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-md shadow-indigo-600/10"
            >
              <Plus className="w-4 h-4" />
              สร้างตู้ความรู้ใหม่ (Add Cabinet)
            </button>
          )}
        </div>

        {isAddingNewCabinet ? (
          /* Cabinet Editorial Form */
          <form onSubmit={handleCabinetFormSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-mono">
                  {editingCabinetId ? "EDIT MODE" : "CREATE MODE"}
                </span>
                {editingCabinetId ? "แก้ไขข้อมูลตู้องค์ความรู้" : "เพิ่มตู้องค์ความรู้ใหม่เข้าสู่หน้าเว็บ"}
              </h4>
              <button
                type="button"
                onClick={resetCabinetForm}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ ยกเลิก
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Visual Settings - 4 Cols */}
              <div className="md:col-span-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">1. เลือกไอคอนตู้ (Cabinet Icon):</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'camera', label: 'กล้อง', icon: <Camera className="w-4 h-4" /> },
                      { id: 'mic', label: 'ไมค์', icon: <Mic className="w-4 h-4" /> },
                      { id: 'lighting', label: 'จัดแสง', icon: <Lightbulb className="w-4 h-4" /> },
                      { id: 'editing', label: 'ตัดต่อ', icon: <PenTool className="w-4 h-4" /> }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCabinetFormIcon(item.id)}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                          cabinetFormIcon === item.id
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold ring-2 ring-indigo-600/5'
                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                        }`}
                      >
                        {item.icon}
                        <span className="text-[9px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">2. ชื่อป้ายสถานะตู้ (Badge Tag):</label>
                  <input
                    type="text"
                    value={cabinetFormTag}
                    onChange={(e) => setCabinetFormTag(e.target.value)}
                    placeholder="เช่น ขาตั้งกล้อง, ความแรงคลื่น, เคล็ดลับพรีเมียร์"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">3. อัปโหลดรูปภาพตู้ (Cabinet Photo):</label>
                  <div className="space-y-3">
                    {cabinetFormImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img
                          src={cabinetFormImage}
                          alt="Cabinet preview"
                          referrerPolicy="no-referrer"
                          className="max-h-40 w-full object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setCabinetFormImage(null)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-lg text-[10px] font-bold shadow-md"
                        >
                          ✕ ลบรูปนี้
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50">
                        <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-600">อัปโหลดรูปภาพประจำตู้</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">ไฟล์ภาพ (jpg/png) จะถูกย่อลงขนาดอัตโนมัติ</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCabinetImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Content & Tips - 8 Cols */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">4. หัวข้อหลักของตู้ (Cabinet Title):</label>
                  <input
                    type="text"
                    value={cabinetFormTitle}
                    onChange={(e) => setCabinetFormTitle(e.target.value)}
                    placeholder="เช่น ตู้ความรู้ขาตั้งกล้องและฟิสิกส์เกลียวล๊อค"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">5. คำอธิบายย่อ (Short Summary):</label>
                  <textarea
                    value={cabinetFormSummary}
                    onChange={(e) => setCabinetFormSummary(e.target.value)}
                    placeholder="อธิบายย่อๆ เกี่ยวกับสิ่งที่นักศึกษาจะได้อ่านในตู้องค์ความรู้นี้..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 resize-none font-medium"
                  />
                </div>

                {/* Tips Dynamic Group */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                    <label className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      📌 รายการประเด็นตอบคำถาม Q&A ภายในตู้นี้ (Tips & Checklist)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddTip}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      เพิ่มประเด็น Q&A
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {cabinetFormTips.map((tip, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative space-y-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveTip(idx)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-650 transition-colors text-[10px] font-bold"
                          title="ลบหัวข้อ Q&A"
                        >
                          ✕ ลบ
                        </button>
                        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                          ประเด็นชุดที่ {idx + 1}
                        </span>

                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <input
                              type="text"
                              value={tip.q}
                              onChange={(e) => handleTipChange(idx, 'q', e.target.value)}
                              placeholder="ตั้งคำถาม (Question)"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <textarea
                              value={tip.a}
                              onChange={(e) => handleTipChange(idx, 'a', e.target.value)}
                              placeholder="รายละเอียดแนวทางแก้ไข (Answer)"
                              rows={2}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {cabinetFormTips.length === 0 && (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                        ยังไม่มีเนื้อหา Q&A แนะนำให้อย่างน้อย 1 ชุดเพื่อส่งมอบคุณค่าให้นักศึกษาค่ะ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form submit handlers */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={resetCabinetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-650/10 flex items-center gap-1.5"
              >
                {formLoading ? "กำลังประมวลผล..." : "💾 บันทึกและเผยแพร่บนหน้าพรีวิว"}
              </button>
            </div>
          </form>
        ) : (
          /* Cabinets Cards Grid List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cabinets.map(cab => (
              <div
                key={cab.id}
                className="bg-white border border-slate-105 rounded-2xl p-5 shadow-sm hover:border-indigo-150 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cab.badgeBg || 'bg-indigo-100 text-indigo-850'}`}>
                      {cab.tag}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEditCabinet(cab)}
                        className="bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-slate-600 hover:text-indigo-700 p-1.5 rounded-lg transition-colors"
                        title="แก้ไขรูป/ข้อมูลตู้"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCabinetClick(cab.id, cab.title)}
                        className="bg-slate-50 hover:bg-red-50 border border-slate-100 text-slate-600 hover:text-red-750 p-1.5 rounded-lg transition-colors"
                        title="ลบตู้ความรู้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-sm font-display leading-snug">{cab.title}</h4>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{cab.summary}</p>
                  </div>

                  {/* Image display */}
                  {cab.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-100 bg-slate-50 max-h-36 w-full flex items-center justify-center">
                      <img
                        src={cab.imageUrl}
                        alt="Cabinet media"
                        referrerPolicy="no-referrer"
                        className="object-contain max-h-36 w-full"
                      />
                    </div>
                  )}

                  {/* Q&A counter */}
                  <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/30 flex items-center gap-1.5">
                    <span>💡 รวมหัวข้อที่แนะนำ: {cab.tips?.length || 0} ประเด็นพบบ่อย</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startEditCabinet(cab)}
                  className="mt-4 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-750 text-xs font-bold py-2 rounded-xl transition-all"
                >
                  📖 จัดการคำแนะนำ & รายละเอียด Q&A
                </button>
              </div>
            ))}

            {cabinets.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-16 bg-white border border-slate-150 rounded-2xl p-6 text-slate-400 text-sm flex flex-col items-center justify-center space-y-2">
                <BookOpen className="w-12 h-12 text-slate-200" />
                <p className="font-bold text-slate-700">ไม่มีตู้ความรู้เผยแพร่อยู่ในขณะนี้</p>
                <p className="text-xs text-slate-500 max-w-sm">แนะนำให้คลิกปุ่ม "สร้างตู้ความรู้ใหม่" ที่มุมขวาบนเพื่อป้อนข้อมูลและหัวข้อแนะนำนักศึกษาค่ะ</p>
              </div>
            )}
          </div>
        )}
      </div>
    )}

  </div>
);
}
