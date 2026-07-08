import * as fs from 'fs';
import * as path from 'path';

export type TemplateEngine = 'django' | 'jinja' | 'nunjucks' | 'plain-html';

export interface ProcessResult {
  html: string;
  variables: string[];
  warnings: string[];
  engine: TemplateEngine;
}

export interface ProcessOptions {
  showElseBranch: boolean;
  mockStyle: 'highlight' | 'value';
  maxIncludeDepth: number;
}

const VAR_RE = /\{\{\s*([\w.\|:'"() \-\[\]]+?)\s*\}\}/g;
const TAG_RE = /\{%\s*([\w]+)([\s\S]*?)\s*%\}/g;
const COMMENT_RE = /\{#[\s\S]*?#\}|\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/g;

export function detectEngine(filePath: string, content: string): TemplateEngine {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.njk') return 'nunjucks';
  if (ext === '.jinja' || ext === '.jinja2' || ext === '.j2') return 'jinja';
  if (/\{%\s*load\s+\w+/.test(content) || /\{%\s*csrf_token\s*%\}/.test(content) || /\{%\s*static\s+/.test(content)) {
    return 'django';
  }
  if (/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/.test(content)) return 'jinja';
  return 'plain-html';
}

function findWorkspaceFile(baseDir: string, ref: string, searchRoots: string[]): string | null {
  const cleaned = ref.replace(/^['"]|['"]$/g, '');
  const direct = path.resolve(baseDir, cleaned);
  if (fs.existsSync(direct)) return direct;
  for (const root of searchRoots) {
    const candidate = path.resolve(root, cleaned);
    if (fs.existsSync(candidate)) return candidate;
    // Django/Jinja convention: app/templates/<ref>
    const nested = findByBasename(root, cleaned);
    if (nested) return nested;
  }
  return null;
}

function findByBasename(root: string, ref: string): string | null {
  try {
    const target = ref.split('/').pop();
    const stack = [root];
    let guard = 0;
    while (stack.length && guard < 4000) {
      guard++;
      const dir = stack.pop()!;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const e of entries) {
        if (e.name === 'node_modules' || e.name.startsWith('.git')) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.name === target && full.replace(/\\/g, '/').includes(ref.replace(/\\/g, '/'))) {
          return full;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function stripComments(src: string): string {
  return src.replace(COMMENT_RE, '');
}

/** Resolve {% extends %} by loading the parent chain and slotting child {% block %} content in. */
function resolveInheritance(
  content: string,
  filePath: string,
  searchRoots: string[],
  warnings: string[],
  depth: number,
  maxDepth: number
): string {
  const extendsMatch = content.match(/\{%\s*extends\s+['"]([^'"]+)['"]\s*%\}/);
  if (!extendsMatch) return content;
  if (depth >= maxDepth) {
    warnings.push('Max {% extends %} depth reached, stopping inheritance resolution.');
    return content;
  }

  const parentRef = extendsMatch[1];
  const baseDir = path.dirname(filePath);
  const parentPath = findWorkspaceFile(baseDir, parentRef, searchRoots);
  if (!parentPath) {
    warnings.push(`Could not resolve extended template: "${parentRef}". Rendering child blocks only.`);
    return stripBlockTags(content);
  }

  let parentContent = fs.readFileSync(parentPath, 'utf-8');
  parentContent = stripComments(parentContent);
  parentContent = resolveInheritance(parentContent, parentPath, searchRoots, warnings, depth + 1, maxDepth);

  // Extract child blocks: name -> inner content
  const childBlocks = new Map<string, string>();
  const blockRe = /\{%\s*block\s+([\w]+)\s*%\}([\s\S]*?)\{%\s*endblock(?:\s+\1)?\s*%\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(content)) !== null) {
    childBlocks.set(m[1], m[2]);
  }

  // Replace matching blocks in parent with child content; keep parent default if child didn't override.
  const merged = parentContent.replace(blockRe, (_full, name: string, parentInner: string) => {
    return childBlocks.has(name) ? childBlocks.get(name)! : parentInner;
  });

  return merged;
}

function stripBlockTags(content: string): string {
  return content
    .replace(/\{%\s*block\s+[\w]+\s*%\}/g, '')
    .replace(/\{%\s*endblock(?:\s+[\w]+)?\s*%\}/g, '');
}

/** Inline {% include %} tags recursively, with a depth guard. */
function resolveIncludes(
  content: string,
  filePath: string,
  searchRoots: string[],
  warnings: string[],
  depth: number,
  maxDepth: number
): string {
  if (depth >= maxDepth) return content;
  const includeRe = /\{%\s*include\s+['"]([^'"]+)['"][^%]*%\}/g;
  return content.replace(includeRe, (_full, ref: string) => {
    const baseDir = path.dirname(filePath);
    const resolved = findWorkspaceFile(baseDir, ref, searchRoots);
    if (!resolved) {
      warnings.push(`Could not resolve included template: "${ref}".`);
      return `<!-- HTMLens: could not resolve include "${ref}" -->`;
    }
    let inc = fs.readFileSync(resolved, 'utf-8');
    inc = stripComments(inc);
    return resolveIncludes(inc, resolved, searchRoots, warnings, depth + 1, maxDepth);
  });
}

function mockValueFor(expr: string, style: 'highlight' | 'value'): string {
  const varName = expr.split('|')[0].trim();
  if (style === 'value') {
    if (/count|num|total|qty|quantity/i.test(varName)) return '42';
    if (/price|amount|cost/i.test(varName)) return '99.00';
    if (/date|time|created|updated/i.test(varName)) return new Date().toLocaleDateString();
    if (/name|title|label/i.test(varName)) return `Sample ${varName.split('.').pop()}`;
    if (/url|href|link/i.test(varName)) return '#';
    return `Sample ${varName}`;
  }
  return `<span class="he-var" title="${escapeAttr(varName)}">{{ ${escapeHtml(varName)} }}</span>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

/** Mock-render {% if %}/{% for %}/{% with %} blocks and strip tags with no visual output. */
function processControlFlow(content: string, opts: ProcessOptions): string {
  let out = content;

  // {% for x in list %} ... {% empty %} ... {% endfor %} -> render body once, tag as repeated
  const forRe = /\{%\s*for\s+(\w+)\s+in\s+([\w.]+)\s*%\}([\s\S]*?)(?:\{%\s*empty\s*%\}([\s\S]*?))?\{%\s*endfor\s*%\}/g;
  out = out.replace(forRe, (_full, loopVar: string, listExpr: string, body: string) => {
    const rendered = body.replace(new RegExp(`\\b${loopVar}\\b`, 'g'), `${loopVar}`);
    return (
      `<div class="he-loop" data-list="${escapeAttr(listExpr)}">` +
      `<div class="he-loop-badge">↻ repeats for each item in "${escapeHtml(listExpr)}"</div>` +
      rendered +
      `</div>`
    );
  });

  // {% if cond %} ... {% elif %} ... {% else %} ... {% endif %}
  const ifRe = /\{%\s*if\s+([\s\S]*?)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g;
  out = out.replace(ifRe, (_full, cond: string, ifBody: string, elseBody?: string) => {
    const branch = opts.showElseBranch && elseBody !== undefined ? elseBody : ifBody;
    const label = opts.showElseBranch && elseBody !== undefined ? 'else' : 'if';
    return `<div class="he-cond" data-cond="${escapeAttr(cond)}"><div class="he-cond-badge">◇ ${label}: ${escapeHtml(
      cond
    )}</div>${branch}</div>`;
  });

  // {% with x=y %} ... {% endwith %} -> just unwrap
  out = out.replace(/\{%\s*with[\s\S]*?%\}/g, '').replace(/\{%\s*endwith\s*%\}/g, '');

  // strip remaining known no-op / side-effect tags
  out = out
    .replace(/\{%\s*load[\s\S]*?%\}/g, '')
    .replace(/\{%\s*csrf_token\s*%\}/g, '<!-- csrf_token -->')
    .replace(/\{%\s*static\s+['"]([^'"]+)['"]\s*%\}/g, '$1')
    .replace(/\{%\s*url\s+[^%]*%\}/g, '#')
    .replace(/\{%\s*trans\s+['"]([^'"]+)['"]\s*%\}/g, '$1')
    .replace(/\{%\s*autoescape[\s\S]*?%\}/g, '')
    .replace(/\{%\s*endautoescape\s*%\}/g, '');

  // any leftover unhandled tags -> visible marker instead of silently vanishing
  out = out.replace(TAG_RE, (full, tagName: string) => `<!-- HTMLens: unhandled tag {% ${tagName} %} -->`);

  return out;
}

export function processTemplate(
  content: string,
  filePath: string,
  searchRoots: string[],
  opts: ProcessOptions
): ProcessResult {
  const engine = detectEngine(filePath, content);
  const warnings: string[] = [];
  const variables = new Set<string>();

  let working = stripComments(content);
  working = resolveInheritance(working, filePath, searchRoots, warnings, 0, opts.maxIncludeDepth);
  working = resolveIncludes(working, filePath, searchRoots, warnings, 0, opts.maxIncludeDepth);
  working = stripBlockTags(working);
  working = processControlFlow(working, opts);

  working = working.replace(VAR_RE, (_full, expr: string) => {
    variables.add(expr.split('|')[0].trim());
    return mockValueFor(expr, opts.mockStyle);
  });

  return { html: working, variables: Array.from(variables), warnings, engine };
}
