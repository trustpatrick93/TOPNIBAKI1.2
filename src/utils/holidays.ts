// 대한민국 공휴일 정보 유틸리티
// 2026년 기준 정확하게 대체공휴일 및 음력 공휴일 반영

const HOLIDAYS_2026: Record<string, string> = {
  '01-01': '신정',
  '02-16': '설날 연휴',
  '02-17': '설날',
  '02-18': '설날 연휴',
  '02-19': '대체공휴일(설날)',
  '03-01': '삼일절',
  '03-02': '대체공휴일(삼일절)',
  '05-05': '어린이날',
  '05-24': '부처님오신날',
  '05-25': '대체공휴일(부처님오신날)',
  '06-06': '현충일',
  '08-15': '광복절',
  '09-24': '추석 연휴',
  '09-25': '추석',
  '09-26': '추석 연휴',
  '09-28': '대체공휴일(추석)',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

const SOLAR_HOLIDAYS_STANDARD: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

/**
 * 특정 날짜가 대한민국 기준 공휴일인지 판별하여 공휴일명을 반환합니다.
 * @param year 연도 (예: 2026)
 * @param month 월 (1 ~ 12)
 * @param day 일 (1 ~ 31)
 */
export function getHolidayName(year: number, month: number, day: number): string | null {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const mmdd = `${mm}-${dd}`;

  if (year === 2026) {
    return HOLIDAYS_2026[mmdd] || null;
  }

  return SOLAR_HOLIDAYS_STANDARD[mmdd] || null;
}
