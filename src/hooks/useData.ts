/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  getDocs
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { Ticket, AttendanceRecord, ClassSession, UserProfile, HelpCategory, RoomBooking, BroadcastProgram } from '../types';

export const AVAILABLE_STUDIO_ROOMS = [
  "Studio A: สตูดิโอโทรทัศน์เสมือนจริง (Virtual TV Studio)",
  "Studio B: ห้องบันทึกรายการพอดแคสต์ (Podcast Creative Room)",
  "Studio C: สตูถ่ายภาพแฟชั่นเเละนิ่ง (Production Photo Studio)",
  "Studio D: ห้องจัดรายการวิทยุเเละดีเจ (FM Broadcast Radio Booth)",
  "Studio E: ห้องตัดต่อระดับสีระดับเสียง (Pre-Post Mastering Suite)"
];

export const AVAILABLE_TIMESLOTS = [
  "ช่วงเช้า (09:00 - 12:00 น.)",
  "ช่วงบ่าย (13:00 - 16:00 น.)",
  "ช่วงเย็น (16:00 - 19:00 น.)",
  "ช่วงค่ำ (19:00 - 22:00 น.)"
];

// Default bookings for starting/demo purposes
export const DEFAULT_BOOKINGS: RoomBooking[] = [
  {
    id: "book-1",
    studentId: "somchai_bumail_net",
    studentName: "สมชาย บุญช่วย (นักศึกษาจำลอง)",
    studentEmail: "somchai@bumail.net",
    roomName: "ห้องจัดรายการ 1",
    date: "2026-06-12",
    timeSlot: "09:00 - 11:00",
    purpose: "CA101 ฝึกจัดรายการสดยามเช้า",
    studentIdInput: "1660123456",
    phone: "081-234-5678",
    status: "approved",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "book-2",
    studentId: "wilai_bumail_net",
    studentName: "วิไลลักษณ์ เนตรตา (นักศึกษาจำลอง)",
    studentEmail: "wilai.n@bumail.net",
    roomName: "ห้องจัดรายการ 2",
    date: "2026-06-13",
    timeSlot: "13:00 - 15:00",
    purpose: "CA102 อัดประเด็นบันทึกหัวข้อวิทยาศาสตร์เสียง",
    studentIdInput: "1661234567",
    phone: "089-876-5432",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default broadcast programs for starting/demo purposes
export const DEFAULT_PROGRAMS: BroadcastProgram[] = [
  {
    id: "prog-1",
    studentId: "somchai_bumail_net",
    studentName: "สมชาย บุญช่วย",
    studentEmail: "somchai@bumail.net",
    programName: "BU CA Morning Wave 📻",
    hosts: "ดีเจสมชาย & เพื่อนๆ คณะนิเทศศาสตร์",
    category: "radio",
    roomName: "Studio D: ห้องจัดรายการวิทยุเเละดีเจ (FM Broadcast Radio Booth)",
    date: "2026-06-12",
    timeSlot: "ช่วงเช้า (09:00 - 12:00 น.)",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prog-2",
    studentId: "wilai_bumail_net",
    studentName: "วิไลลักษณ์ เนตรตา",
    studentEmail: "wilai.n@bumail.net",
    programName: "Creative Talk Podcast 🎙️",
    hosts: "วิไลลักษณ์ & ดีเจอติกันต์",
    category: "podcast",
    roomName: "Studio B: ห้องบันทึกรายการพอดแคสต์ (Podcast Creative Room)",
    date: "2026-06-12",
    timeSlot: "ช่วงบ่าย (13:00 - 16:00 น.)",
    status: "upcoming",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Supported Class Sessions with strict passcode verification (Time-based/Passcode validation)
export const AVAILABLE_CLASSES: ClassSession[] = [
  {
    id: "ca101",
    name: "CA101: การตั้งค่ากล้องพื้นฐานและการจัดเฟรม (Basic Camera Setup)",
    instructor: "อ.พงศกร (Pongsakorn C.)",
    startTime: "09:00",
    endTime: "12:00",
    dayOfWeek: "Wednesday",
    code: "BU101",
    pointsWeight: 10
  },
  {
    id: "ca102",
    name: "CA102: วิทยาศาสตร์ระบบเสียงและไมโครโฟน (Audio & Mic Integration)",
    instructor: "อ.พงศกร (Pongsakorn C.)",
    startTime: "13:00",
    endTime: "16:00",
    dayOfWeek: "Wednesday",
    code: "MIC202",
    pointsWeight: 10
  },
  {
    id: "ca205",
    name: "CA205: ศิลปะการจัดแสงในสตูดิโอ (Studio Lighting Mastery)",
    instructor: "อ.อนันต์ (Anan S.)",
    startTime: "10:00",
    endTime: "13:00",
    dayOfWeek: "Thursday",
    code: "LIT305",
    pointsWeight: 15
  }
];

export function useData() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [programs, setPrograms] = useState<BroadcastProgram[]>([]);
  const [roomImages, setRoomImages] = useState<{ [key: string]: string }>({
    "ห้องจัดรายการ 1": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000",
    "ห้องจัดรายการ 2": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000"
  });


  // Load sandbox presets if firebase is active or fallback
  const getLocalStorageItem = (key: string, fallback: any) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveLocalStorageItem = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage sync error", e);
    }
  };

  // Sync Bookings
  useEffect(() => {
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(collection(db, 'bookings'), async (snapshot) => {
        if (snapshot.empty) {
          for (const book of DEFAULT_BOOKINGS) {
            const { id, ...data } = book;
            try {
              await setDoc(doc(db, 'bookings', id), {
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } catch (e) {
              console.warn("Could not write default booking to Firestore:", e);
            }
          }
          setBookings(DEFAULT_BOOKINGS);
        } else {
          const loaded: RoomBooking[] = [];
          snapshot.forEach((doc) => {
            loaded.push({ id: doc.id, ...doc.data() } as RoomBooking);
          });
          loaded.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setBookings(loaded);
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'bookings');
        } catch (e) {
          console.error("Bookings sync failed, falling back to defaults:", e);
          setBookings(DEFAULT_BOOKINGS);
        }
      });
      return unsubscribe;
    } else {
      const local = getLocalStorageItem('bu_ca_bookings', null);
      if (!local) {
        saveLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS);
        setBookings(DEFAULT_BOOKINGS);
      } else {
        setBookings(local);
      }
    }
  }, []);

  // Sync Room Images
  useEffect(() => {
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(doc(db, 'configs', 'room_images'), (snapshot) => {
        if (snapshot.exists()) {
          setRoomImages(snapshot.data() as { [key: string]: string });
        } else {
          // If doesn't exist, create it with default
          setDoc(doc(db, 'configs', 'room_images'), {
            "ห้องจัดรายการ 1": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000",
            "ห้องจัดรายการ 2": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000"
          }).catch(err => console.warn("Failed to write default room images:", err));
        }
      }, (error) => {
        console.error("Room images sync error:", error);
      });
      return unsubscribe;
    } else {
      const local = getLocalStorageItem('bu_ca_room_images', null);
      if (local) {
        setRoomImages(local);
      }
    }
  }, []);

  const updateRoomImages = async (newImages: { [key: string]: string }) => {
    // Optimistic update: instantly update local state and localStorage
    setRoomImages(newImages);
    saveLocalStorageItem('bu_ca_room_images', newImages);

    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      try {
        await setDoc(doc(db, 'configs', 'room_images'), newImages);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'configs/room_images');
      }
    }
  };

  // Sync Programs
  useEffect(() => {
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(collection(db, 'programs'), async (snapshot) => {
        if (snapshot.empty) {
          for (const prog of DEFAULT_PROGRAMS) {
            const { id, ...data } = prog;
            try {
              await setDoc(doc(db, 'programs', id), {
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } catch (e) {
              console.warn("Could not write default program to Firestore:", e);
            }
          }
          setPrograms(DEFAULT_PROGRAMS);
        } else {
          const loaded: BroadcastProgram[] = [];
          snapshot.forEach((doc) => {
            loaded.push({ id: doc.id, ...doc.data() } as BroadcastProgram);
          });
          loaded.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setPrograms(loaded);
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'programs');
        } catch (e) {
          console.error("Programs sync failed, falling back to defaults:", e);
          setPrograms(DEFAULT_PROGRAMS);
        }
      });
      return unsubscribe;
    } else {
      const local = getLocalStorageItem('bu_ca_programs', null);
      if (!local) {
        saveLocalStorageItem('bu_ca_programs', DEFAULT_PROGRAMS);
        setPrograms(DEFAULT_PROGRAMS);
      } else {
        setPrograms(local);
      }
    }
  }, []);

  // Auth synchronization (Firebase or Local Sandbox)
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user: any) => {
        if (user) {
          // Any email ending with @bu.ac.th is an Admin/Professor, and @bumail.net is a Student
          const email = user.email || '';
          const isAdminRole = email.endsWith('@bu.ac.th');
          
          const profile: UserProfile = {
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: isAdminRole ? 'admin' : 'student',
            joinedAt: new Date().toISOString()
          };
          setCurrentUser(profile);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Local session loading
      const localSession = getLocalStorageItem('bu_ca_current_user', null);
      setCurrentUser(localSession);
      setLoading(false);
    }
  }, []);

  // Real-time Database synchronization
  useEffect(() => {
    if (!currentUser) {
      setTickets([]);
      setAttendance([]);
      return;
    }

    // Only synchronize with live Firebase if we have a real Firebase Auth user session matching the profile
    const shouldUseFirebase = isFirebaseConfigured && db && auth && auth.currentUser && currentUser.uid === auth.currentUser.uid;

    if (shouldUseFirebase) {
      // 1. Subscribe to support tickets (using client-side sorting to eliminate composite index requirements in Firestore)
      let ticketQuery;
      if (currentUser.role === 'admin') {
        ticketQuery = query(collection(db, 'tickets'));
      } else {
        ticketQuery = query(
          collection(db, 'tickets'), 
          where('studentId', '==', currentUser.uid)
        );
      }

      const unsubscribeTickets = onSnapshot(ticketQuery, (snapshot) => {
        const loadedTickets: Ticket[] = [];
        snapshot.forEach((doc) => {
          loadedTickets.push({ id: doc.id, ...doc.data() } as Ticket);
        });
        
        // Safe Client-side descending sort by createdAt
        loadedTickets.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        
        // Notify student of incoming updates (new answers)
        if (currentUser.role === 'student' && tickets.length > 0) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
              const prev = tickets.find(t => t.id === change.doc.id);
              const data = change.doc.data() as Ticket;
              // If status went from pending/inprogress to answered
              if (prev && prev.status !== 'answered' && data.status === 'answered') {
                const text = `🎉 มีข้อความตอบกลับด่วนเกี่ยวกับหัวข้อ "${data.title}": "${data.replyText}"`;
                setLastNotification(text);
              }
            }
          });
        }
        
        setTickets(loadedTickets);
        setLoading(false);
      }, (error) => {
        setLoading(false); // Gracefully release loading lock
        try {
          handleFirestoreError(error, OperationType.GET, 'tickets');
        } catch (e) {
          console.error("Tickets sync failed:", e);
        }
      });

      // 2. Subscribe to class attendance (using client-side sorting as well)
      let attendanceQuery;
      if (currentUser.role === 'admin') {
        attendanceQuery = query(collection(db, 'attendance'));
      } else {
        attendanceQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', currentUser.uid)
        );
      }

      const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
        const loadedRecords: AttendanceRecord[] = [];
        snapshot.forEach((doc) => {
          loadedRecords.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
        });
        
        // Safe Client-side descending sort by checkedInAt
        loadedRecords.sort((a, b) => new Date(b.checkedInAt || 0).getTime() - new Date(a.checkedInAt || 0).getTime());
        
        setAttendance(loadedRecords);
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'attendance');
        } catch (e) {
          console.error("Attendance sync failed:", e);
        }
      });

      return () => {
        unsubscribeTickets();
        unsubscribeAttendance();
      };
    } else {
      // Local Sandbox Live Monitoring Mock Setup
      const interval = setInterval(() => {
        const localTickets = getLocalStorageItem('bu_ca_tickets', []);
        const filteredTickets = currentUser.role === 'admin' 
          ? localTickets 
          : localTickets.filter((t: Ticket) => t.studentId === currentUser.uid);
        
        // Check for state updates for sound alerts
        if (currentUser.role === 'student' && tickets.length > 0) {
          filteredTickets.forEach((freshTicket: Ticket) => {
            const oldMatch = tickets.find(t => t.id === freshTicket.id);
            if (oldMatch && oldMatch.status !== 'answered' && freshTicket.status === 'answered') {
              setLastNotification(`💡 อาจารย์ตอบกลับเรื่อง "${freshTicket.title}": "${freshTicket.replyText}"`);
            }
          });
        }
        
        setTickets(filteredTickets);

        const localAttendance = getLocalStorageItem('bu_ca_attendance', []);
        const filteredAttendance = currentUser.role === 'admin'
          ? localAttendance
          : localAttendance.filter((a: AttendanceRecord) => a.studentId === currentUser.uid);
        setAttendance(filteredAttendance);

        const localBookings = getLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS);
        setBookings(localBookings);

        const localPrograms = getLocalStorageItem('bu_ca_programs', DEFAULT_PROGRAMS);
        setPrograms(localPrograms);
      }, 800);

      return () => clearInterval(interval);
    }
  }, [currentUser, tickets.length]);

  // Auth Handlers (Google / Sandbox selector)
  const loginWithGoogle = async (domainRestriction = true) => {
    if (isFirebaseConfigured && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user?.email || '';

        // Domain restriction verification
        if (domainRestriction && !email.endsWith('@bumail.net') && !email.endsWith('@bu.ac.th')) {
          await fbSignOut(auth);
          throw new Error('ระบบนี้สงวนสิทธิ์เฉพาะโดเมน @bumail.net หรือ @bu.ac.th เท่านั้นเพื่อความปลอดภัย');
        }
        return true;
      } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
          alert(
            "⚠️ ไม่สามารถเข้าใช้งานระบบได้ เนื่องจากหน้าต่างล็อกอิน Google ถูกปิดลง หรือเปิดใช้งานในรูปแบบ iFrame\n\n" +
            "💡 วิธีแก้ไขและทดสอบ:\n" +
            "1. ให้คลิกที่ไอคอน \"เปิดในแท็บใหม่ / Open in new tab\" (สัญลักษณ์ลูกศรเฉียงขึ้น ที่มุมขวาบนสุดของพรีวิวแอปนี้ในหน้าจอ AI Studio) เพื่อเข้าใช้งานแบบเต็มหน้าจอจริง\n" +
            "2. อนุญาตให้เบราว์เซอร์ปลดบล็อกป๊อปอัป (Pop-up) สำหรับโดเมนเว็บนี้\n" +
            "3. หรือหากต้องการเพียงสำรวจและทดสอบฟังก์ชันต่างๆ สามารถกดเลือกบัญชีจำลองด้านล่าง \"นักศึกษาจำลอง\" หรือ \"อาจารย์พงศกร (Admin)\" เพื่อเข้าใช้งานได้อย่างครบถ้วนทันทีค่ะ"
          );
        } else if (error.code === 'auth/cancelled-popup-request') {
          alert("⚠️ มีป๊อปอัปเข้าสู่ระบบซ้อนกันอยู่ ขอแนะนำให้กดรีเฟรชหน้าเว็บนี้ (F5) แล้วลองลงชื่อเข้าใช้งานอีกครั้ง หรือทดสอบด้วยระบบจำลองด้านล่างได้ทันทีค่ะ");
        } else {
          alert(error.message || 'การยืนยันตัวตนล้มเหลว');
          throw error;
        }
        return false;
      }
    } else {
      alert("ไม่พบการตั้งค่า Firebase: ระบบจะเริ่มต้นในโหมดนักศึกษาจำลอง สามารถสลับบัญชีที่หน้าจอได้ตลอดเวลา");
      loginAsMockUser('somchai@bumail.net', 'บุญช่วย ถ่ายสวย (นักศึกษา)');
    }
  };

  const loginAsMockUser = (email: string, displayName: string) => {
    // Check if domain restrictions match
    if (!email.endsWith('@bumail.net') && !email.endsWith('@bu.ac.th')) {
      alert("กรุณาใช้อีเมล @bumail.net หรือ @bu.ac.th เท่านั้น!");
      return;
    }
    const role = email.endsWith('@bu.ac.th') ? 'admin' : 'student';
    const profile: UserProfile = {
      uid: email.replace(/[@.]/g, '_'),
      name: displayName,
      email: email,
      role: role,
      joinedAt: new Date().toISOString()
    };
    saveLocalStorageItem('bu_ca_current_user', profile);
    setCurrentUser(profile);
  };

  const logout = async () => {
    localStorage.removeItem('bu_ca_current_user');
    setCurrentUser(null);
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (error) {
        console.error("Sign out error", error);
      }
    }
  };

  // Ticket submissions
  const createSupportTicket = async (category: HelpCategory, title: string, description: string, imageUrls?: string[]) => {
    if (!currentUser) return;

    const firstMessage = {
      id: 'msg_1_' + Date.now(),
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderRole: 'student' as const,
      text: description,
      createdAt: new Date().toISOString()
    };

    const newTicket: Omit<Ticket, 'id'> = {
      studentId: currentUser.uid,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      category,
      title,
      description,
      imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
      imageUrls: imageUrls || [],
      status: 'pending',
      messages: [firstMessage],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const shouldUseFirebase = isFirebaseConfigured && db && auth && auth.currentUser && currentUser.uid === auth.currentUser.uid;

    if (shouldUseFirebase) {
      try {
        await addDoc(collection(db, 'tickets'), newTicket);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'tickets');
      }
    } else {
      const current = getLocalStorageItem('bu_ca_tickets', []);
      const ticketWithId: Ticket = {
        id: 't_' + Math.floor(Math.random() * 100000),
        ...newTicket
      };
      current.unshift(ticketWithId);
      saveLocalStorageItem('bu_ca_tickets', current);
    }
  };

  // Send a continuous chat message in the ticket
  const sendTicketMessage = async (ticketId: string, text: string) => {
    if (!currentUser) return;

    // Find the ticket
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) return;
    const ticket = tickets[ticketIndex];

    const newMessage = {
      id: 'msg_' + Math.floor(Math.random() * 1000000) + '_' + Date.now(),
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: text,
      createdAt: new Date().toISOString()
    };

    const existingMessages = ticket.messages || [];
    const isFirstMigrated = existingMessages.length > 0;
    const migratedMessages = isFirstMigrated ? existingMessages : [
      {
        id: 'msg_orig_' + ticketId,
        senderId: ticket.studentId,
        senderName: ticket.studentName,
        senderRole: 'student' as const,
        text: ticket.description,
        createdAt: ticket.createdAt
      }
    ];

    if (!isFirstMigrated && ticket.replyText) {
      migratedMessages.push({
        id: 'msg_reply_' + ticketId,
        senderId: 'admin',
        senderName: ticket.repliedBy || 'อาจารย์',
        senderRole: 'admin' as const,
        text: ticket.replyText,
        createdAt: ticket.repliedAt || ticket.updatedAt
      });
    }

    const updatedMessages = [...migratedMessages, newMessage];

    let newStatus = ticket.status;
    if (currentUser.role === 'student') {
      newStatus = 'pending';
    } else if (currentUser.role === 'admin') {
      newStatus = 'answered';
    }

    const updates: Partial<Ticket> = {
      messages: updatedMessages,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (currentUser.role === 'admin') {
      updates.replyText = text;
      updates.repliedBy = currentUser.name;
      updates.repliedAt = newMessage.createdAt;
    }

    const shouldUseFirebase = isFirebaseConfigured && db && auth && auth.currentUser && currentUser.uid === auth.currentUser.uid;

    if (shouldUseFirebase) {
      try {
        const ticketDoc = doc(db, 'tickets', ticketId);
        await updateDoc(ticketDoc, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_tickets', []);
      const index = current.findIndex((t: Ticket) => t.id === ticketId);
      if (index !== -1) {
        current[index] = { ...current[index], ...updates };
        saveLocalStorageItem('bu_ca_tickets', current);
      }
    }
  };

  // Reply Ticket (Action by teacher/instructor, compatible wrapper around sendTicketMessage)
  const submitTicketReply = async (ticketId: string, replyText: string) => {
    await sendTicketMessage(ticketId, replyText);
  };

  // Add rating / review
  const submitTicketRating = async (ticketId: string, rating: number, feedback: string) => {
    if (!currentUser) return;
    const updates = {
      rating,
      ratingFeedback: feedback,
      status: 'closed' as const,
      updatedAt: new Date().toISOString()
    };

    const shouldUseFirebase = isFirebaseConfigured && db && auth && auth.currentUser && currentUser.uid === auth.currentUser.uid;

    if (shouldUseFirebase) {
      try {
        const ticketDoc = doc(db, 'tickets', ticketId);
        await updateDoc(ticketDoc, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_tickets', []);
      const index = current.findIndex((t: Ticket) => t.id === ticketId);
      if (index !== -1) {
        current[index] = { ...current[index], ...updates };
        saveLocalStorageItem('bu_ca_tickets', current);
      }
    }
  };

  // Class sign-ins action with Time-based verification
  const checkInToClass = async (classId: string, inputCode: string) => {
    if (!currentUser) return false;

    const classSession = AVAILABLE_CLASSES.find(c => c.id === classId);
    if (!classSession) {
      alert("ไม่พบวิชาเรียนดังกล่าว");
      return false;
    }

    // Time-based Code checks (Time of validation)
    if (inputCode.trim().toUpperCase() !== classSession.code.toUpperCase()) {
      alert(`รหัสเข้าเรียนไม่ถูกต้อง!`);
      return false;
    }

    const checkTime = new Date();
    const currentHour = checkTime.getHours();
    const classHour = parseInt(classSession.startTime.split(':')[0]);
    
    // Evaluate if user is "On Time" or "Late"
    let status: 'on_time' | 'late' | 'excused' = 'on_time';
    let points = classSession.pointsWeight;
    
    // Time-based buffer simulation: If checking in after startTime + 15 minutes, student is marked late
    const minutesPast = checkTime.getMinutes();
    
    // For local evaluation, we can simulate on-time checks, but if they want to experience "Late" flag triggers:
    if (minutesPast > 15) {
      status = 'late';
      points = Math.round(classSession.pointsWeight * 0.7); // 30% penalty
    }

    // Create the check-in data record
    const attendanceRecord: Omit<AttendanceRecord, 'id'> = {
      studentId: currentUser.uid,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      classId: classSession.id,
      className: classSession.name,
      checkedInAt: checkTime.toISOString(),
      status: status,
      points: points,
      deviceMeta: navigator.userAgent.includes("Mobile") ? "📱 Smartphone" : "💻 Desktop"
    };

    // Prevent duplicate entries for the same day
    const hasAlreadyCheckedIn = attendance.some(
      r => r.classId === classSession.id && 
      r.studentId === currentUser.uid && 
      new Date(r.checkedInAt).toDateString() === checkTime.toDateString()
    );

    if (hasAlreadyCheckedIn) {
      alert("คุณได้ทำการเช็คชื่อเข้าชั้นเรียนวิชานี้ในวันนี้วิชานี้เรียบร้อยแล้ว!");
      return false;
    }

    const shouldUseFirebase = isFirebaseConfigured && db && auth && auth.currentUser && currentUser.uid === auth.currentUser.uid;

    if (shouldUseFirebase) {
      try {
        await addDoc(collection(db, 'attendance'), attendanceRecord);
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'attendance');
        return false;
      }
    } else {
      const current = getLocalStorageItem('bu_ca_attendance', []);
      const recordWithId: AttendanceRecord = {
        id: 'att_' + Math.floor(Math.random() * 100000),
        ...attendanceRecord
      };
      current.unshift(recordWithId);
      saveLocalStorageItem('bu_ca_attendance', current);
      return true;
    }
  };

  // Generate beautiful CSV data formatted for Excel/Sheets of support tickets
  const downloadTicketsReportCSV = () => {
    if (tickets.length === 0) {
      alert("ไม่มีข้อมูลเคสคำร้องสำหรับการออกรายงาน");
      return;
    }

    // BOM for Excel Thai language support
    let csvContent = "\uFEFF";
    csvContent += "ลำดับ,รหัสเคส,ชื่อนักศึกษา,อีเมลนักศึกษา,หมวดหมู่อุปกรณ์,หัวข้อปัญหา,คำอธิบายรายละเอียด,สถานะเคส,เวลาที่สร้าง,อาจารย์ผู้ตอบ,ข้อความตอบกลับ,คะแนนพึงพอใจ,คำติชมการประเมิน\n";

    tickets.forEach((t, idx) => {
      const localDate = new Date(t.createdAt).toLocaleString('th-TH');
      const statusText = t.status === 'pending' ? 'รอช่วยเหลือ' : t.status === 'inprogress' ? 'กำลังดำเนินการ' : t.status === 'answered' ? 'ตอบแล้ว' : 'ปิดเคสถาวร';
      const cleanCategory = t.category === 'camera' ? 'กล้อง/เลนส์' : t.category === 'microphone' ? 'ไมโครโฟน' : t.category === 'lighting' ? 'การจัดแสง' : t.category === 'editing' ? 'การตัดต่อ' : 'อื่นๆ';
      const cleanTitle = (t.title || '').replace(/"/g, '""').replace(/,/g, ' ');
      const cleanDesc = (t.description || '').replace(/"/g, '""').replace(/,/g, ' ');
      const cleanStudentName = (t.studentName || '').replace(/,/g, ' ');
      const cleanReply = (t.replyText || '').replace(/"/g, '""').replace(/,/g, ' ');
      const cleanRepliedBy = (t.repliedBy || '').replace(/,/g, ' ');
      const cleanFeedback = (t.ratingFeedback || '').replace(/"/g, '""').replace(/,/g, ' ');

      csvContent += `${idx + 1},"${t.id}","${cleanStudentName}","${t.studentEmail}","${cleanCategory}","${cleanTitle}","${cleanDesc}","${statusText}","${localDate}","${cleanRepliedBy}","${cleanReply}",${t.rating || 'ยังไม่ได้ประเมิน'},"${cleanFeedback}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานสถิติเคสช่วยเหลือ_BU_CA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Seeding test values for demo
  const seedDemoData = () => {
    const defaultTickets: Ticket[] = [
      {
        id: "t_demo_1",
        studentId: "somchai_bumail_net",
        studentName: "สมชาย บุญช่วย (นักศึกษา)",
        studentEmail: "somchai@bumail.net",
        category: "camera",
        title: "เบลอหลังไม่ออก ถ่ายหน้าคนแล้วเบลอข้างหลังยังนูนอยู่มาก",
        description: "พยายามเปิดค่า f/1.4 แล้วแต่พื้นหลังยังไม่ค่อยเบลอละลายเลยครับ ผมต้องยืนห่างจากตัวแบบเท่าไร และใช้ช่วงเลนส์ยาวเท่าไรดีครับ ถ่ายด้วยกล้อง Sony A7IV เลนส์ 50mm ครับ",
        status: "pending",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "t_demo_2",
        studentId: "wilai_bumail_net",
        studentName: "วิไลลักษณ์ เนตรตา (นักศึกษา)",
        studentEmail: "wilai.n@bumail.net",
        category: "microphone",
        title: "ไมค์ตัวส่ง Wireless Go II ดังซ่า เสียงไม่มีสัญญาณเข้าช่องซ้าย",
        description: "หนูเสียบสาย TRS เข้าช่องกล้อง DSLR Canon 80D แล้ว มีเสียงฟูซ่าตลอด และตัวส่งสัญญาณติดเป็นระดับเต็มสเกลเหมือนกระแทกเสียง แต่ไม่มีเสียงพูดจากไมค์เข้าตัวกล้องเลยค่ะ ต้องเซ็ตตั้งค่าตรงไหนคะ",
        status: "answered",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        replyText: "กรณีสาย TRS ซ่าและสัญญาณพีคเต็ม ให้เข้าไปเช็กที่เมนูเสียงของกล้อง Canon เปลี่ยน Recording Level จาก Auto เป็น Manual แล้วดึงเกณฑ์กล้องต่ำสุด (ประมาณ 10-15%) แล้วปรับแต่งเกนที่ Wireless Go เป็น 0dB หรือ -12dB ครับ",
        repliedBy: "อาจารย์พงศกร CO-CA",
        repliedAt: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ];

    const defaultAttendance: AttendanceRecord[] = [
      {
        id: "att_dem_1",
        studentId: "somchai_bumail_net",
        studentName: "สมชาย บุญช่วย",
        studentEmail: "somchai@bumail.net",
        classId: "ca101",
        className: "CA101: การตั้งค่ากล้องพื้นฐานและการจัดเฟรม (Basic Camera Setup)",
        checkedInAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: "on_time",
        points: 10,
        deviceMeta: "📱 Smartphone"
      },
      {
        id: "att_dem_2",
        studentId: "wilai_bumail_net",
        studentName: "วิไลลักษณ์ เนตรตา",
        studentEmail: "wilai.n@bumail.net",
        classId: "ca101",
        className: "CA101: การตั้งค่ากล้องพื้นฐานและการจัดเฟรม (Basic Camera Setup)",
        checkedInAt: new Date(Date.now() - 3600000 * 23.8).toISOString(),
        status: "on_time",
        points: 10,
        deviceMeta: "📱 Smartphone"
      },
      {
        id: "att_dem_3",
        studentId: "anupong_bumail_net",
        studentName: "อนุพงศ์ มีแสง",
        studentEmail: "anupong.m@bumail.net",
        classId: "ca101",
        className: "CA101: การตั้งค่ากล้องพื้นฐานและการจัดเฟรม (Basic Camera Setup)",
        checkedInAt: new Date(Date.now() - 3600000 * 23.5).toISOString(),
        status: "late",
        points: 7,
        deviceMeta: "💻 Desktop"
      }
    ];

    saveLocalStorageItem('bu_ca_tickets', defaultTickets);
    saveLocalStorageItem('bu_ca_attendance', defaultAttendance);
    setTickets(defaultTickets);
    setAttendance(defaultAttendance);
    alert("ระบบจำลองได้จำลองข้อมูลตั๋วสถิติและคะแนนเข้าเรียนระดับเบื้องต้นเรียบร้อย!");
  };

  // --- Room Booking CRUD Operations ---
  const createBooking = async (roomName: string, date: string, timeSlot: string, purpose: string, studentIdInput?: string, phone?: string) => {
    if (!currentUser) return;

    let subject = "";
    let bookingPurpose = "";
    if (purpose.includes("(")) {
      const match = purpose.match(/^(.*?)\s*\((.*?)\)\s*$/);
      if (match) {
        subject = match[1].trim();
        bookingPurpose = match[2].trim();
      } else {
        subject = purpose;
      }
    } else {
      subject = purpose;
    }

    const bookingPayload: Omit<RoomBooking, 'id'> = {
      studentId: currentUser.uid,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      roomName,
      date,
      timeSlot,
      purpose,
      studentIdInput,
      phone,
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject,
      bookingPurpose
    };

    const shouldUseFirebase = !!(isFirebaseConfigured && db && auth && auth.currentUser && currentUser.uid === auth.currentUser.uid);
    if (shouldUseFirebase) {
      try {
        await addDoc(collection(db, 'bookings'), bookingPayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'bookings');
      }
    } else {
      const current = getLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS);
      const bookingWithId: RoomBooking = {
        id: 'book_' + Math.floor(Math.random() * 1000000),
        ...bookingPayload
      };
      const updated = [bookingWithId, ...current];
      saveLocalStorageItem('bu_ca_bookings', updated);
      setBookings(updated);
    }
  };

  const updateBookingStatus = async (id: string, status: 'approved' | 'rejected') => {
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };
    const shouldUseFirebase = !!(isFirebaseConfigured && db && auth && auth.currentUser);
    if (shouldUseFirebase) {
      try {
        const docRef = doc(db, 'bookings', id);
        await updateDoc(docRef, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS);
      const index = current.findIndex((b: RoomBooking) => b.id === id);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = { ...updated[index], ...updates };
        saveLocalStorageItem('bu_ca_bookings', updated);
        setBookings(updated);
      }
    }
  };

  const deleteBooking = async (id: string) => {
    const shouldUseFirebase = !!(isFirebaseConfigured && db && auth && auth.currentUser);
    if (shouldUseFirebase) {
      try {
        const docRef = doc(db, 'bookings', id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `bookings/${id}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS);
      const updated = current.filter((b: RoomBooking) => b.id !== id);
      saveLocalStorageItem('bu_ca_bookings', updated);
      setBookings(updated);
    }
  };

  // --- Broadcast Program CRUD Operations ---
  const createProgram = async (
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
  ) => {
    if (!currentUser) return;
    const programPayload: Omit<BroadcastProgram, 'id'> = {
      studentId: currentUser.uid,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      programName,
      hosts,
      category,
      roomName,
      date,
      timeSlot,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject,
      purpose,
      studentIdInput,
      phone
    };

    const shouldUseFirebase = !!(isFirebaseConfigured && db && auth && auth.currentUser && currentUser.uid === auth.currentUser.uid);
    if (shouldUseFirebase) {
      try {
        await addDoc(collection(db, 'programs'), programPayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'programs');
      }
    } else {
      const current = getLocalStorageItem('bu_ca_programs', DEFAULT_PROGRAMS);
      const programWithId: BroadcastProgram = {
        id: 'prog_' + Math.floor(Math.random() * 1000000),
        ...programPayload
      };
      const updated = [programWithId, ...current];
      saveLocalStorageItem('bu_ca_programs', updated);
      setPrograms(updated);
    }
  };

  const updateProgramStatus = async (id: string, status: 'upcoming' | 'active' | 'completed') => {
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };
    const shouldUseFirebase = !!(isFirebaseConfigured && db && auth && auth.currentUser);
    if (shouldUseFirebase) {
      try {
        const docRef = doc(db, 'programs', id);
        await updateDoc(docRef, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `programs/${id}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_programs', DEFAULT_PROGRAMS);
      const index = current.findIndex((p: BroadcastProgram) => p.id === id);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = { ...updated[index], ...updates };
        saveLocalStorageItem('bu_ca_programs', updated);
        setPrograms(updated);
      }
    }
  };

  const deleteProgram = async (id: string) => {
    const shouldUseFirebase = !!(isFirebaseConfigured && db && auth && auth.currentUser);
    if (shouldUseFirebase) {
      try {
        const docRef = doc(db, 'programs', id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `programs/${id}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_programs', DEFAULT_PROGRAMS);
      const updated = current.filter((p: BroadcastProgram) => p.id !== id);
      saveLocalStorageItem('bu_ca_programs', updated);
      setPrograms(updated);
    }
  };

  return {
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
    downloadAttendanceReportCSV: downloadTicketsReportCSV,
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
  };
}
