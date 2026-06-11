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
import { Ticket, AttendanceRecord, ClassSession, UserProfile, HelpCategory, KnowledgeCabinet, KnowledgeTip } from '../types';

// Default Knowledge Cabinets for initial seeding and fallback
export const DEFAULT_CABINETS: KnowledgeCabinet[] = [
  {
    id: 'cabin-camera',
    icon: 'camera',
    title: 'ตู้ความรู้ฟิสิกส์ภาพและรูรับแสง (Camera & Exposure Cabin)',
    accent: 'border-orange-100 bg-orange-50/20 text-orange-950',
    badgeBg: 'bg-orange-100 text-orange-850',
    tag: 'กล้อง & เลนส์',
    summary: 'เจาะลึก 3 เสาหลักของการวัดแสง (Aperture, Shutter Speed, ISO) พร้อมระบบกลศาสตร์ตากล้อง',
    tips: [
      { q: 'อยากถ่ายคนหน้าชัดหลังละลายสุดๆ ต้องใช้ค่าอะไร?', a: 'ปรับรูรับแสง (Aperture) ให้กว้างที่สุด เช่น f/1.4, f/1.8 หรือ f/2.0 ยืนใกล้แบบและทิ้งฉากหลังให้ห่างระบบซูมเลนส์จะช่วยหนุนทัศนมิติละลายได้ดีที่สุดค่ะ' },
      { q: 'ภาพมืดเกินไปแก้ด้วยค่าไหนไม่พัง?', a: '1. ลด Shutter Speed ลง (ห้ามต่ำกว่า 1/125 ถ้าไม่ได้ใช้ขาตั้งกล้อง)\n2. เปิดรูรับแสงกว้างขึ้น F-stop น้อยลง\n3. ค่อยๆ ปรับเพิ่ม ISO (ควรคุมไม่เกิน 1600-3200 เพื่อเลี่ยงสัญาณรบกวน Noise)' },
      { q: 'ภาพสั่นไหวและเบลอเวลาวัตถุเคลื่อนที่เร็วแก้ฟิสิกส์อย่างไร?', a: 'เพิ่ม Shutter speed ให้เร็วขึ้นเป็นอย่างน้อย 1/500 วินาที หรือ 1/1000 วินาที คุมให้สัมพันธ์กับการก้าวเดินของวัตถุค่ะ' }
    ]
  },
  {
    id: 'cabin-mic',
    icon: 'mic',
    title: 'ตู้ความรู้คลื่นไมค์และการบันทึกเสียง (Audio & Signal Calibration)',
    accent: 'border-emerald-100 bg-emerald-50/20 text-emerald-950',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    tag: 'คลื่นไมโครโฟน',
    summary: 'คู่มือแก้ไขปัญหาสัญญาณคลื่นไมโครโฟนไร้สาย (Wireless Mics) และขั้นตอนการปรับ Gain ไม่ให้เสียงแตก/ฟู่',
    tips: [
      { q: 'สัญญาณไมค์คลื่นขาดหายหรือมีคลื่นแทรกระหว่างการทำงาน?', a: 'เปลี่ยนความถี่ไปช่องสำรอง (Group/Channel) ทันที หลีกเลี่ยงตำแหน่งอับสัญญาณใกล้เสาดาวเทียม โทรศัพท์เคลื่อนที่ หรือเสาไฟฟ้ารัศมีสูง' },
      { q: 'เสียงแตก (Clip/Peak) บันทึกเข้าไปแล้วดังสะท้านซ่ากระด้าง?', a: 'ปรับลดคลื่น Input Gain ที่ตัวส่ง (Transmitter) หรือลดค่า dB ที่หลังกล้องให้วิ่งไม่เกินแถบส้ม (-12 dB) ห้ามแตะแถบแดงเด็ดขาด' },
      { q: 'เสียงเบาแผ่วมากและมีเสียงลมฟู่ซ่าพัดตลอดเวลาทำงานกลางแจ้ง?', a: 'สวมใส่อุปกรณ์กันลม (Deadcat / Wind Muff) ป้องกันรูไมค์ และปรับเปิดโหมด Low-Cut Filter ที่ตัวรับสัญญาณเพื่อตัดเสียงความถี่ต่ำ' }
    ]
  },
  {
    id: 'cabin-lighting',
    icon: 'lighting',
    title: 'ตู้ความรู้จัดแสงหลัก 3 จุดในสตูดิโอ (3-Point Studio Lighting Cabin)',
    accent: 'border-amber-100 bg-amber-50/20 text-amber-955',
    badgeBg: 'bg-amber-100 text-amber-800',
    tag: 'จัดแสง & เงา',
    summary: 'มาตรฐานการวางทิศทางแสงด้วย Key Light, Fill Light และ Back Light เพื่อมิติใบหน้าคมชัดอย่างมืออาชีพ',
    tips: [
      { q: 'เสาหลักที่ 1: Key Light วางตำแหน่งทิศทางไหน?', a: 'เป็นแสงหลักที่แรงสุด วางทำมุม 45 องศาทั้งแนวนอนและแนวตั้งเฉียงหน้าผู้พูด เพื่อความมีมิติและเงาที่นิ่มนวลตกกระทบ' },
      { q: 'เสาหลักที่ 2: Fill Light แก้ไขเงาฝั่งไหน?', a: 'วางทิศตรงข้ามกับ Key Light แสงนุ่มเบากว่าครึ่งหนึ่งเพื่อถมเงาดำฝั่งมืดไม่ให้หน้าดูลึกหลืบจนแข็งกระด้างเกินเกณฑ์' },
      { q: 'เสาหลักที่ 3: Back Light / Hair Light สำคัญอย่างไร?', a: 'ยิงย้อนมาจากข้างหลังแบบเบาๆ เพื่อวาดเส้นแสง (Rim Light) รอบเส้นผมและหัวไหล่นักแสดง ช่วยแยกตัวแบบหลุดขาดฉายมิติออกมาจากพรมฉากหลัง' }
    ]
  },
  {
    id: 'cabin-editing',
    icon: 'editing',
    title: 'ตู้ความรู้ไฟล์และการเตรียมงานตัดต่อ (Editing Specs & Post-Process)',
    accent: 'border-pink-100 bg-pink-50/20 text-pink-950',
    badgeBg: 'bg-pink-100 text-pink-850',
    tag: 'ซอฟต์แวร์ตัดต่อ',
    summary: 'วิธีเลือกชนิดไฟล์วิดีโอ (Bitrate, Codec, Frame rate) และฟังก์ชันการกู้คืนงานหายเมื่อคอมค้าง',
    tips: [
      { q: 'ทำไมสีวิดีโอบนจอตัดต่อกับเวลาส่งเข้ามือถือถึงจืดจางไม่เหมือนกัน?', a: 'ปัญหานี้เกี่ยวโยงกับ Color Space ผิดเพี้ยน แนะนำให้ตั้งขอบเขตส่งออก (Export profile) เป็น Rec.709 sRGB แทนนอกเสียจากเป็นงานเกรดภาพสีพิเศษ' },
      { q: 'เครื่องหน่วงเรนเดอร์กระตุกแก้สเปกตรงไหน?', a: 'เลือกเปิดฟังก์ชัน "Proxy Media" ในแอปตัดต่อ เพื่อลดความละเอียดไฟล์หลอกเวลาตัด แล้วเครื่องจะเรนเดอร์สบายขึ้นเมื่อดึงผลงานสุดท้าย' },
      { q: 'ค่าเฟรมเรต 24fps, 30fps, 60fps ต่างกันอย่างไร?', a: '• 24fps: มิติฟิล์มโรงภาพยนตร์แบบคลาสสิก\n• 30fps: วิดีโอบล็อกรายการโทรทัศน์ทั่วไป\n• 60fps: ภาพสไลด์ลื่นเคลื่อนไหวเร็วและนิยมใช้เพื่อดึงภาพช้า (Slow-Mo)' }
    ]
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
  const [cabinets, setCabinets] = useState<KnowledgeCabinet[]>([]);


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

  // Sync Knowledge Cabinets
  useEffect(() => {
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(collection(db, 'cabinets'), async (snapshot) => {
        if (snapshot.empty) {
          // Empty in Firestore - let's seed DEFAULT_CABINETS sequentially
          for (const cab of DEFAULT_CABINETS) {
            const { id, ...data } = cab;
            try {
              // We preserve original doc ID
              await setDoc(doc(db, 'cabinets', id), {
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } catch (e) {
              console.warn("Could not write default cabinet to Firestore (expected if current user is non-admin):", e);
            }
          }
          // Fallback immediately to state
          setCabinets(DEFAULT_CABINETS);
        } else {
          const loadedCabinets: KnowledgeCabinet[] = [];
          snapshot.forEach((doc) => {
            loadedCabinets.push({ id: doc.id, ...doc.data() } as KnowledgeCabinet);
          });
          // Sort cabinets by id or title so order stays consistent
          loadedCabinets.sort((a, b) => a.id.localeCompare(b.id));
          setCabinets(loadedCabinets);
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'cabinets');
        } catch (e) {
          console.error("Cabinets sync failed, falling back to defaults:", e);
          setCabinets(DEFAULT_CABINETS);
        }
      });
      return unsubscribe;
    } else {
      // Local storage sandbox
      const local = getLocalStorageItem('bu_ca_cabinets', null);
      if (!local) {
        saveLocalStorageItem('bu_ca_cabinets', DEFAULT_CABINETS);
        setCabinets(DEFAULT_CABINETS);
      } else {
        setCabinets(local);
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
  const createSupportTicket = async (category: HelpCategory, title: string, description: string, imageBase64?: string) => {
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
      imageUrl: imageBase64,
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

  // Cabinets CRUD Operations
  const createCabinet = async (cabinetData: Omit<KnowledgeCabinet, 'id'>) => {
    const newCabinet: Omit<KnowledgeCabinet, 'id'> = {
      ...cabinetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      try {
        await addDoc(collection(db, 'cabinets'), newCabinet);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'cabinets');
      }
    } else {
      const current = getLocalStorageItem('bu_ca_cabinets', DEFAULT_CABINETS);
      const cabinetWithId: KnowledgeCabinet = {
        id: 'cabin_' + Math.floor(Math.random() * 100000),
        ...newCabinet
      };
      const updated = [...current, cabinetWithId];
      saveLocalStorageItem('bu_ca_cabinets', updated);
      setCabinets(updated);
    }
  };

  const updateCabinet = async (id: string, cabinetData: Partial<KnowledgeCabinet>) => {
    const updates = {
      ...cabinetData,
      updatedAt: new Date().toISOString()
    };
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      try {
        const cabinetDoc = doc(db, 'cabinets', id);
        await updateDoc(cabinetDoc, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `cabinets/${id}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_cabinets', DEFAULT_CABINETS);
      const index = current.findIndex((c: KnowledgeCabinet) => c.id === id);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = { ...updated[index], ...updates };
        saveLocalStorageItem('bu_ca_cabinets', updated);
        setCabinets(updated);
      }
    }
  };

  const deleteCabinet = async (id: string) => {
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      try {
        const cabinetDoc = doc(db, 'cabinets', id);
        await deleteDoc(cabinetDoc);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `cabinets/${id}`);
      }
    } else {
      const current = getLocalStorageItem('bu_ca_cabinets', DEFAULT_CABINETS);
      const updated = current.filter((c: KnowledgeCabinet) => c.id !== id);
      saveLocalStorageItem('bu_ca_cabinets', updated);
      setCabinets(updated);
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
    cabinets,
    createCabinet,
    updateCabinet,
    deleteCabinet
  };
}
