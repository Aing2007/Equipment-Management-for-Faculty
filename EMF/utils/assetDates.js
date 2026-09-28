const MIN_ACQUISITION_YEAR = 1950;

function currentBangkokDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function isValidDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateAssetDates(payload, today = currentBangkokDate()) {
  const acquisitionYear = Number(payload.year_input);
  const currentYear = Number(today.slice(0, 4));
  if (!Number.isInteger(acquisitionYear) || acquisitionYear < MIN_ACQUISITION_YEAR || acquisitionYear > currentYear) {
    return `ปีที่รับเข้าต้องอยู่ระหว่าง ${MIN_ACQUISITION_YEAR} ถึง ${currentYear}`;
  }

  for (const [field, label] of [
    ['nextInspectionDate', 'วันตรวจครั้งถัดไป'],
    ['expectedReplacementDate', 'วันที่คาดว่าเปลี่ยนทดแทน']
  ]) {
    const value = payload[field];
    if (value === undefined || value === null || value === '') continue;
    if (!isValidDateOnly(value)) return `${label}ไม่ถูกต้อง`;
    if (value < today) return `${label}ต้องเป็นวันนี้หรือวันในอนาคต`;
  }

  return null;
}

module.exports = { currentBangkokDate, validateAssetDates };
