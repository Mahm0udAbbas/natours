const sanitizeHtml = require('sanitize-html');

exports.toPlainText = (value) => {
  if (typeof value !== 'string') return value;

  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, ' ')
    .trim();
};
