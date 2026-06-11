/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HelpCategory = 'camera' | 'microphone' | 'lighting' | 'editing' | 'other';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'admin';
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  category: HelpCategory;
  title: string;
  description: string;
  imageUrl?: string; // Base64 compressed image string or url
  status: 'pending' | 'inprogress' | 'answered' | 'closed';
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  replyText?: string;
  repliedBy?: string;
  repliedAt?: string;
  messages?: ChatMessage[];
  rating?: number; // 1 to 5 stars
  ratingFeedback?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  className: string;
  checkedInAt: string; // ISO String
  status: 'on_time' | 'late' | 'excused';
  points: number; // class scores
  deviceMeta?: string; // Platform info
}

export interface ClassSession {
  id: string;
  name: string;
  instructor: string;
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  dayOfWeek: string; // Monday, Tuesday...
  code: string; // Access validation code
  pointsWeight: number; // e.g. 10 points
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  joinedAt: string;
}

export interface CameraPreset {
  name: string;
  iso: string;
  shutterSpeed: string;
  aperture: string;
  whiteBalance: string;
  description: string;
  tip: string;
  situation: string;
}

export interface RoomBooking {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:00 - 12:00"
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface BroadcastProgram {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  programName: string;
  hosts: string;
  category: 'radio' | 'tv' | 'podcast' | 'other';
  roomName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 - 11:30"
  status: 'upcoming' | 'active' | 'completed';
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

