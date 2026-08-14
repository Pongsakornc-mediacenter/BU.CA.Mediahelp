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
          className="relative w-full max-w-md bg-[#18181a] border border-red-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] cursor-default my-auto text-white ring-1 ring-red-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#3f3f46]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-xl">
                🗑️
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-red-400 font-display">
                  ยืนยันการยกเลิกการจอง
                </h3>
                <p className="text-[11px] text-slate-400">
                  ลบรายการจองออกจากระบบและคืนช่องเวลาบนตาราง
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Booking details preview */}
          <div className="mt-4 p-3.5 bg-[#232328] border border-[#3f3f46] rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">ห้อง:</span>
              <span className="font-extrabold text-orange-400">{booking.roomName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">วันที่:</span>
              <span className="font-bold text-slate-200">{booking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ช่วงเวลา:</span>
              <span className="font-bold text-slate-200">{booking.timeSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">วิชา/หัวข้อ:</span>
              <span className="font-bold text-slate-200 truncate max-w-[200px]">{displaySubject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ผู้จอง:</span>
              <span className="font-bold text-slate-200">{displayName}</span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-3.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-300 font-medium leading-relaxed">
              เมื่อกดยืนยัน รายการจองนี้จะถูกลบออกจากฐานข้อมูล Firestore ทันที และช่องเวลานี้จะเปลี่ยนเป็น <span className="font-bold text-white underline">"ว่าง"</span> เพื่อให้ผู้ใช้อื่นสามารถจองต่อได้
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 mt-2 border-t border-[#3f3f46]">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 bg-[#27272a] hover:bg-[#323238] text-slate-300 font-bold rounded-xl py-2.5 text-xs transition-colors cursor-pointer"
            >
              ยกเลิก (ไม่ลบ)
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold rounded-xl py-2.5 text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังลบ...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
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
