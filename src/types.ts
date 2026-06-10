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

export interface KnowledgeTip {
  q: string;
  a: string;
}

export interface KnowledgeCabinet {
  id: string;
  icon: string;
  title: string;
  accent: string;
  badgeBg: string;
  tag: string;
  summary: string;
  imageUrl?: string;
  tips: KnowledgeTip[];
  createdAt?: string;
  updatedAt?: string;
}

