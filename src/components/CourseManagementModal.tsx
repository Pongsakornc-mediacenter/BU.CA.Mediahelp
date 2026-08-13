/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Plus, Edit2, Trash2, Check, X, Search, Sparkles, BookMarked, AlertCircle } from 'lucide-react';
import { Course } from '../types';

interface CourseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddCourse: (code: string, name: string) => Promise<void>;
  onUpdateCourse: (id: string, code: string, name: string) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
}

export function CourseManagementModal({
  isOpen,
  onClose,
  courses = [],
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse
}: CourseManagementModalProps) {
  // Add Course State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      showNotification('กรุณากรอกทั้งรหัสวิชาและชื่อวิชาให้ครบถ้วนค่ะ', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCourse(newCode.trim(), newName.trim());
      setNewCode('');
      setNewName('');
      showNotification(`🎉 เพิ่มรายวิชา ${newCode.trim().toUpperCase()} สำเร็จเรียบร้อยค่ะ!`);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการบันทึกรายวิชา', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (course: Course) => {
    setEditingId(course.id);
    setEditCode(course.code);
    setEditName(course.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCode('');
    setEditName('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editCode.trim() || !editName.trim()) {
      showNotification('กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึกค่ะ', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateCourse(id, editCode.trim(), editName.trim());
      setEditingId(null);
      showNotification('✨ อัปเดตข้อมูลรายวิชาเรียบร้อยแล้วค่ะ!');
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการอัปเดตข้อมูลรายวิชา', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    try {
      await onDeleteCourse(id);
      setDeletingId(null);
      showNotification(`🗑️ ลบรายวิชา ${code} ออกจากระบบเรียบร้อยแล้วค่ะ`);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการลบรายวิชา', 'error');
    }
  };

  const filteredCourses = courses.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop click to close */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#141418] border border-[#2b2b36] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          id="course_management_modal_content"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-[#141418] border-b border-[#2b2b36] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  ⚙️ จัดการรายวิชา (Course Management)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  เพิ่ม แก้ไข และลบรายวิชาสำหรับตัวเลือกในแบบฟอร์มจองห้องจัดรายการและสตูดิโอ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-[#1e1e26] hover:bg-[#282834] rounded-xl transition-all cursor-pointer border border-[#2d2d38]"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert / Feedback Toast */}
          <AnimatePresence>
            {feedbackMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/15 border-b border-rose-500/30 text-rose-300'
                }`}
              >
                {feedbackMsg.type === 'success' ? <Sparkles className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{feedbackMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
            
            {/* Form Section: Add New Course */}
            <div className="bg-[#1a1a22] border border-[#2d2d3a] p-4 rounded-xl shadow-inner">
              <h4 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-400" />
                เพิ่มรายวิชาใหม่เข้าสู่ระบบ
              </h4>

              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    รหัสวิชา (Course Code) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="เช่น BRS311, CA102"
                    className="w-full h-10 bg-[#0e0e12] border border-[#2e2e3a] rounded-xl px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono font-bold"
                    required
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    ชื่อรายวิชา (Course Name) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น การจัดรายการวิทยุกระจายเสียง"
                    className="w-full h-10 bg-[#0e0e12] border border-[#2e2e3a] rounded-xl px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-semibold"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmitting ? "กำลังบันทึก..." : "เพิ่มรายวิชา"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Table Section: Course List */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200">
                    รายการวิชาทั้งหมดในระบบ ({courses.length} วิชา)
                  </h4>
                </div>

                {/* Search box */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหารหัสวิชาหรือชื่อวิชา..."
                    className="w-full h-8 bg-[#181820] border border-[#2c2c38] rounded-lg pl-8 pr-3 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-[#16161c] border border-[#2a2a36] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#1f1f2a] text-slate-400 text-[10.5px] uppercase tracking-wider border-b border-[#2c2c3a]">
                        <th className="py-2.5 px-3.5 w-12 text-center font-extrabold">#</th>
                        <th className="py-2.5 px-3.5 w-36 font-extrabold">รหัสวิชา</th>
                        <th className="py-2.5 px-3.5 font-extrabold">ชื่อรายวิชา</th>
                        <th className="py-2.5 px-3.5 w-36 text-center font-extrabold">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262632]">
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                            {searchQuery ? "ไม่พบวิชาที่ตรงกับการค้นหา" : "ยังไม่มีรายวิชาในระบบ กรุณาเพิ่มวิชาใหม่ด้านบน"}
                          </td>
                        </tr>
                      ) : (
                        filteredCourses.map((course, index) => {
                          const isEditing = editingId === course.id;
                          const isDeleting = deletingId === course.id;

                          return (
                            <tr key={course.id} className="hover:bg-[#1a1a24] transition-colors group">
                              {/* Index */}
                              <td className="py-3 px-3.5 text-center text-slate-500 font-mono font-semibold text-[11px]">
                                {index + 1}
                              </td>

                              {/* Course Code */}
                              <td className="py-3 px-3.5">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value)}
                                    className="w-full bg-[#0d0d11] border border-purple-500/70 rounded-lg px-2 py-1 text-xs text-purple-300 font-mono font-bold focus:outline-none"
                                  />
                                ) : (
                                  <span className="inline-block px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-800/40 rounded-md font-mono font-bold text-xs">
                                    {course.code}
                                  </span>
                                )}
                              </td>

                              {/* Course Name */}
                              <td className="py-3 px-3.5">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-[#0d0d11] border border-purple-500/70 rounded-lg px-2 py-1 text-xs text-white font-medium focus:outline-none"
                                  />
                                ) : (
                                  <span className="text-slate-200 font-semibold text-xs">
                                    {course.name}
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3.5 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEdit(course.id)}
                                      disabled={isUpdating}
                                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer shadow-xs text-[10px] font-bold flex items-center gap-1"
                                      title="บันทึก"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>บันทึก</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEdit}
                                      className="p-1.5 bg-[#282834] hover:bg-[#323242] text-slate-300 rounded-lg transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                                      title="ยกเลิก"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>ยกเลิก</span>
                                    </button>
                                  </div>
                                ) : isDeleting ? (
                                  <div className="flex items-center justify-center gap-1.5 bg-rose-950/40 border border-rose-800/40 p-1 rounded-lg">
                                    <span className="text-[10px] font-bold text-rose-300">ยืนยันลบ?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(course.id, course.code)}
                                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      ลบ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingId(null)}
                                      className="px-2 py-0.5 bg-[#282834] text-slate-300 text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(course)}
                                      className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                      title="แก้ไขรายวิชา"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingId(course.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                      title="ลบรายวิชา"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 bg-[#111115] border-t border-[#2b2b36] flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>ข้อมูลจะเชื่อมโยงกับฐานข้อมูล Firestore เรียลไทม์</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#22222c] hover:bg-[#2c2c3a] text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
