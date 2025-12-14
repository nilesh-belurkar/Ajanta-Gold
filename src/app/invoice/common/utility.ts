import { Timestamp } from "@angular/fire/firestore";



export function formatCalenderDate(date: any): string {
  if (!date) return '';

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

export function convertToDDMMYYYY(value: string | Timestamp | null): string | null {
  if (!value) return null;

  let date: Date;

  if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (typeof value === 'string') {
    // Handle DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [day, month, year] = value.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Handle verbose string like "December 31, 2025 at 12:00:00 AM GMT+5:30"
      const match = value.match(/([A-Za-z]+) (\d{1,2}), (\d{4})/);
      if (!match) return null;
      const [, monthName, dayStr, yearStr] = match;
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = months.indexOf(monthName);
      if (monthIndex === -1) return null;
      const day = parseInt(dayStr, 10);
      const year = parseInt(yearStr, 10);
      date = new Date(year, monthIndex, day);
    }
  } else {
    return null;
  }

  if (isNaN(date.getTime())) return null;

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  return `${d}-${m}-${y}`;
}

export function convertTimestamps(obj: any): any {
  if (!obj) return obj;

  // Firestore Timestamp
  if (
    typeof obj === 'object' &&
    'seconds' in obj &&
    'nanoseconds' in obj &&
    Object.keys(obj).length === 2
  ) {
    return new Date(obj.seconds * 1000 + obj.nanoseconds / 1e6);
  }

  // Recursively scan nested objects/arrays
  if (Array.isArray(obj)) {
    return obj.map(v => convertTimestamps(v));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = convertTimestamps(obj[key]);
    }
    return result;
  }

  return obj;
}

export function ddMMyyyyToFirestoreTimestamp(
  value: string | Date
): Timestamp {

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else {
    // expecting DD-MM-YYYY
    const [day, month, year] = value.split('-').map(Number);

    if (!day || !month || !year) {
      throw new Error('Invalid date string format. Expected DD-MM-YYYY');
    }

    date = new Date(year, month - 1, day, 0, 24, 1);
  }

  return Timestamp.fromDate(date);
}
