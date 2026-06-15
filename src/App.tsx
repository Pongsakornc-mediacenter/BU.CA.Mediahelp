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
  PenTool,
  Plus
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
    bookings,
    programs,
    createBooking,
    updateBookingStatus,
    deleteBooking,
    createProgram,
    updateProgramStatus,
    deleteProgram
  } = useData();

  // Admin view toggle for student simulation view switcher (Requested Feature)
  const [isAdminViewingAsStudent, setIsAdminViewingAsStudent] = useState(false);

  // Active view states for Student
  const [studentTab, setStudentTab] = useState<'workbench' | 'helpdesk' | 'booking'>('workbench');
  
  // Student Booking states
  const [bookingRoom, setBookingRoom] = useState("ห้องจัดรายการ 1");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("09:00 - 10:00");
  const [bookingSubject, setBookingSubject] = useState("");
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [bookingStudentId, setBookingStudentId] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  
  // Submit Ticket Form States
  const [ticketCategory, setTicketCategory] = useState<HelpCategory>('camera');
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketImages, setTicketImages] = useState<string[]>([]);
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

  // Lightbox Image Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // File conversion of image attachments (supports up to 5 images with compression)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - ticketImages.length;
    if (remainingSlots <= 0) {
      alert("สามารถอัปโหลดรูปภาพได้สูงสุด 5 รูปเท่านั้นค่ะ");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Compress on canvas to save document quota (~80% quality, max 1366x1024 as requested)
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1366;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          let compressedBase64 = canvas.toDataURL("image/jpeg", quality);

          // Safe limit: protect Firestore from exceeding the 1MB document limit.
          // Gently throttle down the quality or dimensions if it's too large, ensuring high compatibility.
          let attempts = 0;
          while (compressedBase64.length > 165000 && quality > 0.4 && attempts < 4) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            attempts++;
          }

          setTicketImages((prev) => {
            if (prev.length >= 5) return prev;
            return [...prev, compressedBase64];
          });
        };
      };
    });

    e.target.value = "";
  };

  const handleDeleteImage = (indexToRemove: number) => {
    setTicketImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) {
      alert("กรุณากรอกหัวข้อและคำอธิบายปัญหาอุปกรณ์");
      return;
    }

    const title = ticketTitle.trim();
    const desc = ticketDesc.trim();
    const category = ticketCategory;
    const images = [...ticketImages];

    // Clear and reset form immediately so student screen wipes instantly 
    // exactly like submitting an order/cart!
    setTicketTitle("");
    setTicketDesc("");
    setTicketImages([]);
    setTicketCategory('camera');
    setStudentTab('helpdesk');
    setSubmittingTicket(false);

    // Call creation asynchronously in the background so the UI is free and responsive instantly!
    createSupportTicket(category, title, desc, images)
      .then(() => {
        console.log("Ticket created successfully in the background");
      })
      .catch((err) => {
        console.error("Background ticket submission error:", err);
      });

    alert("🎉 ส่งตั๋วขอความช่วยเหลือถึงอาจารย์ผู้สอนสำเร็จ! ระบบกำลังดึงการปรับปรุงคำตอบแบบเรียลไทม์");
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
    const textToSend = studentMsgText.trim();
    if (!activeStudentTicketId || !textToSend) return;

    // Reset input instantly like standard chat!
    setStudentMsgText("");

    sendTicketMessage(activeStudentTicketId, textToSend)
      .catch((err) => {
        console.error("Error sending student chat in background:", err);
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
    if (!bookingStudentId.trim()) {
      alert("กรุณาระบุรหัสนักศึกษา");
      return;
    }
    if (!bookingPhone.trim()) {
      alert("กรุณาระบุเบอร์โทร");
      return;
    }

    try {
      const combinedPurpose = `${bookingSubject.trim()} (${bookingPurpose.trim()})`;
      await createBooking(
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
      setBookingSuccessMsg("🎉 ส่งคำขอจองห้องจัดรายการเรียบร้อยแล้วค่ะ! กรุณารออาจารย์เข้าคิวอนุมัติผ่านระบบแผงควบคุม");
      setTimeout(() => setBookingSuccessMsg(""), 6000);
    } catch (err) {
      console.error("Booking error details:", err);
      alert("เกิดข้อผิดพลาดในการยื่นระบบคำจอง");
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
            bookings={bookings}
            programs={programs}
            onSubmitReply={submitTicketReply}
            onDownloadReport={downloadAttendanceReportCSV}
            currentUserEmail={currentUser.email}
            onUpdateBookingStatus={updateBookingStatus}
            onDeleteBooking={deleteBooking}
            onCreateProgram={createProgram}
            onUpdateProgramStatus={updateProgramStatus}
            onDeleteProgram={deleteProgram}
            onCreateBooking={createBooking}
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
                onClick={() => setStudentTab('booking')}
                id="tab_booking_btn"
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  studentTab === 'booking'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                จองห้องสตูดิโอ & ตารางออกอากาศ
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
                        <label className="text-xs font-semibold text-slate-600 block mb-1">อัปโหลดภาพถ่ายอุปกรณ์หรือหน้าจอที่ขัดข้อง (สูงสุด 5 รูป):</label>
                        <div className="flex items-center gap-3">
                          <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors border border-slate-200 flex items-center gap-1.5 shrink-0">
                            <FileImage className="w-4 h-4 text-slate-500" />
                            เลือกรูปภาพปัญหากล้อง (สูงสุด 5 รูป)
                            <input
                              key={ticketImages.length === 0 ? "empty" : "has-images"}
                              type="file"
                              accept="image/*"
                              multiple
                              id="camera_attachment_input"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ticketImages.length > 0 
                              ? `✓ แนบรูปภาพอุปกรณ์สำเร็จ ${ticketImages.length}/5 รูป` 
                              : 'รองรับภาพถ่ายหน้ากล้องและแสงไฟ'}
                          </p>
                        </div>
                        {ticketImages.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 mt-3">
                            {ticketImages.map((imgSrc, index) => (
                              <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square flex items-center justify-center group shadow-sm">
                                <img src={imgSrc} alt={`Attachment draft ${index + 1}`} className="max-h-full object-contain" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(index)}
                                  className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md transition-colors"
                                  title="ลบรูปภาพนี้"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
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

                                                {/* Render attachments for student's first message */}
                                                {isMe && idx === 0 && ((ticket.imageUrls && ticket.imageUrls.length > 0) || ticket.imageUrl) && (
                                                  <div className="mt-2 text-left">
                                                    <div className="grid grid-cols-2 gap-1.5 max-w-md">
                                                      {(ticket.imageUrls && ticket.imageUrls.length > 0 ? ticket.imageUrls : [ticket.imageUrl]).filter(Boolean).map((imgUrl, imgIdx) => (
                                                        <div key={imgIdx} className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                                                          <img 
                                                            src={imgUrl} 
                                                            alt={`My Attachment ${imgIdx + 1}`} 
                                                            referrerPolicy="no-referrer"
                                                            className="max-h-40 object-contain w-full cursor-zoom-in"
                                                            onClick={() => setPreviewImageUrl(imgUrl)}
                                                          />
                                                        </div>
                                                      ))}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-semibold mt-1">
                                                      📷 ภาพถ่ายแนบประกอบที่บันทึกไว้ ({ticket.imageUrls?.length || 1} รูป)
                                                    </div>
                                                  </div>
                                                )}

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

            {/* TAB 3: DYNAMIC ROOMS BOOKING & SHOWS PROGRAMMING PORTAL */}
            {studentTab === 'booking' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                id="booking_tab_root"
              >
                
                {/* Header Welcome banner */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 font-display">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    ระบบจองห้องสตูดิโอนิเทศศาสตร์ (CA Studio Room Bookings Portal)
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    จองเวลาใช้อุปกรณ์กลุ่ม ห้องทำพอดแคสต์ สตูดิโอโทรทัศน์เสมือนจริง และประเด็นออกอากาศวิทยุแบบสอดประสานกันเรียลไทม์
                  </p>
                </div>

                {/* Submitting Success feedback banner */}
                {bookingSuccessMsg && (
                  <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-xl border border-emerald-200 animate-pulse">
                    {bookingSuccessMsg}
                  </div>
                )}

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
                          onChange={(e) => setBookingRoom(e.target.value)}
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
                            onChange={(e) => setBookingDate(e.target.value)}
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
