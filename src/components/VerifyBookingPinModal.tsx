/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, AlertCircle, Mail, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { RoomBooking } from '../types';

interface VerifyBookingPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: RoomBooking | null;
  actionType: 'edit' | 'delete';
  onSuccess: () => void;
}

export const VerifyBookingPinModal: React.FC<VerifyBookingPinModalProps> = ({
  isOpen,
  onClose,
  booking,
  actionType,
  onSuccess
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
  const bookingEmail = booking.email || booking.studentEmail || 'pongsakorn.c@bu.ac.th';

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
      onSuccess();
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

  const handleForgotPin = () => {
    setIsSendingMail(true);
    setTimeout(() => {
      setIsSendingMail(false);
      setForgotPinNotice(
        `✉️ ระบบได้ส่งรหัส PIN ไปยังอีเมล ${bookingEmail} เรียบร้อยแล้ว (รหัส PIN: ${expectedPin})`
      );
    }, 600);
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
          className={`relative w-full max-w-md bg-[#18181a] border ${
            isEdit ? 'border-orange-500/40 ring-1 ring-orange-500/30' : 'border-red-500/40 ring-1 ring-red-500/30'
          } rounded-2xl p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] cursor-default my-auto text-white`}
          onClick={(e) => e.stopPropagation()}
          id="verify_booking_pin_content"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#2d2d34]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                isEdit ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-extrabold font-display ${
                  isEdit ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {isEdit ? '🔐 ยืนยัน PIN เพื่อแก้ไข / ย้ายวันเวลา' : '🔐 ยืนยัน PIN เพื่อยกเลิก / ลบการจอง'}
                </h3>
                <p className="text-[11.5px] text-slate-400">
                  กรุณากรอกรหัส PIN กลุ่ม 4 หลักที่ระบุไว้ตอนจอง
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

          {/* Booking Summary Box */}
          <div className="mt-4 p-3 bg-[#232328] border border-[#34343d] rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">ห้องที่จอง:</span>
              <span className="font-extrabold text-slate-200">{booking.roomName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">วันและเวลา:</span>
              <span className="font-bold text-amber-300 font-mono">{booking.date} ({booking.timeSlot})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">ผู้จอง / อีเมล:</span>
              <span className="font-bold text-slate-300 truncate max-w-[200px]" title={bookingEmail}>
                {booking.studentNameInput || booking.studentName} ({bookingEmail})
              </span>
            </div>
          </div>

          {/* PIN Input Digits */}
          <div className="mt-5 space-y-3">
            <label className="text-xs font-bold text-slate-300 text-center block">
              🔑 กรอกรหัส PIN 4 หลัก
            </label>
            <div className="flex justify-center items-center gap-3">
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
                  className={`w-12 h-14 bg-[#0e0e11] border-2 rounded-xl text-center text-2xl font-black text-white focus:outline-none transition-all font-mono shadow-inner ${
                    errorMsg 
                      ? 'border-red-500 bg-red-950/20 text-red-300 focus:border-red-400' 
                      : digit 
                        ? isEdit ? 'border-orange-500 bg-orange-950/20 focus:border-orange-400' : 'border-red-500 bg-red-950/20 focus:border-red-400'
                        : 'border-[#3f3f46] focus:border-indigo-500 focus:bg-[#1a1a24]'
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
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg text-center"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Forgot PIN notification */}
            {forgotPinNotice && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold leading-relaxed">{forgotPinNotice}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = expectedPin.slice(0, 4).split('');
                        setPinDigits(digits);
                        setErrorMsg('');
                        inputRefs[3].current?.focus();
                      }}
                      className="text-[11px] font-extrabold text-amber-300 hover:text-amber-200 underline cursor-pointer inline-block"
                    >
                      👉 คลิกที่นี่เพื่อกรอกรหัส {expectedPin} อัตโนมัติ
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-5 space-y-3">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-[#232328] hover:bg-[#2d2d34] text-slate-300 font-extrabold rounded-xl py-2.5 text-xs transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={currentEnteredPin.length < 4}
                className={`flex-1 font-black rounded-xl py-2.5 text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isEdit
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-orange-500/20'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/20'
                }`}
              >
                <span>ยืนยันรหัส PIN</span>
              </button>
            </div>

            {/* Forgot PIN Trigger Button */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleForgotPin}
                disabled={isSendingMail}
                className="text-xs text-slate-400 hover:text-indigo-300 underline font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {isSendingMail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังส่งข้อมูลไปยังอีเมล...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>ลืมรหัส PIN? (ส่งรหัสแจ้งเตือนไปยังอีเมลผู้จอง)</span>
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
