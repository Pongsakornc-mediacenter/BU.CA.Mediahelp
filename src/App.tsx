/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Camera, 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  LogOut, 
  Send, 
  Layers, 
  Sliders, 
  CheckCircle, 
  Clock, 
  Star, 
  MessageSquare, 
  BellRing, 
  AlertCircle,
  FileImage,
  QrCode,
  ShieldAlert,
  GraduationCap,
  RefreshCw,
  Mic,
  Lightbulb,
  PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from './hooks/useData';
import CameraWorkbench from './components/CameraWorkbench';
import AdminDashboard from './components/AdminDashboard';
import { HelpCategory } from './types';

export default function App() {
  const {
    currentUser,
    tickets,
    attendance,
    loading,
    lastNotification,
    setLastNotification,
    loginWithGoogle,
    loginAsMockUser,
    logout,
    createSupportTicket,
    submitTicketReply,
    submitTicketRating,
    sendTicketMessage,
    checkInToClass,
    downloadAttendanceReportCSV,
    seedDemoData,
    isFirebaseConfigured,
    cabinets,
    createCabinet,
    updateCabinet,
    deleteCabinet
  } = useData();

  // Admin view toggle for student simulation view switcher (Requested Feature)
  const [isAdminViewingAsStudent, setIsAdminViewingAsStudent] = useState(false);

  // Active view states for Student
  const [studentTab, setStudentTab] = useState<'workbench' | 'helpdesk' | 'knowledge'>('workbench');
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [activeCabinetId, setActiveCabinetId] = useState<string | null>(null);
  
  // Submit Ticket Form States
  const [ticketCategory, setTicketCategory] = useState<HelpCategory>('camera');
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketImage, setTicketImage] = useState<string | null>(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Check-In Form States
  const [selectedClassId, setSelectedClassId] = useState("ca101");
  const [classCode, setClassCode] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Student active ticket selective viewer (analogous to private chat thread)
  const [activeStudentTicketId, setActiveStudentTicketId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [studentMsgText, setStudentMsgText] = useState("");

  // File conversion of image attachments
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Compress on canvas to save document quota (~60kb)
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
        setTicketImage(compressedBase64);
      };
    };
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) {
      alert("กรุณากรอกหัวข้อและคำอธิบายปัญหาอุปกรณ์");
      return;
    }

    setSubmittingTicket(true);
    try {
      await createSupportTicket(ticketCategory, ticketTitle.trim(), ticketDesc.trim(), ticketImage || undefined);
      setTicketTitle("");
      setTicketDesc("");
      setTicketImage(null);
      alert("🎉 ส่งตั๋วขอความช่วยเหลือถึงอาจารย์ผู้สอนสำเร็จ! ระบบกำลังดึงการปรับปรุงคำตอบแบบเรียลไทม์");
      setStudentTab('helpdesk');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleClassCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      alert("กรุณากรอกรหัสเช็คชื่อเข้าชั้นเรียน");
      return;
    }

    setCheckInLoading(true);
    const success = await checkInToClass(selectedClassId, classCode.trim());
    setCheckInLoading(false);
    
    if (success) {
      setClassCode("");
      alert("✨ เช็คชื่อเข้าคลาสเรียนสำเร็จ! คุณได้รับคะแนนสะสมชั่วโมงการเรียนเรียบร้อย");
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentTicketId) return;

    setRatingLoading(true);
    try {
      await submitTicketRating(activeStudentTicketId, ratingValue, ratingComment.trim());
      setRatingComment("");
      setActiveStudentTicketId(null);
      alert("🔒 ทำการให้คะแนนความพึงพอใจและปิดเคสขอความช่วยเหลือเรียบร้อย ขอบคุณค่ะ!");
    } catch (err) {
      console.error(err);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleStudentChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentTicketId || !studentMsgText.trim()) return;
    try {
      await sendTicketMessage(activeStudentTicketId, studentMsgText.trim());
      setStudentMsgText("");
    } catch (err) {
      console.error(err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-mono">กำลังเชื่อมต่อฐานข้อมูลนิเทศศาสตร์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col" id="app_root_layout">
      
      {/* 1. Global Interactive Live Notifications (Toast Banner) */}
      <AnimatePresence>
        {lastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 inset-x-4 md:inset-x-auto md:right-4 md:w-96 bg-indigo-900 text-white rounded-2xl p-4 shadow-2xl border border-indigo-700/50 z-50 flex items-start gap-3"
            id="toast_notification_banner"
          >
            <div className="bg-indigo-600/30 text-indigo-200 p-2 rounded-xl border border-indigo-500/10 shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs">มีการอัปเดตคำร้องขอความช่วยเหลือ!</h5>
              <p className="text-[11px] text-indigo-200 mt-1 leading-normal">{lastNotification}</p>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setLastNotification(null)}
                  className="bg-indigo-800 hover:bg-indigo-750 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-lg transition-colors"
                >
                  รับทราบ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentTab('helpdesk');
                    setLastNotification(null);
                  }}
                  className="bg-white text-indigo-900 text-[10px] font-bold px-3 py-1 rounded-lg transition-colors"
                >
                  เปิดดูคำตอบ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top Navigation Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm/50">
        <div className="max-w-[1700px] mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm tracking-tight text-slate-800 font-display">BU CA Media Help</h1>
                <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1 py-0.2 rounded border border-slate-200 uppercase">
                  v2.0
                </span>
              </div>
              <p className="text-slate-500 text-[10px]">ศูนย์สนับสนุนอุปกรณ์และผู้ช่วยตั้งค่ากล้องนิเทศฯ @ BU</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setIsAdminViewingAsStudent(!isAdminViewingAsStudent)}
                    id="admin_student_view_toggle"
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all border flex items-center gap-1.5 ${
                      isAdminViewingAsStudent
                        ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-sm'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    {isAdminViewingAsStudent ? '🔄 สลับกลับโหมดอาจารย์' : '👁️ สลับมุมมองนักศึกษา'}
                  </button>
                )}
                <div className="hidden sm:block text-right">
                  <span className="text-slate-800 text-xs font-bold block">{currentUser.name}</span>
                  <span className="text-slate-400 text-[9px] block font-mono">{currentUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  id="sign_out_header_btn"
                  className="bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 p-2 rounded-xl transition-all border border-slate-100"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-slate-400 text-xs font-mono">กรุณาเข้าสู่ระบบด้านล่าง</span>
            )}
          </div>
        </div>
      </header>

      {/* 3. Central Content Arena */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 space-y-6 transition-all duration-300">

        {/* Auth Required Check screen if not logged in */}
        {!currentUser ? (
          <div className="max-w-2xl mx-auto my-16 bg-white border border-slate-100 rounded-[32px] p-10 sm:p-14 shadow-xl text-center space-y-9" id="login_block">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-indigo-200 rounded-3xl blur-xl opacity-35 animate-pulse"></div>
              <div className="relative bg-gradient-to-tr from-indigo-50 to-violet-50 text-indigo-600 p-5 rounded-3xl w-20 h-20 flex items-center justify-center border border-indigo-100 shadow-sm">
                <GraduationCap className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3.5xl font-black font-display text-slate-900 tracking-tight leading-normal">
                นิสิตและนักศึกษา <br className="sm:hidden" />
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">นิเทศศาสตร์ ม.กรุงเทพ</span>
              </h2>
              <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                ยินดีต้อนรับเข้าสู่ระบบช่วยเหลืออุปกรณ์ห้องปฏิบัติการและศูนย์สื่อการเรียนรู้ <br className="hidden sm:block" />
                เพื่อความปลอดภัยสูงสุด กรุณาลงชื่อเข้าใช้งานด้วยบัญชีสถาบันของท่าน
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 sm:p-8 text-left space-y-4 shadow-sm">
              <span className="text-slate-800 font-extrabold text-sm sm:text-base flex items-center gap-2">
                🔑 การเข้าใช้งานระบบ
              </span>
              <div className="space-y-3.5 pt-1">
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-100 text-indigo-700 text-xs sm:text-[13px] font-black px-3 py-1 rounded-lg shrink-0 mt-0.5">
                    นักศึกษา
                  </span>
                  <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                    ใช้บัญชี <strong className="text-indigo-600 font-bold">@bumail.net</strong> เพื่อเข้าสู่ระบบเเละขอความช่วยเหลือ
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-violet-100 text-violet-700 text-xs sm:text-[13px] font-black px-3 py-1 rounded-lg shrink-0 mt-0.5">
                    อาจารย์ / เจ้าหน้าที่
                  </span>
                  <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                    ใช้บัญชี <strong className="text-indigo-600 font-bold">@bu.ac.th</strong> เพื่อเข้าสู่ระบบ
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={() => loginWithGoogle(true)}
                id="google_signin_btn"
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold rounded-2xl text-sm sm:text-base py-4 px-6 shadow-lg shadow-indigo-900/10 hover:shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <QrCode className="w-5 h-5" />
                เข้าสู่ระบบด้วย BU Google Account
              </button>
            </div>
          </div>
        ) : (currentUser.role === 'admin' && !isAdminViewingAsStudent) ? (
          /* =======================================================
             ADMINISTRATIVE INSTRUCTOR WORKSPACE
             ======================================================= */
          <AdminDashboard
            tickets={tickets}
            attendance={attendance}
            onSubmitReply={submitTicketReply}
            onDownloadReport={downloadAttendanceReportCSV}
            currentUserEmail={currentUser.email}
            cabinets={cabinets}
            onCreateCabinet={createCabinet}
            onUpdateCabinet={updateCabinet}
            onDeleteCabinet={deleteCabinet}
          />
        ) : (
          /* =======================================================
             STUDENT WORKSPACE
             ======================================================= */
          <div className="space-y-6" id="student_workspace_root">
            
            {/* Student Navigation Tabs */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm/50" id="student_segment_tabs">
              <button
                type="button"
                onClick={() => setStudentTab('workbench')}
                id="tab_workbench_btn"
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  studentTab === 'workbench'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4" />
                การตั้งค่า กล้องพื้นฐาน
              </button>
              
              <button
                type="button"
                onClick={() => setStudentTab('helpdesk')}
                id="tab_helpdesk_btn"
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  studentTab === 'helpdesk'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                ส่งตั๋วขอความช่วยเหลือ
              </button>

              <button
                type="button"
                onClick={() => setStudentTab('knowledge')}
                id="tab_knowledge_btn"
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  studentTab === 'knowledge'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                ตู้ความรู้และคู่มืออุปกรณ์
              </button>
            </div>

            {/* TAB 1: WORKBENCH */}
            {studentTab === 'workbench' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CameraWorkbench />
              </motion.div>
            )}

            {/* TAB 2: HELPDESK */}
            {studentTab === 'helpdesk' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                {/* Submit New Ticket Form - 5 Cols */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-4 font-display">
                      <HelpCircle className="w-5 h-5 text-indigo-600" />
                      เปิดเคสขอคำแนะนำใหม่
                    </h3>

                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                      {/* Category Selector */}
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">อุปกรณ์ที่เป็นปัญหา:</label>
                        <select
                          value={ticketCategory}
                          id="category_picker"
                          onChange={(e) => setTicketCategory(e.target.value as HelpCategory)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                        >
                          <option value="camera">กล้อง / เลนส์ (Camera Setup)</option>
                          <option value="microphone">ระบบบันทึกเสียงและไมค์ (Microphone/Audio)</option>
                          <option value="lighting">การจัดการไฟและฉากสตูดิโอ (Lighting/Studio)</option>
                          <option value="editing">ซอฟต์แวร์ตัดต่อหรือซอร์ฟแวร์ที่เกี่ยวข้อง (Editing)</option>
                          <option value="other">เรื่องอื่นๆ / ปัญหาทั่วไป</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">หัวข้อสั้นระบุปัญหา:</label>
                        <input
                          type="text"
                          value={ticketTitle}
                          id="ticket_title_input"
                          onChange={(e) => setTicketTitle(e.target.value)}
                          placeholder="เช่น เปิดรูรับแสง f1.8 แต่กล้องไม่ยอมให้ปรับ"
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                          maxLength={150}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">อธิบายสภาพปัญหาและรุ่นของอุปกรณ์:</label>
                        <textarea
                          rows={4}
                          value={ticketDesc}
                          id="ticket_desc_input"
                          onChange={(e) => setTicketDesc(e.target.value)}
                          placeholder="อธิบายพฤติกรรม อาการ หรือรายละเอียดของปัญหา เพื่ออาจารย์จะวิเคราะห์ได้อย่างแม่นยำขึ้น..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 resize-none"
                          maxLength={2000}
                        />
                      </div>

                      {/* Photo Attachment (Feature 10: Image submission base64) */}
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">อัปโหลดภาพถ่ายอุปกรณ์หรือหน้าจอที่ขัดข้อง (ถ้ามี):</label>
                        <div className="flex items-center gap-3">
                          <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors border border-slate-200 flex items-center gap-1.5 shrink-0">
                            <FileImage className="w-4 h-4 text-slate-500" />
                            เลือกรูปภาพปัญหากล้อง
                            <input
                              type="file"
                              accept="image/*"
                              id="camera_attachment_input"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ticketImage ? '✓ แนบรูปภาพอุปกรณ์เรียบร้อย' : 'รองรับภาพถ่ายหน้ากล้องและแสงไฟ'}
                          </p>
                        </div>
                        {ticketImage && (
                          <div className="relative mt-2.5 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                            <img src={ticketImage} alt="Setup error attachment" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => setTicketImage(null)}
                              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 text-[10px] uppercase font-bold"
                            >
                              ✕ ลบ
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        id="submit_ticket_btn"
                        disabled={submittingTicket}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-colors"
                      >
                        {submittingTicket ? 'กำลังยื่นเรื่องช่วยเหลือ...' : 'ส่งเคสส่งอาจารย์ (Open Support Case)'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Tickets list - 7 Cols */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm min-h-[400px]">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-3 font-display">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      เคสขอความช่วยเหลือและประวัติการคุยของคุณ
                    </h3>
                    <p className="text-slate-500 text-xs mb-4">
                      แสดงรายการคำร้องที่ส่งปรึกษา อัปเดตคำตอบและการให้ความเห็นพึงพอใจการบริการ
                    </p>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {tickets.filter(t => t.studentEmail === currentUser?.email).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                          <AlertCircle className="w-12 h-12 text-slate-200 mb-2" />
                          <span>ยังไม่มีประวัติการส่งเคสขอความช่วยเหลืออุปกรณ์แต่อย่างใด</span>
                        </div>
                      ) : (
                        tickets
                          .filter(t => t.studentEmail === currentUser?.email)
                          .map((ticket) => {
                            const isShowing = activeStudentTicketId === ticket.id;
                            return (
                              <div
                                key={ticket.id}
                                id={`ticket_card_${ticket.id}`}
                                className="bg-slate-50/55 hover:bg-slate-50 border border-slate-100/80 rounded-2xl p-4 transition-all"
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5">
                                        {getCategoryLabel(ticket.category).toUpperCase()}
                                      </span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        ticket.status === 'pending'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                          : ticket.status === 'answered'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {ticket.status === 'pending' ? 'รอคำตอบ' : ticket.status === 'answered' ? 'อาจารย์ตอบแล้ว' : 'ปิดเคสเรียบร้อย'}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm">{ticket.title}</h4>
                                    <p className="text-slate-500 text-xs whitespace-pre-wrap">{ticket.description}</p>
                                    
                                    {ticket.imageUrl && (
                                      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                                        📷 แนบไฟล์รูปประกอบเรียบร้อย
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveStudentTicketId(isShowing ? null : ticket.id);
                                    }}
                                    className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-1.5 font-bold shrink-0 transition-colors"
                                  >
                                    {isShowing ? 'ย่อคำตอบ' : 'เปิดแชทคำตอบ'}
                                  </button>
                                </div>

                                {/* Replies Stream section */}
                                {isShowing && (
                                  <div className="mt-3.5 pl-3 border-l-2 border-indigo-600 space-y-3 bg-slate-50/70 p-3.5 rounded-xl flex flex-col">
                                    {/* Chat dialog logs */}
                                    <div className="space-y-3.5 max-h-72 overflow-y-auto mb-2 p-1">
                                      {(!ticket.messages || ticket.messages.length === 0) ? (
                                        <>
                                          {/* Fallback backward compatibility */}
                                          <div className="flex gap-2.5 items-start max-w-[85%]">
                                            <div className="bg-white border border-slate-200/65 rounded-2xl rounded-tl-none p-3 shadow-sm text-xs text-slate-800 leading-normal">
                                              <span className="text-[10px] text-slate-400 font-bold block mb-1">หัวข้อเริ่มเคสโดย {ticket.studentName}:</span>
                                              <p className="whitespace-pre-wrap font-medium">{ticket.description}</p>
                                            </div>
                                          </div>
                                          {ticket.replyText && (
                                            <div className="flex gap-2.5 items-start max-w-[85%] ml-auto flex-row-reverse">
                                              <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none p-3 shadow-md shadow-indigo-600/5 text-xs leading-normal">
                                                <span className="text-[10px] text-indigo-200 font-bold block mb-1">คำแนะนำโดย {ticket.repliedBy || 'อาจารย์'} (อาจารย์):</span>
                                                <p className="whitespace-pre-wrap font-medium">{ticket.replyText}</p>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        ticket.messages.map((msg, idx) => {
                                          const isMe = msg.senderId === currentUser?.uid || msg.senderRole === 'student';
                                          return (
                                            <div key={msg.id || idx} className={`flex gap-2.5 items-start max-w-[85%] ${isMe ? '' : 'ml-auto flex-row-reverse'}`}>
                                              <div className={`rounded-2xl p-3 shadow-sm text-xs leading-normal ${
                                                isMe 
                                                  ? 'bg-white border border-slate-200/65 text-slate-850 rounded-tl-none' 
                                                  : 'bg-indigo-600 text-white rounded-tr-none text-left'
                                              }`}>
                                                <span className={`text-[10px] font-bold block mb-1 ${
                                                  isMe ? 'text-slate-400' : 'text-indigo-200'
                                                }`}>
                                                  {msg.senderName} ({msg.senderRole === 'admin' ? 'ผู้สอน' : 'คุณ'}):
                                                </span>
                                                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                                <span className={`text-[8px] block text-right mt-1 font-mono ${
                                                  isMe ? 'text-slate-400' : 'text-indigo-300'
                                                }`}>
                                                  {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>

                                    {ticket.status !== 'closed' ? (
                                      <form 
                                        onSubmit={async (e) => {
                                          e.preventDefault();
                                          const form = e.currentTarget;
                                          const input = form.elements.namedItem('studentChatInput') as HTMLInputElement;
                                          if (!input || !input.value.trim()) return;
                                          const val = input.value.trim();
                                          input.value = "";
                                          try {
                                            await sendTicketMessage(ticket.id, val);
                                          } catch (error) {
                                            console.error("Failed to send message", error);
                                          }
                                        }}
                                        className="flex gap-2 border-t border-slate-200/65 pt-3"
                                      >
                                        <input
                                          name="studentChatInput"
                                          type="text"
                                          placeholder="พิมพ์คำถาม ข้อมูลเพิ่มเติม หรือโต้ตอบผู้สอนที่นี่..."
                                          className="flex-1 bg-white border border-slate-200 focus:outline-none focus:border-indigo-600 rounded-xl px-3.5 py-2 text-xs"
                                        />
                                        <button
                                          type="submit"
                                          className="bg-indigo-600 hover:bg-indigo-750 active:bg-indigo-800 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                                        >
                                          <span>ส่งแชท</span>
                                          <Send className="w-3 h-3" />
                                        </button>
                                      </form>
                                    ) : (
                                      <div className="bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-2.5 text-center text-xs font-bold">
                                        🔒 ตั๋วคำร้องนี้ปิดเสร็จสิ้นเรียบร้อยแล้ว ได้คะแนนความพึงพอใจเรียบร้อย
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: DYNAMIC KNOWLEDGE BASE & EQUIPMENT MANUAL CABINETS */}
            {studentTab === 'knowledge' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                id="knowledge_cabinets_root"
              >
                {/* Search Bar / Filter Panel */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 font-display">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        ตู้ความรู้อุปกรณ์สื่อพรีเมียม (BU CA Premium Knowledge Cabinets)
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        คลังข้อมูลดิจิทัล เทคนิคแก้ปัญหาเฉพาะหน้า และเช็คลิสต์ตรวจสอบกล้อง เลนส์ คลื่นเสียง และสตูดิโอถ่ายทำ
                      </p>
                    </div>
                    
                    {/* Search input */}
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        value={knowledgeSearch}
                        id="knowledge_search_input"
                        onChange={(e) => setKnowledgeSearch(e.target.value)}
                        placeholder="🔎 ค้นหาหัวข้อ เช่น แสง, รูรับแสง, ไมค์, คลื่น..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-medium"
                      />
                      {knowledgeSearch && (
                        <button
                          type="button"
                          onClick={() => setKnowledgeSearch('')}
                          className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid of Cabinets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cabinets.filter(cabin => {
                    if (!knowledgeSearch.trim()) return true;
                    const query = knowledgeSearch.toLowerCase();
                    return cabin.title.toLowerCase().includes(query) ||
                           cabin.summary.toLowerCase().includes(query) ||
                           cabin.tag.toLowerCase().includes(query) ||
                           (cabin.tips && cabin.tips.some(t => t.q.toLowerCase().includes(query) || t.a.toLowerCase().includes(query)));
                  }).map(cabin => {
                    const isOpen = activeCabinetId === cabin.id;
                    const getCabinetIcon = (iconName?: string) => {
                      switch(iconName) {
                        case 'camera': return <Camera className="w-5 h-5 text-orange-500" />;
                        case 'mic': return <Mic className="w-5 h-5 text-emerald-500" />;
                        case 'lighting': return <Lightbulb className="w-5 h-5 text-amber-500" />;
                        case 'editing': return <PenTool className="w-5 h-5 text-pink-500" />;
                        default: return <BookOpen className="w-5 h-5 text-indigo-500" />;
                      }
                    };
                    return (
                      <div
                        key={cabin.id}
                        id={`knowledge_cabin_${cabin.id}`}
                        className={`bg-white border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                          isOpen ? 'border-indigo-200 ring-2 ring-indigo-600/5' : 'border-slate-100 hover:border-indigo-100'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cabin.badgeBg}`}>
                              {cabin.tag}
                            </span>
                            <div className="p-2 bg-slate-50 rounded-xl shrink-0">
                              {getCabinetIcon(cabin.icon)}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm leading-snug font-display">{cabin.title}</h4>
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{cabin.summary}</p>
                          </div>

                          {isOpen && cabin.tips && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 border-t border-slate-100 pt-4 space-y-4"
                            >
                              <h5 className="font-bold text-xs text-indigo-700">📌 เจาะลึกเทคนิคแก้ปัญหาพบบ่อย:</h5>
                              <div className="space-y-3 divide-y divide-slate-100">
                                {cabin.tips.map((tip, idx) => (
                                  <div key={idx} className={`text-xs space-y-1 ${idx > 0 ? 'pt-3' : ''}`}>
                                    <div className="font-bold text-slate-800 flex items-start gap-1">
                                      <span className="text-indigo-600 shrink-0">Q:</span>
                                      <span>{tip.q}</span>
                                    </div>
                                    <div className="bg-slate-50 text-slate-600 p-2.5 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-wrap ml-4 font-medium">
                                      {tip.a}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveCabinetId(isOpen ? null : cabin.id)}
                          className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            isOpen 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-705' 
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {isOpen ? '✕ ปิดตู้ความรู้นี้' : '📖 เปิดตู้เพื่ออ่านคำอธิบายแบบละเอียด'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 bg-slate-50/70">
        <div className="max-w-[1700px] mx-auto px-4 text-center space-y-1.5">
          <p className="text-slate-500 text-xs leading-normal">
            © 2026 BU CA Media Support Panel. พัฒนาโดยใช้เทคโนโลยี React, Tailwind v4 และ Google Firestore Spark Plan (No-Cost tier)<br />
            สลับโหมดผู้ใช้เพื่อทำการทดสอบฟังก์ชันแลกเปลี่ยนข้อมูลด่วน คำตอบสั่นแจ้งเตือน และรายงานสรุป Excel สำหรับนักจัดสัมมนาได้อิสระ
          </p>
        </div>
      </footer>

    </div>
  );
}
