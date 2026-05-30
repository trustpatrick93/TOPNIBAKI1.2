import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, HelpCircle, CheckCircle, AlertTriangle, RefreshCw, Trash2, Globe } from 'lucide-react';
import { MonthlyEvent, EventStatus } from '../types';

interface ScheduleActionModalProps {
  event: MonthlyEvent | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: EventStatus, cancelReason?: string) => void;
  onDeleteEvent: (id: string) => void;
}

export default function ScheduleActionModal({
  event,
  onClose,
  onUpdateStatus,
  onDeleteEvent,
}: ScheduleActionModalProps) {
  const [status, setStatus] = useState<EventStatus>('pending');
  const [cancelReason, setCancelReason] = useState('');

  // Update states when event is loaded
  useEffect(() => {
    if (event) {
      setStatus(event.status);
      setCancelReason(event.cancelReason || '');
    }
  }, [event]);

  if (!event) return null;

  const handleSave = () => {
    onUpdateStatus(event.id, status, cancelReason);
  };

  const handleDelete = () => {
    const confirmation = window.confirm(`이 일정을 전면 폐기/삭제하시겠습니까?\n이 행위는 연동된 구글 캘린더에서도 이벤트를 영구 소멸시킬 것입니다.`);
    if (confirmation) {
      onDeleteEvent(event.id);
    }
  };

  const getStatusText = (st: EventStatus) => {
    switch (st) {
      case 'pending': return '⏳ [업무대기]';
      case 'completed': return '💡 [완료]';
      case 'canceled': return '❌ [일정취소]';
    }
  };

  const startTimeStr = event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : '00:00';
  const endTimeStr = event.end.includes('T') ? event.end.split('T')[1].substring(0, 5) : '24:00';
  const dateStr = event.start.split('T')[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#fcfbfa] border-2 border-stone-800 rounded-lg max-w-md w-full shadow-xl overflow-hidden font-sans"
        >
          {/* Header block with retro metal plate feeling */}
          <div className="bg-[#1c1c1a] text-[#f7f5ef] p-4 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
              [EVENT_SHEET_SPECIFICATION_CARD]
            </span>
            <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Title specification area */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">EVENT TITLE</span>
              <h3 className="font-serif italic font-bold text-lg text-stone-900 border-b border-stone-200 pb-1.5 flex items-center justify-between">
                {event.title}
                {event.id.startsWith('gcal-') && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-mono bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded leading-none">
                    <Globe className="w-2.5 h-2.5" /> GCAL_LINKED
                  </span>
                )}
              </h3>
            </div>

            {/* Time meta specs */}
            <div className="grid grid-cols-2 gap-4 bg-[#fbf9f4] border border-[#e8e4db] rounded p-3 text-stone-700 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[9px] text-stone-400 uppercase font-bold">DATE OF SPEC</span>
                <p className="font-semibold text-stone-800">{dateStr}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-stone-400 uppercase font-bold">TIME ALLOCATION</span>
                <p className="font-semibold text-stone-800">{startTimeStr} - {endTimeStr}</p>
              </div>
            </div>

            {/* Status switcher specs */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">WORKFLOW STATUS CONTROL</span>
              <div className="grid grid-cols-3 gap-2">
                {(['pending', 'completed', 'canceled'] as EventStatus[]).map((st) => {
                  const isActive = status === st;
                  let stColor = 'border-stone-300 hover:bg-stone-50 text-stone-700';
                  if (isActive) {
                    if (st === 'pending') stColor = 'bg-amber-100 border-amber-500 text-amber-900 font-bold';
                    if (st === 'completed') stColor = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                    if (st === 'canceled') stColor = 'bg-rose-100 border-rose-500 text-rose-900 font-bold';
                  }

                  return (
                    <button
                      key={st}
                      onClick={() => setStatus(st)}
                      className={`py-2 px-1 text-center rounded text-xs transition-all border cursor-pointer ${stColor}`}
                    >
                      {getStatusText(st)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Show Cancel Reason context box if status is 'canceled' */}
            <AnimatePresence>
              {status === 'canceled' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden bg-rose-50/50 border border-rose-200 rounded p-3"
                >
                  <label className="text-[10px] font-mono font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> RETRO CANCEL REASON JUSTIFICATION
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="예: 클라이언트 연동 규격 변경으로 인한 파기"
                    className="w-full bg-white border border-rose-300 rounded px-2.5 py-1.5 text-xs text-rose-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    required
                  />
                  <p className="text-[9px] text-rose-700 font-mono">
                    * 취소 사유는 구글 캘린더 이벤트의 제목(`[일정취소]`) 및 설명란에 실시간 반영처리 됩니다.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recovery message alert block */}
            {event.status === 'canceled' && status === 'pending' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-emerald-800 text-[11px] font-serif">
                💡 <strong>상태 복원 감지:</strong> 일정을 대기(Pending)상태로 변경 시, 구글 캘린더에서 제거되었던 취소 말머리 딱지가 전면 탈착되고 `⏳ [업무대기]` 상태로 원래 원복 동기화됩니다.
              </div>
            )}

            {/* Action buttons footer */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <button
                onClick={handleDelete}
                className="bg-stone-100 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded text-xs font-mono transition-colors border border-stone-300 hover:border-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> 폐기 삭제
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="bg-white hover:bg-stone-50 text-stone-600 border border-stone-300 px-4 py-2 rounded text-xs font-mono cursor-pointer"
                >
                  창 닫기
                </button>
                <button
                  onClick={handleSave}
                  className="bg-[#1c1c1a] hover:bg-amber-600 text-white px-5 py-2 rounded text-xs font-mono shadow-md font-bold cursor-pointer"
                >
                  기안 내용 저장
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
