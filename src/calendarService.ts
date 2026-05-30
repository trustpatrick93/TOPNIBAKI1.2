import { MonthlyEvent, EventStatus } from './types';

// Computes the query parameters requested: Past 180 days to Future 500 days
export function getSyncTimeBoundaries() {
  const now = new Date();
  const past180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const future500 = new Date(now.getTime() + 500 * 24 * 60 * 60 * 1000);
  return {
    timeMin: past180.toISOString(),
    timeMax: future500.toISOString(),
  };
}

// Fetch events from Google Calendar
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<MonthlyEvent[]> {
  // If we are in developer bypass mode, return mocked Google Calendar events to let users play immediately
  if (accessToken === 'simulated_developer_bypass_token' || !accessToken) {
    console.log("simulating Google Calendar fetch - Bypass Mode");
    return getMockGCalEvents();
  }

  const { timeMin, timeMax } = getSyncTimeBoundaries();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=2500&singleEvents=true`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Calendar API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const items = data.items || [];

    // Filter out canceled ones from Google Calendar unless they are our custom ones that we manage state for,
    // or parse them beautifully.
    // Spec: "취소(status === 'cancelled'), 공백 일정, 혹은 시스템 전용 메타데이터 성격의 일정은 정밀 스크리닝하여 제외하십시오."
    const parsedEvents: MonthlyEvent[] = [];

    for (const item of items) {
      if (item.status === 'cancelled') {
        continue;
      }

      const summary = item.summary || '(No Title)';
      
      // Filter out utility / empty titles or system metadata if needed, but let's parse normal events.
      // If we want to detect if an event was canceled via Cogwheel, we check if summary has '[취소]' or similar.
      let estatus: 'pending' | 'completed' | 'canceled' = 'pending';
      let cleanTitle = summary;
      let cancelReason = '';

      if (summary.startsWith('❌ [일정취소]') || summary.includes('[취소됨]')) {
        estatus = 'canceled';
        // Extract cancel reason if formatted e.g. "❌ [일정취소] UI회의 (사유: 버그수정)"
        const match = summary.match(/\(사유:\s*([^)]+)\)/);
        if (match) {
          cancelReason = match[1];
        }
        // Remove prefixes for clean title
        cleanTitle = summary
          .replace(/^❌\s*\[일정취소\]\s*/, '')
          .replace(/^💡\s*\[완료\]\s*/, '')
          .replace(/^⏳\s*\[업무대기\]\s*/, '')
          .replace(/\s*\(사유:\s*[^)]+\)/, '');
      } else if (summary.startsWith('💡 [완료]')) {
        estatus = 'completed';
        cleanTitle = summary.replace(/^💡\s*\[완료\]\s*/, '');
      } else if (summary.startsWith('⏳ [업무대기]')) {
        estatus = 'pending';
        cleanTitle = summary.replace(/^⏳\s*\[업무대기\]\s*/, '');
      }

      // Read start and end times
      const startStr = item.start?.dateTime || item.start?.date || '';
      const endStr = item.end?.dateTime || item.end?.date || '';

      if (!startStr) {
        continue; // Screen out completely blank events
      }

      parsedEvents.push({
        id: `gcal-${item.id}`,
        title: cleanTitle,
        start: startStr,
        end: endStr,
        status: estatus,
        cancelReason: cancelReason || item.description || '',
        gcalEventId: item.id,
        isGcalOnly: true
      });
    }

    return parsedEvents;
  } catch (error) {
    console.error("Error fetching google calendar:", error);
    throw error;
  }
}

// Create a Google Calendar event
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: Omit<MonthlyEvent, 'id'>
): Promise<string | null> {
  if (accessToken === 'simulated_developer_bypass_token' || !accessToken) {
    const mockId = `mock-event-${Date.now()}`;
    console.log("simulating GCal Event Creation:", event);
    return mockId;
  }

  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  // Construct special title depending on status
  let summary = event.title;
  if (event.status === 'canceled') {
    summary = `❌ [일정취소] ${event.title}${event.cancelReason ? ` (사유: ${event.cancelReason})` : ''}`;
  } else if (event.status === 'completed') {
    summary = `💡 [완료] ${event.title}`;
  } else {
    summary = `⏳ [업무대기] ${event.title}`;
  }

  // Format start and end properly
  let startObj = {};
  let endObj = {};
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

  if (event.start.includes('T')) {
    startObj = { dateTime: event.start, timeZone: localTimeZone };
    endObj = { dateTime: event.end, timeZone: localTimeZone };
  } else {
    // All day
    startObj = { date: event.start.substring(0, 10) };
    endObj = { date: event.end.substring(0, 10) };
  }

  const body = {
    summary,
    description: event.cancelReason || 'Created via Cogwheel Schedule Platform',
    start: startObj,
    end: endObj,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Failed to create GCal event:", err);
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (err) {
    console.error("Error creating GCal event:", err);
    return null;
  }
}

// Update an existing Google Calendar event
export async function updateGoogleCalendarEvent(
  accessToken: string,
  gcalEventId: string,
  event: Partial<MonthlyEvent> & { title: string; start: string; end: string; status: EventStatus }
): Promise<boolean> {
  if (accessToken === 'simulated_developer_bypass_token' || !accessToken) {
    console.log(`simulating GCal Event Update (${gcalEventId}):`, event);
    return true;
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalEventId}`;

  // Formulate title based on status
  let summary = event.title;
  if (event.status === 'canceled') {
    summary = `❌ [일정취소] ${event.title}${event.cancelReason ? ` (사유: ${event.cancelReason})` : ''}`;
  } else if (event.status === 'completed') {
    summary = `💡 [완료] ${event.title}`;
  } else {
    summary = `⏳ [업무대기] ${event.title}`;
  }

  // Check structure of start/end dates
  let startObj = {};
  let endObj = {};
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

  if (event.start.includes('T')) {
    startObj = { dateTime: event.start, timeZone: localTimeZone };
    endObj = { dateTime: event.end, timeZone: localTimeZone };
  } else {
    startObj = { date: event.start.substring(0, 10) };
    endObj = { date: event.end.substring(0, 10) };
  }

  const body = {
    summary,
    description: event.cancelReason || 'Updated via Cogwheel Schedule Platform',
    start: startObj,
    end: endObj,
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Failed to update GCal event (${gcalEventId}):`, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error updating GCal event:", err);
    return false;
  }
}

// Delete an event from Google Calendar
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  gcalEventId: string
): Promise<boolean> {
  if (accessToken === 'simulated_developer_bypass_token' || !accessToken) {
    console.log(`simulating GCal Event Deletion (${gcalEventId})`);
    return true;
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalEventId}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 404) {
      const err = await response.text();
      console.error(`Failed to delete GCal event (${gcalEventId}):`, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error deleting GCal event:", err);
    return false;
  }
}

// Returns realistic retro-styled mock events for the bypass developer mode
function getMockGCalEvents(): MonthlyEvent[] {
  const today = new Date();
  const formatOffset = (days: number, hours: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString();
  };

  const dayFormat = (days: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return d.toISOString().substring(0, 10);
  };

  return [
    {
      id: "gcal-mock1",
      title: "⚙️ 핵심 시스템 아키텍처 회의",
      start: formatOffset(1, 10),
      end: formatOffset(1, 12),
      status: 'pending',
      cancelReason: '',
      gcalEventId: "mock1",
      isGcalOnly: true
    },
    {
      id: "gcal-mock2",
      title: "🛠️ 프론트엔드 와이어프레임 수정",
      start: formatOffset(0, 14),
      end: formatOffset(0, 16),
      status: 'completed',
      gcalEventId: "mock2",
      isGcalOnly: true
    },
    {
      id: "gcal-mock3",
      title: "⚠️ 레거시 동기화 서버 폐기",
      start: formatOffset(-1, 15),
      end: formatOffset(-1, 17),
      status: 'canceled',
      cancelReason: '클라우드 인프라 이전 마일스톤 연기로 인한 폐기',
      gcalEventId: "mock3",
      isGcalOnly: true
    },
    {
      id: "gcal-mock4",
      title: "☕ Retro Cozy Tea Time",
      start: dayFormat(2),
      end: dayFormat(2),
      status: 'pending',
      gcalEventId: "mock4",
      isGcalOnly: true
    }
  ];
}
