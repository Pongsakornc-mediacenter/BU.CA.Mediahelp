/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { RoomBooking } from '../types';

interface DeleteBookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: RoomBooking | null;
  onConfirmDelete: (id: string) => Promise<void>;
  onAfterDeleteSuccess?: () => void;
}

export const DeleteBookingConfirmModal: React.FC<DeleteBookingConfirmModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirmDelete,
  onAfterDeleteSuccess
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirmDelete(booking.id);
      if (onAfterDeleteSuccess) {
        onAfterDeleteSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert("เกิดข้อผิดพลาดในการลบรายการจอง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleting(false);
    }
  };

  const displayName = booking.studentNameInput || booking.studentName || booking.studentIdInput || "ไม่ระบุชื่อ";
  const displaySubject = booking.subject || booking.purpose || "จองห้องจัดรายการ";

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl sm:max-w-2xl bg-[#18181a] border border-red-500/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] cursor-default my-auto text-white ring-2 ring-red-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-[#3f3f46]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-2xl shadow-sm">
                🗑️
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-red-400 font-display tracking-tight">
                  ยืนยันการยกเลิกการจอง
                </h3>
                <p className="text-sm sm:text-base text-zinc-200 font-medium mt-0.5">
                  ลบรายการจองออกจากระบบและคืนช่องเวลาบนตาราง
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Booking details preview */}
          <div className="mt-5 p-4 sm:p-5 bg-[#232328] border border-[#3f3f46] rounded-2xl space-y-2.5 sm:space-y-3 text-sm sm:text-base shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-200 font-semibold">ห้อง:</span>
              <span className="font-extrabold text-orange-400 text-base sm:text-lg">{booking.roomName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-200 font-semibold">วันที่:</span>
              <span className="font-bold text-white font-mono">{booking.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-200 font-semibold">ช่วงเวลา:</span>
              <span className="font-bold text-amber-300 font-mono">{booking.timeSlot}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-200 font-semibold">วิชา/หัวข้อ:</span>
              <span className="font-bold text-white truncate max-w-[240px] sm:max-w-[360px]">{displaySubject}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-200 font-semibold">ผู้จอง:</span>
              <span className="font-bold text-white">{displayName}</span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-4 p-3.5 sm:p-4 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-200 font-medium leading-relaxed">
              เมื่อกดยืนยัน รายการจองนี้จะถูกลบออกจากฐานข้อมูล Firestore ทันที และช่องเวลานี้จะเปลี่ยนเป็น <span className="font-bold text-white underline">"ว่าง"</span> เพื่อให้ผู้ใช้อื่นสามารถจองต่อได้
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3.5 sm:gap-4 pt-5 mt-3 border-t border-[#3f3f46]">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 bg-[#27272a] hover:bg-[#323238] text-zinc-100 font-bold rounded-xl py-3.5 text-base sm:text-lg transition-colors cursor-pointer border border-[#3f3f46]"
            >
              ยกเลิก (ไม่ลบ)
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold rounded-xl py-3.5 text-base sm:text-lg transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังลบ...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>ยืนยันยกเลิกและลบ</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
