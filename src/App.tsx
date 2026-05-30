import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  ClipboardList,
  BookOpen,
  User,
  LogOut,
  RefreshCw,
  Tag,
  AlertCircle,
  Globe,
  Plus,
  CheckCircle,
  TrendingUp,
  Inbox,
  Coffee
} from 'lucide-react';

import { DiaryEntry, WeeklyTask, MonthlyEvent, Category, EventStatus } from './types';
import { googleSignIn, logoutUser, initAuth, AppUser } from './auth';
import { fetchGoogleCalendarEvents, createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from './calendarService';

import ErrorGuideCard from './components/ErrorGuideCard';
import DailyJournalCard from './components/DailyJournalCard';
import WeeklyChecklistCard from './components/WeeklyChecklistCard';
import MonthlyBoardCard from './components/MonthlyBoardCard';
import JournalArchivePage from './components/JournalArchivePage';
import ScheduleActionModal from './components/ScheduleActionModal';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '⚙️ 일상', color: '#b45309' },
  { id: 'cat-2', name: '⚡ 업무', color: '#15803d' },
  { id: 'cat-3', name: '📈 주식', color: '#0369a1' },
];

const INITIAL_LOCAL_TASKS: WeeklyTask[] = [
  { id: 'task-1', dayOfWeek: 1, title: '⚙️ 핵심 시스템 체크리스트 인덱싱', timeStart: '09:00', timeEnd: '10:30', completed: false, syncTarget: true },
  { id: 'task-2', dayOfWeek: 3, title: '🖥️ 백엔드 연동 캘린더 싱크 로드 점검', timeStart: '14:00', timeEnd: '15:30', completed: false, syncTarget: true },
  { id: 'task-3', dayOfWeek: 5, title: '🧪 회고 및 종합 앰버 일지 축적 확인', timeStart: '17:00', timeEnd: '18:00', completed: true, syncTarget: false },
];

const INITIAL_MONTHLY_EVENTS: MonthlyEvent[] = [
  { id: 'local-evt-1', title: '⚙️ 톱니바퀴 개발 플랫폼 시스템 온보딩', start: '2026-05-29T10:00:00', end: '2026-05-29T11:30:00', status: 'pending' },
  { id: 'local-evt-2', title: '☕ Retro Cozy Coffee Break', start: '2026-05-29T15:00:00', end: '2026-05-29T15:30:00', status: 'completed' },
];

const formatLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dateVal = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dateVal}`;
};

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core synchronized application state
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [monthlyEvents, setMonthlyEvents] = useState<MonthlyEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  // Interaction states
  const [selectedEvent, setSelectedEvent] = useState<MonthlyEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'archive'>('dashboard');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Time tracker for visual retro touch
  const [currentTime, setCurrentTime] = useState<string>('');

  // Track state change to save
  const dataLoadedRef = useRef<string | null>(null);

  // Initialize Clock & Authenticator connection
  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    // Dynamic Auth init
    const unsubscribe = initAuth((currentUser, currentToken) => {
      setUser(currentUser);
      setToken(currentToken);
      setAuthLoading(false);
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  // Sync / Load logic when switching user (Authentication Isolation)
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // isolated multi-user loading from localstorage
      const keyPrefix = `user_${user.uid}_cogwheel`;
      
      const loadedDiary = localStorage.getItem(`${keyPrefix}_diary_entries`);
      const loadedTasks = localStorage.getItem(`${keyPrefix}_weekly_tasks`);
      const loadedEvents = localStorage.getItem(`${keyPrefix}_monthly_events`);
      const loadedCategories = localStorage.getItem(`${keyPrefix}_categories`);

      let parsedDiary: DiaryEntry[] = loadedDiary ? JSON.parse(loadedDiary) : [];
      let parsedCategories: Category[] = loadedCategories ? JSON.parse(loadedCategories) : DEFAULT_CATEGORIES;

      // Ensure '🩺 일상' or '📝 일기' are seamlessly migrated to '⚙️ 일상'
      parsedCategories = parsedCategories.map(cat => {
        if (cat.name === '🩺 일상' || cat.name === '📝 일기') {
          return { ...cat, name: '⚙️ 일상' };
        }
        return cat;
      });

      parsedDiary = parsedDiary.map(entry => {
        if (entry.category === '🩺 일상' || entry.category === '📝 일기') {
          return { ...entry, category: '⚙️ 일상' };
        }
        return entry;
      });

      // Ensure '⚙️ 일상' is at the very beginning of categories (if it exists)
      const dailyIndex = parsedCategories.findIndex(c => c.name === '⚙️ 일상');
      if (dailyIndex > 0) {
        const [dailyCat] = parsedCategories.splice(dailyIndex, 1);
        parsedCategories.unshift(dailyCat);
      }

      setDiaryEntries(parsedDiary);
      setWeeklyTasks(loadedTasks ? JSON.parse(loadedTasks) : INITIAL_LOCAL_TASKS);
      setMonthlyEvents(loadedEvents ? JSON.parse(loadedEvents) : INITIAL_MONTHLY_EVENTS);
      setCategories(parsedCategories);
      setSyncError(null);

      dataLoadedRef.current = user.uid;
      
      // Auto-trigger synchronizer on login
      setTimeout(() => {
        triggerSync(currentTokenRef.current || 'simulated_developer_bypass_token', user.uid);
      }, 500);

    } else {
      // Clear data to prevent leaks
      setDiaryEntries([]);
      setWeeklyTasks([]);
      setMonthlyEvents([]);
      setCategories(DEFAULT_CATEGORIES);
      setSyncError(null);
      dataLoadedRef.current = null;
    }
  }, [user, authLoading]);

  // Keep a ref of Token for async hooks
  const currentTokenRef = useRef<string | null>(null);
  useEffect(() => {
    currentTokenRef.current = token;
  }, [token]);

  // Automanaged client side backups
  useEffect(() => {
    if (!user || dataLoadedRef.current !== user.uid) return;
    const keyPrefix = `user_${user.uid}_cogwheel`;

    localStorage.setItem(`${keyPrefix}_diary_entries`, JSON.stringify(diaryEntries));
    localStorage.setItem(`${keyPrefix}_weekly_tasks`, JSON.stringify(weeklyTasks));
    localStorage.setItem(`${keyPrefix}_monthly_events`, JSON.stringify(monthlyEvents));
    localStorage.setItem(`${keyPrefix}_categories`, JSON.stringify(categories));
  }, [diaryEntries, weeklyTasks, monthlyEvents, categories, user]);

  // Polling logic & Focus event subscription (Spec: 45초 폴링)
  useEffect(() => {
    if (!user) return;

    // Background 45s poller
    const poller = setInterval(() => {
      console.log("[POLLER] 45s recurring synchronizer triggered");
      triggerSync(currentTokenRef.current || 'simulated_developer_bypass_token', user.uid);
    }, 45000);

    // Focus listener
    const onWindowFocus = () => {
      console.log("[FOCUS] window regained focus, immediate synchronization activated");
      triggerSync(currentTokenRef.current || 'simulated_developer_bypass_token', user.uid);
    };

    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(poller);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [user]);

  // Dynamic status toast popup controller
  const showToast = (message: string) => {
    setSyncMessage(message);
    setTimeout(() => {
      setSyncMessage(null);
    }, 4500);
  };

  // Google Calendar 2-Way Sync Core Engine
  const triggerSync = async (accessToken: string, activeUid: string) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      console.log("Beginning Google Calendar 2-way real-time synchronizer...");
      const gcalEvents = await fetchGoogleCalendarEvents(accessToken);
      setSyncError(null);

      // Perform bidirectional diff checks:
      setMonthlyEvents((currentEvents) => {
        let addCount = 0;
        let modCount = 0;
        let delCount = 0;

        // 1. Build dictionary of incoming events by gcal ID
        const gcalDict = new Map<string, MonthlyEvent>();
        gcalEvents.forEach(evt => {
          if (evt.gcalEventId) gcalDict.set(evt.gcalEventId, evt);
        });

        // 2. Identify deletions from Google Calendar:
        // Any local event with prefix `gcal-` but NOT present in the received Google Calendar list is removed.
        const nonDeletedLocalEvents = currentEvents.filter(localEvt => {
          if (localEvt.id.startsWith('gcal-') && localEvt.gcalEventId) {
            const stillExists = gcalDict.has(localEvt.gcalEventId);
            if (!stillExists) {
              delCount++;
              return false; // Deleted from GCal, discard
            }
          }
          return true;
        });

        // 3. For remaining events, detect modifications vs new arrivals
        const updatedLocalEvents = [...nonDeletedLocalEvents];

        gcalEvents.forEach(gEvt => {
          const matchIndex = updatedLocalEvents.findIndex(le => {
            return le.gcalEventId === gEvt.gcalEventId || le.id === gEvt.id;
          });

          if (matchIndex >= 0) {
            // Found existing matching event. Check if titles, start, end, or status have changed
            const existing = updatedLocalEvents[matchIndex];
            const hasChanged = 
              existing.title !== gEvt.title ||
              existing.start !== gEvt.start ||
              existing.end !== gEvt.end ||
              existing.status !== gEvt.status;

            if (hasChanged) {
              // Update existing object in-place without duplicating index
              updatedLocalEvents[matchIndex] = {
                ...existing,
                title: gEvt.title,
                start: gEvt.start,
                end: gEvt.end,
                status: gEvt.status,
                cancelReason: gEvt.cancelReason || existing.cancelReason
              };
              modCount++;
            }
          } else {
            // New event from Google Calendar arrived
            updatedLocalEvents.push(gEvt);
            addCount++;
          }
        });

        if (addCount > 0 || modCount > 0 || delCount > 0) {
          console.log(`[SYNC SUCCESS] Google Calendar 동기화 완료: 추가 ${addCount}건, 수정 ${modCount}건, 삭제 ${delCount}건`);
        } else {
          console.log(`[SYNC SUCCESS] Google Calendar 동기화 완료: 최신 상태가 유지되고 있습니다.`);
        }

        return updatedLocalEvents;
      });

    } catch (err: any) {
      console.warn("Real-time sync alert:", err);
      const errMsg = err?.message || String(err);
      setSyncError(errMsg);

      let toastMsg = `⚠️ Sync failed: 파이어베이스 인증 정보 또는 토큰이 만료되었습니다.`;
      if (errMsg.includes('403')) {
        toastMsg = `⚠️ Sync failed (403): Google Calendar API 활성화 또는 권한 확인이 필요합니다.`;
      } else if (errMsg.includes('401')) {
        toastMsg = `⚠️ Sync failed (401): 인증 토큰이 만료되었습니다. 다시 로그인해 주세요.`;
      }
      showToast(toastMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sync execution helper
  const handleImmediateManualSync = () => {
    if (!user) return;
    triggerSync(token || 'simulated_developer_bypass_token', user.uid);
  };

  // Actions handlers
  const handleAddDiaryEntry = (content: string, category: string) => {
    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      category,
    };
    setDiaryEntries((prev) => [newEntry, ...prev]);
    showToast("📝 일지가 등록되었습니다.");
  };

  const handleDeleteDiaryEntry = (id: string) => {
    setDiaryEntries((prev) => prev.filter((d) => d.id !== id));
    showToast("🗑️ 일지가 삭제되었습니다.");
  };

  const handleAddCategory = (name: string, color: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      color,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`🌱 새 카테고리 [${name}]가 추가되었습니다.`);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Weekly checklist handlers & Propagates up to Google Calendar
  const handleAddWeeklyTask = async (title: string, dayOfWeek: number, timeStart: string, timeEnd: string, syncTarget: boolean, dateStr?: string) => {
    const taskId = `week-task-${Date.now()}`;
    const localEventId = `monthly-evt-${Date.now()}`;
    
    let gcalId: string | undefined = undefined;
    let syncErrorDectected = false;

    // Use selected date string or fallback to baseline if not provided
    let targetDateStr = dateStr;
    if (!targetDateStr) {
      const baseDate = new Date(2026, 4, 24 + dayOfWeek); 
      targetDateStr = formatLocalDateStr(baseDate);
    }
    const startIso = `${targetDateStr}T${timeStart}:00`;
    const endIso = `${targetDateStr}T${timeEnd}:00`;

    if (syncTarget && user) {
      // Create associated event in Google Calendar:
      const id = await createGoogleCalendarEvent(token || 'simulated_developer_bypass_token', {
        title,
        start: startIso,
        end: endIso,
        status: 'pending'
      });
      if (id) {
        gcalId = id;
      } else {
        syncErrorDectected = true;
      }
    }

    const projectedEventId = gcalId ? `gcal-${gcalId}` : localEventId;

    // Push the projected event into monthlyEvents list
    const projectedEvent: MonthlyEvent = {
      id: projectedEventId,
      title,
      start: startIso,
      end: endIso,
      status: 'pending',
      gcalEventId: gcalId || undefined,
      weeklyTaskId: taskId
    };

    const newTask: WeeklyTask = {
      id: taskId,
      dayOfWeek,
      title,
      timeStart,
      timeEnd,
      completed: false,
      syncTarget,
      gcalEventId: gcalId,
      monthlyEventId: projectedEventId,
      date: targetDateStr
    };

    setMonthlyEvents((prev) => [...prev, projectedEvent]);
    setWeeklyTasks((prev) => [...prev, newTask]);

    if (syncErrorDectected) {
      showToast("⚠️ 일정은 로컬에 추가되었으나, 구글 캘린더 등록에 실패했습니다. (API 비활성화 또는 토큰 만료)");
    } else {
      showToast("📋 주간 업무 계획표와 월간 연동 보드에 일정이 함께 배치되었습니다.");
    }
  };

  const handleToggleWeeklyTask = async (id: string) => {
    setWeeklyTasks((prev) => {
      return prev.map((t) => {
        if (t.id === id) {
          const newCompleted = !t.completed;
          
          // If synced with Google Calendar, update the completed status tag dynamically
          if (t.gcalEventId) {
            const baseDate = new Date(2026, 4, 24 + t.dayOfWeek); 
            const formattedDate = formatLocalDateStr(baseDate);
            const startIso = `${formattedDate}T${t.timeStart}:00`;
            const endIso = `${formattedDate}T${t.timeEnd}:00`;

            updateGoogleCalendarEvent(token || 'simulated_developer_bypass_token', t.gcalEventId, {
              title: t.title,
              start: startIso,
              end: endIso,
              status: newCompleted ? 'completed' : 'pending'
            });
          }

          // Update matched monthlyEvents whether local or GCal linked!
          setMonthlyEvents(prevEvents => prevEvents.map(me => {
            const isMatch = me.id === t.monthlyEventId || me.weeklyTaskId === t.id || (t.gcalEventId && me.gcalEventId === t.gcalEventId);
            if (isMatch) {
              return { ...me, status: newCompleted ? 'completed' : 'pending' };
            }
            return me;
          }));

          return { ...t, completed: newCompleted };
        }
        return t;
      });
    });
  };

  const handleDeleteWeeklyTask = async (id: string) => {
    const taskObj = weeklyTasks.find(t => t.id === id);
    if (taskObj?.gcalEventId) {
      await deleteGoogleCalendarEvent(token || 'simulated_developer_bypass_token', taskObj.gcalEventId);
    }
    
    // Always delete from monthlyEvents, matching local or GCal-linked ones
    setMonthlyEvents(prev => prev.filter(me => {
      const isMatch = me.id === taskObj?.monthlyEventId || me.weeklyTaskId === id || (taskObj?.gcalEventId && me.gcalEventId === taskObj.gcalEventId);
      return !isMatch;
    }));

    setWeeklyTasks((prev) => prev.filter((t) => t.id !== id));
    showToast("🗑️ 주간 계획표 및 월간 보드에서 일정이 영구 취소 및 삭제되었습니다.");
  };

  const handleUpdateWeeklyTask = async (
    id: string,
    updated: { title: string; dayOfWeek: number; timeStart: string; timeEnd: string; syncTarget: boolean; dateStr?: string }
  ) => {
    setWeeklyTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          let targetDateStr = updated.dateStr || t.date;
          if (!targetDateStr) {
            const baseDate = new Date(2026, 4, 24 + updated.dayOfWeek); 
            targetDateStr = formatLocalDateStr(baseDate);
          }
          const startIso = `${targetDateStr}T${updated.timeStart}:00`;
          const endIso = `${targetDateStr}T${updated.timeEnd}:00`;

          const updatedTask = { ...t, ...updated, date: targetDateStr };

          if (t.gcalEventId) {
            updateGoogleCalendarEvent(token || 'simulated_developer_bypass_token', t.gcalEventId, {
              title: updated.title,
              start: startIso,
              end: endIso,
              status: t.completed ? 'completed' : 'pending'
            });
          }

          // Update matched monthlyEvents
          setMonthlyEvents(prevEvents => {
            let found = false;
            const nextEvents = prevEvents.map(me => {
              const isMatch = me.id === t.monthlyEventId || me.weeklyTaskId === t.id || (t.gcalEventId && me.gcalEventId === t.gcalEventId);
              if (isMatch) {
                found = true;
                return {
                  ...me,
                  title: updated.title,
                  start: startIso,
                  end: endIso,
                  status: t.completed ? 'completed' : 'pending' as const
                };
              }
              return me;
            });

            // Fallback: If no matched event found, create one to ensure auto-link
            if (!found) {
              const eventId = `monthly-evt-${Date.now()}`;
              const projectedEvent: MonthlyEvent = {
                id: eventId,
                title: updated.title,
                start: startIso,
                end: endIso,
                status: t.completed ? 'completed' : 'pending',
                weeklyTaskId: t.id
              };
              updatedTask.monthlyEventId = eventId;
              return [...nextEvents, projectedEvent];
            }

            return nextEvents;
          });
          
          return updatedTask;
        }
        return t;
      })
    );
    showToast("📝 주간 및 월간 연동 일정이 성공적으로 수정되었습니다.");
  };

  const handleCopyWeeklyTask = async (id: string, targetDayOfWeek: number, targetDateStr?: string) => {
    const original = weeklyTasks.find(t => t.id === id);
    if (!original) return;

    const taskId = `copy-task-${Date.now()}`;
    const localEventId = `monthly-evt-${Date.now()}`;
    let gcalId: string | undefined = undefined;
    let syncErrorDectected = false;

    let targetDate = targetDateStr || original.date;
    if (!targetDate) {
      const baseDate = new Date(2026, 4, 24 + targetDayOfWeek); 
      targetDate = formatLocalDateStr(baseDate);
    }
    const startIso = `${targetDate}T${original.timeStart}:00`;
    const endIso = `${targetDate}T${original.timeEnd}:00`;

    if (original.syncTarget && user) {
      const idGcal = await createGoogleCalendarEvent(token || 'simulated_developer_bypass_token', {
        title: original.title,
        start: startIso,
        end: endIso,
        status: 'pending'
      });
      if (idGcal) {
        gcalId = idGcal;
      } else {
        syncErrorDectected = true;
      }
    }

    const projectedEventId = gcalId ? `gcal-${gcalId}` : localEventId;

    const projectedEvent: MonthlyEvent = {
      id: projectedEventId,
      title: original.title,
      start: startIso,
      end: endIso,
      status: 'pending',
      gcalEventId: gcalId || undefined,
      weeklyTaskId: taskId
    };

    const newTask: WeeklyTask = {
      id: taskId,
      dayOfWeek: targetDayOfWeek,
      title: original.title,
      timeStart: original.timeStart,
      timeEnd: original.timeEnd,
      completed: false,
      syncTarget: original.syncTarget,
      gcalEventId: gcalId,
      monthlyEventId: projectedEventId,
      date: targetDate
    };

    setMonthlyEvents(prev => [...prev, projectedEvent]);
    setWeeklyTasks((prev) => [...prev, newTask]);

    if (syncErrorDectected) {
      showToast(`⚠️ 복사된 일정은 성공적으로 배치되었으나, 구글 캘린더 등록에 실패했습니다. (API 확인 필요)`);
    } else {
      showToast(`📋 일정이 복사되어 주간 및 월간 보드에 함께 배치되었습니다.`);
    }
  };

  // Monthly board event creation
  const handleAddMonthlyEvent = async (title: string, start: string, end: string, status: 'pending' | 'completed' | 'canceled') => {
    // Write directly as linked Google Calendar item
    const gcalId = await createGoogleCalendarEvent(token || 'simulated_developer_bypass_token', {
      title,
      start,
      end,
      status
    });

    const eventId = gcalId ? `gcal-${gcalId}` : `local-${Date.now()}`;
    const taskId = `week-task-${Date.now()}`;

    // Extract dayOfWeek
    const eventDate = new Date(start);
    const dayOfWeek = isNaN(eventDate.getTime()) ? 1 : eventDate.getDay();

    // Helper to extract time string "HH:MM"
    const getTimeString = (isoStr: string, defaultTime: string) => {
      try {
        const parts = isoStr.split('T');
        if (parts.length > 1) {
          return parts[1].substring(0, 5);
        }
        return defaultTime;
      } catch {
        return defaultTime;
      }
    };

    const targetDateStr = start.substring(0, 10);

    const newWeeklyTask: WeeklyTask = {
      id: taskId,
      dayOfWeek,
      title,
      timeStart: getTimeString(start, '09:00'),
      timeEnd: getTimeString(end, '18:00'),
      completed: status === 'completed',
      syncTarget: !!gcalId,
      gcalEventId: gcalId || undefined,
      monthlyEventId: eventId,
      date: targetDateStr
    };

    const newEvent: MonthlyEvent = {
      id: eventId,
      title,
      start,
      end,
      status,
      gcalEventId: gcalId || undefined,
      weeklyTaskId: taskId
    };

    setMonthlyEvents((prev) => [...prev, newEvent]);
    setWeeklyTasks((prev) => [...prev, newWeeklyTask]);

    if (user && !gcalId) {
      showToast("⚠️ 보드에는 임시 추가되었으나, 구글 캘린더 등록에 실패했습니다. (API 활성화 상태 및 권한 확인 필요)");
    } else {
      showToast("📆 월간 연동 보드와 주간 계획표에 신규 일정이 승인 배치되었습니다.");
    }
  };

  // Schedule detailed modifier
  const handleUpdateEventStatus = async (id: string, newStatus: EventStatus, reason?: string) => {
    const ev = monthlyEvents.find(e => e.id === id);
    if (!ev) return;

    // Check if synced to GCal
    if (ev.gcalEventId) {
      // If Canceled status restoration occurs (i.e. status is back to pending), we strip cancel tag
      const finalTitle = ev.title;
      await updateGoogleCalendarEvent(token || 'simulated_developer_bypass_token', ev.gcalEventId, {
        title: finalTitle,
        start: ev.start,
        end: ev.end,
        status: newStatus,
        cancelReason: reason || ''
      });
    }

    setMonthlyEvents((prev) => {
      return prev.map((e) => {
        if (e.id === id) {
          return { ...e, status: newStatus, cancelReason: reason || '' };
        }
        return e;
      });
    });

    // Also trace and update associated Weekly Task
    setWeeklyTasks(prevTasks => prevTasks.map(t => {
      const isMatch = t.monthlyEventId === id || t.id === ev.weeklyTaskId || (ev.gcalEventId && t.gcalEventId === ev.gcalEventId);
      if (isMatch) {
        return { ...t, completed: newStatus === 'completed' };
      }
      return t;
    }));

    setSelectedEvent(null);
    showToast(`📝 상태가 [${newStatus}] 로 수정 합치되었습니다.`);
  };

  const handleDeleteMonthlyEvent = async (id: string) => {
    const ev = monthlyEvents.find(e => e.id === id);
    if (ev?.gcalEventId) {
      await deleteGoogleCalendarEvent(token || 'simulated_developer_bypass_token', ev.gcalEventId);
    }
    
    // Also delete any associated Weekly Task
    setWeeklyTasks(prev => prev.filter(t => {
      const isMatch = t.monthlyEventId === id || t.id === ev?.weeklyTaskId || (ev?.gcalEventId && t.gcalEventId === ev.gcalEventId);
      return !isMatch;
    }));

    setMonthlyEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
    showToast("🗑️ 일정이 월간 보드 및 주간 계획표에서 완전히 제거되었습니다.");
  };

  // Complete reset to blank state for quick clean sandbox experiments
  const handleResetAllData = () => {
    setDiaryEntries([]);
    setWeeklyTasks(INITIAL_LOCAL_TASKS);
    setMonthlyEvents(INITIAL_MONTHLY_EVENTS);
    setCategories(DEFAULT_CATEGORIES);
    showToast("⚙️ 시스템 로컬 스토리지 데이터가 리셋되었습니다.");
  };

  // Core Login Buttons Trigger
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      await googleSignIn();
    } catch (e: any) {
      console.error(e);
      showToast("⚠️ Firebase Auth Google 연동 실패. 개발자 우회 패스를 활용하십시오.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
    showToast("🚪 안전하게 로그아웃 마쳤습니다.");
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#1c1c1a] font-sans selection:bg-amber-200">
      
      {/* Dynamic Toast System Message Popups */}
      <AnimatePresence>
        {syncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1a] text-[#f7f5ef] px-5 py-3 border-2 border-amber-600 rounded-md shadow-2xl font-mono text-xs flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            {syncMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body Switch (Authenticated vs Landing Portal) */}
      <AnimatePresence mode="wait">
        {authLoading ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 3 }}
              className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full"
            />
            <p className="font-mono text-xs text-stone-500 mt-4 animate-pulse">BOOTING COGWHEEL DASHBOARD CORE...</p>
          </div>
        ) : !user ? (
          /* AUTHENTICATION PORTAL (Minimalist & Compact Responsive Layout) */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="login-portal"
            className="min-h-screen flex flex-col justify-between items-center p-6 max-w-md mx-auto"
          >
            {/* Top Logo and Title branding */}
            <div className="w-full text-center py-6 border-b border-stone-200">
              <h1 className="font-mono font-black text-4xl tracking-widest text-[#1c1c1a]">
                TOPNIBAKI
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-stone-500 uppercase mt-1">
                COGWHEEL SCHEDULE ENGINE
              </p>
            </div>

            {/* Immersive centerpiece containing rotating cogwheels visual art & Google Login Button */}
            <div className="w-full my-auto py-10 flex flex-col items-center justify-center space-y-10 select-none">
              
              {/* Nested interactive double rotating gear graphical asset */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Main Large Gear */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 16 }}
                  className="absolute text-stone-850"
                  style={{ width: '130px', height: '130px' }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-stone-800">
                    <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-15c2.2 0 4-1.8 4-4v-2c0-2.2-1.8-4-4-4s-4 1.8-4 4v2c0 2.2 1.8 4 4 4zm0 60c-2.2 0-4 1.8-4 4v2c0 2.2 1.8 4 4 4s4-1.8 4-4v-2c0-2.2-1.8-4-4-4zm30-30c0-2.2-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4s1.8 4 4 4h2c2.2 0 4-1.8 4-4zm-60 0c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4s-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4zm49.5-21c1.6 1.6 4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7s-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7zm-39 39c-1.6-1.6-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7s4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7zm39 0c1.6-1.6 1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0s-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0zm-39-39c-1.6 1.6-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0s1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0z" />
                    <circle cx="50" cy="50" r="23" className="stroke-[#f7f5ef] stroke-[4px] fill-transparent" />
                    <circle cx="50" cy="50" r="10" className="fill-[#f7f5ef]" />
                  </svg>
                </motion.div>
                
                {/* Ancillary Intermeshed Smaller Gear */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 9 }}
                  className="absolute text-amber-600 top-5 right-3"
                  style={{ width: '70px', height: '70px' }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                    <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-15c2.2 0 4-1.8 4-4v-2c0-2.2-1.8-4-4-4s-4 1.8-4 4v2c0 2.2 1.8 4 4 4zm0 60c-2.2 0-4 1.8-4 4v2c0 2.2 1.8 4 4 4s4-1.8 4-4v-2c0-2.2-1.8-4-4-4zm30-30c0-2.2-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4s1.8 4 4 4h2c2.2 0 4-1.8 4-4zm-60 0c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4s-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4zm49.5-21c1.6 1.6 4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7s-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7zm-39 39c-1.6-1.6-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7s4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7zm39 0c1.6-1.6 1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0s-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0zm-39-39c-1.6 1.6-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0s1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0z" />
                    <circle cx="50" cy="50" r="23" className="stroke-[#f7f5ef] stroke-[4px] fill-transparent" />
                    <circle cx="50" cy="50" r="10" className="fill-[#f7f5ef]" />
                  </svg>
                </motion.div>
              </div>

              {/* Minimal Sign In Button */}
              <div className="w-full flex justify-center">
                <button
                  onClick={handleGoogleLogin}
                  className="gsi-material-button hover:shadow-md transition-shadow cursor-pointer border border-[#d2cebf] rounded-md bg-white text-stone-900 active:bg-stone-50 w-full max-w-xs flex justify-center items-center"
                  style={{ display: 'inline-flex', height: '44px', padding: '0 16px' }}
                >
                  <div className="gsi-material-button-icon" style={{ marginRight: '10px' }}>
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '22px', height: '22px' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-sans text-xs font-semibold whitespace-nowrap">Google 계정으로 로그인</span>
                </button>
              </div>
            </div>

            {/* Troubleshooting guides embedded at the bottom of login portal (Spec: Gatekeeper 모드) */}
            <div className="w-full mt-auto mb-6">
              <ErrorGuideCard />
            </div>

            {/* Footer rights */}
            <div className="py-2 text-center font-mono text-[9px] text-stone-400">
              © 2026 TOPNIBAKI. Cozy Retro Technical.
            </div>
          </motion.div>
        ) : (
          /* AUTHENTICATED SYSTEM DASHBOARD (Desktop 7xl centered grid layout) */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            key="dashboard-app"
            className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
          >
            {/* Top Command Bar Panel */}
            <header className="bg-[#1c1c1a] text-[#f7f5ef] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                {/* Embedded dynamic double-rotating cogwheel graphics */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  {/* Main Gear */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, ease: 'linear', duration: 16 }}
                    className="absolute text-amber-500"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                      <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-15c2.2 0 4-1.8 4-4v-2c0-2.2-1.8-4-4-4s-4 1.8-4 4v2c0 2.2 1.8 4 4 4zm0 60c-2.2 0-4 1.8-4 4v2c0 2.2 1.8 4 4 4s4-1.8 4-4v-2c0-2.2-1.8-4-4-4zm30-30c0-2.2-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4s1.8 4 4 4h2c2.2 0 4-1.8 4-4zm-60 0c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4s-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4zm49.5-21c1.6 1.6 4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7s-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7zm-39 39c-1.6-1.6-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7s4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7zm39 0c1.6-1.6 1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0s-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0zm-39-39c-1.6 1.6-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0s1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0z" />
                      <circle cx="50" cy="50" r="23" className="stroke-[#1c1c1a] stroke-[5px] fill-transparent" />
                      <circle cx="50" cy="50" r="10" className="fill-[#1c1c1a]" />
                    </svg>
                  </motion.div>
                  {/* Small Gear */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, ease: 'linear', duration: 9 }}
                    className="absolute text-stone-400 top-1 right-1"
                    style={{ width: '18px', height: '18px' }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                      <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-15c2.2 0 4-1.8 4-4v-2c0-2.2-1.8-4-4-4s-4 1.8-4 4v2c0 2.2 1.8 4 4 4zm0 60c-2.2 0-4 1.8-4 4v2c0 2.2 1.8 4 4 4s4-1.8 4-4v-2c0-2.2-1.8-4-4-4zm30-30c0-2.2-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4s1.8 4 4 4h2c2.2 0 4-1.8 4-4zm-60 0c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4s-1.8-4-4-4h-2c-2.2 0-4 1.8-4 4zm49.5-21c1.6 1.6 4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7s-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7zm-39 39c-1.6-1.6-4.1-1.6-5.7 0l-1.4 1.4c-1.6 1.6-1.6 4.1 0 5.7s4.1 1.6 5.7 0l1.4-1.4c1.6-1.6 1.6-4.1 0-5.7zm39 0c1.6-1.6 1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0s-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0zm-39-39c-1.6 1.6-1.6 4.1 0 5.7l1.4 1.4c1.6 1.6 4.1 1.6 5.7 0s1.6-4.1 0-5.7l-1.4-1.4c-1.6-1.6-4.1-1.6-5.7 0z" />
                      <circle cx="50" cy="50" r="23" className="stroke-[#1c1c1a] stroke-[5px] fill-transparent" />
                      <circle cx="50" cy="50" r="10" className="fill-[#1c1c1a]" />
                    </svg>
                  </motion.div>
                </div>
                <div>
                  <h1 className="font-mono font-black text-xl tracking-wider text-white">
                    TOPNIBAKI
                  </h1>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#a8a49b] block mt-0.5">
                    User Domain: {user.displayName || user.email}
                  </span>
                </div>
              </div>

              {/* Central clock and server pollings */}
              <div className="hidden md:flex items-center gap-6 font-mono text-xs">
                <div className="bg-stone-800/80 border border-stone-700 px-3 py-1.5 rounded flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>{currentTime || '12:00:00'}</span>
                </div>

                <button
                  onClick={handleImmediateManualSync}
                  disabled={isSyncing}
                  className={`border border-amber-600/50 hover:border-amber-600 bg-stone-800 text-amber-500 px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-inner ${
                    isSyncing ? 'opacity-70' : ''
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? '캘린더 연동중...' : '동기화 반영'}</span>
                </button>
              </div>

              {/* User badge and Logout button */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-mono font-medium block text-emerald-400 flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    ONLINE
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 block">{user.email?.substring(0, 18)}...</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-stone-800 hover:bg-rose-950 text-stone-300 hover:text-rose-200 p-2.5 rounded-md transition-colors cursor-pointer border border-stone-700"
                  title="시스템 완전히 잠그고 로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Google Calendar Sync Error Diagnostic Alert Banner */}
            <AnimatePresence>
              {syncError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 border-2 border-amber-500 rounded-lg p-5 font-mono text-xs text-stone-800 space-y-3 shadow-sm"
                >
                  <div className="flex items-center gap-2 font-bold text-amber-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>⚠️ 구글 캘린더 실시간 동기화 에러 (Google Calendar Sync Error)</span>
                  </div>
                  
                  <div className="space-y-2 leading-relaxed">
                    <p>
                      최근 시도된 구글 캘린더 연동 과정에서 아래와 같은 세부 오류가 감지되었습니다:
                    </p>
                    <code className="block bg-stone-900 text-stone-100 p-3 rounded overflow-x-auto text-[11px] font-mono whitespace-pre-wrap border-l-4 border-amber-500">
                      {syncError}
                    </code>
                  </div>

                  <div className="bg-white p-4 border border-amber-200 rounded text-[11px] space-y-2.5 text-stone-600 leading-normal">
                    <p className="font-bold text-rose-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>💡 403 오류 (Forbidden/Disabled) 해결 방법:</span>
                    </p>
                    <p>
                      새로 연동하신 Firebase / Google Cloud 프로젝트(<span className="font-semibold text-stone-800">patrickroom-93</span>) 웹 콘솔에서 <strong>Google Calendar API</strong>가 비활성화되어 있을 가능성이 높습니다.
                    </p>
                    <ol className="list-decimal pl-4 space-y-2 font-sans">
                      <li>
                        <a
                          href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=patrickroom-93"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-700 font-bold underline hover:text-amber-900 inline-flex items-center gap-1"
                        >
                          [여기를 클릭하여 구글 클라우드 API 라이브러리로 원클릭 이동] ➡️
                        </a>
                      </li>
                      <li>접속 창 오른쪽 위에 활성화된 프로젝트 ID가 <span className="font-semibold text-[#1c1c1a] bg-stone-100 px-1 rounded">patrickroom-93</span>인지 확인합니다.</li>
                      <li>화면 중앙의 파란색 <strong>사용 (Enable)</strong> 버튼을 눌러 활성화해 주십시오.</li>
                      <li>활성화 완료 후, 이 화면으로 돌아와 우상단의 <strong>[동기화 반영]</strong> 버튼을 누르면 즉시 동기화가 성공합니다!</li>
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Retro Tab View Selector */}
            <div className="flex border-b border-[#ece9e0] gap-1 pt-1">
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 font-mono text-xs font-bold border-t-2 border-x rounded-t transition-all relative cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'border-t-amber-600 border-x-[#d9d5cb] bg-[#fcfbfa] text-stone-900 -mb-[1px]'
                    : 'border-t-transparent border-x-transparent text-stone-500 hover:text-stone-850 bg-[#edeae4]/30'
                }`}
              >
                📝 일정/일지
              </button>
              <button
                type="button"
                onClick={() => setActiveView('archive')}
                className={`px-4 py-2 font-mono text-xs font-bold border-t-2 border-x rounded-t transition-all relative cursor-pointer ${
                  activeView === 'archive'
                    ? 'border-t-amber-600 border-x-[#d9d5cb] bg-[#fcfbfa] text-stone-900 -mb-[1px]'
                    : 'border-t-transparent border-x-transparent text-stone-500 hover:text-stone-850 bg-[#edeae4]/30'
                }`}
              >
                🗃️ 아카이브
              </button>
            </div>

            {activeView === 'dashboard' ? (
              <>
                {/* Grid 1: Daily Journal card area for premium writing (Placed first at the absolute top!) */}
                <DailyJournalCard
                  entries={diaryEntries}
                  categories={categories}
                  onAddEntry={handleAddDiaryEntry}
                  onDeleteEntry={handleDeleteDiaryEntry}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />

                {/* Grid 2: Stretched Weekly repetition list (Sunday ~ Saturday cards) */}
                <WeeklyChecklistCard
                  tasks={weeklyTasks}
                  onAddTask={handleAddWeeklyTask}
                  onToggleTask={handleToggleWeeklyTask}
                  onDeleteTask={handleDeleteWeeklyTask}
                  onUpdateTask={handleUpdateWeeklyTask}
                  onCopyTask={handleCopyWeeklyTask}
                  diaryEntries={diaryEntries}
                />

                {/* Grid 3: Real-time interactive high-density calendar */}
                <div className="w-full">
                  <MonthlyBoardCard
                    events={monthlyEvents}
                    onAddEvent={handleAddMonthlyEvent}
                    onSelectEvent={(evt) => setSelectedEvent(evt)}
                    diaryEntries={diaryEntries}
                  />
                </div>
              </>
            ) : (
              <JournalArchivePage
                entries={diaryEntries}
                categories={categories}
                onDeleteEntry={handleDeleteDiaryEntry}
              />
            )}

            {/* Controls Drawer at Dashboard Bottom is deactivated */}

            {/* Footer rights */}
            <div className="py-6 border-t border-[#dcd9cc] text-center font-mono text-[10px] text-stone-500">
              © 2026 Cogwheel Schedule Platform. Cozy Retro Technical Layout centering high-contrast typography.
            </div>

            {/* Dynamic Event Detail modification sheets floating modal */}
            {selectedEvent && (
              <ScheduleActionModal
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onUpdateStatus={handleUpdateEventStatus}
                onDeleteEvent={handleDeleteMonthlyEvent}
              />
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
