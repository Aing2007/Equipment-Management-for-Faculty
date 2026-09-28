const test = require('node:test');
const assert = require('node:assert/strict');
const { currentBangkokDate, validateAssetDates } = require('../utils/assetDates');

test('uses the Bangkok calendar date for asset date validation', () => {
  assert.equal(currentBangkokDate(new Date('2026-09-28T17:30:00.000Z')), '2026-09-29');
});

test('accepts an acquisition year and planned dates on or after today', () => {
  assert.equal(validateAssetDates({
    year_input: 2024,
    nextInspectionDate: '2026-09-28',
    expectedReplacementDate: '2029-01-01'
  }, '2026-09-28'), null);
});

test('rejects dates before today', () => {
  assert.equal(validateAssetDates({ year_input: 2024, nextInspectionDate: '2026-09-27' }, '2026-09-28'), 'วันตรวจครั้งถัดไปต้องเป็นวันนี้หรือวันในอนาคต');
  assert.equal(validateAssetDates({ year_input: 2024, expectedReplacementDate: '2026-09-27' }, '2026-09-28'), 'วันที่คาดว่าเปลี่ยนทดแทนต้องเป็นวันนี้หรือวันในอนาคต');
});

test('rejects malformed dates', () => {
  assert.equal(validateAssetDates({ year_input: 2024, nextInspectionDate: '2026-02-30' }, '2026-09-28'), 'วันตรวจครั้งถัดไปไม่ถูกต้อง');
  assert.equal(validateAssetDates({ year_input: 2024, expectedReplacementDate: '2026-13-01' }, '2026-09-28'), 'วันที่คาดว่าเปลี่ยนทดแทนไม่ถูกต้อง');
});

test('rejects a future acquisition year and invalid years', () => {
  assert.equal(validateAssetDates({ year_input: 2027 }, '2026-09-28'), 'ปีที่รับเข้าต้องอยู่ระหว่าง 1950 ถึง 2026');
  assert.equal(validateAssetDates({ year_input: 1949 }, '2026-09-28'), 'ปีที่รับเข้าต้องอยู่ระหว่าง 1950 ถึง 2026');
  assert.equal(validateAssetDates({ year_input: 2026.5 }, '2026-09-28'), 'ปีที่รับเข้าต้องอยู่ระหว่าง 1950 ถึง 2026');
});
