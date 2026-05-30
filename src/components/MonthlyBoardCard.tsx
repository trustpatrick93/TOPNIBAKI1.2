import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, X, Sparkles, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { MonthlyEvent, DiaryEntry } from '../types';
import { getHolidayName } from '../utils/holidays';

interface MonthlyBoardCardProps {
  events: MonthlyEvent[];
  onAddEvent: (title: string, start: string, end: string, status: 'pending' | 'completed' | 'canceled') => void;
  onSelectEvent: (event: MonthlyEvent) => void;
  diaryEntries?: DiaryEntry[];
}

export default function MonthlyBoardCard({
  events,
  onAddEvent,
  onSelectEvent,
  diaryEntries = []
}: MonthlyBoardCardProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Start at May 2026 based on mock timestamp

  // Selected date for schedule details / addition modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // New Event state inside modal
  const [newTitle, setNewTitle] = useState('');
  const [newTimePreset, setNewTimePreset] = useState<'allday' | 'morning' | 'afternoon' | 'custom'>('allday');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('18:00');

  // Month configurations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getMonthName = (m: number) => {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return names[m];
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, etc.

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayMonth = () => {
    setCurrentDate(new Date(2026, 4, 29)); // Default to May 29, 2026
  };

  // Preset time helper for new event inside modal
  const handlePresetChange = (preset: 'allday' | 'morning' | 'afternoon' | 'custom') => {
    setNewTimePreset(preset);
    if (preset === 'allday') {
      setNewStartTime('09:00');
      setNewEndTime('18:00');
    } else if (preset === 'morning') {
      setNewStartTime('09:00');
      setNewEndTime('12:00');
    } else if (preset === 'afternoon') {
      setNewStartTime('13:00');
      setNewEndTime('18:00');
    }
  };

  const handleAddNewEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr || !newTitle.trim()) return;

    const startIso = `${selectedDateStr}T${newStartTime}:00`;
    const endIso = `${selectedDateStr}T${newEndTime}:00`;

    // Strictly trigger parent state update
    onAddEvent(newTitle.trim(), startIso, endIso, 'pending');

    // Reset state fields
    setNewTitle('');
    setNewTimePreset('allday');
    setNewStartTime('09:00');
    setNewEndTime('18:00');
  };

  // Generate calendar days
  const dayCells = [];
  // Offsets from previous month
  for (let s = 0; s < firstDayOfMonth; s++) {
    dayCells.push({ dayNumber: null, key: `empty-${s}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    dayCells.push({ dayNumber: d, key: `day-${d}` });
  }

  // Group events by day mapping
  const getEventsForDay = (day: number) => {
    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      const eDate = e.start.split('T')[0];
      return eDate === cellDateStr;
    });
  };

  // Retrieve current selected day's events
  const getSelectedDayEvents = () => {
    if (!selectedDateStr) return [];
    return events.filter(e => e.start.split('T')[0] === selectedDateStr);
  };

  return (
    <div className="bg-[#fcfbfa] border border-[#d9d5cb] rounded-lg p-5 shadow-sm space-y-5">
      {/* Header controls layout */}
      <div className="flex items-center justify-between border-b border-[#ece9e0] pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-amber-600 animate-pulse" />
          <h3 className="font-mono font-black text-sm text-[#1c1c1a] uppercase tracking-widest">
            MONTHLY Grid
          </h3>
        </div>
        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-0.5 rounded font-mono font-medium">
          💡 원하는 날짜를 누르면 일정을 확인하거나 새로 등록할 수 있습니다.
        </span>
      </div>

      {/* Date Navigator Grid Area */}
      <div className="flex items-center justify-between bg-[#fbf9f4] border border-[#ece9e0] rounded p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-[#edeae4] rounded transition-colors cursor-pointer border border-[#dcd9cd] bg-white shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4 text-stone-700" />
          </button>
          <span className="font-serif italic font-bold text-sm text-stone-800 tracking-tight min-w-[120px] text-center">
            {getMonthName(month)} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-[#edeae4] rounded transition-colors cursor-pointer border border-[#dcd9cd] bg-white shadow-2xs"
          >
            <ChevronRight className="w-4 h-4 text-stone-700" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-stone-500 bg-amber-50 border border-amber-200/50 px-2 py-1 rounded">
            대한민국 공휴일 연동 중
          </span>
          <button
            onClick={todayMonth}
            className="bg-[#f0ece2] hover:bg-[#ede9dc] text-stone-700 px-2.5 py-1 rounded text-xs font-mono border border-[#d1ccbe] cursor-pointer font-semibold shadow-xs"
          >
            오늘이 속한 월
          </button>
        </div>
      </div>

      {/* MONTH CALENDAR VIEW */}
      <div className="border border-[#e2dfd5] rounded-lg overflow-hidden bg-white shadow-xs">
        {/* Calendar Day Header */}
        <div className="grid grid-cols-7 bg-[#f6f3ea] border-b border-[#e2dfd5] py-2 text-center text-xs font-mono font-bold tracking-wider text-stone-600">
          <div className="text-rose-600">SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div className="text-amber-700">SAT</div>
        </div>

        {/* Calendar Grid Numbers */}
        <div className="grid grid-cols-7 border-t-0 auto-rows-[88px] divide-x divide-y divide-[#ece9e0]">
          {dayCells.map((cell, index) => {
            const dayNum = cell.dayNumber;
            const cellEvents = dayNum ? getEventsForDay(dayNum) : [];
            const dayOfWeek = index % 7; // 0: Sun, 6: Sat

            // Gather holiday info
            const holidayName = dayNum ? getHolidayName(year, month + 1, dayNum) : null;
            const isHoliday = !!holidayName;

            // Date String configuration
            const cellDateStr = dayNum 
              ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              : null;

            const hasDiary = cellDateStr && diaryEntries
              ? diaryEntries.some((entry) => {
                  const entryDate = new Date(entry.createdAt);
                  const formattedEntryDate = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
                  return formattedEntryDate === cellDateStr;
                })
              : false;

            // Visual colors matching
            let dayColorClass = 'text-stone-700';
            let cellBgClass = 'bg-white hover:bg-[#faf9f4]';

            if (!dayNum) {
              cellBgClass = 'bg-[#faf9f6]';
            } else if (isHoliday) {
              dayColorClass = 'text-rose-600 font-bold';
              cellBgClass = 'bg-rose-50/40 hover:bg-rose-100/30';
            } else if (dayOfWeek === 0) {
              dayColorClass = 'text-rose-600';
            } else if (dayOfWeek === 6) {
              dayColorClass = 'text-amber-700';
            }

            return (
              <div
                key={cell.key}
                onClick={() => {
                  if (cellDateStr) {
                    setSelectedDateStr(cellDateStr);
                    setNewTitle('');
                    setNewTimePreset('allday');
                    setNewStartTime('09:00');
                    setNewEndTime('18:00');
                  }
                }}
                className={`p-2 flex flex-col justify-between transition-colors relative group/day cursor-pointer select-none ${cellBgClass}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col text-left">
                    {dayNum ? (
                      <span className={`text-xs font-mono font-bold ${dayColorClass}`}>
                        {String(dayNum).padStart(2, '0')}
                      </span>
                    ) : (
                      <span />
                    )}
                    {holidayName && (
                      <span className="text-[8px] text-rose-500 font-bold leading-none mt-0.5 truncate max-w-[58px]" title={holidayName}>
                        {holidayName}
                      </span>
                    )}
                  </div>

                  {/* Tiny events headcount / diary indicator */}
                  <div className="flex items-center gap-1">
                    {dayNum && hasDiary && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-250 py-0.5 px-1 rounded font-bold animate-pulse select-none" title="일지 작성 완료">
                        ✍️
                      </span>
                    )}
                    {dayNum && cellEvents.length > 0 && (
                      <span className="text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200 px-1.5 py-0.5 rounded-full scale-[0.85] select-none group-hover/day:bg-amber-100 group-hover/day:text-amber-800 group-hover/day:border-amber-200 transition-colors font-semibold">
                        {cellEvents.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Aesthetic minimal state dots indicating scheduled workload status */}
                <div className="flex flex-wrap gap-1 min-h-[8px] mt-1">
                  {dayNum && cellEvents.slice(0, 4).map((evt) => {
                    let dotColor = 'bg-amber-400';
                    if (evt.status === 'completed') {
                      dotColor = 'bg-emerald-400';
                    } else if (evt.status === 'canceled') {
                      dotColor = 'bg-rose-300';
                    }
                    return (
                      <span 
                        key={evt.id} 
                        className={`w-2 h-2 rounded-full ${dotColor} border border-white shadow-3xs`} 
                        title={`${evt.title} (${evt.start.split('T')[1]?.substring(0, 5) || '종일'})`}
                      />
                    );
                  })}
                  {dayNum && cellEvents.length > 4 && (
                    <span className="text-[7px] text-stone-400 leading-none font-mono">+{(cellEvents.length - 4)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda & Interactive Schedule Builder Modal */}
      <AnimatePresence>
        {selectedDateStr && (() => {
          const matchedDate = new Date(selectedDateStr);
          const formattedTitle = `${matchedDate.getFullYear()}년 ${matchedDate.getMonth() + 1}월 ${matchedDate.getDate()}일 일정 관리`;
          const dayEvents = getSelectedDayEvents();
          
          // Holiday check inside modal
          const modalHoliday = getHolidayName(matchedDate.getFullYear(), matchedDate.getMonth() + 1, matchedDate.getDate());

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop override */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDateStr(null)}
                className="absolute inset-0 bg-stone-900"
              />

              {/* Modal window */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-[#fcfbfa] border-2 border-stone-850 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl p-5"
              >
                {/* Close handle */}
                <button
                  onClick={() => setSelectedDateStr(null)}
                  className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Display Header */}
                <div className="border-b pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-amber-600" />
                    <h4 className="font-mono font-black text-sm text-stone-900 uppercase">
                      {formattedTitle}
                    </h4>
                  </div>
                  {modalHoliday && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded font-mono font-bold">
                       🚨 {modalHoliday}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Left Column: List of Current Events for this day */}
                  <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-1 text-left">
                        당일 예정 리스트 ({dayEvents.length}건)
                      </span>
                      <div className="border border-stone-200/80 rounded-lg bg-[#f9f8f4] p-2 space-y-2 max-h-[220px] overflow-y-auto">
                        {dayEvents.length === 0 ? (
                          <div className="text-center text-[11px] text-stone-400 italic py-10">
                            등록된 일정이 없습니다.
                          </div>
                        ) : (
                          dayEvents.map(evt => {
                            let statusBadge = '⏳';
                            let statusStyle = 'bg-white border-stone-200 text-stone-850 hover:border-amber-300';
                            
                            if (evt.status === 'completed') {
                              statusBadge = '✅';
                              statusStyle = 'bg-emerald-50/60 border-emerald-250 text-emerald-800 line-through';
                            } else if (evt.status === 'canceled') {
                              statusBadge = '❌';
                              statusStyle = 'bg-rose-50 border-rose-200 text-rose-600 line-through';
                            }

                            const timeStr = evt.start.includes('T')
                              ? evt.start.split('T')[1].substring(0, 5)
                              : '종일';

                            return (
                              <div
                                key={evt.id}
                                onClick={() => {
                                  // Call parent selection trigger
                                  onSelectEvent(evt);
                                }}
                                className={`border p-2 rounded text-[11px] cursor-pointer transition-all flex flex-col gap-1 text-left ${statusStyle}`}
                                title="상태 제어 및 편집하기"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[9px] text-[#555] font-semibold">{timeStr}</span>
                                  <span>{statusBadge}</span>
                                </div>
                                <p className="font-semibold truncate">{evt.title}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Built-in Event Registration Form */}
                  <form onSubmit={handleAddNewEventSubmit} className="md:col-span-6 space-y-3 flex flex-col justify-between text-left">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-1">
                        신규 일정 등록 기안
                      </span>

                      <div className="space-y-3">
                        {/* Event Title */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-stone-500 block">일정명</label>
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="예: ⚙️ 시스템 보안 로드 및 검측"
                            className="w-full bg-white border border-[#d2cebf] rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            required
                          />
                        </div>

                        {/* Preset Buttons Grid */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-stone-50 block">시간 지정 방식</label>
                          <div className="grid grid-cols-4 gap-1">
                            {(['allday', 'morning', 'afternoon', 'custom'] as const).map((mode) => {
                              const modeLabels = {
                                allday: '종일',
                                morning: '오전',
                                afternoon: '오후',
                                custom: '세부 시간',
                              };
                              const isActive = newTimePreset === mode;

                              return (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => handlePresetChange(mode)}
                                  className={`py-1 border rounded text-[10px] transition-colors cursor-pointer text-center font-bold ${
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

                        {/* Event Times Custom render conditional */}
                        <AnimatePresence>
                          {newTimePreset === 'custom' ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-2 gap-2 overflow-hidden pt-0.5"
                            >
                              <div className="space-y-0.5">
                                <label className="text-[9px] font-mono text-stone-400 block">시작</label>
                                <input
                                  type="time"
                                  value={newStartTime}
                                  onChange={(e) => setNewStartTime(e.target.value)}
                                  className="w-full bg-white border border-[#d2cebf] rounded px-2 py-1 text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[9px] font-mono text-stone-400 block">종료</label>
                                <input
                                  type="time"
                                  value={newEndTime}
                                  onChange={(e) => setNewEndTime(e.target.value)}
                                  className="w-full bg-white border border-[#d2cebf] rounded px-2 py-1 text-xs font-mono"
                                />
                              </div>
                            </motion.div>
                          ) : (
                            <div className="bg-[#fcfbf9] border border-[#ece9e0] rounded px-2.5 py-1 text-[10px] font-mono text-stone-500 flex items-center justify-between select-none">
                              <span>지정된 시간:</span>
                              <span className="font-bold text-[#1c1c1a]">{newStartTime} ~ {newEndTime}</span>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-150 flex justify-end gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDateStr(null)}
                        className="border border-[#d2cebf] px-3.5 py-1.5 rounded text-xs font-mono text-stone-600 hover:bg-stone-50 cursor-pointer"
                      >
                        닫기
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-xs font-mono transition-all font-semibold cursor-pointer shadow-xs"
                      >
                        일정 등록
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
