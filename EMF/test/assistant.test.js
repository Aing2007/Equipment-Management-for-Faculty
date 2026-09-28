const assert = require('node:assert/strict');
const test = require('node:test');
const {
  AssistantError,
  askOpenRouter,
  createEquipmentQuery,
  currentMonthRange,
  searchTokens
} = require('../services/assistant');

test('retrieves upcoming inspections for inspection questions', () => {
  const query = createEquipmentQuery('ครุภัณฑ์ใดใกล้ถึงรอบตรวจ?', new Date(2026, 8, 28));
  assert.deepEqual(query, {
    $and: [{ nextInspectionDate: { $lte: new Date(2026, 10, 12) } }]
  });
});

test('retrieves equipment by escaped identifying terms', () => {
  const query = createEquipmentQuery('หาเครื่องพิมพ์ HP+Laser', new Date(2026, 8, 28));
  assert.equal(query.$and.length, 1);
  assert.equal(query.$and[0].$or.length, 2);
  assert.match(query.$and[0].$or[1].$or[0].name.source, /\\\+/);
});

test('excludes summary filler words from search terms', () => {
  assert.deepEqual(searchTokens('สรุปจำนวนครุภัณฑ์ เดือนนี้ เครื่องพิมพ์'), ['สรุปจำนวนครุภัณฑ์', 'เครื่องพิมพ์']);
});

test('calculates current-month bounds across year boundaries', () => {
  const { start, end } = currentMonthRange(new Date(2026, 11, 18));
  assert.equal(start.toISOString(), new Date(2026, 11, 1).toISOString());
  assert.equal(end.toISOString(), new Date(2027, 0, 1).toISOString());
});

test('uses OpenRouter with the configured server-side key and parses its answer', async (context) => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.OPENROUTER_MODEL;
  context.after(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = originalModel;
  });
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MODEL = 'test/model';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    assert.equal(JSON.parse(options.body).model, 'test/model');
    return new Response(JSON.stringify({ choices: [{ message: { content: 'มีครุภัณฑ์ 3 รายการ' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  assert.equal(await askOpenRouter('สรุปจำนวนครุภัณฑ์', [], { count: 3 }), 'มีครุภัณฑ์ 3 รายการ');
});

test('reports missing OpenRouter configuration explicitly', async (context) => {
  const originalKey = process.env.OPENROUTER_API_KEY;
  context.after(() => {
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  });
  delete process.env.OPENROUTER_API_KEY;

  await assert.rejects(askOpenRouter('ทดสอบ', [], {}), (error) => error instanceof AssistantError && error.status === 503);
});
