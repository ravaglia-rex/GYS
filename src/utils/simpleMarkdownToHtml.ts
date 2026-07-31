/**
 * Minimal Markdown → HTML for published legal docs (headings, paragraphs, lists,
 * tables, links, bold). Not a full CommonMark parser.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label: string, href: string) => {
      const safeHref = escapeHtml(href.trim());
      const isExternal = /^https?:\/\//i.test(href.trim());
      const rel = isExternal ? ' rel="noopener noreferrer"' : '';
      const target = isExternal ? ' target="_blank"' : '';
      return `<a href="${safeHref}"${target}${rel}>${label}</a>`;
    }
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

function slugify(heading: string): string {
  const scheduleMatch = /^schedule\s+(\d+)\b/i.exec(heading);
  if (scheduleMatch) {
    return `schedule-${scheduleMatch[1]}`;
  }
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return '';
  const parseRow = (row: string) =>
    row
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  const header = parseRow(rows[0]);
  const bodyRows = rows.slice(2).map(parseRow);
  const th = header.map((c) => `<th>${inlineFormat(c)}</th>`).join('');
  const trs = bodyRows
    .map((cols) => `<tr>${cols.map((c) => `<td>${inlineFormat(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="legal-table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

export function simpleMarkdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${inlineFormat(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    const tag = listOrdered ? 'ol' : 'ul';
    html.push(
      `<${tag}>${listItems.map((item) => `<li>${inlineFormat(item)}</li>`).join('')}</${tag}>`
    );
    listItems = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\|.+\|/.test(line) && i + 1 < lines.length && /^\|?\s*[-:| ]+\|/.test(lines[i + 1])) {
      flushParagraph();
      flushList();
      const tableLines: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text);
      html.push(`<h${level} id="${id}">${inlineFormat(text)}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      flushList();
      html.push('<hr />');
      i += 1;
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      flushParagraph();
      if (listItems.length > 0 && listOrdered) flushList();
      listOrdered = false;
      listItems.push(ul[1]);
      i += 1;
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(line);
    if (ol) {
      flushParagraph();
      if (listItems.length > 0 && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(ol[1]);
      i += 1;
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      i += 1;
      continue;
    }

    if (line.trim().startsWith('> ')) {
      flushParagraph();
      flushList();
      html.push(`<blockquote><p>${inlineFormat(line.replace(/^>\s?/, ''))}</p></blockquote>`);
      i += 1;
      continue;
    }

    flushList();
    paragraph.push(line.trim());
    i += 1;
  }

  flushParagraph();
  flushList();
  return html.join('\n');
}
