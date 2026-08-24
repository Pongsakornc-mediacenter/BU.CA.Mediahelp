/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CheckCircle2, Sparkles, X } from 'lucide-react';

export type SuccessModalType = 'booking' | 'edit' | 'custom';

export interface SuccessNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: SuccessModalType;
  title?: string;
  message?: string;
  autoCloseDelay?: number; // Delay in ms after transitioning to success state (default: 2500ms)
  onCompleted?: () => void;
}

export const SuccessNotificationModal: React.FC<SuccessNotificationModalProps> = ({
  isOpen,
  onClose,
  type = 'booking',
  title,
  message,
  autoCloseDelay = 2500,
  onCompleted
}) => {
  const [phase, setPhase] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    let loadingTimer: NodeJS.Timeout;
    let autoCloseTimer: NodeJS.Timeout;

    if (isOpen) {
      // Phase 1: Start in loading state (1.5 seconds)
      setPhase('loading');

      loadingTimer = setTimeout(() => {
        // Phase 2: Smooth transition to Success State (2.5 seconds)
        setPhase('success');

        // Auto close after 2.5s in success state
        autoCloseTimer = setTimeout(() => {
          if (onCompleted) {
            onCompleted();
          }
          onClose();
        }, autoCloseDelay);
      }, 1500);
    } else {
      setPhase('loading');
    }

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [isOpen, autoCloseDelay, onClose, onCompleted]);

  // Derived Title & Message
  const displayTitle = title || (type === 'booking' ? 'ทำรายการสำเร็จ!' : 'อัปเดตข้อมูลสำเร็จ!');
  const displayMessage = message || (
    type === 'booking' 
      ? 'ระบบได้บันทึกข้อมูลการจองของคุณเรียบร้อยแล้ว' 
      : 'แก้ไขวันและเวลาการใช้งานห้องเรียบร้อยแล้ว'
  );

  const handleManualClose = () => {
    if (onCompleted) {
      onCompleted();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="success-notification-modal-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto select-none"
          onClick={phase === 'success' ? handleManualClose : undefined}
        >
          <motion.div
            id="success-notification-modal-card"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { type: 'spring', stiffness: 380, damping: 24 } 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: -15, 
              transition: { duration: 0.25, ease: 'easeInOut' } 
            }}
            className="relative w-full max-w-sm bg-[#16161a] border border-[#2d2d34] rounded-2xl p-6 sm:p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div 
              className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
                phase === 'loading' ? 'bg-amber-500/15' : 'bg-emerald-500/25'
              }`} 
            />
            <div 
              className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
                phase === 'loading' ? 'bg-blue-500/15' : 'bg-teal-500/20'
              }`} 
            />

            {/* Quick close icon button (enabled in success state) */}
            {phase === 'success' && (
              <button
                type="button"
                id="close-success-modal-btn"
                onClick={handleManualClose}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Micro-interaction Container */}
            <div className="relative mx-auto mb-5 flex items-center justify-center h-20">
              <AnimatePresence mode="wait">
                {phase === 'loading' ? (
                  <motion.div
                    key="loader-phase"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.2 } }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Outer glowing spinner wheel */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 rounded-full border-4 border-slate-700/50 border-t-amber-400 border-r-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                    />

                    {/* Inner counter-rotating ring for mechanical wheel feel */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute w-10 h-10 rounded-full border-2 border-dashed border-amber-300/40"
                    />

                    {/* Center hub */}
                    <div className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-phase"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: [0.5, 1.15, 0.96, 1], 
                      opacity: 1,
                      transition: { duration: 0.5, ease: 'easeOut' }
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Pulsing Aura */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.4, 1.2], opacity: [0.6, 0, 0] }}
                      transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity }}
                      className="absolute w-20 h-20 rounded-full bg-emerald-500/40 blur-md"
                    />

                    {/* Green Success Badge */}
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.55)] border border-emerald-300/40">
                      {/* Animated SVG Checkmark */}
                      <svg 
                        className="w-9 h-9 text-slate-950" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3.2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
                        />
                      </svg>
                    </div>

                    {/* Little sparkle accent */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.35, duration: 0.3 }}
                      className="absolute -top-1 -right-1 text-emerald-300"
                    >
                      <Sparkles className="w-5 h-5 fill-emerald-300 animate-pulse" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dynamic Text Information */}
            <AnimatePresence mode="wait">
              {phase === 'loading' ? (
                <motion.div
                  key="loading-text"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  <h3 className="text-base font-bold text-slate-200">
                    กำลังบันทึกข้อมูล...
                  </h3>
                  <p className="text-xs text-slate-400 font-normal">
                    กรุณารอสักครู่ ระบบกำลังประมวลผล
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="success-text"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="space-y-1.5"
                >
                  <h3 className="text-xl font-black text-emerald-400 tracking-tight">
                    {displayTitle}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-[280px] mx-auto">
                    {displayMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions and Progress Bar */}
            {phase === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.25 }}
                className="mt-5 space-y-3"
              >
                <button
                  type="button"
                  id="confirm-success-modal-btn"
                  onClick={handleManualClose}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1.5 text-sm"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ตกลง</span>
                </button>

                {/* Auto close progress indicator */}
                <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: autoCloseDelay / 1000, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  />
                </div>
              </motion.div>
            ) : (
              <div className="mt-5 h-1 w-full bg-slate-800/40 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full w-1/2 bg-amber-400/80 rounded-full"
                />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
