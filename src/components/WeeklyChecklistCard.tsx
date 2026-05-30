import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Clock, Plus, Trash2, CheckCircle2, Circle, Globe, Edit2, Copy, ArrowLeft, Check, X, CalendarDays } from 'lucide-react';
import { WeeklyTask, DiaryEntry } from '../types';
import { getHolidayName } from '../utils/holidays';

interface WeeklyChecklistCardProps {
  tasks: WeeklyTask[];
  onAddTask: (title: string, dayOfWeek: number, timeStart: string, timeEnd: string, syncTarget: boolean, dateStr?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updated: { title: string; dayOfWeek: number; timeStart: string; timeEnd: string; syncTarget: boolean; dateStr?: string }) => void;
  onCopyTask: (id: string, targetDayOfWeek: number, targetDateStr?: string) => void;
  diaryEntries?: DiaryEntry[];
}

const DAYS_OF_WEEK_NAMES = [
  { value: 0, label: 'SUN', fullName: '일요일', bg: 'bg-rose-50/50 border-rose-100', text: 'text-rose-700' },
  { value: 1, label: 'MON', fullName: '월요일', bg: 'bg-stone-50/50 border-stone-200', text: 'text-[#1c1c1a]' },
  { value: 2, label: 'TUE', fullName: '화요일', bg: 'bg-stone-50/50 border-stone-200', text: 'text-[#1c1c1a]' },
  { value: 3, label: 'WED', fullName: '수요일', bg: 'bg-stone-50/50 border-stone-200', text: 'text-[#1c1c1a]' },
  { value: 4, label: 'THU', fullName: '목요일', bg: 'bg-stone-50/50 border-stone-200', text: 'text-[#1c1c1a]' },
  { value: 5, label: 'FRI', fullName: '금요일', bg: 'bg-stone-50/50 border-stone-200', text: 'text-[#1c1c1a]' },
  { value: 6, label: 'SAT', fullName: '토요일', bg: 'bg-amber-50/50 border-amber-100', text: 'text-amber-700' },
];

