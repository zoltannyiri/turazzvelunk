const sanitizeHtml = require('sanitize-html');

const allowedTags = [
  'p', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li',
  'blockquote', 'hr', 'br', 'a', 'code', 'pre', 'img'
];

const normalizeBlogImageSource = (source) => {
  const value = String(source || '').trim();
  const uploadPath = value.match(/\/uploads\/blog\/[a-z0-9._-]+/i)?.[0];
  return uploadPath || '';
};

const sanitizeBlogContent = (content) => sanitizeHtml(String(content || ''), {
  allowedTags,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'data-align', 'data-width', 'data-wrap']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        href: attribs.href,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    }),
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        src: normalizeBlogImageSource(attribs.src),
        alt: String(attribs.alt || '').slice(0, 250),
        ...(attribs.title ? { title: String(attribs.title).slice(0, 250) } : {}),
        'data-align': ['left', 'center', 'right'].includes(attribs['data-align'])
          ? attribs['data-align']
          : 'center',
        'data-width': ['50', '75', '100'].includes(attribs['data-width'])
          ? attribs['data-width']
          : '100',
        'data-wrap': ['none', 'left', 'right'].includes(attribs['data-wrap'])
          ? attribs['data-wrap']
          : 'none'
      }
    })
  },
  exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src
}).trim();

const toPlainText = (content) => sanitizeHtml(
  String(content || '').replace(/<\/(p|h[1-6]|li|blockquote|pre)>/gi, '$& '),
  {
  allowedTags: [],
  allowedAttributes: {}
  }
)
  .replace(/&nbsp;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getReadingMinutes = (content) => {
  const wordCount = toPlainText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

module.exports = { sanitizeBlogContent, toPlainText, getReadingMinutes };
