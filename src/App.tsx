/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Camera, 
  Calendar,
  BookOpen, 
  Sparkles, 
  LogOut, 
  Layers, 
  Sliders, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BellRing,
  GraduationCap,
  QrCode, 
  RefreshCw, 
  Plus, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  User, 
  ChevronDown, 
  FileSpreadsheet, 
  BarChart3, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData, getCourseLabel, isTimeOverlapping } from './hooks/useData';
import CameraWorkbench from './components/CameraWorkbench';
import AdminDashboard from './components/AdminDashboard';
import { DataSummaryDashboard } from './components/DataSummaryDashboard';
import { CourseManagementModal } from './components/CourseManagementModal';
import { EditBookingModal } from './components/EditBookingModal';
import { DeleteBookingConfirmModal } from './components/DeleteBookingConfirmModal';
import { VerifyBookingPinModal } from './components/VerifyBookingPinModal';
import { UnifiedBookingForm } from './components/UnifiedBookingForm';
import { BookingDetailModal } from './components/BookingDetailModal';
import { SuccessNotificationModal, SuccessModalType } from './components/SuccessNotificationModal';
import { RoomBooking, HelpCategory } from './types';

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

export default function App() {
  const {
    currentUser,
    tickets,
    attendance,
    loading,
    lastNotification,
    setLastNotification,
    loginWithGoogle,
    logout,
    createSupportTicket,
    submitTicketReply,
    submitTicketRating,
    sendTicketMessage,
    checkInToClass,
    downloadAttendanceReportCSV,
    bookings,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    roomImages,
    updateRoomImages
  } = useData();

  // Room Settings & Course Management States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [tempRoom1Images, setTempRoom1Images] = useState<string[]>(["", "", "", "", ""]);
  const [tempRoom2Images, setTempRoom2Images] = useState<string[]>(["", "", "", "", ""]);
  const [tempYoutube1Images, setTempYoutube1Images] = useState<string[]>(["", "", "", "", ""]);
  const [tempYoutube2Images, setTempYoutube2Images] = useState<string[]>(["", "", "", "", ""]);
  const [activeRoomSettingsTab, setActiveRoomSettingsTab] = useState<"ห้องจัดรายการ 1" | "ห้องจัดรายการ 2" | "ห้องยูทูป 1" | "ห้องยูทูป 2">("ห้องจัดรายการ 1");
  const [uploadTargetIdx, setUploadTargetIdx] = useState<number | null>(null);
  const settingsFileRef = React.useRef<HTMLInputElement>(null);

  // Sync temp images when loaded
  React.useEffect(() => {
    if (roomImages && !isRoomSettingsOpen) {
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
      setTempYoutube1Images(getArray(roomImages["ห้องยูทูป 1"], "https://images.unsplash.com/photo-1616469829941-c7200edec809?q=85&w=1920"));
      setTempYoutube2Images(getArray(roomImages["ห้องยูทูป 2"], "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=85&w=1920"));
    }
  }, [roomImages, isRoomSettingsOpen]);

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
        } else if (activeRoomSettingsTab === "ห้องจัดรายการ 2") {
          setTempRoom2Images((prev) => {
            const next = [...prev];
            next[uploadTargetIdx] = compressed;
            return next;
          });
        } else if (activeRoomSettingsTab === "ห้องยูทูป 1") {
          setTempYoutube1Images((prev) => {
            const next = [...prev];
            next[uploadTargetIdx] = compressed;
            return next;
          });
        } else if (activeRoomSettingsTab === "ห้องยูทูป 2") {
          setTempYoutube2Images((prev) => {
            const next = [...prev];
            next[uploadTargetIdx] = compressed;
            return next;
          });
        }
      } catch (err) {
        console.warn("Notice compressing file:", err);
      } finally {
        e.target.value = "";
        setUploadTargetIdx(null);
      }
    }
  };

  // Active view states
  const [studentTab, setStudentTab] = useState<'workbench' | 'booking' | 'summary'>('booking');
  const [adminTab, setAdminTab] = useState<'student_schedule' | 'summary' | 'tickets' | 'bookings'>('student_schedule');


  const handleOpenSummaryView = () => {
    if (currentUser?.role === 'admin') {
      setAdminTab('summary');
    } else {
      setStudentTab('summary');
    }
    setIsProfileDropdownOpen(false);
  };
  
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  const [successModalConfig, setSuccessModalConfig] = useState<{
    isOpen: boolean;
    type: SuccessModalType;
  }>({
    isOpen: false,
    type: 'booking'
  });
  const [myBookingFilter, setMyBookingFilter] = useState("");

  // Robust Date & Room comparison helpers
  const isSameDate = (dateA?: string, dateB?: string) => {
    if (!dateA || !dateB) return false;
    const cleanA = dateA.trim();
    const cleanB = dateB.trim();
    if (cleanA === cleanB) return true;
    const partsA = cleanA.split('-');
    const partsB = cleanB.split('-');
    if (partsA.length === 3 && partsB.length === 3) {
      const yA = parseInt(partsA[0], 10);
      const mA = parseInt(partsA[1], 10);
      const dA = parseInt(partsA[2], 10);
      const yB = parseInt(partsB[0], 10);
      const mB = parseInt(partsB[1], 10);
      const dB = parseInt(partsB[2], 10);
      return yA === yB && mA === mB && dA === dB;
    }
    return false;
  };

  const isSameRoom = (roomA?: string, roomB?: string) => {
    if (!roomA || !roomB) return false;
    return roomA.replace(/\s+/g, ' ').trim().toLowerCase() === roomB.replace(/\s+/g, ' ').trim().toLowerCase();
  };

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
    return true;
  });
  
  // Schedule Check Table States
  const [activeScheduleRoom, setActiveScheduleRoom] = useState<string>("ห้องจัดรายการ 1");
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
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
        console.warn("Notice sending student chat:", err?.message || err);
      });
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
    <div 
      className={`bg-slate-50 font-sans text-slate-800 flex flex-col ${
        !currentUser ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`} 
      id="app_root_layout"
    >
      
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
                  className="bg-white text-indigo-900 text-[10px] font-bold px-3 py-1 rounded-lg transition-colors"
                >
                  รับทราบ
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
              <div className="flex items-center gap-2.5">
                {/* Data Summary Button next to Settings */}
                <button
                  type="button"
                  onClick={handleOpenSummaryView}
                  id="data_summary_btn"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl transition-all border border-emerald-200/70 flex items-center gap-1.5 cursor-pointer shadow-xs text-xs font-bold"
                  title="สรุปข้อมูล"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">สรุปข้อมูล</span>
                </button>

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

                {/* Profile Menu Dropdown */}
                <div className="relative" id="profile_menu_dropdown_container">
                  <button
                    type="button"
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    id="profile_dropdown_trigger_btn"
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
                    title="เมนูโปรไฟล์"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div className="hidden sm:block text-left pr-1">
                      <span className="text-slate-800 text-xs font-bold block leading-tight">{currentUser.name}</span>
                      <span className="text-slate-400 text-[9px] block font-mono leading-tight">
                        {currentUser.role === 'admin' ? 'อาจารย์ผู้ดูแล' : currentUser.email}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Content */}
                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <>
                        {/* Invisible Backdrop to close on click outside */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsProfileDropdownOpen(false)} 
                        />

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                        >
                          {/* User Info Header */}
                          <div className="p-3.5 bg-slate-50/80 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {currentUser.role === 'admin' ? 'อาจารย์ผู้ดูแล (ADMIN)' : 'นักศึกษา / ผู้ใช้งาน'}
                              </span>
                            </div>
                          </div>

                          {/* Menu Options */}
                          <div className="p-1.5 space-y-1">
                            {/* Data Summary Button */}
                            <button
                              type="button"
                              onClick={handleOpenSummaryView}
                              id="profile_dropdown_summary_btn"
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50/80 rounded-xl transition-all text-left cursor-pointer group"
                            >
                              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                <BarChart3 className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="leading-tight">สรุปข้อมูล</span>
                                <span className="text-[9.5px] font-normal text-slate-400">รายงานสรุปข้อมูลเเละสถิติระบบ</span>
                              </div>
                            </button>

                            {/* Feature 6: Excel / CSV Report Download */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsProfileDropdownOpen(false);
                                downloadAttendanceReportCSV();
                              }}
                              id="profile_dropdown_export_excel_btn"
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-all text-left cursor-pointer group"
                            >
                              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                <FileSpreadsheet className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="leading-tight">ออกรายงาน Excel / CSV</span>
                                <span className="text-[9.5px] font-normal text-slate-400">สรุปสถิติการใช้งานรายภาคเรียน</span>
                              </div>
                            </button>

                            {/* Settings Option for Admin: Course Management */}
                            {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.email === 'pongsakorn.c@bu.ac.th') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsProfileDropdownOpen(false);
                                  setIsCourseModalOpen(true);
                                }}
                                id="profile_dropdown_course_management_btn"
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-purple-600 hover:bg-purple-50/80 rounded-xl transition-all text-left cursor-pointer group"
                              >
                                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="leading-tight">⚙️ จัดการรายวิชา</span>
                                  <span className="text-[9.5px] font-normal text-slate-400">เพิ่ม แก้ไข ลบรายวิชาในระบบ</span>
                                </div>
                              </button>
                            )}

                            {/* Settings Option for Admin */}
                            {currentUser.email === 'pongsakorn.c@bu.ac.th' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsProfileDropdownOpen(false);
                                  setIsRoomSettingsOpen(true);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl transition-all text-left cursor-pointer group"
                              >
                                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                  <Settings className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="leading-tight">ตั้งค่ารูปภาพห้องจัดรายการ</span>
                                  <span className="text-[9.5px] font-normal text-slate-400">จัดการรูปภาพบรรยากาศห้อง</span>
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="h-[1px] bg-slate-100 my-0.5" />

                          {/* Logout */}
                          <div className="p-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsProfileDropdownOpen(false);
                                logout();
                              }}
                              id="profile_dropdown_sign_out_btn"
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all text-left cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>ออกจากระบบ</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <span className="text-slate-400 text-xs font-mono">กรุณาเข้าสู่ระบบด้านล่าง</span>
            )}
          </div>
        </div>
      </header>

      {/* 3. Central Content Arena */}
      <main className={`flex-1 w-full max-w-full mx-auto transition-all duration-300 pt-[14px] ${
        !currentUser 
          ? 'h-[calc(100vh-64px)] flex items-center justify-center p-4 overflow-hidden' 
          : 'p-4 sm:p-6 lg:p-8 space-y-6'
      }`}>

        {/* Auth Required Check screen if not logged in */}
        {!currentUser ? (
          <div className="w-full max-w-xl mx-auto bg-[#141416] border border-[#27272a] rounded-[28px] p-6 sm:p-8 shadow-2xl text-center space-y-6 my-auto" id="login_block">
            <div className="relative inline-flex">
              <div className="bg-gradient-to-b from-[#2e2e34] to-[#1c1c20] text-orange-400 p-4 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border border-[#3f3f46] shadow-lg">
                <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" />
              </div>
            </div>

            <div className="space-y-3 px-[10px] py-0">
              <h2 className="text-xl sm:text-2xl font-black font-display text-[#c1c1c1] tracking-tight leading-snug">
                อาจารย์และเจ้าหน้าที่ <span className="text-orange-400">นิเทศศาสตร์</span><span className="text-purple-400">ม.กรุงเทพ</span>
              </h2>
              <p className="text-[#c1c1c1] text-[12px] leading-relaxed max-w-[450px] mx-auto">
                ยินดีต้อนรับเข้าสู่ระบบจัดการและบริการอุปกรณ์ห้องปฏิบัติการและศูนย์สื่อการเรียนรู้ <br className="hidden sm:block" />
                เพื่อความปลอดภัยสูงสุด กรุณาลงชื่อเข้าใช้งานด้วยบัญชีสถาบันของท่าน
              </p>
            </div>

            <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-5 sm:p-6 text-left space-y-4 shadow-inner">
              <span className="text-[#c1c1c1] font-extrabold text-[18px] flex items-center justify-center gap-2 text-center">
                🔑 การเข้าใช้งานระบบ
              </span>
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center gap-3">
                  <span className="bg-[#2a2038] text-[#c084fc] text-[16px] font-bold px-3.5 py-1.5 rounded-md shrink-0">
                    อาจารย์ / เจ้าหน้าที่
                  </span>
                  <p className="text-[#c1c1c1] text-[18px] leading-relaxed">
                    ใช้บัญชี <strong className="text-[#f97316] font-bold">@bu.ac.th</strong> เพื่อเข้าสู่ระบบ
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <button
                type="button"
                onClick={() => loginWithGoogle(true)}
                id="google_signin_btn"
                className="w-full max-w-[494px] mx-auto bg-[#b4b4b4] hover:bg-[#a3a3a3] text-black font-extrabold rounded-2xl text-[22px] py-3.5 sm:py-4 px-6 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <QrCode className="w-6 h-6 text-black" />
                เข้าสู่ระบบด้วย BU Google Account
              </button>
            </div>
          </div>
        ) : currentUser.role === 'admin' ? (
          /* =======================================================
             ADMINISTRATIVE INSTRUCTOR WORKSPACE
             ======================================================= */
          <AdminDashboard
            tickets={tickets}
            attendance={attendance}
            bookings={bookings}
            onSubmitReply={submitTicketReply}
            onDownloadReport={downloadAttendanceReportCSV}
            currentUserEmail={currentUser.email}
            onUpdateBookingStatus={updateBookingStatus}
            onUpdateBooking={updateBooking}
            onDeleteBooking={deleteBooking}
            onCreateBooking={createBooking}
            roomImages={roomImages}
            courses={courses}
            activeTabProp={adminTab}
            onTabChangeProp={setAdminTab}
          />
        ) : (
          /* =======================================================
             STUDENT WORKSPACE
             ======================================================= */
          <div className="space-y-6" id="student_workspace_root">
            
            {/* Student Navigation Tabs */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm/50 gap-1" id="student_segment_tabs">
              <button
                type="button"
                onClick={() => setStudentTab('booking')}
                id="tab_booking_btn"
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  studentTab === 'booking'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-orange-500" />
                จองห้องจัดรายการ MEDIA CENTER
              </button>

              <button
                type="button"
                onClick={() => setStudentTab('summary')}
                id="tab_summary_btn"
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  studentTab === 'summary'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                สรุปข้อมูล & รายงานสถิติ
              </button>

              <button
                type="button"
                onClick={() => setStudentTab('workbench')}
                id="tab_workbench_btn"
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  studentTab === 'workbench'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4" />
                การตั้งค่า กล้องพื้นฐาน
              </button>
            </div>

            {/* TAB: DATA SUMMARY PAGE VIEW */}
            {studentTab === 'summary' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DataSummaryDashboard
                  bookings={bookings}
                  tickets={tickets}
                  attendance={attendance}
                  courses={courses}
                  onDownloadReport={downloadAttendanceReportCSV}
                  onBack={() => setStudentTab('booking')}
                />
              </motion.div>
            )}
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

            {/* TAB 3: DYNAMIC ROOMS BOOKING & SHOWS PROGRAMMING PORTAL */}
            {studentTab === 'booking' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 text-white"
                id="booking_tab_root"
              >
                
                {/* Submitting Success feedback banner */}
                {bookingSuccessMsg && (
                  <div className="bg-emerald-500/15 text-emerald-400 text-xs font-bold p-3 rounded-xl border border-emerald-500/20 animate-pulse">
                    {bookingSuccessMsg}
                  </div>
                )}

                {/* 1. TOP SECTION: Header & Atmosphere Image Banner */}
                <div className="space-y-4 mb-8 pb-2 relative" style={{ marginBottom: '32px' }}>
                  {/* Centered Dark Header Section with Room selectors */}
                  <div className="bg-[#111115] border border-[#2d2d34] p-3.5 sm:p-4 rounded-[20px] shadow-2xl text-center space-y-2.5 relative">
                    <div className="text-center space-y-1">
                      <h4 className={`text-[20px] font-extrabold ${getRoomTheme(activeScheduleRoom).text} tracking-tight font-display flex items-center justify-center gap-1.5`}>
                        📅 ตารางห้องจัดรายการ MEDIA CENTER
                      </h4>
                      <p className="text-slate-400 text-[13px] max-w-xl mx-auto leading-tight">
                        กรุณาตรวจสอบตารางการจองด้านล่างเพื่อตรวจสอบคิวที่ว่างก่อนกรอกแบบฟอร์มจองห้องจัดรายการต่อ
                      </p>
                    </div>

                    {/* Room selectors */}
                    <div className="flex max-w-2xl mx-auto bg-[#0a0a0c] border border-[#2d2d34] rounded-xl overflow-hidden shadow-inner p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScheduleRoom("ห้องจัดรายการ 1");
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

                  {/* Top Center Horizontal Atmosphere Banner */}
                  <div className="w-full max-w-6xl mx-auto relative">
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
                            {/* Overlay gradient at bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none flex items-end justify-center pb-2.5">
                              <p className="text-white text-xs sm:text-sm font-extrabold tracking-wide drop-shadow-md">
                                📷 บรรยากาศ {activeScheduleRoom} (Atmospheric Preview)
                              </p>
                            </div>
                            
                            {/* Navigation Arrows */}
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

                            {/* Indicator Dots */}
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

                {/* 2. MAIN CONTENT SECTION: Two-Column Layout (30% Form / 70% Table Ratio) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative mt-6 pt-2" style={{ marginTop: '24px' }}>
                  
                  {/* LEFT COLUMN: Unified Booking Form (lg:col-span-3 - Reduced Width ~20-25%) */}
                  <div className="lg:col-span-3 w-full relative">
                    <UnifiedBookingForm
                      courses={courses}
                      bookings={bookings}
                      currentUser={currentUser}
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
                      }}
                      createBooking={createBooking}
                      isSameDate={isSameDate}
                      isSameRoom={isSameRoom}
                    />
                  </div>

                  {/* RIGHT COLUMN: Weekly Schedule Calendar Grid (lg:col-span-9 - Expanded Width +20-25%) */}
                  <div 
                    className="lg:col-span-9 bg-[#111115] border border-[#2d2d34] p-3.5 sm:p-4 rounded-2xl shadow-2xl space-y-3 overflow-y-auto"
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
                                {/* Day Name and Date */}
                                <td className="py-1 px-1 border-r border-[#2d2d34] font-bold bg-[#111113] text-slate-100 h-[116px] max-h-[116px] w-[12%] align-middle box-border">
                                  <div className="flex flex-col justify-center items-center h-full w-full overflow-hidden gap-1">
                                    <div className={`text-[17px] uppercase font-extrabold truncate w-full ${getRoomTheme(activeScheduleRoom).text}`}>{dayInfo.dayName}</div>
                                    <div className="text-[14px] text-[#ffffff] font-semibold truncate w-full">{dayInfo.displayDate}</div>
                                  </div>
                                </td>

                                {/* Slots */}
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
                                              /* TEACHER LUXURY GOLD & WHITE CARD (EXACT MOCKUP MATCH) */
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

              </motion.div>
            )}
          </div>
        )}
      </main>


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

      {/* Settings Modal */}
      <AnimatePresence>
        {isRoomSettingsOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2f2f]/85 backdrop-blur-md p-4 overflow-y-auto"
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
                <div className="flex bg-[#16161a] border border-[#2d2d34] p-1 rounded-xl gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveRoomSettingsTab("ห้องจัดรายการ 1")}
                    className={`flex-1 py-2 pl-2 pr-3 text-[11px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 shrink-0 ${
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
                    className={`flex-1 py-2 pl-2 pr-3 text-[11px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 shrink-0 ${
                      activeRoomSettingsTab === "ห้องจัดรายการ 2"
                        ? "bg-[#4a90e2] text-white shadow-md font-black"
                        : "hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    🎧 ห้องจัดรายการ 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoomSettingsTab("ห้องยูทูป 1")}
                    className={`flex-1 py-2 pl-2 pr-3 text-[11px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 shrink-0 ${
                      activeRoomSettingsTab === "ห้องยูทูป 1"
                        ? "bg-rose-600 text-white shadow-md font-black"
                        : "hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    📹 ห้องยูทูป 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoomSettingsTab("ห้องยูทูป 2")}
                    className={`flex-1 py-2 pl-2 pr-3 text-[11px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1 shrink-0 ${
                      activeRoomSettingsTab === "ห้องยูทูป 2"
                        ? "bg-[#9810fa] text-white shadow-md font-black"
                        : "hover:bg-white/5 text-slate-400"
                    }`}
                  >
                    🎬 ห้องยูทูป 2
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
                    {(activeRoomSettingsTab === "ห้องจัดรายการ 1" 
                      ? tempRoom1Images 
                      : activeRoomSettingsTab === "ห้องจัดรายการ 2" 
                        ? tempRoom2Images 
                        : activeRoomSettingsTab === "ห้องยูทูป 1"
                          ? tempYoutube1Images
                          : tempYoutube2Images
                    ).map((currentUrl, idx) => {
                      const accentColor = activeRoomSettingsTab === "ห้องจัดรายการ 1"
                        ? "group-hover:text-[#ef8840] hover:border-[#ef8840]"
                        : activeRoomSettingsTab === "ห้องจัดรายการ 2"
                          ? "group-hover:text-[#4a90e2] hover:border-[#4a90e2]"
                          : activeRoomSettingsTab === "ห้องยูทูป 1"
                            ? "group-hover:text-rose-500 hover:border-rose-500"
                            : "group-hover:text-purple-500 hover:border-purple-500";
                      const borderFocus = activeRoomSettingsTab === "ห้องจัดรายการ 1"
                        ? "focus:border-[#ef8840]/60"
                        : activeRoomSettingsTab === "ห้องจัดรายการ 2"
                          ? "focus:border-[#4a90e2]/60"
                          : activeRoomSettingsTab === "ห้องยูทูป 1"
                            ? "focus:border-rose-500/60"
                            : "focus:border-purple-500/60";
                      
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
                                } else if (activeRoomSettingsTab === "ห้องจัดรายการ 2") {
                                  setTempRoom2Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = val;
                                    return next;
                                  });
                                } else if (activeRoomSettingsTab === "ห้องยูทูป 1") {
                                  setTempYoutube1Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = val;
                                    return next;
                                  });
                                } else if (activeRoomSettingsTab === "ห้องยูทูป 2") {
                                  setTempYoutube2Images((prev) => {
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
                                } else if (activeRoomSettingsTab === "ห้องจัดรายการ 2") {
                                  setTempRoom2Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = "";
                                    return next;
                                  });
                                } else if (activeRoomSettingsTab === "ห้องยูทูป 1") {
                                  setTempYoutube1Images((prev) => {
                                    const next = [...prev];
                                    next[idx] = "";
                                    return next;
                                  });
                                } else if (activeRoomSettingsTab === "ห้องยูทูป 2") {
                                  setTempYoutube2Images((prev) => {
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
                      const filteredYoutube1 = tempYoutube1Images.filter(Boolean);
                      const filteredYoutube2 = tempYoutube2Images.filter(Boolean);

                      // Fall back to defaults if fully cleared
                      const finalRoom1 = filteredRoom1.length > 0 ? filteredRoom1 : ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=85&w=1920"];
                      const finalRoom2 = filteredRoom2.length > 0 ? filteredRoom2 : ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=85&w=1920"];
                      const finalYoutube1 = filteredYoutube1.length > 0 ? filteredYoutube1 : ["https://images.unsplash.com/photo-1616469829941-c7200edec809?q=85&w=1920"];
                      const finalYoutube2 = filteredYoutube2.length > 0 ? filteredYoutube2 : ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=85&w=1920"];

                      // Fire the save action in the background
                      updateRoomImages({
                        "ห้องจัดรายการ 1": finalRoom1,
                        "ห้องจัดรายการ 2": finalRoom2,
                        "ห้องยูทูป 1": finalYoutube1,
                        "ห้องยูทูป 2": finalYoutube2
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

      {/* Modal Dialog for Schedule Booking Details */}
      <BookingDetailModal
        isOpen={!!selectedScheduleBookingModal}
        onClose={() => setSelectedScheduleBookingModal(null)}
        data={selectedScheduleBookingModal}
        courses={courses}
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
          await updateBooking(id, updates);
        }}
        onAfterSaveSuccess={(newRoom, newDate) => {
          setActiveScheduleRoom(newRoom);
          setScheduleBaseDate(newDate);
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
          await deleteBooking(id);
          alert("🗑️ ยกเลิกและลบรายการจองสำเร็จ คืนช่องเวลาว่างบนตารางเรียบร้อยแล้ว");
        }}
      />

      {/* Course Management Modal */}
      <CourseManagementModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        courses={courses}
        onAddCourse={addCourse}
        onUpdateCourse={updateCourse}
        onDeleteCourse={deleteCourse}
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
