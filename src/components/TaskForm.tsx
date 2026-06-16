import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, BookOpen, GraduationCap, Presentation, Clock } from 'lucide-react';
import { Task, TaskType, SUBJECTS } from '../types';
import { cn } from '../lib/utils';
import { format, startOfToday } from 'date-fns';

interface TaskFormProps {
  initialTask?: Task;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onClose: () => void;
}

export function TaskForm({ initialTask, onSave, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [type, setType] = useState<TaskType>(initialTask?.type || 'homework');
  const [subject, setSubject] = useState(() => {
    if (!initialTask?.subject) return '';
    if (SUBJECTS.includes(initialTask.subject as any)) return initialTask.subject;
    return 'Other';
  });
  const [customSubject, setCustomSubject] = useState(() => {
    if (initialTask?.subject && !SUBJECTS.includes(initialTask.subject as any)) return initialTask.subject;
    return '';
  });
  const [description, setDescription] = useState(initialTask?.description || '');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState(initialTask?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      type,
      subject: subject === 'Other' ? customSubject.trim() || undefined : subject || undefined,
      description: description.trim() || undefined,
      dueDate,
      notes: notes.trim() || undefined,
    });
  };

  const types: { value: TaskType; label: string; icon: React.ReactNode }[] = [
    { value: 'homework', label: 'Homework', icon: <BookOpen size={16} /> },
    { value: 'study', label: 'Study', icon: <Clock size={16} /> },
    { value: 'project', label: 'Project', icon: <Presentation size={16} /> },
    { value: 'exam', label: 'Exam', icon: <GraduationCap size={16} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '100%', scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5 px-6">
          <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">{initialTask ? 'Edit Task' : 'New Task'}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              What needs to be done?
            </label>
            <input
              autoFocus
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Math Chapter 4 Exercises"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium appearance-none"
            >
              <option value="">Select subject...</option>
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            {subject === 'Other' && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter custom subject..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
                />
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Task Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all',
                    type === t.value
                      ? cn('bg-[#1a1a1a] text-white border-[#1a1a1a]')
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {t.icon}
                  <span className="text-[11px] font-medium tracking-wide">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <Calendar size={18} />
              </div>
              <input
                id="date"
                type="date"
                required
                value={dueDate}
                min={format(startOfToday(), 'yyyy-MM-dd')}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-11 px-4 py-3 text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Project Definition / Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add project instructions, notes, or details..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium resize-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full rounded-full bg-[#1a1a1a] px-4 py-3.5 text-center font-medium text-white transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 active:scale-[0.98]"
            >
              Save Task
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
