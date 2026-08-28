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
import { Ticket, AttendanceRecord, ClassSession, UserProfile, HelpCategory, RoomBooking, BroadcastProgram, Course } from '../types';
import { sendBookingEmail, sendPinReminderEmail } from '../services/emailService';

export const OVERLAP_ERROR_MESSAGE = "⚠️ ไม่สามารถจอง/ย้ายได้ เนื่องจากช่วงเวลานี้ถูกจองไว้แล้ว กรุณาเลือกช่วงเวลาอื่น";

export function parseTimeSlotRange(timeStr: string): { startMin: number; endMin: number } | null {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const startH = parseInt(match[1], 10);
  const startM = parseInt(match[2], 10);
  const endH = parseInt(match[3], 10);
  const endM = parseInt(match[4], 10);
  
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  
  if (isNaN(startMin) || isNaN(endMin) || startMin >= endMin) {
    return null;
  }
  return { startMin, endMin };
}

export function calculateBookingDurationHours(timeSlot: string): number {
  if (!timeSlot) return 1.0;
  const range = parseTimeSlotRange(timeSlot);
  if (range && range.endMin > range.startMin) {
    const diffMinutes = range.endMin - range.startMin;
    const hours = diffMinutes / 60;
    return hours > 0 ? hours : 1.0;
  }
  return 1.0;
}

export function formatHoursDisplay(hours: number): string {
  if (hours === 0) return "0";
  return Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
}

