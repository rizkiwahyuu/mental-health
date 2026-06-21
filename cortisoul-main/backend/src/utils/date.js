export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const getStartOfDay = (date) => {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
};

export const getEndOfDay = (date) => {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
};

export const getWeekRange = (referenceDate = new Date()) => {
  const startDate = getStartOfDay(referenceDate);
  const dayOfWeek = startDate.getDay();
  const deltaToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(startDate);
  monday.setDate(startDate.getDate() + deltaToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: getStartOfDay(monday),
    end: getEndOfDay(sunday),
  };
};

export const formatToYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
