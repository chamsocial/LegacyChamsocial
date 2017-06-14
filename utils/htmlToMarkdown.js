'use strict';

const toMarkdown = require('to-markdown');
const striptags = require('striptags');

const tags = [
  'a', 'strong', 'b', 'em', 'i',
  'p', 'blockquote', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img',
  'ol', 'ul', 'li'
];

module.exports = function (text) {

  // Replace email footer lines with hr
  text = text.replace(/-- /g, '<hr>');

  // if the text don't include html breaks
  if (!text.match(/<br ?\/?>|<p>/g)) {
    text = text.replace(/\n/g, '  \n');
  }

  // make sure it's html (prevent linebreaks to disapear)
  text = striptags(text, tags).replace(/\n/g, '<br>\n');

  // Convert it to markdown
  text = striptags(toMarkdown(text, {
    gfm: true,
    converters: [{
      filter: ['br'],
      replacement: () => '  \n'
    }]
  }));

  // Simple XXS protection
  text = text
    .replace(/javascript:/g, 'javascript ')
    .replace(/\'/g, '&#39;')
    .replace(/\"/g, '&quot;');

  return text;
};
