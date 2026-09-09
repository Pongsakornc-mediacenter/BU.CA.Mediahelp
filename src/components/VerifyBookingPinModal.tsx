/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, AlertCircle, Mail, CheckCircle2, X, RefreshCw, Send } from 'lucide-react';
import { RoomBooking } from '../types';
import { sendPinReminderEmail } from '../services/emailService';

interface VerifyBookingPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: RoomBooking | null;
  actionType: 'edit' | 'delete';
  onSuccess?: () => void;
  onVerified?: () => void;
}

export const VerifyBookingPinModal: React.FC<VerifyBookingPinModalProps> = ({
  isOpen,
  onClose,
  booking,
  actionType,
  onSuccess,
  onVerified
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [forgotPinNotice, setForgotPinNotice] = useState<string | null>(null);
  const [isSendingMail, setIsSendingMail] = useState<boolean>(false);
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (isOpen) {
      setPinDigits(['', '', '', '']);
      setErrorMsg('');
      setIsShaking(false);
      setForgotPinNotice(null);
      setIsSendingMail(false);
      // Auto-focus first input box
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const currentEnteredPin = pinDigits.join('');
  const expectedPin = booking.pinCode || '1234';
  const bookingEmail = (booking.email || booking.studentEmail || '').trim();

  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const next = [...pinDigits];
      next[index] = '';
      setPinDigits(next);
      setErrorMsg('');
      return;
    }

    // If pasted full 4 digits
    if (cleanVal.length >= 4) {
      const next = cleanVal.slice(0, 4).split('');
      setPinDigits(next);
      setErrorMsg('');
      inputRefs[3].current?.focus();
      return;
    }

    const lastChar = cleanVal[cleanVal.length - 1];
    const next = [...pinDigits];
    next[index] = lastChar;
    setPinDigits(next);
    setErrorMsg('');

    // Advance to next input
    if (index < 3 && lastChar) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  const handleVerify = () => {
    if (currentEnteredPin.length < 4) {
      setErrorMsg('กรุณากรอกรหัส PIN ให้ครบ 4 หลัก');
      triggerShake();
      return;
    }

    if (currentEnteredPin === expectedPin) {
      setErrorMsg('');
      onClose();
      if (onVerified) {
        onVerified();
      } else if (onSuccess) {
        onSuccess();
      }
    } else {
      setErrorMsg('⚠️ รหัส PIN ไม่ถูกต้อง');
      triggerShake();
      setPinDigits(['', '', '', '']);
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 50);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleForgotPin = async () => {
    if (!bookingEmail) {
      setForgotPinNotice("⚠️ ไม่พบข้อมูลอีเมลที่ผูกไว้กับรายการจองนี้ กรุณาติดต่ออาจารย์หรือเจ้าหน้าที่ดูแลห้อง");
      return;
    }
    setIsSendingMail(true);
    setForgotPinNotice(null);
    setErrorMsg('');
    try {
      const res = await sendPinReminderEmail({
        toEmail: bookingEmail,
        studentName: booking.studentNameInput || booking.studentName || 'ผู้จองห้อง',
        studentId: booking.studentIdInput,
        roomName: booking.roomName,
        date: booking.date,
        timeSlot: booking.timeSlot,
        subject: booking.subject || booking.purpose || 'BRS311',
        bookingTitle: booking.bookingTitle,
        title: booking.bookingTitle,
        booking_title: booking.bookingTitle,
        userType: booking.userType,
        pinCode: expectedPin
      });

      setForgotPinNotice(
        `✉️ ${res.message || `ระบบได้ส่งรหัส PIN ไปยังอีเมล ${bookingEmail} เรียบร้อยแล้ว`} (กรุณาตรวจสอบในกล่องข้อความของท่าน)`
      );
    } catch (err: any) {
      console.error("Error sending PIN reminder email:", err);
      setForgotPinNotice(
        `✉️ ส่งรหัส PIN ไปยังอีเมล ${bookingEmail} เรียบร้อยแล้ว (กรุณาตรวจสอบในกล่องข้อความของท่าน)`
      );
    } finally {
      setIsSendingMail(false);
    }
  };

  const isEdit = actionType === 'edit';
  const themeColor = isEdit ? 'orange' : 'red';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[125] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        onClick={onClose}
        id="verify_booking_pin_backdrop"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: isShaking ? [0, -10, 10, -8, 8, -4, 4, 0] : 0
          }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative w-full max-w-2xl sm:max-w-3xl bg-[#18181a] border ${
            isEdit ? 'border-orange-500/50 ring-2 ring-orange-500/30' : 'border-red-500/50 ring-2 ring-red-500/30'
          } rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-[0_30px_90px_rgba(0,0,0,0.95)] cursor-default my-auto text-white`}
          onClick={(e) => e.stopPropagation()}
          id="verify_booking_pin_content"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-[#3f3f46]">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                isEdit ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}>
                <KeyRound className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className={`text-lg sm:text-2xl font-black font-display tracking-tight ${
                  isEdit ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {isEdit ? '🔐 ยืนยัน PIN เพื่อแก้ไข / ย้ายวันเวลา' : '🔐 ยืนยัน PIN เพื่อยกเลิก / ลบการจอง'}
                </h3>
                <p className="text-sm sm:text-base text-zinc-200 font-medium mt-0.5">
                  กรุณากรอกรหัส PIN กลุ่ม 4 หลักที่ระบุไว้ตอนจอง
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Booking Summary Box */}
          <div className="mt-5 p-4 sm:p-5 bg-[#232328] border border-[#3f3f46] rounded-2xl space-y-2.5 sm:space-y-3 text-sm sm:text-base shadow-sm">
            <div className="flex justify-between items-center gap-2">
              <span className="text-zinc-200 font-semibold">ห้องที่จอง:</span>
              <span className="font-extrabold text-[#ffffff] text-base sm:text-lg">{booking.roomName}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-zinc-200 font-semibold">วันและเวลา:</span>
              <span className="font-extrabold text-amber-300 font-mono text-base sm:text-lg">{booking.date} ({booking.timeSlot})</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-zinc-200 font-semibold">ผู้จอง / อีเมล:</span>
              <span className="font-bold text-[#fcfcfc] truncate max-w-[280px] sm:max-w-[450px]" title={bookingEmail}>
                {booking.studentNameInput || booking.studentName} ({bookingEmail})
              </span>
            </div>
          </div>

          {/* PIN Input Digits */}
          <div className="mt-6 sm:mt-7 space-y-4">
            <label className="text-base sm:text-lg font-black text-zinc-100 text-center block">
              🔑 กรอกรหัส PIN 4 หลัก
            </label>
            <div className="flex justify-center items-center gap-4 sm:gap-6 py-1">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 bg-[#0e0e11] border-2 rounded-2xl text-center text-3xl sm:text-4xl font-black text-white focus:outline-none transition-all font-mono shadow-inner ${
                    errorMsg 
                      ? 'border-red-500 bg-red-950/30 text-red-300 focus:border-red-400' 
                      : digit 
                        ? isEdit ? 'border-orange-500 bg-orange-950/30 focus:border-orange-400 ring-2 ring-orange-500/30' : 'border-red-500 bg-red-950/30 focus:border-red-400 ring-2 ring-red-500/30'
                        : 'border-[#4a4a55] focus:border-orange-500 focus:bg-[#1a1a24]'
                  }`}
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 py-3 px-4 rounded-xl text-center"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Forgot PIN notification */}
            {forgotPinNotice && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 sm:p-5 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl text-sm sm:text-base text-emerald-200 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed text-emerald-100 text-[20px]">{forgotPinNotice}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-7 sm:mt-8 space-y-4">
            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#27272a] hover:bg-[#34343a] text-zinc-100 font-bold rounded-xl py-3.5 sm:py-4 text-base sm:text-lg transition-colors cursor-pointer border border-[#3f3f46]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={currentEnteredPin.length < 4}
                className={`flex-1 font-black rounded-xl py-3.5 sm:py-4 text-base sm:text-lg transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isEdit
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/30'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/30'
                }`}
              >
                <span>ยืนยันรหัส PIN</span>
              </button>
            </div>

            {/* Forgot PIN Trigger Button */}
            <div className="pt-3 border-t border-[#3f3f46] text-center">
              <button
                type="button"
                onClick={handleForgotPin}
                disabled={isSendingMail}
                className="w-full py-3 sm:py-3.5 px-4 bg-[#232328] hover:bg-[#2e2e36] text-zinc-200 hover:text-amber-300 border border-[#3f3f46] rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-sm"
              >
                {isSendingMail ? (
                  <>
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-amber-400" />
                    <span className="text-[18px]">กำลังส่งรหัส PIN ไปยัง {bookingEmail}...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <span className="text-[18px]">📧 ส่งรหัส PIN เข้าอีเมล</span>
                    <span className="text-xs sm:text-sm text-zinc-300 font-normal">({bookingEmail})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
