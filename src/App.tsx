import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Award, Trophy, Star, Flame, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Task, UserState, Badge } from './types';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { isBefore, isAfter, isToday, startOfDay, parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay } from 'date-fns';
import { cn } from './lib/utils';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('study-buddy-tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('study-buddy-stats');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return { points: 0, badges: [] };
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'completed' | 'progress'>('home');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [showReward, setShowReward] = useState<{points: number, badge?: Badge} | null>(null);

  useEffect(() => {
    localStorage.setItem('study-buddy-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('study-buddy-stats', JSON.stringify(userState));
  }, [userState]);

  const addTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setIsFormOpen(false);

    if (tasks.length === 0 && !userState.badges.find(b => b.iconType === 'first-step')) {
      awardBadge({
        id: crypto.randomUUID(),
        name: 'First Step',
        description: 'Added your first study task!',
        iconType: 'first-step',
        earnedAt: new Date().toISOString()
      }, 5);
    }
  };

  const awardBadge = (badge: Badge, bonusPoints: number = 0) => {
    setUserState(prev => {
      const alreadyHas = prev.badges.find(b => b.iconType === badge.iconType);
      if (alreadyHas) return { ...prev, points: prev.points + bonusPoints };
      return {
        ...prev,
        points: prev.points + bonusPoints,
        badges: [...prev.badges, badge]
      };
    });
    setShowReward({ points: bonusPoints, badge });
    setTimeout(() => setShowReward(null), 3000);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.completed) {
      let pointsEarned = 10;
      const today = startOfDay(new Date());
      const dueDate = startOfDay(parseISO(task.dueDate));
      
      let earnedBadge: Badge | undefined;

      if (isBefore(today, dueDate) && !userState.badges.find(b => b.iconType === 'early-bird')) {
        pointsEarned += 15;
        earnedBadge = {
          id: crypto.randomUUID(),
          name: 'Early Bird',
          description: 'Completed a task ahead of its due date.',
          iconType: 'early-bird',
          earnedAt: new Date().toISOString()
        };
      }

      const completedCount = tasks.filter(t => t.completed).length + 1;
      if (completedCount === 5 && !userState.badges.find(b => b.iconType === 'master-planner') && !earnedBadge) {
        pointsEarned += 50;
        earnedBadge = {
          id: crypto.randomUUID(),
          name: 'Master Planner',
          description: 'Completed 5 tasks successfully.',
          iconType: 'master-planner',
          earnedAt: new Date().toISOString()
        };
      }

      let newStreak = userState.currentStreak || 0;
      let lastDate = userState.lastCompletedDate ? startOfDay(parseISO(userState.lastCompletedDate)) : null;
      let diff = lastDate ? Math.round((today.getTime() - lastDate.getTime()) / 86400000) : null;
      let updatedLastDate = userState.lastCompletedDate;

      if (diff === 1) { // Consecutive day
        newStreak += 1;
        updatedLastDate = new Date().toISOString();
      } else if (diff === null || diff > 1) { // First time or broken streak
        newStreak = 1;
        updatedLastDate = new Date().toISOString();
      } // if diff === 0, keep same streak and date

      if (newStreak === 3 && diff === 1 && !userState.badges.find(b => b.iconType === 'streak') && !earnedBadge) {
        pointsEarned += 30;
        earnedBadge = {
          id: crypto.randomUUID(),
          name: 'On a Roll',
          description: 'Completed tasks 3 days in a row.',
          iconType: 'streak',
          earnedAt: new Date().toISOString()
        };
      }

      setUserState(prev => {
        let newBadges = prev.badges;
        if (earnedBadge && !prev.badges.find(b => b.iconType === earnedBadge!.iconType)) {
          newBadges = [...prev.badges, earnedBadge];
        }
        return {
          ...prev,
          points: prev.points + pointsEarned,
          badges: newBadges,
          currentStreak: newStreak,
          lastCompletedDate: updatedLastDate || prev.lastCompletedDate
        };
      });

      setShowReward({ points: pointsEarned, badge: earnedBadge });
      setTimeout(() => setShowReward(null), 3000);
    }

    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Derived state for Home tab
  const todayTasks = tasks.filter(t => !t.completed && isToday(parseISO(t.dueDate)));
  const upcomingTasks = tasks.filter(t => !t.completed && isAfter(startOfDay(parseISO(t.dueDate)), startOfDay(new Date())));
  const overdueTasks = tasks.filter(t => !t.completed && isBefore(startOfDay(parseISO(t.dueDate)), startOfDay(new Date())));
  const completedTasks = tasks.filter(t => t.completed).sort((a,b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-200">
      <nav className="border-b border-[#f0f0f0] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="font-serif italic text-2xl text-gray-900 pr-8 tracking-tight">Study Buddy Hub</div>
          <div className="flex gap-4 sm:gap-6 h-full items-end">
            {['home', 'calendar', 'completed', 'progress'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "pb-[22px] text-[14px] sm:text-[15px] font-medium transition-colors relative capitalize px-1",
                  activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-16"
            >
              {overdueTasks.length > 0 && (
                 <section>
                    <div className="flex justify-between items-baseline mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Overdue</h2>
                    </div>
                    <div className="space-y-3">
                      {overdueTasks.map(t => (
                        <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
                      ))}
                    </div>
                 </section>
              )}

              <section>
                <div className="flex justify-between items-baseline mb-6">
                  <h2 className="text-[26px] font-semibold text-gray-900 tracking-tight">Due today</h2>
                  <span className="text-[14px] text-gray-400 font-medium">{format(new Date(), 'EEEE, MMM d')}</span>
                </div>
                {todayTasks.length === 0 ? (
                  <div className="bg-[#fcfcfc] rounded-2xl p-7 border border-gray-100">
                    <h3 className="font-serif italic text-xl text-[#3A4E5C] mb-2 font-medium">Nothing due today</h3>
                    <p className="text-gray-500 text-[15px] max-w-sm">Enjoy the breathing room, or get a head start on tomorrow.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayTasks.map(t => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="flex justify-between items-baseline mb-6">
                  <h2 className="text-[26px] font-semibold text-gray-900 tracking-tight">Coming up</h2>
                </div>
                {upcomingTasks.length === 0 ? (
                  <div className="bg-[#fcfcfc] rounded-2xl p-7 border border-gray-100">
                    <h3 className="font-serif italic text-xl text-[#3A4E5C] mb-2 font-medium">Your horizon is clear</h3>
                    <p className="text-gray-500 text-[15px] max-w-sm">Add a homework assignment, project, or exam to start planning ahead.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingTasks.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(t => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[26px] font-semibold text-gray-900 tracking-tight">Calendar</h2>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="font-semibold text-gray-900 min-w-[120px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                    <button 
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-white border text-gray-900 border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-medium text-gray-400 text-xs uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2" />
                    ))}
                    {eachDayOfInterval({
                      start: startOfMonth(currentMonth),
                      end: endOfMonth(currentMonth)
                    }).map(day => {
                      const dayTasks = tasks.filter(t => t.dueDate === format(day, 'yyyy-MM-dd'));
                      const hasTasks = dayTasks.length > 0;
                      return (
                        <div 
                          key={day.toISOString()} 
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl transition-colors relative min-h-[50px]", 
                            isToday(day) ? "bg-gray-900 text-white" : "text-gray-700",
                            hasTasks && !isToday(day) ? "hover:bg-gray-50" : ""
                          )}
                        >
                          <span className={cn("text-sm", isToday(day) ? "font-semibold" : "font-medium")}>
                            {format(day, 'd')}
                          </span>
                          {hasTasks && (
                            <div className="flex gap-1 mt-1 flex-wrap justify-center w-full max-w-[24px]">
                              {dayTasks.slice(0,3).map(t => (
                                 <div 
                                    key={t.id} 
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      isToday(day) && !t.completed ? "bg-white/80" :
                                      isToday(day) && t.completed ? "bg-emerald-400" :
                                      t.completed ? "bg-emerald-500" : "bg-orange-500"
                                    )} 
                                 />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-[26px] font-semibold text-gray-900 tracking-tight mb-6">Completed Tasks</h2>
              {completedTasks.length === 0 ? (
                <div className="bg-[#fcfcfc] rounded-2xl p-7 border border-gray-100 text-center">
                  <h3 className="font-serif italic text-xl text-gray-400 mb-2 font-medium">No history yet</h3>
                  <p className="text-gray-400 text-[15px]">When you finish tasks, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 opacity-80">
                  {completedTasks.map(t => (
                    <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <section className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-3xl p-6 text-center border border-gray-800 text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                  <div className="absolute -top-4 -right-4 p-4 opacity-5">
                    <Trophy size={100} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Total Points</p>
                    <h3 className="text-4xl font-bold tracking-tight">{userState.points}</h3>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-3xl p-6 text-center border border-orange-100 text-orange-900 relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                  <div className="absolute -bottom-4 -right-4 p-4 opacity-5">
                    <Flame size={120} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-widest mb-1 mr-1">Daily Streak</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="text-4xl font-bold tracking-tight">{userState.currentStreak || 0}</h3>
                      <Flame className="text-orange-500 fill-orange-500" size={24} />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Your Badges</h2>
                  <span className="text-sm font-medium text-gray-400">{userState.badges.length} Unlocked</span>
                </div>

                {userState.badges.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-gray-200 border-dashed">
                    <Award className="mx-auto text-gray-300 mb-3" size={32} strokeWidth={1.5} />
                    <p className="text-[15px] text-gray-500 font-medium">Complete tasks to earn badges.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {userState.badges.map(badge => (
                      <div key={badge.id} className="flex flex-row items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-[3px] border-l-gray-900">
                        <div className="h-12 w-12 shrink-0 rounded-[14px] bg-gray-50 flex items-center justify-center border border-gray-100">
                          <Award className="text-gray-900" size={22} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-[15px]">{badge.name}</h4>
                          <p className="text-[#666] text-sm mt-0.5 leading-snug">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="pt-8 flex justify-center">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset your progress? This action cannot be undone.')) {
                      setUserState({ points: 0, badges: [], currentStreak: 0, lastCompletedDate: undefined });
                    }
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-red-500/80 hover:text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                  <RotateCcw size={16} />
                  Reset all progress
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-3 rounded-full bg-[#1a1a1a] p-2 pr-4 text-white shadow-xl hover:bg-black transition-colors border border-gray-800"
          aria-label="Add new task"
        >
          <div className="bg-white/10 rounded-full p-2.5">
            <Plus size={18} strokeWidth={2.5} />
          </div>
          <span className="font-medium text-[15px] tracking-wide">New Task</span>
        </motion.button>
      </div>

      {/* Rewards Toast Overlay */}
      <AnimatePresence>
        {showReward && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-3 z-50 whitespace-nowrap"
          >
            <Star className="text-[#1a1a1a] fill-[#1a1a1a]" size={18} />
            <div className="text-[15px] font-medium flex items-center">
              <span className="font-semibold">+{showReward.points} pts</span>
              {showReward.badge && (
                <>
                  <span className="text-gray-300 mx-2">•</span>
                  <span className="text-gray-600">Unlocked: <span className="font-semibold text-gray-900">{showReward.badge.name}</span></span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <TaskForm 
            onAdd={addTask} 
            onClose={() => setIsFormOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}


