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
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from './hooks/useData';
import CameraWorkbench from './components/CameraWorkbench';
import AdminDashboard from './components/AdminDashboard';
import { HelpCategory } from './types';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Use original dimensions reduced by 10%
        let width = Math.round(img.width * 0.9);
        let height = Math.round(img.height * 0.9);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.90);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
    deleteProgram,
    roomImages,
    updateRoomImages
  } = useData();

  // Admin view toggle for student simulation view switcher (Requested Feature)
  const [isAdminViewingAsStudent, setIsAdminViewingAsStudent] = useState(false);

  // Room Settings States
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [tempRoom1Images, setTempRoom1Images] = useState<string[]>(["", "", "", "", ""]);
  const [tempRoom2Images, setTempRoom2Images] = useState<string[]>(["", "", "", "", ""]);
  const [activeRoomSettingsTab, setActiveRoomSettingsTab] = useState<"ห้องจัดรายการ 1" | "ห้องจัดรายการ 2">("ห้องจัดรายการ 1");
  const [uploadTargetIdx, setUploadTargetIdx] = useState<number | null>(null);
  const settingsFileRef = React.useRef<HTMLInputElement>(null);

  // Sync temp images when loaded
  React.useEffect(() => {
    if (roomImages) {
      const getArray = (val: any, defaultUrl: string) => {
        let arr: string[] = [];
        if (Array.isArray(val)) {
          arr = val.filter(Boolean);
        } else if (typeof val === "string" && val) {
          arr = [val];
        }
        if (arr.length === 0) {
          arr = [defaultUrl];
        }
        // Fill up to 5 elements with empty strings
        const filled = [...arr];
        while (filled.length < 5) {
          filled.push("");
        }
        return filled.slice(0, 5);
      };

      setTempRoom1Images(getArray(roomImages["ห้องจัดรายการ 1"], "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=85&w=1920"));
      setTempRoom2Images(getArray(roomImages["ห้องจัดรายการ 2"], "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=85&w=1920"));
    }
  }, [roomImages]);

  // Sync bookingStudentName with currentUser
  React.useEffect(() => {
    if (currentUser) {
      setBookingStudentName(currentUser.name || "");
    }
  }, [currentUser]);

  const handleSettingsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetIdx !== null) {
      try {
        const compressed = await compressImage(file);
        if (activeRoomSettingsTab === "ห้องจัดรายการ 1") {
          setTempRoom1Images((prev) => {
            const next = [...prev];
            next[uploadTargetIdx] = compressed;
            return next;
          });
        } else {
          setTempRoom2Images((prev) => {
            const next = [...prev];
            next[uploadTargetIdx] = compressed;
            return next;
          });
        }
      } catch (err) {
        console.error("Error compressing file:", err);
      } finally {
        e.target.value = "";
        setUploadTargetIdx(null);
      }
    }
  };

  // Active view states for Student
  const [studentTab, setStudentTab] = useState<'workbench' | 'helpdesk' | 'booking'>('workbench');
  
  // Student Booking states
  const [bookingRoom, setBookingRoom] = useState("ห้องจัดรายการ 1");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("09:00 - 10:00");
  const [bookingSubject, setBookingSubject] = useState("BRS311");
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [bookingStudentName, setBookingStudentName] = useState("");
  const [bookingStudentId, setBookingStudentId] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Schedule Check Table States
  const [activeScheduleRoom, setActiveScheduleRoom] = useState<string>("ห้องจัดรายการ 1");
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // Reset active image index when switching rooms
  React.useEffect(() => {
    setActiveImageIdx(0);
  }, [activeScheduleRoom]);

  const [scheduleBaseDate, setScheduleBaseDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

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
        return cellTime.startMin >= bTime.startMin && cellTime.endMin <= bTime.endMin;
      }
      const normalize = (str: string) => {
        let res = str.replace(/\./g, ':').trim();
        if (/^\d:/.test(res)) res = '0' + res;
        return res;
      };
      return normalize(b.timeSlot) === normalize(slotStr);
    });
  };
  
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

    // Close the modal immediately for instant, responsive UI feedback
    setIsBookingModalOpen(false);

    try {
      const combinedPurpose = `${bookingSubject.trim()} (${bookingPurpose.trim()})`;
      await createBooking(
        bookingRoom, 
        bookingDate, 
        bookingSlot, 
        combinedPurpose, 
        bookingStudentId.trim(), 
        bookingPhone.trim(),
        bookingStudentName.trim()
      );
      setBookingSubject("BRS311");
      setBookingPurpose("");
      setBookingStudentName(currentUser?.name || "");
      setBookingStudentId("");
      setBookingPhone("");
      setBookingSuccessMsg("🎉 ยืนยันการจองห้องจัดรายการเสร็จสิ้นเรียบร้อยแล้วค่ะ! ข้อมูลแสดงในตารางจัดรายการเรียบร้อยแล้ว");
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
      
      {/* Custom Styles for table hover skew shine animation */}
      <style>{`
        .shine-cell {
          position: relative;
          overflow: hidden !important;
        }
        .shine-cell-overlay {
          position: absolute;
          top: 0;
          left: -35%;
          height: 100%;
          width: 0;
          transform: skew(30deg);
          transform-origin: top left;
          transition-duration: 0.4s;
          transition-property: all;
          transition-timing-function: ease-out;
          background: linear-gradient(90deg, rgba(16, 185, 129, 0) 0%, rgba(16, 185, 129, 0.15) 50%, rgba(16, 185, 129, 0) 100%);
          pointer-events: none;
          z-index: 5;
        }
        .shine-cell:hover .shine-cell-overlay {
          width: 135%;
        }
      `}</style>

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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
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
                {currentUser.email === 'pongsakorn.c@bu.ac.th' && (
                  <button
                    type="button"
                    onClick={() => setIsRoomSettingsOpen(true)}
                    id="room_images_settings_btn"
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded-xl transition-all border border-indigo-100 flex items-center justify-center cursor-pointer shadow-sm"
                    title="ตั้งค่ารูปภาพห้องจัดรายการ"
                  >
                    <Settings className="w-4 h-4" />
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
      <main className="flex-1 w-full max-w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 transition-all duration-300">

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
            roomImages={roomImages}
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
                className="space-y-3 text-white"
                id="booking_tab_root"
              >
                
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  
                  {/* LEFT COLUMN: Room Image Preview (Fills height to match table on desktop) */}
                  <div className="lg:col-span-5 flex flex-col justify-start">
                    <div className="w-full max-w-md md:max-w-xl lg:max-w-none mx-auto aspect-[3/2] bg-[#111115] border border-[#2d2d34] rounded-[16px] overflow-hidden shadow-2xl relative group">
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
                              ? "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=85&w=1920"
                              : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=85&w=1920"
                          ];
                        }

                        const currentImgIdx = Math.min(activeImageIdx, images.length - 1);
                        const currentImg = images[currentImgIdx] || images[0];

                        return (
                          <>
                            <img 
                              src={currentImg} 
                              alt={activeScheduleRoom}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                            {/* Elegant overlay gradient at bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111115]/80 to-transparent pointer-events-none" />
                            
                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                                  }}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/75 hover:bg-white/90 text-slate-800 rounded-full p-2 transition-all shadow-md z-10 cursor-pointer animate-fade-in backdrop-blur-[2px]"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/75 hover:bg-white/90 text-slate-800 rounded-full p-2 transition-all shadow-md z-10 cursor-pointer animate-fade-in backdrop-blur-[2px]"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Indicator Dots */}
                            {images.length > 1 && (
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
                                {images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveImageIdx(idx);
                                    }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                      idx === currentImgIdx ? "bg-[#ef8840] scale-125" : "bg-white/60 hover:bg-white"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {/* Caption underneath the image */}
                    <div className="pt-1.5 text-center">
                      <p className="text-[#94a3b8] text-[11px] font-semibold tracking-wide">
                        มุมมองบรรยากาศห้อง/สถานที่จอง (Atmospheric Preview)
                      </p>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Table representation (lg:col-span-7) */}
                  <div className="lg:col-span-7 bg-[#111115] border border-[#2d2d34] p-3 rounded-[16px] shadow-2xl space-y-3">
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
                    <table className="w-full min-w-[960px] border-collapse text-xs text-center table-fixed bg-[#0e0e11]">
                      <thead>
                        {/* Elegant dark grey row for วิชา */}
                        <tr className="border-b border-[#2d2d34]">
                          <th colSpan={7} className={`py-3 bg-[#111113] ${activeScheduleRoom === "ห้องจัดรายการ 1" ? "text-[#ef8840]" : "text-[#4a90e2]"} font-extrabold text-xs sm:text-sm tracking-wide shadow-sm`}>
                            📚 รายวิชาเรียนประจำสัปดาห์ (Scheduled Class Subjects)
                          </th>
                        </tr>
                        {/* Table Headers in unified slate dark styling for professional contrast */}
                        <tr className="bg-[#16161a] text-[#ffffff] font-bold border-b border-[#2d2d34]">
                          <th className="py-2.5 px-2 border-r border-[#2d2d34] bg-[#0e0e11] text-[#ffffff] font-extrabold w-[13%]">วัน / เวลา</th>
                          <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[14.5%]">9.00 - 10.00</th>
                          <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[14.5%]">10.00 - 11.00</th>
                          <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[14.5%]">11.00 - 12.00</th>
                          <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[14.5%]">13.00 - 14.00</th>
                          <th className="py-2.5 px-2 border-r border-[#2d2d34] text-[#ffffff] font-extrabold w-[14.5%]">14.00 - 15.00</th>
                          <th className="py-2.5 px-2 text-[#ffffff] font-extrabold w-[14.5%]">15.00 - 16.00</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getWeekDates(scheduleBaseDate).map((dayInfo) => {
                          const slots = [
                            "9.00 - 10.00",
                            "10.00 - 11.00",
                            "11.00 - 12.00",
                            "13.00 - 14.00",
                            "14.00 - 15.00",
                            "15.00 - 16.00"
                          ];

                          return (
                            <tr key={dayInfo.dayName} className="border-b border-[#2d2d34] bg-[#16161a] hover:bg-[#1b1b21] transition-colors">
                              {/* Day Name and Date */}
                              <td className="py-1.5 px-1 border-r border-[#2d2d34] font-bold bg-[#111113] text-slate-100">
                                <div className={`text-[11px] uppercase font-extrabold ${activeScheduleRoom === "ห้องจัดรายการ 1" ? "text-[#ef8840]" : "text-[#4a90e2]"}`}>{dayInfo.dayName}</div>
                                <div className="text-[9px] text-slate-400 font-semibold mt-0.5">{dayInfo.displayDate}</div>
                              </td>

                              {/* Slots */}
                              {slots.map((slot) => {
                                // Look up if there's an approved or pending booking for this cell
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

                                        // Match code and title
                                        let subjectCode = "BRS311";
                                        let subjectTitle = "";
                                        if (displaySubject) {
                                          const codeMatch = displaySubject.match(/^([A-Za-z]{2,4}\d{3,4})[\s:-]*(.*)$/);
                                          if (codeMatch) {
                                            subjectCode = codeMatch[1].toUpperCase();
                                            subjectTitle = codeMatch[2].trim() || displayPurpose || "ฝึกจัดรายการ";
                                          } else {
                                            if (displaySubject.length <= 8) {
                                              subjectCode = displaySubject;
                                              subjectTitle = displayPurpose || "กิจกรรมพิเศษ";
                                            } else {
                                              subjectCode = "WORK";
                                              subjectTitle = displaySubject;
                                            }
                                          }
                                        } else {
                                          subjectCode = "BRS311";
                                          subjectTitle = displayPurpose || "ฝึกจัดรายการ";
                                        }

                                        // Format Booker details
                                        const namePart = b.studentName ? b.studentName.split(/\s+/)[0] : "ไม่ระบุ";
                                        let phoneMasked = "";
                                        if (b.phone) {
                                          const cleanPhone = b.phone.trim();
                                          if (cleanPhone.length >= 8) {
                                            phoneMasked = cleanPhone.slice(0, cleanPhone.length - 4) + "xxxx";
                                          } else {
                                            phoneMasked = cleanPhone;
                                          }
                                        } else {
                                          phoneMasked = b.studentIdInput ? (b.studentIdInput.length > 4 ? b.studentIdInput.slice(0, 4) + "xxxx" : b.studentIdInput) : "";
                                        }
                                        
                                        const footerText = phoneMasked ? `${namePart} (${phoneMasked})` : namePart;
                                        const accentColorClass = isRoom1 ? "text-[#ef8840]" : "text-[#4a90e2]";
                                        const barColorClass = isRoom1 ? "bg-[#ef8840]" : "bg-[#4a90e2]";
                                        const borderOutlineClass = isRoom1 ? "border-[#ef8840]/30" : "border-[#4a90e2]/30";
                                        const footerTextColorClass = isRoom1 ? "text-[#ef8840]" : "text-[#4a90e2]";

                                        return (
                                          <>
                                            {/* Visible Compact Card */}
                                            <div 
                                              className={`relative p-3 pl-4 rounded-xl border border-solid text-left flex flex-col justify-between h-full min-h-[82px] transition-all duration-300 shadow-md overflow-hidden bg-[#1E1E1E] ${borderOutlineClass}`}
                                            >
                                              {/* Left Thick Rounded Accent Bar */}
                                              <div className={`absolute left-0 top-0 bottom-0 w-[5px] rounded-l-xl ${barColorClass}`} />

                                              <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                                                {/* Header: Subject Code */}
                                                <div className={`font-extrabold text-[11px] sm:text-[12px] tracking-wider uppercase truncate ${accentColorClass}`}>
                                                  {subjectCode}
                                                </div>

                                                {/* Subject Title */}
                                                <div 
                                                  className="font-bold text-xs sm:text-[13px] text-[#d3d3d3] leading-snug mt-0.5 truncate" 
                                                  title={subjectTitle}
                                                >
                                                  {subjectTitle}
                                                </div>
                                              </div>

                                              {/* Separator line */}
                                              <div 
                                                className="h-[1px] bg-[#aeadad]/20 w-full my-1.5" 
                                              />

                                              {/* Booker Name & Contact details */}
                                              <div 
                                                className={`text-[10.5px] font-bold ${footerTextColorClass} truncate leading-none`}
                                                title={footerText}
                                              >
                                                {footerText}
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

                                // Empty/Free Slot
                                return (
                                  <td 
                                    key={slot} 
                                    className="p-1 border-r border-[#2d2d34] group bg-[#16161a] transition-all duration-300 text-center"
                                  >
                                    {/* Empty card container that matches the booked card dimensions and style */}
                                    <div className="p-1 rounded-lg border border-dashed border-[#2d2d34] bg-[#0e0e11]/20 text-center flex items-center justify-center h-full min-h-[82px] transition-all duration-300 group-hover:border-slate-500/30 group-hover:bg-[#1c1c24] shadow-sm">
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

                <div className="flex justify-center">
                  
                  {/* Booking submission form */}
                  <div className="w-full max-w-xl space-y-4">
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
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3 pb-1 border-b border-slate-50">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">4. รายวิชา</label>
                          <select
                            value={bookingSubject}
                            onChange={(e) => setBookingSubject(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                          >
                            <option value="BRS311">BRS311</option>
                            <option value="งานอื่นๆ">งานอื่นๆ</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">วัตถุประสงค์</label>
                          <textarea
                            rows={2}
                            value={bookingPurpose}
                            onChange={(e) => setBookingPurpose(e.target.value)}
                            placeholder="จัดรายการรายวิชาเรียน / ฝึกจัดรายการ"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-medium resize-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">5. ชื่อ-นามสกุล</label>
                          <input
                            type="text"
                            value={bookingStudentName}
                            onChange={(e) => setBookingStudentName(e.target.value)}
                            placeholder="ชื่อ-นามสกุล"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-750 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">6. รหัสนักศึกษา</label>
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
                          <label className="text-xs font-bold text-slate-700 block mb-1">7. เบอร์โทร</label>
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

                </div>

              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 bg-slate-50/70">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1.5">
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

      {/* Centered Booking Form Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setIsBookingModalOpen(false)}
            id="booking_modal_backdrop"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white border border-slate-100 rounded-[24px] p-6 sm:p-7 shadow-2xl cursor-default my-auto"
              onClick={(e) => e.stopPropagation()}
              id="booking_modal_content"
            >
              {/* Close Button */}
              <button 
                type="button"
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
                onClick={() => setIsBookingModalOpen(false)}
                title="ปิดหน้าต่าง"
              >
                ✕
              </button>

              <div className="space-y-4">
                {/* Header info */}
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

                {/* Form starts */}
                <form onSubmit={handleRoomBookingSubmit} className="space-y-4 pt-1">
                  
                  {/* Select Room */}
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

                  {/* Date & Timeslot Grid */}
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

                  {/* Subject and Purpose */}
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

                  {/* Student ID & Contact phone */}
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

                  {/* Submit / Action buttons */}
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

      {/* Settings Modal */}
      <AnimatePresence>
        {isRoomSettingsOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setIsRoomSettingsOpen(false)}
            id="room_settings_modal_backdrop"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-xl bg-[#0e0e11] border border-[#2d2d34] rounded-[24px] p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] cursor-default my-auto text-white"
              onClick={(e) => e.stopPropagation()}
              id="room_settings_modal_content"
            >
              {/* Close Button */}
              <button 
                type="button"
                className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
                onClick={() => setIsRoomSettingsOpen(false)}
                title="ปิดหน้าต่าง"
              >
                ✕
              </button>

              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#2d2d34]">
                  <div className="bg-[#ef8840]/10 text-[#ef8840] p-2.5 rounded-xl border border-[#ef8840]/20">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-200 text-base font-display">
                      ตั้งค่ารูปภาพห้องจัดรายการ (Room Images Gallery - Max 5)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">เฉพาะแอดมิน pongsakorn.c@bu.ac.th • แสดงผลสอดคล้องกันทุกเครื่อง ทุกแอคเคาท์</p>
                  </div>
                </div>

                {/* Tab Switcher inside Settings */}
                <div className="flex bg-[#16161a] border border-[#2d2d34] p-1 rounded-xl gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveRoomSettingsTab("ห้องจัดรายการ 1")}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeRoomSettingsTab === "ห้องจัดรายการ 1"
                        ? "bg-[#ef8840] text-white shadow-md font-black"
                        : "hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    🎙️ ห้องจัดรายการ 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoomSettingsTab("ห้องจัดรายการ 2")}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      activeRoomSettingsTab === "ห้องจัดรายการ 2"
                        ? "bg-[#4a90e2] text-white shadow-md font-black"
                        : "hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    🎧 ห้องจัดรายการ 2
                  </button>
                </div>

                {/* Hidden File Input for the Settings */}
                <input 
                  type="file" 
                  ref={settingsFileRef} 
                  onChange={handleSettingsFileChange}
                  accept="image/*" 
                  className="hidden" 
                />

                {/* Form / Images slots */}
                <div className="space-y-3 pt-1">
                  <p className="text-slate-400 text-[10.5px] font-semibold">
                    กรุณาคลิกที่รูปภาพเพื่ออัปโหลดจากไฟล์ภายในเครื่อง หรือนำเข้าโดยตรงด้วย URL รูปภาพประกอบ (อัปโหลดได้สูงสุดห้องละ 5 รูป)
                  </p>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {(activeRoomSettingsTab === "ห้องจัดรายการ 1" ? tempRoom1Images : tempRoom2Images).map((currentUrl, idx) => {
                      const accentColor = activeRoomSettingsTab === "ห้องจัดรายการ 1" ? "group-hover:text-[#ef8840] hover:border-[#ef8840]" : "group-hover:text-[#4a90e2] hover:border-[#4a90e2]";
                      const borderFocus = activeRoomSettingsTab === "ห้องจัดรายการ 1" ? "focus:border-[#ef8840]/60" : "focus:border-[#4a90e2]/60";
                      
                      return (
                        <div key={idx} className="flex items-center gap-3 bg-[#16161a] border border-[#2d2d34] p-2.5 rounded-xl hover:bg-[#1a1a20] transition-colors">
                          {/* Thumbnail / Upload Button */}
                          <div 
                            onClick={() => {
                              setUploadTargetIdx(idx);
                              settingsFileRef.current?.click();
                            }}
                            className={`w-11 h-11 bg-[#0e0e11] border border-[#2d2d34] ${accentColor} rounded-lg overflow-hidden relative group cursor-pointer flex flex-col items-center justify-center transition-all shrink-0`}
                            title="อัปโหลดรูปภาพ"
                          >
                            {currentUrl ? (
                              <>
                                <img 
                                  src={currentUrl} 
                                  alt={`Slot ${idx + 1}`} 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Camera className="w-4.5 h-4.5 text-slate-200" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-slate-300">
                                <Camera className="w-4.5 h-4.5" />
                                <span className="text-[7.5px] font-bold mt-0.5">อัปโหลด</span>
                              </div>
                            )}
                          </div>

                          {/* URL Input */}
                          <div className="flex-1 min-w-0">
                            <label className="text-[8.5px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">
                              รูปภาพตำแหน่งที่ {idx + 1} {currentUrl.startsWith("data:") && <span className="text-emerald-400 font-extrabold">(✓ อัปโหลดไฟล์สำเร็จ)</span>}
                            </label>
                            <input
                              type="url"
                              value={currentUrl.startsWith("data:") ? "" : currentUrl}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (activeRoomSettingsTab === "ห้องจัดรายการ 1") {
                                  setTempRoom1Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = val;
                                    return next;
                                  });
                                } else {
                                  setTempRoom2Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = val;
                                    return next;
                                  });
                                }
                              }}
                              placeholder={currentUrl.startsWith("data:") ? "✓ อัปโหลดไฟล์รูปภาพแล้ว" : "https://example.com/image.jpg"}
                              className={`w-full bg-[#0e0e11] border border-[#2d2d34] rounded-lg px-2 py-1 text-[10.5px] text-slate-200 focus:bg-[#1a1a22] ${borderFocus} focus:outline-none transition-all font-mono`}
                            />
                          </div>

                          {/* Delete Button */}
                          {currentUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (activeRoomSettingsTab === "ห้องจัดรายการ 1") {
                                  setTempRoom1Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = "";
                                    return next;
                                  });
                                } else {
                                  setTempRoom2Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = "";
                                    return next;
                                  });
                                }
                              }}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer border border-red-500/20"
                              title="ล้างรูปภาพนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-[#2d2d34]">
                  <button
                    type="button"
                    onClick={() => setIsRoomSettingsOpen(false)}
                    className="flex-1 bg-[#1e1e24] hover:bg-[#25252d] text-slate-300 font-extrabold rounded-xl py-3 text-xs transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Close modal immediately
                      setIsRoomSettingsOpen(false);
                      
                      // Filter out empty URLs or files
                      const filteredRoom1 = tempRoom1Images.filter(Boolean);
                      const filteredRoom2 = tempRoom2Images.filter(Boolean);

                      // Fall back to defaults if fully cleared
                      const finalRoom1 = filteredRoom1.length > 0 ? filteredRoom1 : ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=85&w=1920"];
                      const finalRoom2 = filteredRoom2.length > 0 ? filteredRoom2 : ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=85&w=1920"];

                      // Fire the save action in the background
                      updateRoomImages({
                        "ห้องจัดรายการ 1": finalRoom1,
                        "ห้องจัดรายการ 2": finalRoom2
                      }).catch((err) => {
                        console.error("Failed to update room images:", err);
                      });
                    }}
                    className="flex-1 bg-[#ef8840] hover:bg-[#ef8840]/90 text-white font-extrabold rounded-xl py-3 text-xs transition-all cursor-pointer shadow-md"
                  >
                    บันทึกการตั้งค่าทั้งหมด
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