export default function WeeklyChecklistCard({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onCopyTask,
  diaryEntries = [],
}: WeeklyChecklistCardProps) {
  // Pivot date representing the starting Sunday of the currently viewed week
  const [currentSunday, setCurrentSunday] = useState<Date>(() => {
    let today = new Date();
    // Default to mock baseline May 30, 2026 if context year is not 2026.
    if (today.getFullYear() !== 2026) {
      today = new Date(2026, 4, 30);
    }
    const day = today.getDay();
    const sun = new Date(today);
    sun.setDate(today.getDate() - day);
    return sun;
  });

  // Dynamic dates generator for current week (Sunday to Saturday) with holiday info
  const [weekDates, setWeekDates] = useState<{
    year: number;
    month: number;
    day: number;
    formatted: string;
    holiday: string | null;
    dateKey: string;
  }[]>([]);
  
  useEffect(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentSunday);
      d.setDate(currentSunday.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dateVal = d.getDate();
      const monthStr = String(m).padStart(2, '0');
      const dateStr = String(dateVal).padStart(2, '0');
      const holiday = getHolidayName(y, m, dateVal);
      return {
        year: y,
        month: m,
        day: dateVal,
        formatted: `${monthStr}/${dateStr}`,
        holiday,
        dateKey: `${y}-${monthStr}-${dateStr}`,
      };
    });
    setWeekDates(dates);
  }, [currentSunday]);

  // Task Actions Modal State
  const [selectedTaskForAction, setSelectedTaskForAction] = useState<WeeklyTask | null>(null);
  const [modalMode, setModalMode] = useState<'menu' | 'edit' | 'copy'>('menu');

  // Unified Add Item Modal State (instead of persistent box)
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [timePreset, setTimePreset] = useState<'allday' | 'morning' | 'afternoon' | 'custom'>('allday');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('18:00');
  const [syncTarget, setSyncTarget] = useState(true);

  // Edit State form variables
  const [editTitle, setEditTitle] = useState('');
  const [editDayOfWeek, setEditDayOfWeek] = useState(1);
  const [editTimePreset, setEditTimePreset] = useState<'allday' | 'morning' | 'afternoon' | 'custom'>('allday');
  const [editTimeStart, setEditTimeStart] = useState('09:00');
  const [editTimeEnd, setEditTimeEnd] = useState('18:00');
  const [editSyncTarget, setEditSyncTarget] = useState(true);

  // Sync edit variable values when task changes
  useEffect(() => {
    if (selectedTaskForAction) {
      setEditTitle(selectedTaskForAction.title);
      setEditDayOfWeek(selectedTaskForAction.dayOfWeek);
      setEditTimeStart(selectedTaskForAction.timeStart);
      setEditTimeEnd(selectedTaskForAction.timeEnd);
      setEditSyncTarget(selectedTaskForAction.syncTarget);
      
      // Determine existing preset
      const ts = selectedTaskForAction.timeStart;
      const te = selectedTaskForAction.timeEnd;
      if (ts === '09:00' && te === '18:00') {
        setEditTimePreset('allday');
      } else if (ts === '09:00' && te === '12:00') {
        setEditTimePreset('morning');
      } else if (ts === '13:00' && te === '18:00') {
        setEditTimePreset('afternoon');
      } else {
        setEditTimePreset('custom');
      }
    }
  }, [selectedTaskForAction]);

  // Handle Preset select for Adding
  const handlePresetChange = (preset: 'allday' | 'morning' | 'afternoon' | 'custom') => {
    setTimePreset(preset);
    if (preset === 'allday') {
      setTimeStart('09:00');
      setTimeEnd('18:00');
    } else if (preset === 'morning') {
      setTimeStart('09:00');
      setTimeEnd('12:00');
    } else if (preset === 'afternoon') {
      setTimeStart('13:00');
      setTimeEnd('18:00');
    }
  };

  // Handle Preset select for Editing
  const handleEditPresetChange = (preset: 'allday' | 'morning' | 'afternoon' | 'custom') => {
    setEditTimePreset(preset);
    if (preset === 'allday') {
      setEditTimeStart('09:00');
      setEditTimeEnd('18:00');
    } else if (preset === 'morning') {
      setEditTimeStart('09:00');
      setEditTimeEnd('12:00');
    } else if (preset === 'afternoon') {
      setEditTimeStart('13:00');
      setEditTimeEnd('18:00');
    }
  };

  // Helper to completely strip emojis & double spaces
  const stripEmojisAndSymbols = (str: string) => {
    // Elegant regex targeting wide range of emoji and graphic icon planes, leaving clean letters, numbers & general punctuation
    return str
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDayForAdd === null) return;
    
    // Completely remove the emoji symbols from scheduled title upon insert
    const cleanedTitle = stripEmojisAndSymbols(title);
    if (!cleanedTitle) return;

    onAddTask(cleanedTitle, selectedDayForAdd, timeStart, timeEnd, syncTarget);
    
    // Clear state
    setTitle('');
    setTimePreset('allday');
    setTimeStart('09:00');
    setTimeEnd('18:00');
    setSyncTarget(true);
    setSelectedDayForAdd(null);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForAction) return;

    // Completely remove the emoji symbols from scheduled title upon update
    const cleanedTitle = stripEmojisAndSymbols(editTitle);
    if (!cleanedTitle) return;

    onUpdateTask(selectedTaskForAction.id, {
      title: cleanedTitle,
      dayOfWeek: editDayOfWeek,
      timeStart: editTimeStart,
      timeEnd: editTimeEnd,
      syncTarget: editSyncTarget,
      dateStr: weekDates[editDayOfWeek]?.dateKey,
    });
    setSelectedTaskForAction(null);
  };

  return (
    <div className="bg-[#fcfbfa] border border-[#d9d5cb] rounded-lg p-5 shadow-sm space-y-5">
      {/* Header section with week layout switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#ece9e0] pb-3 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600 animate-pulse" />
            <h3 className="font-mono font-black text-sm tracking-widest text-[#1c1c1a] uppercase">
              WEEKLY Checklist
            </h3>
          </div>
          
          {/* Week control arrows */}
          <div className="flex items-center bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSunday(prev => {
                  const copy = new Date(prev);
                  copy.setDate(prev.getDate() - 7);
                  return copy;
                });
              }}
              className="p-1 text-stone-500 hover:text-amber-700 hover:bg-stone-200 rounded transition-colors cursor-pointer"
              title="이전 주"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-mono font-bold text-stone-850 px-1 select-none">
              {weekDates[0] ? `${weekDates[0].year}년 ${weekDates[0].month}월 ${weekDates[0].day}일` : ''} 
              {' '}~{' '}
              {weekDates[6] ? `${weekDates[6].month}월 ${weekDates[6].day}일` : ''}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSunday(prev => {
                  const copy = new Date(prev);
                  copy.setDate(prev.getDate() + 7);
                  return copy;
                });
              }}
              className="p-1 text-stone-500 hover:text-amber-700 hover:bg-stone-200 rounded transition-colors cursor-pointer"
              title="다음 주"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
            
            <button
              onClick={() => {
                const today = new Date();
                let base = today;
                if (today.getFullYear() !== 2026) {
                  base = new Date(2026, 4, 30);
                }
                const day = base.getDay();
                const sun = new Date(base);
                sun.setDate(base.getDate() - day);
                setCurrentSunday(sun);
              }}
              className="text-[10px] text-amber-700 hover:text-amber-900 px-1.5 py-0.5 bg-[#edeae4] hover:bg-amber-100 rounded border border-stone-200 transition-colors font-mono cursor-pointer"
            >
              이번 주
            </button>
          </div>
        </div>
        
        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-0.5 rounded font-mono font-medium md:self-center">
          💡 원하는 요일 칸을 누르면 신규 일정이 등록됩니다.
        </span>
      </div>

      {/* Sundays -> Saturdays Grid view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS_OF_WEEK_NAMES.map((day) => {
          const dateInfo = weekDates[day.value];
          const dayTasks = tasks.filter((t) => {
            if (!dateInfo) return false;
            if (t.date) {
              return t.date === dateInfo.dateKey;
            }
            // Fallback: baseline initial week
            const isInitialWeek = currentSunday.getFullYear() === 2026 && 
                                  currentSunday.getMonth() === 4 && 
                                  currentSunday.getDate() === 24;
            if (isInitialWeek) {
              return t.dayOfWeek === day.value;
            }
            return false;
          });
          
          let formattedDateHeader = day.fullName;
          let isHoliday = false;
          let holidayName = '';
          let cardBg = day.bg;
          let textColor = day.text;

          if (dateInfo) {
            formattedDateHeader = `${dateInfo.formatted},(${day.fullName.substring(0, 1)})`;
            if (dateInfo.holiday) {
              isHoliday = true;
              holidayName = dateInfo.holiday;
              cardBg = 'bg-rose-50 border-rose-200 hover:bg-rose-100/50';
              textColor = 'text-rose-600 font-bold';
            }
          }

          const hasDiary = dateInfo && diaryEntries
            ? diaryEntries.some((entry) => {
                const entryDate = new Date(entry.createdAt);
                return (
                  entryDate.getFullYear() === dateInfo.year &&
                  (entryDate.getMonth() + 1) === dateInfo.month &&
                  entryDate.getDate() === dateInfo.day
                );
              })
            : false;

          return (
            <div
              key={day.value}
              onClick={() => {
                setSelectedDayForAdd(day.value);
                // Pre-configure fields
                setTimePreset('allday');
                setTimeStart('09:00');
                setTimeEnd('18:00');
              }}
              className={`border rounded-lg p-3 flex flex-col h-[290px] transition-all duration-200 cursor-pointer select-none hover:border-amber-400 group/day ${cardBg}`}
            >
              <div className="flex items-center justify-between border-b pb-2 mb-2 border-stone-200/60 group-hover/day:border-amber-200">
                <div className="flex flex-col text-left">
                  <span className={`text-xs font-mono font-bold tracking-tight ${textColor}`}>
                    {formattedDateHeader}
                  </span>
                  {isHoliday && (
                    <span className="text-[9px] text-rose-500 font-semibold leading-none mt-0.5">
                      {holidayName}
                    </span>
                  )}
                  {hasDiary && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-250 py-0.5 px-1.5 rounded font-bold animate-pulse mt-1 inline-block self-start" title="일지 작성 완료">
                      ✍️
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full border border-stone-200/30">
                    {dayTasks.length}건
                  </span>
                  <Plus className="w-3.5 h-3.5 text-stone-300 group-hover/day:text-amber-600 transition-colors" />
                </div>
              </div>

              {/* Day tasks lists */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                {dayTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[10px] text-stone-400 italic font-mono pt-12">
                    <span>계획 없음</span>
                    <span className="text-[9px] text-stone-300 mt-2 block not-italic group-hover/day:text-amber-500/70 transition-colors">+ 일정 추가</span>
                  </div>
                ) : (
                  dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop parent (day card) addition click trigger
                        setSelectedTaskForAction(task);
                        setModalMode('menu');
                      }}
                      className={`group/task border p-2.5 rounded text-[11px] relative transition-all flex flex-col gap-1 cursor-pointer select-none active:scale-[0.98] ${
                        task.completed
                          ? 'bg-stone-100/60 border-stone-200 text-stone-400 hover:bg-stone-100'
                          : 'bg-white border-[#ece9e0] text-stone-800 hover:border-amber-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Top time layout priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-stone-400 group-hover/task:text-stone-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-stone-300" /> {task.timeStart}~{task.timeEnd}
                        </span>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {task.syncTarget && (
                            <Globe className="w-2.5 h-2.5 text-sky-400 group-hover/task:text-sky-500" title="구글 캘린더 연동 타겟" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTask(task.id);
                            }}
                            className="text-stone-400 hover:text-rose-600 transition-colors opacity-0 group-hover/task:opacity-100 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Title layout secondary */}
                      <div className="flex items-start gap-1 p-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid checklist modal
                            onToggleTask(task.id);
                          }}
                          className="mt-0.5 shrink-0 text-stone-405 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-650 font-bold" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-stone-300 hover:text-amber-500" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <span className={`font-semibold block break-all leading-tight text-stone-700 ${task.completed ? 'line-through text-stone-400' : ''}`}>
                            {task.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. Modal for Scheduling a New Task */}
      <AnimatePresence>
        {selectedDayForAdd !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDayForAdd(null)}
              className="absolute inset-0 bg-stone-900"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-[#fcfbfa] border-2 border-stone-850 rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-5"
            >
              <button
                onClick={() => setSelectedDayForAdd(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b pb-3 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-650" />
                <h4 className="font-mono font-black text-sm text-stone-900 uppercase">
                  {weekDates[selectedDayForAdd] ? `${weekDates[selectedDayForAdd].formatted} (${DAYS_OF_WEEK_NAMES[selectedDayForAdd].fullName})` : DAYS_OF_WEEK_NAMES[selectedDayForAdd].fullName} 일정 등록
                </h4>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-left">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">할일 제목 (이모티콘 입력 시 자동 정제됩니다)</label>
                  <input
                    type="text"
                    placeholder="주간 부서 서버 점검"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-[#d2cebf] rounded px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Time options presets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">시간 선택 방식</label>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {(['allday', 'morning', 'afternoon', 'custom'] as const).map((mode) => {
                      const modeLabels = {
                        allday: '종일',
                        morning: '오전',
                        afternoon: '오후',
                        custom: '세부 시간',
                      };
                      const isActive = timePreset === mode;

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handlePresetChange(mode)}
                          className={`py-1.5 border rounded text-xs transition-colors cursor-pointer text-center font-semibold ${
                            isActive
                              ? 'bg-[#1c1c1a] border-stone-850 text-white'
                              : 'bg-white border-[#d2cebf] text-stone-700 hover:bg-[#edeae4]'
                          }`}
                        >
                          {modeLabels[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Time Start/End - Conditional Render */}
                <AnimatePresence>
                  {timePreset === 'custom' ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-3 pt-1 overflow-hidden"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">시작 시간</label>
                        <input
                          type="time"
                          value={timeStart}
                          onChange={(e) => setTimeStart(e.target.value)}
                          className="w-full bg-white border border-[#d2cebf] rounded px-2.5 py-1.5 text-xs focus:outline-none font-mono text-stone-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">종료 시간</label>
                        <input
                          type="time"
                          value={timeEnd}
                          onChange={(e) => setTimeEnd(e.target.value)}
                          className="w-full bg-white border border-[#d2cebf] rounded px-2.5 py-1.5 text-xs focus:outline-none font-mono text-stone-700"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-[#faf9f5] border border-[#ece9e0] rounded px-3 py-2 text-xs font-mono text-stone-500 flex items-center justify-between select-none">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-stone-400" /> 설정된 적용 시간:</span>
                      <span className="font-bold text-[#1c1c1a]">{timeStart} ~ {timeEnd}</span>
                    </div>
                  )}
                </AnimatePresence>

                {/* GCal sync checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="syncTarget"
                    checked={syncTarget}
                    onChange={(e) => setSyncTarget(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="syncTarget" className="text-xs font-mono text-[#1c1c1a] select-none flex items-center gap-1 cursor-pointer">
                    <Globe className="w-3.5 h-3.5 text-sky-600 animate-pulse" /> 구글 캘린더 동기화 등록하기
                  </label>
                </div>

                {/* Confirm Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedDayForAdd(null)}
                    className="border border-[#d2cebf] px-4 py-2 rounded text-xs font-mono text-stone-605 hover:bg-stone-50 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded text-xs font-mono transition-colors cursor-pointer font-semibold shadow-sm"
                  >
                    일정 적용 및 배포
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Actions Overlay Modal for Weekly Tasks */}
      <AnimatePresence>
        {selectedTaskForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskForAction(null)}
              className="absolute inset-0 bg-stone-900"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-[#fcfbfa] border-2 border-stone-850 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-5 md:max-w-md"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedTaskForAction(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {modalMode === 'menu' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200.5 rounded-full inline-block">
                      {DAYS_OF_WEEK_NAMES[selectedTaskForAction.dayOfWeek].fullName} 일정 제어
                    </span>
                    <h4 className="font-sans font-bold text-base text-stone-900 mt-2 break-all leading-snug">
                      {selectedTaskForAction.title}
                    </h4>
                    <p className="text-xs text-stone-500 font-mono mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400 animate-pulse" /> {selectedTaskForAction.timeStart} ~ {selectedTaskForAction.timeEnd}
                      {selectedTaskForAction.syncTarget && (
                        <span className="mx-1 text-sky-600 flex items-center gap-0.5">
                          <Globe className="w-3 h-3" /> 연동됨
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="border-t border-stone-200/80 pt-4 space-y-2.5">
                    {/* Action 1: Toggle Completion */}
                    <button
                      onClick={() => {
                        onToggleTask(selectedTaskForAction.id);
                        setSelectedTaskForAction(null);
                      }}
                      className="w-full flex items-center justify-between border border-stone-200 hover:bg-stone-50 rounded-lg p-3 text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        {selectedTaskForAction.completed ? (
                          <>
                            <Circle className="w-4 h-4 text-stone-400" />
                            <span>일정 완료 해제 (대기 상태로 돌리기)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 font-bold" />
                            <span>일정 완료 처리하기</span>
                          </>
                        )}
                      </span>
                      <Check className="w-3.5 h-3.5 text-stone-400" />
                    </button>

                    {/* Action 2: Update task fields */}
                    <button
                      onClick={() => setModalMode('edit')}
                      className="w-full flex items-center justify-between border border-stone-200 hover:bg-stone-50 rounded-lg p-3 text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Edit2 className="w-4 h-4 text-amber-600" />
                        <span>일정 편집/수정하기</span>
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">수정란</span>
                    </button>

                    {/* Action 3: Copy / Repeat tasks */}
                    <button
                      onClick={() => setModalMode('copy')}
                      className="w-full flex items-center justify-between border border-[#d9d5cb] hover:bg-stone-50 rounded-lg p-3 text-xs font-semibold text-[#1c1c1a] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-blue-600" />
                        <span>타 요일로 일정 복사하기</span>
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">중복 배치</span>
                    </button>

                    {/* Action 4: Instantly Delete task */}
                    <button
                      onClick={() => {
                        onDeleteTask(selectedTaskForAction.id);
                        setSelectedTaskForAction(null);
                      }}
                      className="w-full flex items-center justify-between border border-rose-100 hover:bg-rose-50 rounded-lg p-3 text-xs font-semibold text-rose-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>이 일정을 완전히 삭제 및 취소</span>
                      </span>
                      <span className="text-[10px] text-rose-450 font-mono">폐기</span>
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'edit' && (
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setModalMode('menu')}
                      className="text-stone-500 hover:text-stone-800 p-1 rounded hover:bg-stone-100 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-stone-700">일정 인자 세부 수정</span>
                  </div>

                  <div className="space-y-3.5 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">할일 제목 (이모티콘 입력 시 자동 정제됩니다)</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white border border-[#d2cebf] rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-amber-50/10 font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">수행 요일</label>
                        <select
                          value={editDayOfWeek}
                          onChange={(e) => setEditDayOfWeek(Number(e.target.value))}
                          className="w-full bg-white border border-[#d2cebf] rounded px-2.5 py-1.5 text-xs focus:outline-none text-stone-800 font-mono"
                        >
                          {DAYS_OF_WEEK_NAMES.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 flex flex-col justify-end text-left">
                        <div className="flex items-center gap-2 py-2">
                          <input
                            type="checkbox"
                            id="editSyncTarget"
                            checked={editSyncTarget}
                            onChange={(e) => setEditSyncTarget(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <label htmlFor="editSyncTarget" className="text-xs font-mono text-stone-600 select-none cursor-pointer">
                            구글 연동 활성화
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Time presets for edit */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">시간 선택 방식</label>
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {(['allday', 'morning', 'afternoon', 'custom'] as const).map((mode) => {
                          const modeLabels = {
                            allday: '종일',
                            morning: '오전',
                            afternoon: '오후',
                            custom: '세부 시간',
                          };
                          const isActive = editTimePreset === mode;

                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => handleEditPresetChange(mode)}
                              className={`py-1.5 border rounded text-xs transition-colors cursor-pointer text-center font-semibold ${
                                isActive
                                  ? 'bg-[#1c1c1a] border-stone-850 text-white'
                                  : 'bg-white border-[#d2cebf] text-stone-700 hover:bg-[#edeae4]'
                              }`}
                            >
                              {modeLabels[mode]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Time Start/End for Edit - Conditional Render */}
                    <AnimatePresence>
                      {editTimePreset === 'custom' ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 gap-3 pt-1 overflow-hidden"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">시작 시간</label>
                            <input
                              type="time"
                              value={editTimeStart}
                              onChange={(e) => setEditTimeStart(e.target.value)}
                              className="w-full bg-white border border-[#d2cebf] rounded px-2.5 py-1.5 text-xs focus:outline-none font-mono text-stone-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono font-bold text-stone-500 uppercase block">종료 시간</label>
                            <input
                              type="time"
                              value={editTimeEnd}
                              onChange={(e) => setEditTimeEnd(e.target.value)}
                              className="w-full bg-white border border-[#d2cebf] rounded px-2.5 py-1.5 text-xs focus:outline-none font-mono text-stone-700"
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-[#faf9f5] border border-[#ece9e0] rounded px-3 py-2 text-xs font-mono text-stone-500 flex items-center justify-between select-none">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-stone-400" /> 설정된 적용 시간:</span>
                          <span className="font-bold text-[#1c1c1a]">{editTimeStart} ~ {editTimeEnd}</span>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-stone-150">
                    <button
                      type="button"
                      onClick={() => setModalMode('menu')}
                      className="border border-[#d2cebf] px-4 py-1.5 rounded text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1c1c1a] hover:bg-[#2e2e2a] text-[#f7f5ef] px-5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer shadow-sm font-semibold"
                    >
                      저장하기
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'copy' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setModalMode('menu')}
                      className="text-stone-500 hover:text-stone-800 p-1 rounded hover:bg-stone-100 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-stone-700">복사할 대상 요일 선택</span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-sans text-left">
                    본 일정(<span className="font-semibold text-stone-800">{selectedTaskForAction.title}</span>)을 복사하여 배치할 요일을 아래에서 선택하십시오. 동일한 내용과 시작/종료 시간이 새로운 카드로 복제 부여됩니다. (복사 전 이모지가 완전히 정제됩니다.)
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                    {DAYS_OF_WEEK_NAMES.map((day) => {
                      const isCurrent = day.value === selectedTaskForAction.dayOfWeek;
                      return (
                        <button
                          key={day.value}
                          type="button"
                          disabled={isCurrent}
                          onClick={() => {
                            onCopyTask(selectedTaskForAction.id, day.value);
                            setSelectedTaskForAction(null);
                          }}
                          className={`p-2.5 border rounded-lg text-xs font-mono font-bold text-center transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-50'
                              : 'bg-white border-stone-200 hover:bg-amber-50 hover:border-amber-400 text-stone-800'
                          }`}
                        >
                          {day.fullName}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-stone-150">
                    <button
                      type="button"
                      onClick={() => setModalMode('menu')}
                      className="border border-[#d2cebf] px-4 py-1.5 rounded text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      뒤로 가기
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
