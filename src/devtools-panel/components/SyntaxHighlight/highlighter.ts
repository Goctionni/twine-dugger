import { toRegExp } from 'oniguruma-to-es';
import {
  type IOnigLib,
  IRawGrammar,
  type OnigScanner,
  type OnigString,
  Registry,
} from 'vscode-textmate';

class JSOnigString implements OnigString {
  constructor(public readonly content: string) {}
  dispose() {}
}

const supportsIndices = (() => {
  try {
    new RegExp('', 'd');
    return true;
  } catch {
    return false;
  }
})();

function normalizeFlags(flags: string) {
  // dedupe & enforce a stable order; drop invalid combos (u+v)
  const set = new Set(flags.split(''));
  if (set.has('v')) set.delete('u'); // v implies unicode; u+v is invalid
  const order = ['g', 'y', 'i', 'm', 's', 'u', 'v', 'd']; // any order is fine; keep consistent
  return order.filter((f) => set.has(f)).join('');
}
class JSOnigScanner implements OnigScanner {
  private regs: RegExp[];

  constructor(patterns: string[]) {
    this.regs = patterns.map((p) => {
      const base = toRegExp(p); // ← no options object needed here
      let flags = base.flags;

      // VS Code TM expects forward scanning; ensure global-ish search
      if (!flags.includes('g') && !flags.includes('y')) flags += 'g';

      // Add indices if supported
      if (supportsIndices && !flags.includes('d')) flags += 'd';

      // Only add 'u' if neither 'u' nor 'v' present
      if (!flags.includes('u') && !flags.includes('v')) flags += 'u';

      flags = normalizeFlags(flags);
      return new RegExp(base.source, flags);
    });
  }

  findNextMatchSync(str: string | OnigString, startPosition: number) {
    const s = typeof str === 'string' ? str : ((str as any).content as string);

    let best: { patternIndex: number; m: RegExpExecArray; re: RegExp } | null = null;
    for (let i = 0; i < this.regs.length; i++) {
      const re = this.regs[i]!;
      re.lastIndex = startPosition;
      const m = re.exec(s);
      if (!m) continue;
      if (!best || m.index < best.m.index) best = { patternIndex: i, m, re };
      if (m.index === startPosition) break;
    }
    if (!best) return null;

    const m = best.m as RegExpExecArray & { indices?: [number, number][] };
    const caps: { start: number; end: number; length: number }[] = [];

    const start0 = m.index;
    const end0 = m.index + m[0].length;
    caps.push({ start: start0, end: end0, length: end0 - start0 });

    if (m.indices && Array.isArray(m.indices)) {
      for (let i = 1; i < m.length; i++) {
        const rng = (m.indices as any)[i] as [number, number] | undefined;
        if (rng && rng[0] >= 0) caps.push({ start: rng[0], end: rng[1], length: rng[1] - rng[0] });
        else caps.push({ start: -1, end: -1, length: 0 });
      }
    } else {
      // Fallback placement when 'd' unsupported
      let cursor = 0;
      for (let i = 1; i < m.length; i++) {
        const g = m[i];
        if (g == null) {
          caps.push({ start: -1, end: -1, length: 0 });
          continue;
        }
        const local = m[0].indexOf(g, cursor);
        const st = start0 + (local >= 0 ? local : 0);
        caps.push({ start: st, end: st + g.length, length: g.length });
        if (local >= 0) cursor = local + g.length;
      }
    }

    return { index: best.patternIndex, captureIndices: caps };
  }
}

const onigLib: IOnigLib = {
  createOnigScanner: (sources: string[]) => new JSOnigScanner(sources),
  createOnigString: (str: string) => new JSOnigString(str),
};

export function createRegistry(grammars: IRawGrammar[]) {
  return new Registry({
    onigLib: Promise.resolve(onigLib),
    loadGrammar: async (scope: string) => {
      return grammars.find((g) => g.scopeName === scope);
    },
  });
}

interface CreateHighlighterOpts {
  registry: Registry;
  scope: string;
}

export async function createHighlighter({ registry, scope }: CreateHighlighterOpts) {
  const grammar = await registry.loadGrammar(scope);
  if (!grammar) throw new Error('Failed to load grammar');

  return {
    toHtml(code: string): string {
      let ruleStack = null as any;
      const lines = code.split(/\r?\n/);
      const out: string[] = [];

      for (const line of lines) {
        const r = grammar.tokenizeLine(line, ruleStack);
        const parts: string[] = [];
        for (const t of r.tokens) {
          const text = escapeHtml(line.slice(t.startIndex, t.endIndex));
          const cls = t.scopes.join(' ');
          parts.push(cls ? `<span class="${cls}">${text}</span>` : text);
        }
        out.push(parts.join(''));
        ruleStack = r.ruleStack;
      }
      return out.join('\n');
    },
  };
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!,
  );
}