export function formatTimestampDisplay(isoStr?: string): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} น.`;
  } catch {
    return isoStr;
  }
}

export function isTimeOverlapping(slotA: string, slotB: string): boolean {
  const rangeA = parseTimeSlotRange(slotA);
  const rangeB = parseTimeSlotRange(slotB);
  
  if (rangeA && rangeB) {
    return rangeA.startMin < rangeB.endMin && rangeA.endMin > rangeB.startMin;
  }
  
  const normA = slotA.replace(/\./g, ':').replace(/\s+/g, ' ').trim().toLowerCase();
  const normB = slotB.replace(/\./g, ':').replace(/\s+/g, ' ').trim().toLowerCase();
  return normA === normB;
}

export const DEFAULT_COURSES: Course[] = [
  { id: "course-1", code: "BRS311", name: "การจัดรายการวิทยุกระจายเสียง" },
  { id: "course-2", code: "CA102", name: "เทคโนโลยีสื่อสารมวลชน" },
  { id: "course-3", code: "BC101", name: "พื้นฐานการสื่อสาร" },
  { id: "course-4", code: "OTHER", name: "งานอื่นๆ / คลาสเรียนพิเศษ" },
];

export function getCourseLabel(course: Course): string {
  if (!course.code || course.code.toUpperCase() === 'OTHER' || course.code === 'งานอื่นๆ') {
    return course.name;
  }
  if (course.name.startsWith(course.code)) {
    return course.name;
  }
  return `${course.code} - ${course.name}`;
}

export const AVAILABLE_STUDIO_ROOMS = [
  "Studio A: สตูดิโอโทรทัศน์เสมือนจริง (Virtual TV Studio)",
  "Studio B: ห้องบันทึกรายการพอดแคสต์ (Podcast Creative Room)",
  "Studio C: สตูถ่ายภาพแฟชั่นเเละนิ่ง (Production Photo Studio)",
  "Studio D: ห้องจัดรายการวิทยุเเละดีเจ (FM Broadcast Radio Booth)",
  "Studio E: ห้องตัดต่อระดับสีระดับเสียง (Pre-Post Mastering Suite)"
];

export const AVAILABLE_TIMESLOTS = [
  "08:30 - 09:30",
  "09:30 - 10:30",
  "10:30 - 11:30",
  "11:30 - 12:30",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00"
];

// Default bookings for starting/demo purposes (Empty - no mock data)
export const DEFAULT_BOOKINGS: RoomBooking[] = [];

// Default broadcast programs for starting/demo purposes (Empty - no mock data)
export const DEFAULT_PROGRAMS: BroadcastProgram[] = [];

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

// Local storage helper functions
function getLocalStorageItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalStorageItem<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage sync error", e);
  }
}

export function useData() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [programs, setPrograms] = useState<BroadcastProgram[]>([]);
  const [courses, setCourses] = useState<Course[]>(() => getLocalStorageItem('bu_ca_courses', DEFAULT_COURSES));
  const [roomImages, setRoomImages] = useState<{ [key: string]: string | string[] }>({
    "ห้องจัดรายการ 1": ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=90&w=2560"],
    "ห้องจัดรายการ 2": ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=90&w=2560"],
    "ห้องยูทูป 1": ["https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=90&w=2560"],
    "ห้องยูทูป 2": ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=90&w=2560"]
  });

  // Sync Bookings
  useEffect(() => {
    const isRealAuthSession = auth && auth.currentUser && currentUser && currentUser.uid === auth.currentUser.uid;
    const shouldUseFirebase = isFirebaseConfigured && db && isRealAuthSession;

    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(collection(db, 'bookings'), async (snapshot) => {
        if (snapshot.empty) {
          if (currentUser?.role === 'admin') {
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
          }
          setBookings(DEFAULT_BOOKINGS);
        } else {
          const loaded: RoomBooking[] = [];
          snapshot.forEach((doc) => {
            loaded.push({ ...doc.data(), id: doc.id } as RoomBooking);
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
      return () => unsubscribe();
    } else {
      const local = getLocalStorageItem('bu_ca_bookings', null);
      if (!local) {
        saveLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS);
        setBookings(DEFAULT_BOOKINGS);
      } else {
        setBookings(local);
      }
    }
  }, [currentUser]);

  // Sync Room Images
  useEffect(() => {
    const shouldUseFirebase = isFirebaseConfigured && db;
    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(doc(db, 'configs', 'room_images'), (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.data() as { [key: string]: string | string[] };
          let hasUpdated = false;
          const updatedData = { ...rawData };
          
          for (const key in updatedData) {
            const val = updatedData[key];
            if (Array.isArray(val)) {
              updatedData[key] = val.map(url => {
                if (typeof url === 'string') {
                  let nextUrl = url;
                  if (nextUrl.includes('w=1000')) {
                    nextUrl = nextUrl.replace('w=1000', 'w=1920');
                    hasUpdated = true;
                  }
                  if (nextUrl.includes('q=80')) {
                    nextUrl = nextUrl.replace('q=80', 'q=85');
                    hasUpdated = true;
                  }
                  return nextUrl;
                }
                return url;
              });
            } else if (typeof val === 'string') {
              let nextUrl = val;
              if (nextUrl.includes('w=1000')) {
                nextUrl = nextUrl.replace('w=1000', 'w=1920');
                hasUpdated = true;
              }
              if (nextUrl.includes('q=80')) {
                nextUrl = nextUrl.replace('q=80', 'q=85');
                hasUpdated = true;
              }
              updatedData[key] = nextUrl;
            }
          }
          
          if (hasUpdated && currentUser?.role === 'admin') {
            setDoc(doc(db, 'configs', 'room_images'), updatedData)
              .then(() => console.log("Successfully upgraded room images in Firestore to 1920px (HD)"))
              .catch(err => console.warn("Failed to save high-res room images:", err));
          }
          
          setRoomImages(updatedData);
        } else {
          // If doesn't exist, create it with default if admin
          if (currentUser?.role === 'admin') {
            setDoc(doc(db, 'configs', 'room_images'), {
              "ห้องจัดรายการ 1": ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=85&w=1920"],
              "ห้องจัดรายการ 2": ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=85&w=1920"],
              "ห้องยูทูป 1": ["https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=85&w=1920"],
              "ห้องยูทูป 2": ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=85&w=1920"]
            }).catch(err => console.warn("Failed to write default room images:", err));
          } else {
            setRoomImages({
              "ห้องจัดรายการ 1": ["https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=85&w=1920"],
              "ห้องจัดรายการ 2": ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=85&w=1920"],
              "ห้องยูทูป 1": ["https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=85&w=1920"],
              "ห้องยูทูป 2": ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=85&w=1920"]
            });
          }
        }
      }, (error) => {
        console.error("Room images sync error:", error);
      });
      return () => unsubscribe();
    } else {
      const local = getLocalStorageItem('bu_ca_room_images', null);
      if (local) {
        let hasUpdated = false;
        const updatedLocal = { ...local };
        for (const key in updatedLocal) {
          const val = updatedLocal[key];
          if (Array.isArray(val)) {
            updatedLocal[key] = val.map(url => {
              if (typeof url === 'string') {
                let nextUrl = url;
                if (nextUrl.includes('w=1000')) {
                  nextUrl = nextUrl.replace('w=1000', 'w=1920');
                  hasUpdated = true;
                }
                if (nextUrl.includes('q=80')) {
                  nextUrl = nextUrl.replace('q=80', 'q=85');
                  hasUpdated = true;
                }
                return nextUrl;
              }
              return url;
            });
          } else if (typeof val === 'string') {
            let nextUrl = val;
            if (nextUrl.includes('w=1000')) {
              nextUrl = nextUrl.replace('w=1000', 'w=1920');
              hasUpdated = true;
            }
            if (nextUrl.includes('q=80')) {
              nextUrl = nextUrl.replace('q=80', 'q=85');
              hasUpdated = true;
            }
            updatedLocal[key] = nextUrl;
          }
        }
        if (hasUpdated) {
          saveLocalStorageItem('bu_ca_room_images', updatedLocal);
        }
        setRoomImages(updatedLocal);
      }
    }
  }, [currentUser]);

  // Sync Courses from Firestore / LocalStorage
  useEffect(() => {
    const shouldUseFirebase = isFirebaseConfigured && db;

    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(collection(db, 'courses'), async (snapshot) => {
        if (snapshot.empty) {
          for (const c of DEFAULT_COURSES) {
            try {
              await setDoc(doc(db, 'courses', c.id), {
                code: c.code,
                name: c.name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } catch (e) {
              console.warn("Could not seed default course to Firestore:", e);
            }
          }
          setCourses(DEFAULT_COURSES);
        } else {
          const list = snapshot.docs.map(d => ({
            ...d.data(),
            id: d.id
          })) as Course[];
          list.sort((a, b) => {
            const codeA = (a.code || '').trim().toUpperCase();
            const codeB = (b.code || '').trim().toUpperCase();
            if (codeA === 'OTHER' || codeA === 'งานอื่นๆ') return 1;
            if (codeB === 'OTHER' || codeB === 'งานอื่นๆ') return -1;
            return codeA.localeCompare(codeB, 'th');
          });
          setCourses(list);
          saveLocalStorageItem('bu_ca_courses', list);
        }
      }, (error) => {
        console.warn("Firestore courses subscription error:", error);
        setCourses(getLocalStorageItem('bu_ca_courses', DEFAULT_COURSES));
      });
      return () => unsubscribe();
    } else {
      setCourses(getLocalStorageItem('bu_ca_courses', DEFAULT_COURSES));
    }
  }, [currentUser]);

  const updateRoomImages = async (newImages: { [key: string]: string | string[] }) => {
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
    const isRealAuthSession = auth && auth.currentUser && currentUser && currentUser.uid === auth.currentUser.uid;
    const shouldUseFirebase = isFirebaseConfigured && db && isRealAuthSession;

    if (shouldUseFirebase) {
      const unsubscribe = onSnapshot(collection(db, 'programs'), async (snapshot) => {
        if (snapshot.empty) {
          if (currentUser?.role === 'admin') {
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
      return () => unsubscribe();
    } else {
      const local = getLocalStorageItem('bu_ca_programs', null);
      if (!local) {
        saveLocalStorageItem('bu_ca_programs', DEFAULT_PROGRAMS);
        setPrograms(DEFAULT_PROGRAMS);
      } else {
        setPrograms(local);
      }
    }
  }, [currentUser]);

  // Auth synchronization (Firebase or Local Sandbox)
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
        if (user) {
          const email = user.email || '';
          if (!email.endsWith('@bu.ac.th')) {
            try {
              await fbSignOut(auth);
            } catch (e) {
              console.error(e);
            }
            setCurrentUser(null);
            setLoading(false);
            alert("⚠️ ระบบนี้สงวนสิทธิ์เฉพาะอาจารย์และเจ้าหน้าที่ (@bu.ac.th) เท่านั้นในการเข้าใช้งาน");
            return;
          }
          
          const profile: UserProfile = {
            uid: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: 'admin',
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
      if (localSession && !localSession.email?.endsWith('@bu.ac.th')) {
        localStorage.removeItem('bu_ca_current_user');
        setCurrentUser(null);
      } else {
        setCurrentUser(localSession);
      }
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
      // Local Sandbox Live Monitoring Mock Setup (Safe compare & non-mutating update)
      const interval = setInterval(() => {
        const localTickets = getLocalStorageItem('bu_ca_tickets', []);
        const filteredTickets = currentUser.role === 'admin' 
          ? localTickets 
          : localTickets.filter((t: Ticket) => t.studentId === currentUser.uid);
        
        setTickets(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(filteredTickets)) {
            return filteredTickets;
          }
          return prev;
        });

        const localAttendance = getLocalStorageItem('bu_ca_attendance', []);
        const filteredAttendance = currentUser.role === 'admin'
          ? localAttendance
          : localAttendance.filter((a: AttendanceRecord) => a.studentId === currentUser.uid);
        
        setAttendance(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(filteredAttendance)) {
            return filteredAttendance;
          }
          return prev;
        });

        const localBookings = getLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS);
        setBookings(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(localBookings)) {
            return localBookings;
          }
          return prev;
        });

        const localPrograms = getLocalStorageItem('bu_ca_programs', DEFAULT_PROGRAMS);
        setPrograms(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(localPrograms)) {
            return localPrograms;
          }
          return prev;
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Auth Handlers (Google / Sandbox selector)
  const loginWithGoogle = async (domainRestriction = true) => {
    if (isFirebaseConfigured && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user?.email || '';

        // Domain restriction verification: strictly @bu.ac.th
        if (domainRestriction && !email.endsWith('@bu.ac.th')) {
          await fbSignOut(auth);
          throw new Error('ระบบนี้สงวนสิทธิ์เฉพาะอาจารย์และเจ้าหน้าที่ (@bu.ac.th) เท่านั้นในการเข้าสู่ระบบ');
        }
        return true;
      } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
          alert(
            "⚠️ ไม่สามารถเข้าใช้งานระบบได้ เนื่องจากหน้าต่างล็อกอิน Google ถูกปิดลง หรือเปิดใช้งานในรูปแบบ iFrame\n\n" +
            "💡 วิธีแก้ไขและทดสอบ:\n" +
            "1. ให้คลิกที่ไอคอน \"เปิดในแท็บใหม่ / Open in new tab\" (สัญลักษณ์ลูกศรเฉียงขึ้น ที่มุมขวาบนสุดของพรีวิวแอปนี้ในหน้าจอ AI Studio) เพื่อเข้าใช้งานแบบเต็มหน้าจอจริง\n" +
            "2. อนุญาตให้เบราว์เซอร์ปลดบล็อกป๊อปอัป (Pop-up) สำหรับโดเมนเว็บนี้\n" +
            "3. หรือหากต้องการเพียงสำรวจและทดสอบฟังก์ชันต่างๆ สามารถลงชื่อเข้าใช้งานด้วยบัญชี @bu.ac.th ค่ะ"
          );
        } else if (error.code === 'auth/cancelled-popup-request') {
          alert("⚠️ มีป๊อปอัปเข้าสู่ระบบซ้อนกันอยู่ ขอแนะนำให้กดรีเฟรชหน้าเว็บนี้ (F5) แล้วลองลงชื่อเข้าใช้งานอีกครั้ง");
        } else {
          alert(error.message || 'การยืนยันตัวตนล้มเหลว');
          throw error;
        }
        return false;
      }
    } else {
      alert("ไม่พบการตั้งค่า Firebase: ระบบจะเริ่มต้นในโหมดอาจารย์/เจ้าหน้าที่จำลอง (@bu.ac.th)");
      loginAsMockUser('pongsakorn.c@bu.ac.th', 'อาจารย์พงศกร (Admin)');
    }
  };

  const loginAsMockUser = (email: string, displayName: string) => {
    // Check if domain restrictions match: strictly @bu.ac.th
    if (!email.endsWith('@bu.ac.th')) {
      alert("กรุณาใช้อีเมล @bu.ac.th สำหรับอาจารย์/เจ้าหน้าที่ เท่านั้น!");
      return;
    }
    const profile: UserProfile = {
      uid: email.replace(/[@.]/g, '_'),
      name: displayName,
      email: email,
      role: 'admin',
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

  // Generate CSV for All Room Bookings (Feature 6) compatible with Google Sheets & Excel
  const downloadAllBookingsReportCSV = () => {
    if (bookings.length === 0) {
      alert("ไม่มีข้อมูลการจองห้องสำหรับการออกรายงาน");
      return;
    }

    // UTF-8 BOM for Thai language support
    let csvContent = "\uFEFF";
    csvContent += "ลำดับ,วันที่จอง,ช่วงเวลา,ห้องจัดรายการ,ชื่อผู้จอง,รหัสนักศึกษา/อาจารย์,ชื่อรายวิชา,วัตถุประสงค์,เวลาทำรายการล่าสุด\n";

    const sorted = [...bookings].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (a.roomName || '').localeCompare(b.roomName || '');
    });

    sorted.forEach((b, idx) => {
      const isTeacher =
        b.userType === 'teacher' ||
        b.studentId === 'TEACHER' ||
        b.studentIdInput === 'TEACHER' ||
        (b.purpose && b.purpose.includes('สำหรับการเรียนการสอนอาจารย์')) ||
        b.studentName === 'อาจารย์ผู้สอน' ||
        b.studentIdInput === 'อาจารย์ประจำวิชา';

      let bookerName = b.studentName || b.studentNameInput || (isTeacher ? 'อาจารย์ผู้สอน' : '-');
      let idDisplay = b.studentIdInput || b.studentId || (isTeacher ? 'อาจารย์ประจำวิชา' : '-');
      let subjectDisplay = b.subject || 'BRS311';
      subjectDisplay = subjectDisplay.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '').trim();

      let purposeDisplay = b.bookingPurpose || b.purpose || (isTeacher ? 'สำหรับการเรียนการสอน' : 'ฝึกปฏิบัติการจัดรายการ');
      purposeDisplay = purposeDisplay.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '').replace(/\|/g, '').trim();

      const lastUpdated = formatTimestampDisplay(b.updatedAt || b.submittedAt || b.createdAt);

      const clean = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

      csvContent += `${idx + 1},${clean(b.date)},${clean(b.timeSlot)},${clean(b.roomName)},${clean(bookerName)},${clean(idDisplay)},${clean(subjectDisplay)},${clean(purposeDisplay)},${clean(lastUpdated)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานการจองห้องจัดรายการ_BU_CA_AllRooms_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear demo data
  const seedDemoData = () => {
    saveLocalStorageItem('bu_ca_tickets', []);
    saveLocalStorageItem('bu_ca_attendance', []);
    setTickets([]);
    setAttendance([]);
  };

  // --- Room Booking CRUD Operations ---
  const checkTimeOverlap = async (
    roomName: string, 
    date: string, 
    timeSlot: string, 
    excludeBookingId?: string
  ): Promise<{ hasOverlap: boolean; conflictingBooking?: RoomBooking }> => {
    try {
      const targetRoom = (roomName || '').trim();
      const targetDate = (date || '').trim();
      const targetSlot = (timeSlot || '').trim();

      if (!targetRoom || !targetDate || !targetSlot) {
        return { hasOverlap: false };
      }

      let candidateBookings: RoomBooking[] = Array.isArray(bookings) ? [...bookings] : [];

      const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
      const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);

      if (shouldUseFirebase && db) {
        try {
          const q = query(
            collection(db, 'bookings'),
            where('roomName', '==', targetRoom),
            where('date', '==', targetDate)
          );
          const snap = await getDocs(q);
          const fsBookings: RoomBooking[] = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as RoomBooking));

          // Combine Firestore results with local state for maximum freshness
          const map = new Map<string, RoomBooking>();
          candidateBookings.forEach(b => { if (b && b.id) map.set(b.id, b); });
          fsBookings.forEach(b => { if (b && b.id) map.set(b.id, b); });
          candidateBookings = Array.from(map.values());
        } catch (err) {
          // Silent fallback to local candidate bookings
        }
      }

      for (const b of candidateBookings) {
        if (!b) continue;
        if (excludeBookingId && b.id === excludeBookingId) continue;
        if (b.status === 'rejected') continue;
        if ((b.roomName || '').trim() !== targetRoom || (b.date || '').trim() !== targetDate) continue;

        if (isTimeOverlapping(b.timeSlot || '', targetSlot)) {
          return { hasOverlap: true, conflictingBooking: b };
        }
      }

      return { hasOverlap: false };
    } catch {
      return { hasOverlap: false };
    }
  };

  const createBooking = async (
    roomName: string, 
    date: string, 
    timeSlot: string, 
    purpose: string, 
    studentIdInput?: string, 
    phone?: string, 
    studentNameInput?: string,
    emailInput?: string,
    pinCodeInput?: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำการจอง" };

    // Strict Overlap Validation Check (Boolean State)
    const overlap = await checkTimeOverlap(roomName, date, timeSlot);
    if (overlap.hasOverlap) {
      return { success: false, message: OVERLAP_ERROR_MESSAGE };
    }

    const nowIso = new Date().toISOString();
    const isTeacher = studentIdInput === 'TEACHER' || (purpose && purpose.includes('สำหรับการเรียนการสอนอาจารย์'));

    let subject = "";
    let extractedBookingTitle = "";
    let extractedBookingPurpose = "";

    if (purpose && purpose.includes("(")) {
      const match = purpose.match(/^(.*?)\s*\((.*?)\)/);
      if (match) {
        subject = match[1].trim();
        const inside = match[2].trim();
        const headerMatch = purpose.match(/หัวข้อ:\s*([^|)]+)/i);
        const purposeMatch = purpose.match(/วัตถุประสงค์:\s*([^|)]+)/i);
        if (headerMatch) extractedBookingTitle = headerMatch[1].trim();
        if (purposeMatch) extractedBookingPurpose = purposeMatch[1].trim();
        if (!extractedBookingPurpose && !headerMatch) {
          extractedBookingPurpose = inside.replace(/\(สำหรับการเรียนการสอนอาจารย์\)/g, '').trim();
        }
      } else {
        subject = purpose;
      }
    } else {
      subject = purpose || "";
    }

    if (isTeacher) {
      if (!extractedBookingTitle) extractedBookingTitle = "สำหรับการเรียนการสอน";
      if (!extractedBookingPurpose) extractedBookingPurpose = "สำหรับการเรียนการสอน";
    }

    const finalBookingTitle = extractedBookingTitle || (isTeacher ? "สำหรับการเรียนการสอน" : "จัดรายการ");
    const finalBookingPurpose = extractedBookingPurpose || (isTeacher ? "สำหรับการเรียนการสอน" : "ฝึกปฏิบัติการจัดรายการ");

    const finalEmail = (emailInput && emailInput.trim()) || currentUser.email || "";
    const finalPin = (pinCodeInput && pinCodeInput.trim()) || "1234";

    const bookingPayload: Omit<RoomBooking, 'id'> = {
      studentId: currentUser.uid || "student",
      studentName: studentNameInput && studentNameInput.trim() ? studentNameInput.trim() : (isTeacher ? "อาจารย์ผู้สอน" : (currentUser.name || "นักศึกษา")),
      studentEmail: finalEmail,
      email: finalEmail,
      pinCode: finalPin,
      roomName: roomName || "ห้องจัดรายการ 1",
      date: date || "",
      timeSlot: timeSlot || "08:30 - 09:30",
      purpose: purpose || (isTeacher ? "สำหรับการเรียนการสอน" : "จัดรายการ"),
      bookingTitle: finalBookingTitle,
      studentIdInput: studentIdInput || (isTeacher ? "TEACHER" : ""),
      phone: phone || "",
      status: 'approved',
      createdAt: nowIso,
      submittedAt: nowIso,
      updatedAt: nowIso,
      subject: subject || 'BRS311',
      bookingPurpose: finalBookingPurpose,
      userType: isTeacher ? 'teacher' : 'student'
    };

    const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
    const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);
    if (shouldUseFirebase) {
      try {
        await addDoc(collection(db, 'bookings'), bookingPayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'bookings');
      }
    } else {
      const current = getLocalStorageItem('bu_ca_bookings', DEFAULT_BOOKINGS) || [];
      const bookingWithId: RoomBooking = {
        id: 'book_' + Math.floor(Math.random() * 1000000),
        ...bookingPayload
      };
      const updated = [bookingWithId, ...current];
      saveLocalStorageItem('bu_ca_bookings', updated);
      setBookings(updated);
    }

    // Automatically trigger booking confirmation email safely
    if (finalEmail) {
      sendBookingEmail({
        toEmail: finalEmail,
        studentName: bookingPayload.studentName,
        userName: bookingPayload.studentName,
        name: bookingPayload.studentName,
        studentId: studentIdInput || (isTeacher ? "อาจารย์ประจำวิชา" : "-"),
        roomName: roomName || "ห้องจัดรายการ 1",
        date: date || new Date().toISOString().split('T')[0],
        bookingDate: date || new Date().toISOString().split('T')[0],
        timeSlot: timeSlot || "08:30 - 09:30",
        course_name: subject || 'BRS311',
        courseName: subject || 'BRS311',
        subject: subject || 'BRS311',
        bookingTitle: finalBookingTitle,
        title: finalBookingTitle,
        booking_title: finalBookingTitle,
        purpose: finalBookingPurpose,
        bookingPurpose: finalBookingPurpose,
        phone: phone || "-",
        pinCode: finalPin,
        userType: isTeacher ? 'teacher' : 'student',
        isTeacher
      }).catch(() => {
        // Safe swallow
      });
    }

    return { success: true };
  };

  const updateBookingStatus = async (id: string, status: 'approved' | 'rejected') => {
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };
    const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
    const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);
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

  const updateBooking = async (id: string, updates: Partial<RoomBooking>): Promise<{ success: boolean; message?: string }> => {
    const existing = bookings.find(b => b.id === id);
    const targetRoom = updates.roomName || existing?.roomName;
    const targetDate = updates.date || existing?.date;
    const targetSlot = updates.timeSlot || existing?.timeSlot;

    if (targetRoom && targetDate && targetSlot) {
      const overlap = await checkTimeOverlap(targetRoom, targetDate, targetSlot, id);
      if (overlap.hasOverlap) {
        return { success: false, message: OVERLAP_ERROR_MESSAGE };
      }
    }

    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
    const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);
    if (shouldUseFirebase && db) {
      try {
        const docRef = doc(db, 'bookings', id);
        await updateDoc(docRef, payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
      }
    }
    // Always sync local state
    setBookings(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...payload } : b);
      saveLocalStorageItem('bu_ca_bookings', updated);
      return updated;
    });

    return { success: true };
  };

  const deleteBooking = async (id: string) => {
    const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
    const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);
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

    const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
    const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);
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
    const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
    const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);
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
    const isMockSession = currentUser && (!auth?.currentUser || currentUser.uid !== auth.currentUser.uid);
    const shouldUseFirebase = !!(isFirebaseConfigured && db && !isMockSession);
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

  const addCourse = async (code: string, name: string) => {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCourses(prev => {
      const updated = [...prev, newCourse];
      saveLocalStorageItem('bu_ca_courses', updated);
      return updated;
    });

    if (db) {
      try {
        await setDoc(doc(db, 'courses', newCourse.id), {
          code: newCourse.code,
          name: newCourse.name,
          createdAt: newCourse.createdAt,
          updatedAt: newCourse.updatedAt
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `courses/${newCourse.id}`);
      }
    }
  };

  const updateCourse = async (id: string, code: string, name: string) => {
    setCourses(prev => {
      const updated = prev.map(c => c.id === id ? {
        ...c,
        code: code.trim(),
        name: name.trim(),
        updatedAt: new Date().toISOString()
      } : c);
      saveLocalStorageItem('bu_ca_courses', updated);
      return updated;
    });

    if (db) {
      try {
        await updateDoc(doc(db, 'courses', id), {
          code: code.trim(),
          name: name.trim(),
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `courses/${id}`);
      }
    }
  };

  const deleteCourse = async (id: string) => {
    setCourses(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveLocalStorageItem('bu_ca_courses', updated);
      return updated;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, 'courses', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
      }
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
    downloadAllBookingsReportCSV,
    seedDemoData,
    isFirebaseConfigured,
    bookings,
    programs,
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    checkTimeOverlap,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    createProgram,
    updateProgramStatus,
    deleteProgram,
    roomImages,
    updateRoomImages,
    sendBookingEmail,
    sendPinReminderEmail
  };
}
