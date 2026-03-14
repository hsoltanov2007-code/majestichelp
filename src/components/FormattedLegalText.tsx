import type { ReactNode } from "react";

/**
 * Renders legal text with:
 * - Line breaks preserved (\n)
 * - Bullet points (• and а), б), в)) as styled list items
 * - Red paragraph separators between * delimited sections
 * - Organization lists (ORG - description) as formatted blocks
 */
export function FormattedLegalText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;

  // Clean * wrappers around bullet letters: *а)* → а)
  let cleaned = text.replace(/\*([а-я]\d?\))\*/g, '$1');
  // Remove remaining lone asterisks used as emphasis markers
  cleaned = cleaned.replace(/\*/g, '');

  // Split by \n\n for paragraph breaks, then handle \n within paragraphs
  const blocks = cleaned.split(/\n\n+/);
  const result: ReactNode[] = [];

  blocks.forEach((block, bIdx) => {
    if (bIdx > 0) {
      result.push(<span key={`gap-${bIdx}`} className="block h-3" />);
    }

    // Check if this block has org patterns
    const orgPattern = /(?:^|\n)((?:LSPD|LSCSD|FIB|SANG|Government|EMS|WN|GOV|USSS|NSS|DOJ|DA|PD|SD)[A-Z/]*)\s*[-–—]\s*/g;
    const hasOrgList = orgPattern.test(block);
    orgPattern.lastIndex = 0;

    if (hasOrgList) {
      // Split into intro text + org entries
      const positions: { start: number; org: string; descStart: number }[] = [];
      let m: RegExpExecArray | null;
      while ((m = orgPattern.exec(block)) !== null) {
        positions.push({ start: m.index, org: m[1], descStart: m.index + m[0].length });
      }

      const introText = positions.length > 0 ? block.slice(0, positions[0].start).trim() : block;
      if (introText) {
        result.push(<span key={`${bIdx}-intro`} className="block mb-3">{renderLines(introText, bIdx, 'intro')}</span>);
      }

      positions.forEach((pos, oi) => {
        const end = oi < positions.length - 1 ? positions[oi + 1].start : block.length;
        const desc = block.slice(pos.descStart, end).replace(/\*+/g, '').trim();
        result.push(
          <span key={`${bIdx}-org-${oi}`} className="flex items-start gap-2.5 mt-2 first:mt-0">
            <span className="inline-flex px-2.5 py-0.5 rounded-md bg-accent/10 text-accent text-[11px] font-bold shrink-0 border border-accent/20 mt-0.5 tracking-wide">
              {pos.org}
            </span>
            <span className="text-foreground/70 leading-relaxed">{desc}</span>
          </span>
        );
      });
      return;
    }

    // Render lines within block
    result.push(<span key={`${bIdx}-content`}>{renderLines(block, bIdx, 'main')}</span>);
  });

  return <span className={className}>{result}</span>;
}

function renderLines(block: string, bIdx: number, prefix: string): ReactNode[] {
  const result: ReactNode[] = [];
  
  // Split by single newlines
  const lines = block.split('\n');
  
  if (lines.length === 1) {
    return renderInline(block, bIdx, prefix);
  }

  lines.forEach((line, li) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if line starts with bullet •
    if (trimmed.startsWith('•')) {
      const text = trimmed.slice(1).trim();
      result.push(
        <span key={`${bIdx}-${prefix}-line-${li}`} className="flex items-start gap-2 mt-1.5 first:mt-0">
          <span className="text-accent shrink-0 mt-0.5 text-xs">●</span>
          <span className="leading-relaxed">{text}</span>
        </span>
      );
      return;
    }

    // Check for cyrillic bullet а) б) в)
    const bulletMatch = trimmed.match(/^([а-я]\d?\))\s*(.*)/);
    if (bulletMatch) {
      result.push(
        <span key={`${bIdx}-${prefix}-line-${li}`} className="flex items-start gap-1.5 mt-1 first:mt-0 pl-1">
          <span className="font-bold text-accent shrink-0">{bulletMatch[1]}</span>
          <span className="leading-relaxed">{bulletMatch[2]}</span>
        </span>
      );
      return;
    }

    // Plain text line
    if (li > 0) {
      result.push(<span key={`${bIdx}-${prefix}-br-${li}`} className="block mt-1" />);
    }
    result.push(<span key={`${bIdx}-${prefix}-line-${li}`}>{trimmed}</span>);
  });

  return result;
}

function renderInline(paragraph: string, pIdx: number, prefix: string): ReactNode[] {
  const result: ReactNode[] = [];
  
  // Check for * paragraph separators
  const segments = paragraph.split(/\s\*\s/).filter(s => s.trim().length > 0);
  if (segments.length > 1) {
    segments.forEach((seg, si) => {
      if (si > 0) {
        result.push(
          <span key={`sep-${pIdx}-${si}`} className="block my-1.5">
            <span className="block w-full h-[1.5px] rounded-full bg-destructive/25" />
          </span>
        );
      }
      result.push(<span key={`seg-${pIdx}-${si}`}>{renderBullets(seg, pIdx, `${prefix}-seg${si}`)}</span>);
    });
    return result;
  }

  return renderBullets(paragraph, pIdx, prefix);
}

function renderBullets(paragraph: string, pIdx: number, prefix: string): ReactNode[] {
  const result: ReactNode[] = [];
  const bulletPattern = /([а-я]\d?\))\s*/g;
  
  const bullets: { index: number; match: string; fullMatch: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = bulletPattern.exec(paragraph)) !== null) {
    const idx = m.index;
    if (idx === 0 || /[\s;.]/.test(paragraph[idx - 1])) {
      bullets.push({ index: idx, match: m[1], fullMatch: m[0] });
    }
  }

  if (bullets.length === 0) {
    // Check for • bullet points inline
    const dotBullets = paragraph.split(/(?:^|\s)•\s*/);
    if (dotBullets.length > 1) {
      const intro = dotBullets[0].trim();
      if (intro) {
        result.push(<span key={`${pIdx}-${prefix}-intro`}>{intro}</span>);
      }
      dotBullets.slice(1).forEach((item, i) => {
        const text = item.trim();
        if (!text) return;
        result.push(
          <span key={`${pIdx}-${prefix}-dot-${i}`} className="flex items-start gap-2 mt-1.5 first:mt-0">
            <span className="text-accent shrink-0 mt-0.5 text-xs">●</span>
            <span className="leading-relaxed">{text}</span>
          </span>
        );
      });
      return result;
    }
    result.push(<span key={`${pIdx}-${prefix}-plain`}>{paragraph}</span>);
    return result;
  }

  const beforeFirst = paragraph.slice(0, bullets[0].index).trim();
  if (beforeFirst) {
    result.push(<span key={`${pIdx}-${prefix}-pre`}>{beforeFirst} </span>);
  }

  bullets.forEach((bullet, bIdx) => {
    const textStart = bullet.index + bullet.fullMatch.length;
    const textEnd = bIdx < bullets.length - 1 ? bullets[bIdx + 1].index : paragraph.length;
    const content = paragraph.slice(textStart, textEnd).trim();
    
    result.push(
      <span key={`${pIdx}-${prefix}-b${bIdx}`} className="flex items-start gap-1.5 mt-1 first:mt-0 pl-1">
        <span className="font-bold text-accent shrink-0">{bullet.match}</span>
        <span className="leading-relaxed">{content}</span>
      </span>
    );
  });

  return result;
}