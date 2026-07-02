const { toPlainText } = require('../../utils/sanitizeText');

describe('toPlainText', () => {
  test('removes markup and trims text', () => {
    expect(toPlainText('  <b>Hello</b> world  ')).toBe('Hello world');
  });

  test('passes non-string values through for schema validation', () => {
    expect(toPlainText(42)).toBe(42);
  });
});
