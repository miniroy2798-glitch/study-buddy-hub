import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Clock, GraduationCap, Presentation, CheckCircle2, Circle } from 'lucide-react';
import { Task, TaskType } from '../types';
import { cn } from '../lib/utils';
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay } from 'date-fns';

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const isCompleted = task.completed;
  
  const getTypeConfig = (type: TaskType) => {
    switch (type) {
      case 'homework':
        return { icon: <BookOpen size={13} />, label: 'Homework' };
      case 'study':
        return { icon: <Clock size={13} />, label: 'Study' };
      case 'project':
        return { icon: <Presentation size={13} />, label: 'Project' };
      case 'exam':
        return { icon: <GraduationCap size={13} />, label: 'Exam' };
    }
  };

  const config = getTypeConfig(task.type);
  const dateObj = parseISO(task.dueDate);
  const isOverdue = !isCompleted && isPast(startOfDay(dateObj)) && !isToday(startOfDay(dateObj));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -1 }}
      className={cn(
        'group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200',
        isCompleted 
          ? 'bg-[#FDFDFD] border-gray-100 opacity-70' 
          : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
      )}
    >
      <button 
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-0.5 flex-shrink-0 transition-colors duration-300",
          isCompleted ? "text-gray-900" : "text-gray-300 hover:text-gray-900 group-hover:text-gray-400"
        )}
      >
        {isCompleted ? <CheckCircle2 size={22} className="fill-gray-100" /> : <Circle size={22} strokeWidth={2} />}
      </button>

      <div className="flex-1 min-w-0 pb-0.5">
        <h3 className={cn(
          "font-medium text-[15px] mb-1.5 transition-all truncate",
          isCompleted ? "text-gray-400 line-through decoration-gray-300" : "text-gray-900"
        )}>
          {task.title}
        </h3>
        
        {task.description && !isCompleted && (
          <p className="text-[13px] text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors",
            isCompleted ? "text-gray-400" : "text-gray-600"
          )}>
            {config.icon}
            <span>{config.label}</span>
          </span>
          
          <span className="text-gray-300 text-[10px]">•</span>

          {task.subject && (
            <>
              <span className={cn(
                "text-[12px] font-medium",
                isCompleted ? "text-gray-400" : "text-[#3A4E5C]"
              )}>
                {task.subject}
              </span>
              <span className="text-gray-300 text-[10px]">•</span>
            </>
          )}

          <span className={cn(
            "inline-flex items-center gap-1 text-[12px] font-medium",
            isCompleted ? "text-gray-400" : (isOverdue ? "text-red-500" : "text-gray-500")
          )}>
            <Calendar size={12} />
            {format(dateObj, 'MMM d')}
            {isOverdue && " (Overdue)"}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
        aria-label="Delete task"
      >
        <span className="sr-only">Delete</span>
        <XIcon size={16} />
      </button>
    </motion.div>
  );
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
