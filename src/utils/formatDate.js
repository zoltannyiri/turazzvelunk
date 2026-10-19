export const parseTourDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Pure date "YYYY-MM-DD"
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, y, m, d] = dateOnlyMatch;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    // ISO string or timestamp
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const HUNGARIAN_MONTHS_LOWER = [
  'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
];

const HUNGARIAN_MONTHS_CAPITALIZED = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
];

export const formatTourDate = (value) => {
  const date = parseTourDate(value);
  if (!date) return 'Időpont egyeztetés alatt';
  return `${date.getFullYear()}. ${HUNGARIAN_MONTHS_LOWER[date.getMonth()]} ${date.getDate()}.`;
};

export const formatHungarianDate = (value) => {
  const date = parseTourDate(value);
  if (!date) return '';
  return `${date.getFullYear()}. ${HUNGARIAN_MONTHS_CAPITALIZED[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}.`;
};

export const toDateInputValue = (value) => {
  const date = parseTourDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateKey = (value) => {
  return toDateInputValue(value) || null;
};

export const formatTourRange = (start, end) => {
  if (!start && !end) return "Időpont hamarosan";
  const s = parseTourDate(start);
  const e = parseTourDate(end);
  if (!s && !e) return "Időpont hamarosan";
  if (!e) return formatTourDate(s);
  if (!s) return formatTourDate(e);

  const monthOptions = { month: 'short' };
  const sYear = s.getFullYear();
  const eYear = e.getFullYear();
  const sMonth = s.getMonth();
  const eMonth = e.getMonth();
  const sDay = s.getDate();
  const eDay = e.getDate();

  if (sYear === eYear && sMonth === eMonth) {
    const monthShort = s.toLocaleDateString('hu-HU', monthOptions);
    if (sDay === eDay) {
      return `${sYear}. ${monthShort} ${sDay}.`;
    }
    return `${sYear}. ${monthShort} ${sDay}. – ${eDay}.`;
  }

  if (sYear === eYear) {
    const sMonthShort = s.toLocaleDateString('hu-HU', monthOptions);
    const eMonthShort = e.toLocaleDateString('hu-HU', monthOptions);
    return `${sYear}. ${sMonthShort} ${sDay}. – ${eMonthShort} ${eDay}.`;
  }

  const sMonthShort = s.toLocaleDateString('hu-HU', monthOptions);
  const eMonthShort = e.toLocaleDateString('hu-HU', monthOptions);
  return `${sYear}. ${sMonthShort} ${sDay}. – ${eYear}. ${eMonthShort} ${eDay}.`;
};
