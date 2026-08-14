/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Trash2,
  User,
  ChevronDown,
  FileSpreadsheet,
  BarChart3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData, getCourseLabel } from './hooks/useData';
import CameraWorkbench from './components/CameraWorkbench';
import AdminDashboard from './components/AdminDashboard';
import { DataSummaryDashboard } from './components/DataSummaryDashboard';
import { CourseManagementModal } from './components/CourseManagementModal';
import { EditBookingModal } from './components/EditBookingModal';
import { DeleteBookingConfirmModal } from './components/DeleteBookingConfirmModal';
import { VerifyBookingPinModal } from './components/VerifyBookingPinModal';
import { HelpCategory, RoomBooking } from './types';

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
        borderOutline: "border-[#ef8840]/30",
        borderLight: "border-[#ef8840]/20",
      };
    case "ห้องจัดรายการ 2":
      return {
        text: "text-[#4a90e2]",
        bg: "bg-[#4a90e2]",
        bgLight: "bg-[#4a90e2]/10",
        bgHoverLight: "hover:bg-[#4a90e2]/20",
        borderOutline: "border-[#4a90e2]/30",
        borderLight: "border-[#4a90e2]/20",
      };
    case "ห้องยูทูป 1":
      return {
        text: "text-rose-500",
        bg: "bg-rose-600",
        bgLight: "bg-rose-600/10",
        bgHoverLight: "hover:bg-rose-600/20",
        borderOutline: "border-rose-500/30",
        borderLight: "border-rose-500/20",
      };
    case "ห้องยูทูป 2":
      return {
        text: "text-purple-500",
        bg: "bg-purple-600",
        bgLight: "bg-purple-600/10",
        bgHoverLight: "hover:bg-purple-600/20",
        borderOutline: "border-purple-500/30",
        borderLight: "border-purple-500/20",
      };
    default:
      return {
        text: "text-[#ef8840]",
        bg: "bg-[#ef8840]",
        bgLight: "bg-[#ef8840]/10",
        bgHoverLight: "hover:bg-[#ef8840]/20",
        borderOutline: "border-[#ef8840]/30",
        borderLight: "border-[#ef8840]/20",
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
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    createProgram,
    updateProgramStatus,
    deleteProgram,
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
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
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
      setTempYoutube1Images(getArray(roomImages["ห้องยูทูป 1"], "https://images.unsplash.com/photo-1616469829941-c7200edec809?q=85&w=1920"));
      setTempYoutube2Images(getArray(roomImages["ห้องยูทูป 2"], "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=85&w=1920"));
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
        console.error("Error compressing file:", err);
      } finally {
        e.target.value = "";
        setUploadTargetIdx(null);
      }
    }
  };

  // Active view states
  const [studentTab, setStudentTab] = useState<'workbench' | 'booking' | 'summary'>('booking');
  const [adminTab, setAdminTab] = useState<'student_schedule' | 'summary'>('student_schedule');

  const handleOpenSummaryView = () => {
    if (currentUser?.role === 'admin') {
      setAdminTab('summary');
    } else {
      setStudentTab('summary');
    }
    setIsProfileDropdownOpen(false);
  };
  
  // Student Booking states
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
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [myBookingFilter, setMyBookingFilter] = useState("");

  // Sync default user email/name when currentUser loads
  React.useEffect(() => {
    if (currentUser?.email && !bookingEmail) {
      setBookingEmail(currentUser.email);
    }
    if (currentUser?.name && !bookingStudentName) {
      setBookingStudentName(currentUser.name);
    }
  }, [currentUser]);

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

  // Teacher Class Booking States
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

  React.useEffect(() => {
    if (currentUser?.email && !teacherEmail) {
      setTeacherEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleTeacherBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherSubject.trim()) {
      alert("กรุณาระบุรหัสวิชา / กลุ่มเรียน (Section)");
      return;
    }
    const finalEmail = teacherEmail.trim() || currentUser?.email || "pongsakorn.c@bu.ac.th";
    const finalPin = teacherPinCode.trim() || "1234";

    if (finalPin.length !== 4 || !/^\d{4}$/.test(finalPin)) {
      alert("⚠️ กรุณากำหนดรหัส PIN เป็นตัวเลข 4 หลัก (เช่น 1234)");
      return;
    }

    setSubmittingTeacherBooking(true);
    try {
      const instructorName = teacherName.trim() || currentUser?.name || "อาจารย์ผู้สอน";
      await createBooking(
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
    } catch (err) {
      console.error("Teacher booking error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmittingTeacherBooking(false);
    }
  };

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

    const finalEmail = bookingEmail.trim() || currentUser?.email || "";
    if (!finalEmail) {
      alert("⚠️ กรุณาระบุอีเมลผู้แจ้งจองเพื่อใช้สำหรับรับอีเมลยืนยันการจองและกู้คืน PIN");
      return;
    }

    const finalPin = bookingPinCode.trim();
    if (!finalPin || finalPin.length !== 4 || !/^\d{4}$/.test(finalPin)) {
      alert("⚠️ กรุณากำหนดรหัส PIN กลุ่มเป็นตัวเลข 4 หลัก (เช่น 1234, 5678) สำหรับยืนยันตัวตนตอนแก้ไขหรือลบการจอง");
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
        bookingPhone.trim(),
        bookingStudentName.trim(),
        finalEmail,
        finalPin
      );
      setIsBookingModalOpen(false);
      setBookingSubject("BRS311");
      setBookingPurpose("");
      setBookingStudentName(currentUser?.name || "");
      setBookingStudentId("");
      setBookingPhone("");
      setBookingPinCode("");
      setBookingSuccessMsg("🎉 ยืนยันการจองห้องจัดรายการเสร็จสิ้นเรียบร้อยแล้วค่ะ! ข้อมูลแสดงในตารางจัดรายการเรียบร้อยแล้ว");
      setTimeout(() => setBookingSuccessMsg(""), 6000);
    } catch (err: any) {
      console.error("Booking error details:", err);
      alert(err?.message || "เกิดข้อผิดพลาดในการยื่นระบบคำจอง");
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
      <main className={`flex-1 w-full max-w-full mx-auto transition-all duration-300 ${
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
            programs={programs}
            onSubmitReply={submitTicketReply}
            onDownloadReport={downloadAttendanceReportCSV}
            currentUserEmail={currentUser.email}
            onUpdateBookingStatus={updateBookingStatus}
            onUpdateBooking={updateBooking}
            onDeleteBooking={deleteBooking}
            onCreateProgram={createProgram}
            onUpdateProgramStatus={updateProgramStatus}
            onDeleteProgram={deleteProgram}
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
                <div className="space-y-3">
                  {/* Centered Dark Header Section with Room selectors */}
                  <div className="bg-[#111115] border border-[#2d2d34] p-3.5 sm:p-4 rounded-[20px] shadow-2xl text-center space-y-2.5">
                    <div className="text-center space-y-1">
                      <h4 className={`text-base sm:text-lg font-extrabold ${getRoomTheme(activeScheduleRoom).text} tracking-tight font-display flex items-center justify-center gap-1.5`}>
                        📅 ตารางห้องจัดรายการ MEDIA CENTER
                      </h4>
                      <p className="text-slate-400 text-[11px] max-w-xl mx-auto leading-tight">
                        กรุณาตรวจสอบตารางการจองด้านล่างเพื่อตรวจสอบคิวที่ว่างก่อนกรอกแบบฟอร์มจองห้องจัดรายการต่อ
                      </p>
                    </div>

                    {/* Room selectors */}
                    <div className="flex max-w-2xl mx-auto bg-[#0a0a0c] border border-[#2d2d34] rounded-xl overflow-hidden shadow-inner p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScheduleRoom("ห้องจัดรายการ 1");
                          setBookingRoom("ห้องจัดรายการ 1");
                        }}
                        className={`flex-1 py-1.5 text-center text-xs sm:text-sm font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
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
                        className={`flex-1 py-1.5 text-center text-xs sm:text-sm font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
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
                        className={`flex-1 py-1.5 text-center text-xs sm:text-sm font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                          activeScheduleRoom === "ห้องยูทูป 1"
                            ? "bg-rose-600 text-white shadow-md"
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
                        className={`flex-1 py-1.5 text-center text-xs sm:text-sm font-extrabold transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                          activeScheduleRoom === "ห้องยูทูป 2"
                            ? "bg-purple-600 text-white shadow-md"
                            : "hover:bg-white/5 text-slate-400"
                        }`}
                      >
                        🎬 ห้องยูทูป 2
                      </button>
                    </div>
                  </div>

                  {/* Top Center Horizontal Atmosphere Banner */}
                  <div className="w-full max-w-6xl mx-auto">
                    <div className="w-full h-[570px] sm:h-[590px] md:h-[635px] lg:h-[680px] bg-[#111115] border border-[#2d2d34] rounded-2xl overflow-hidden shadow-2xl relative group">
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

                {/* 2. MAIN CONTENT SECTION: Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* LEFT COLUMN: Booking Form (lg:col-span-4) */}
                  <div className="lg:col-span-4 w-full">
                    <form onSubmit={handleRoomBookingSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 text-slate-800">
                      <h4 className="font-extrabold text-slate-800 text-[18px] pt-5 pl-0.5 h-[31px] border-b border-slate-100 pb-2.5 flex items-center gap-2" style={{ fontSize: '18px' }}>
                        <Plus className="w-5 h-5 text-indigo-600" />
                        แบบฟอร์มจองห้องจัดรายการ
                      </h4>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">1. เลือกห้องจัดรายการ</label>
                        <select
                          value={bookingRoom}
                          onChange={(e) => {
                            setBookingRoom(e.target.value);
                            setActiveScheduleRoom(e.target.value);
                          }}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] text-slate-850 focus:bg-white focus:outline-none transition-all font-bold"
                        >
                          <option value="ห้องจัดรายการ 1">🎙️ ห้องจัดรายการ 1</option>
                          <option value="ห้องจัดรายการ 2">🎧 ห้องจัดรายการ 2</option>
                          <option value="ห้องยูทูป 1">📹 ห้องยูทูป 1</option>
                          <option value="ห้องยูทูป 2">🎬 ห้องยูทูป 2</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">2. วันที่ต้องการจอง</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => {
                            setBookingDate(e.target.value);
                            if (e.target.value) {
                              setScheduleBaseDate(e.target.value);
                            }
                          }}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-800 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">3. ช่วงเวลา (Timeslot)</label>
                        <select
                          value={bookingSlot}
                          onChange={(e) => setBookingSlot(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] focus:bg-white focus:outline-none transition-all font-mono font-medium text-slate-800"
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

                      <div className="space-y-3 pb-1 border-b border-slate-100">
                        <div>
                          <label className="text-[15px] font-bold text-slate-700 block mb-1">4. รายวิชา</label>
                          <select
                            value={bookingSubject}
                            onChange={(e) => setBookingSubject(e.target.value)}
                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-semibold cursor-pointer"
                          >
                            {courses.length > 0 ? (
                              courses.map((c) => {
                                const lbl = getCourseLabel(c);
                                return (
                                  <option key={c.id} value={c.code || lbl}>
                                    {lbl}
                                  </option>
                                );
                              })
                            ) : (
                              <>
                                <option value="BRS311">BRS311 - การจัดรายการวิทยุกระจายเสียง</option>
                                <option value="CA102">CA102 - เทคโนโลยีสื่อสารมวลชน</option>
                                <option value="BC101">BC101 - พื้นฐานการสื่อสาร</option>
                                <option value="งานอื่นๆ">งานอื่นๆ / คลาสเรียนพิเศษ</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="text-[15px] font-bold text-slate-700 block mb-1">วัตถุประสงค์</label>
                          <textarea
                            rows={1}
                            value={bookingPurpose}
                            onChange={(e) => setBookingPurpose(e.target.value)}
                            placeholder="จัดรายการรายวิชาเรียน / ฝึกจัดรายการ"
                            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[15px] text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-medium resize-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">5. ชื่อ-นามสกุล</label>
                        <input
                          type="text"
                          value={bookingStudentName}
                          onChange={(e) => setBookingStudentName(e.target.value)}
                          placeholder="ชื่อ-นามสกุล"
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-800 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">6. รหัสนักศึกษา</label>
                        <input
                          type="text"
                          maxLength={15}
                          value={bookingStudentId}
                          onChange={(e) => setBookingStudentId(e.target.value)}
                          placeholder="รหัสนักศึกษา 10 หลัก"
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-800 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">7. เบอร์โทร</label>
                        <input
                          type="tel"
                          maxLength={12}
                          value={bookingPhone}
                          onChange={(e) => setBookingPhone(e.target.value)}
                          placeholder="เช่น 089XXXXXXX"
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-800 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">
                          8. อีเมลผู้แจ้งจอง <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          required
                          placeholder="เช่น student@bumail.net"
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-800 font-semibold"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          ✉️ สำหรับรับข้อมูลยืนยันและการกู้คืนรหัส PIN
                        </p>
                      </div>

                      <div>
                        <label className="text-[15px] font-bold text-slate-700 block mb-1">
                          9. กำหนดรหัส PIN กลุ่ม (4 หลัก) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={bookingPinCode}
                          onChange={(e) => setBookingPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          required
                          placeholder="กำหนดรหัสตัวเลข 4 หลัก เช่น 1234"
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-800 font-mono font-bold tracking-widest"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          🔒 ตัวเลข 4 หลัก ใช้ยืนยันตัวตนเมื่อต้องการแก้ไขหรือยกเลิกการจอง
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-[39px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl text-sm transition-colors shadow-md shadow-indigo-600/15 cursor-pointer mt-2 flex items-center justify-center"
                      >
                        ⚡ ส่งคำขอจองห้องจัดรายการ
                      </button>
                    </form>
                  </div>

                  {/* RIGHT COLUMN: Weekly Schedule Calendar Grid (lg:col-span-8) */}
                  <div className="lg:col-span-8 bg-[#111115] border border-[#2d2d34] p-3.5 sm:p-4 rounded-2xl shadow-2xl space-y-3">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${getRoomTheme(activeScheduleRoom).bgLight} ${getRoomTheme(activeScheduleRoom).bgHoverLight} ${getRoomTheme(activeScheduleRoom).text} ${getRoomTheme(activeScheduleRoom).borderLight}`}
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
                            <th colSpan={9} className={`py-3 bg-[#111113] ${getRoomTheme(activeScheduleRoom).text} font-extrabold text-xs sm:text-sm tracking-wide shadow-sm`}>
                              📚 รายวิชาเรียนประจำสัปดาห์ (Scheduled Class Subjects)
                            </th>
                          </tr>
                          {/* Table Headers in unified slate dark styling for professional contrast */}
                          <tr className="bg-[#16161a] text-[#ffffff] font-bold border-b border-[#2d2d34]">
                            <th className="py-2.5 px-1 border-r border-[#2d2d34] bg-[#0e0e11] text-[#ffffff] font-extrabold w-[12%]">วัน / เวลา</th>
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
                              <tr key={dayInfo.dayName} className="border-b border-[#2d2d34] bg-[#16161a] hover:bg-[#1b1b21] transition-colors h-[94px]">
                                {/* Day Name and Date */}
                                <td className="py-1 px-1 border-r border-[#2d2d34] font-bold bg-[#111113] text-slate-100 h-[94px] max-h-[94px] w-[12%] align-middle box-border">
                                  <div className="flex flex-col justify-center items-center h-full w-full overflow-hidden">
                                    <div className={`text-[12px] uppercase font-extrabold truncate w-full ${getRoomTheme(activeScheduleRoom).text}`}>{dayInfo.dayName}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate w-full">{dayInfo.displayDate}</div>
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

                                      const isTeacherBooking = b.userType === "TEACHER" || (b.purpose && b.purpose.includes("สำหรับการเรียนการสอนอาจารย์"));

                                      if (isTeacherBooking || spanCount > 1) {
                                        // MERGED CELL (Teacher / Multi-slot booking)
                                        let displaySubject = b.subject || b.purpose || "วิชาสำหรับการเรียนการสอน";
                                        displaySubject = displaySubject.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/, '').trim();

                                        const instructorName = b.studentName || b.studentIdInput || "อาจารย์ผู้สอน";
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
                                            className="p-1 border-r border-[#2d2d34] text-center align-middle bg-[#16161a] transition-all relative group h-[94px] max-h-[94px] box-border"
                                          >
                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedScheduleBookingModal({
                                                  room: activeScheduleRoom,
                                                  subject: displaySubject,
                                                  slot: slotSpanText,
                                                  studentId: "อาจารย์ผู้สอน",
                                                  studentName: instructorName,
                                                  phone: b.phone && b.phone !== "-" ? b.phone : "อาจารย์ผู้สอน",
                                                  purpose: purposeText || "สำหรับการเรียนการสอนอาจารย์",
                                                  roomThemeText: "text-purple-400",
                                                  booking: b
                                                });
                                              }}
                                              style={{ padding: '4px 8px 4px 10px' }}
                                              className="relative px-2 py-1 pl-2.5 rounded-xl border border-purple-500/60 bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 hover:from-purple-900/90 hover:to-indigo-900/90 text-center flex flex-col justify-between items-center h-[84px] min-h-[84px] max-h-[84px] w-full transition-all duration-300 shadow-lg overflow-hidden cursor-pointer group-hover:border-purple-300 ring-1 ring-purple-500/30"
                                            >
                                              {/* Left thick accent gradient line */}
                                              <div className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl bg-gradient-to-b from-purple-400 via-indigo-400 to-blue-500" />

                                              <div className="flex flex-col items-center justify-between h-full w-full min-w-0 px-1 overflow-hidden">
                                                <div 
                                                  className="flex items-center gap-1 font-black !text-[13px] text-purple-200 truncate w-full justify-center leading-[1.2]"
                                                  style={{ fontSize: '13px', lineHeight: '1.2' }}
                                                >
                                                  <span className="text-[13px] shrink-0">🎓</span>
                                                  <span className="truncate !text-[13px]" style={{ fontSize: '13px' }}>{displaySubject}</span>
                                                </div>
                                                <div 
                                                  className="font-bold !text-[13px] text-[#ef8840] truncate w-full leading-[1.2]"
                                                  style={{ fontSize: '13px', lineHeight: '1.2' }}
                                                >
                                                  อาจารย์ผู้สอน: {instructorName}
                                                </div>
                                                <div 
                                                  className="inline-flex items-center gap-1 bg-purple-900/70 border border-purple-400/40 text-purple-200 !text-[11px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm leading-tight max-w-[95%] truncate"
                                                  style={{ fontSize: '11px' }}
                                                >
                                                  <span className="truncate">⏱️ {slotSpanText}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                        );

                                        i += spanCount;
                                      } else {
                                        // STANDARD SINGLE-SLOT STUDENT BOOKING
                                        const roomTheme = getRoomTheme(activeScheduleRoom);
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
                                        const accentColorClass = roomTheme.text;
                                        const barColorClass = roomTheme.bg;
                                        const borderOutlineClass = roomTheme.borderOutline;

                                        const cardSubject = subjectCode || displaySubject || "BRS 311";
                                        const cleanSlot = slot ? slot.replace(/\s*-\s*/g, '-') : '';
                                        const studentIdStr = b.studentIdInput || b.studentId || b.studentName || '-';

                                        let rawPurpose = b.bookingPurpose || displayPurpose || "";
                                        if (!rawPurpose && b.purpose) {
                                          const parenMatch = b.purpose.match(/\((.*?)\)/);
                                          if (parenMatch) {
                                            rawPurpose = parenMatch[1].trim();
                                          } else {
                                            rawPurpose = b.purpose.replace(/^[A-Za-z]{2,4}\s*\d{3,4}[\s:-]*/i, '').trim();
                                          }
                                        }
                                        if (!rawPurpose) {
                                          rawPurpose = subjectTitle || "จัดรายการ";
                                        }
                                        let cleanPurpose = rawPurpose
                                          .replace(/^[A-Za-z]{2,4}\s*\d{3,4}[\s:-]*/i, '')
                                          .replace(/^\((.*)\)$/, '$1')
                                          .trim();

                                        const purposeText = cleanPurpose || rawPurpose || "จัดรายการ";

                                        renderedCells.push(
                                          <td 
                                            key={slot} 
                                            className="p-1 border-r border-[#2d2d34] text-left align-top bg-[#16161a] transition-all relative group h-[94px] max-h-[94px] w-[11%] box-border"
                                          >
                                            <div 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedScheduleBookingModal({
                                                  room: activeScheduleRoom,
                                                  subject: cardSubject,
                                                  slot: cleanSlot,
                                                  studentId: studentIdStr,
                                                  studentName: b.studentNameInput || b.studentName,
                                                  phone: b.phone || '-',
                                                  purpose: purposeText,
                                                  roomThemeText: roomTheme.text,
                                                  booking: b
                                                });
                                              }}
                                              style={{ padding: '4px 8px 4px 10px' }}
                                              className={`relative px-2 py-1 pl-2.5 rounded-xl border border-solid text-left flex flex-col justify-between h-[84px] min-h-[84px] max-h-[84px] w-full transition-all duration-300 shadow-md overflow-hidden bg-[#1E1E1E] group-hover:bg-[#28282c] group-hover:border-[#ffffff]/50 cursor-pointer ${borderOutlineClass}`}
                                            >
                                              <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl ${barColorClass}`} />
                                              <div className="flex flex-col gap-0.5 w-full min-w-0 overflow-hidden">
                                                <div 
                                                  className={`font-extrabold !text-[13px] tracking-normal uppercase truncate w-full overflow-hidden text-ellipsis leading-[1.2] ${accentColorClass} group-hover:!text-[#ffffff] transition-colors`}
                                                  style={{ fontSize: '13px', lineHeight: '1.2' }}
                                                >
                                                  {subjectCode}
                                                </div>
                                                <div 
                                                  className="font-medium !text-[13px] text-[#d3d3d3] group-hover:!text-[#ffffff] leading-[1.2] truncate w-full overflow-hidden text-ellipsis transition-colors" 
                                                  style={{ fontSize: '13px', lineHeight: '1.2' }}
                                                  title={subjectTitle}
                                                >
                                                  {subjectTitle}
                                                </div>
                                              </div>
                                              <div className="h-[1px] bg-[#aeadad]/20 group-hover:bg-[#ffffff]/40 w-full my-0.5 transition-colors shrink-0" />
                                              <div 
                                                className="font-semibold !text-[13px] text-[#9CA3AF] group-hover:!text-[#ffffff] truncate w-full overflow-hidden text-ellipsis leading-[1.2] transition-colors"
                                                style={{ fontSize: '13px', lineHeight: '1.2' }}
                                              >
                                                {footerText}
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
                                          className="p-1 border-r border-[#2d2d34] group bg-[#16161a] transition-all duration-300 text-center h-[94px] max-h-[94px] w-[11%] box-border"
                                        >
                                          <div className="p-1 rounded-lg border border-dashed border-[#2d2d34] bg-[#0e0e11]/20 text-center flex items-center justify-center h-[84px] min-h-[84px] max-h-[84px] w-full transition-all duration-300 group-hover:border-slate-500/30 group-hover:bg-[#1c1c24] shadow-sm overflow-hidden">
                                            <div className="relative flex items-center justify-center select-none w-full gap-1 overflow-hidden truncate">
                                              <span className="text-xs opacity-30 group-hover:scale-110 transition-transform duration-300 shrink-0">🗓️</span>
                                              <span className="text-[10px] text-slate-500 font-bold tracking-wide group-hover:text-slate-400 transition-colors truncate">
                                                ว่าง
                                              </span>
                                            </div>
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

                    {/* Bottom-Right Teacher Booking Accent Button */}
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherRoom(activeScheduleRoom);
                          setIsTeacherModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg border border-purple-400/30 transition-all duration-200 cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95"
                      >
                        🎓 จองห้องสำหรับอาจารย์สอน
                      </button>
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
                      <option value="ห้องยูทูป 1">📹 ห้องยูทูป 1</option>
                      <option value="ห้องยูทูป 2">🎬 ห้องยูทูป 2</option>
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

                  {/* Email & 4-digit PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                        7. อีเมลผู้แจ้งจอง <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(e.target.value)}
                        required
                        placeholder="student@bumail.net"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-indigo-600 transition-all text-slate-850 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                        8. กำหนดรหัส PIN (4 หลัก) <span className="text-rose-500">*</span>
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
                        ? "bg-purple-600 text-white shadow-md font-black"
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
      {selectedScheduleBookingModal && createPortal(
        <div 
          onClick={() => setSelectedScheduleBookingModal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] sm:max-w-[400px] cursor-default bg-[#18181a] border border-[#3f3f46] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-5 text-left flex flex-col animate-in zoom-in-95 duration-200"
            style={{ color: '#E5E7EB' }}
          >
            {/* Header: Room Name & Close Button */}
            <div className="flex items-center justify-between gap-2">
              <div className={`font-black text-[22px] leading-tight tracking-wide ${selectedScheduleBookingModal.roomThemeText}`}>
                {selectedScheduleBookingModal.room}
              </div>
              <button 
                onClick={() => setSelectedScheduleBookingModal(null)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                title="ปิด"
                style={{ color: '#E5E7EB' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Solid White/Light Divider Line */}
            <div className="h-[2px] w-full my-3 bg-[#3f3f46]" />

            {/* Details List */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="font-extrabold text-[15px] sm:text-[16px] leading-snug">
                <span className="font-semibold text-xs sm:text-sm block mb-0.5" style={{ color: '#9CA3AF' }}>วิชา / ช่วงเวลา</span>
                <span style={{ color: '#E5E7EB' }}>{selectedScheduleBookingModal.subject} / {selectedScheduleBookingModal.slot}</span>
              </div>

              <div className="font-extrabold text-[15px] leading-snug">
                <span className="font-semibold text-xs sm:text-sm block mb-0.5" style={{ color: '#9CA3AF' }}>รหัสนักศึกษา</span>
                <span style={{ color: '#E5E7EB' }}>{selectedScheduleBookingModal.studentId}</span>
              </div>

              {selectedScheduleBookingModal.studentName && (
                <div className="font-extrabold text-[15px] leading-snug">
                  <span className="font-semibold text-xs sm:text-sm block mb-0.5" style={{ color: '#9CA3AF' }}>ชื่อ-นามสกุล</span>
                  <span style={{ color: '#E5E7EB' }}>{selectedScheduleBookingModal.studentName}</span>
                </div>
              )}

              <div className="font-extrabold text-[15px] leading-snug">
                <span className="font-semibold text-xs sm:text-sm block mb-0.5" style={{ color: '#9CA3AF' }}>เบอร์โทรศัพท์</span>
                <span style={{ color: '#E5E7EB' }}>{selectedScheduleBookingModal.phone}</span>
              </div>
            </div>

            {/* Bottom Purpose Box */}
            <div className="rounded-xl p-3.5 shadow-sm min-h-[52px] flex flex-col justify-center bg-[#2a2a2e] border border-[#3f3f46]">
              <span className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>วัตถุประสงค์การใช้งาน</span>
              <div className="font-extrabold text-[14px] leading-snug break-words" style={{ color: '#E5E7EB' }}>
                {selectedScheduleBookingModal.purpose}
              </div>
            </div>

            {/* Action Buttons: Edit & Delete (Protected by 4-digit PIN) */}
            {selectedScheduleBookingModal.booking && (
              <div className="flex gap-2.5 mt-4 pt-3 border-t border-[#3f3f46]">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedScheduleBookingModal.booking) {
                      setTargetBookingForPin(selectedScheduleBookingModal.booking);
                      setPinActionType('edit');
                      setIsVerifyPinModalOpen(true);
                      setSelectedScheduleBookingModal(null);
                    }
                  }}
                  className="flex-1 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 hover:text-orange-200 font-extrabold rounded-xl py-2 px-3 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span>✏️</span>
                  <span>แก้ไข / ย้ายวันเวลา</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedScheduleBookingModal.booking) {
                      setTargetBookingForPin(selectedScheduleBookingModal.booking);
                      setPinActionType('delete');
                      setIsVerifyPinModalOpen(true);
                      setSelectedScheduleBookingModal(null);
                    }
                  }}
                  className="flex-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 hover:text-red-200 font-extrabold rounded-xl py-2 px-3 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span>🗑️</span>
                  <span>ยกเลิกการจอง (ลบ)</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Verify Booking PIN Modal */}
      <VerifyBookingPinModal
        isOpen={isVerifyPinModalOpen}
        onClose={() => {
          setIsVerifyPinModalOpen(false);
          setTargetBookingForPin(null);
        }}
        booking={targetBookingForPin}
        actionType={pinActionType}
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
        onSave={async (id, updates) => {
          await updateBooking(id, updates);
        }}
        onAfterSaveSuccess={(newRoom, newDate) => {
          setActiveScheduleRoom(newRoom);
          setScheduleBaseDate(newDate);
          setBookingDate(newDate);
          alert(`✅ บันทึกการแก้ไขและย้ายเวลาสำเร็จ!\n\nห้อง: ${newRoom}\nวันที่: ${newDate}\n\nระบบอัปเดตตำแหน่งบนตารางและฐานข้อมูลเรียบร้อยแล้ว`);
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

      {/* Teacher Class Booking Modal */}
      <AnimatePresence>
        {isTeacherModalOpen && (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
            onClick={() => setIsTeacherModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-[#18181a] border border-[#3f3f46] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] cursor-default my-auto text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header & Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-[#3f3f46]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <h3 className="text-lg font-black text-purple-400 font-display">
                    จองห้องสำหรับอาจารย์สอน
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer font-bold"
                  title="ปิด"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleTeacherBookingSubmit} className="mt-4 space-y-4">
                {/* 1. ห้องจัดรายการ */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    1. ห้องจัดรายการ
                  </label>
                  <select
                    value={teacherRoom}
                    onChange={(e) => setTeacherRoom(e.target.value)}
                    className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    <option value="ห้องจัดรายการ 1">ห้องจัดรายการ 1</option>
                    <option value="ห้องจัดรายการ 2">ห้องจัดรายการ 2</option>
                    <option value="ห้องยูทูป 1">ห้องยูทูป 1</option>
                    <option value="ห้องยูทูป 2">ห้องยูทูป 2</option>
                  </select>
                </div>

                {/* 2. วันที่ต้องการสอน */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    2. วันที่ต้องการสอน
                  </label>
                  <input
                    type="date"
                    value={teacherDate}
                    onChange={(e) => setTeacherDate(e.target.value)}
                    className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                    required
                  />
                </div>

                {/* 3. รูปแบบช่วงเวลา */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    3. รูปแบบช่วงเวลา
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: "คาบเช้า", sub: "08:30 - 12:30", value: "08:30 - 12:30", highlighted: false },
                      { label: "คาบบ่าย", sub: "13:00 - 17:00", value: "13:00 - 17:00", highlighted: false },
                      { label: "เหมาทั้งวัน", sub: "08:30 - 17:00", value: "08:30 - 17:00", highlighted: true }
                    ].map((opt) => {
                      const isSelected = teacherTimeSlot === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTeacherTimeSlot(opt.value)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                            isSelected
                              ? opt.highlighted
                                ? "bg-gradient-to-r from-purple-600/40 via-indigo-600/40 to-blue-600/40 border-purple-400 text-white font-black shadow-md ring-2 ring-purple-500/50"
                                : "bg-purple-600/30 border-purple-500 text-purple-200 font-bold shadow-sm"
                              : opt.highlighted
                                ? "bg-[#232030] border-purple-500/40 text-purple-300 hover:bg-[#2e2a3f] font-semibold"
                                : "bg-[#27272a] border-[#3f3f46] text-slate-300 hover:bg-[#323238]"
                          }`}
                        >
                          {opt.highlighted && (
                            <span className="absolute -top-2 right-2 text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.2 rounded-full shadow">
                              แนะนำ
                            </span>
                          )}
                          <span className="text-xs font-extrabold">{opt.label}</span>
                          <span className="text-[10px] opacity-80 mt-0.5">{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. รหัสวิชา / กลุ่มเรียน (Section) */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    4. รหัสวิชา / กลุ่มเรียน (Section) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={teacherSubject}
                    onChange={(e) => setTeacherSubject(e.target.value)}
                    className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
                    required
                  >
                    {courses.length > 0 ? (
                      courses.map((c) => {
                        const lbl = getCourseLabel(c);
                        return (
                          <option key={c.id} value={lbl}>
                            {lbl}
                          </option>
                        );
                      })
                    ) : (
                      <>
                        <option value="BRS311 - การจัดรายการวิทยุกระจายเสียง">BRS311 - การจัดรายการวิทยุกระจายเสียง</option>
                        <option value="CA102 - เทคโนโลยีสื่อสารมวลชน">CA102 - เทคโนโลยีสื่อสารมวลชน</option>
                        <option value="BC101 - พื้นฐานการสื่อสาร">BC101 - พื้นฐานการสื่อสาร</option>
                        <option value="งานอื่นๆ / คลาสเรียนพิเศษ">งานอื่นๆ / คลาสเรียนพิเศษ</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 5. ชื่ออาจารย์ผู้สอน */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    5. ชื่ออาจารย์ผู้สอน
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder={currentUser?.name || "เช่น อ.พงศกร"}
                    className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-semibold"
                  />
                </div>

                {/* 6. อีเมลผู้แจ้งจอง & 7. รหัส PIN 4 หลัก */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      6. อีเมลผู้แจ้งจอง <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      required
                      placeholder="เช่น pongsakorn.c@bu.ac.th"
                      className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      7. กำหนดรหัส PIN (4 หลัก) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={teacherPinCode}
                      onChange={(e) => setTeacherPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      placeholder="เช่น 1234"
                      className="w-full h-10 bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono font-bold tracking-widest"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingTeacherBooking}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-purple-600/25 cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingTeacherBooking ? "กำลังบันทึกข้อมูล..." : "⚡ บันทึกการจองปูเต็มตาราง"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Management Modal */}
      <CourseManagementModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        courses={courses}
        onAddCourse={addCourse}
        onUpdateCourse={updateCourse}
        onDeleteCourse={deleteCourse}
      />

    </div>
  );
}
