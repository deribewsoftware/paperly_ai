import { useEffect, useRef, useState } from "react";

/** Advance index: whole HTML tag, or whitespace + one word (never splits inside a tag). */
export function nextHtmlChunkEnd(html: string, from: number): number {
  const n = html.length;
  if (from >= n) return n;
  if (html[from] === "<") {
    const close = html.indexOf(">", from);
    return close < 0 ? n : close + 1;
  }
  let i = from;
  while (i < n && /\s/.test(html[i])) i++;
  if (i >= n) return n;
  while (i < n && !/\s/.test(html[i]) && html[i] !== "<") i++;
  return i;
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

/**
 * While `isActive`, reveals `targetHtml` incrementally (word/tag chunks) for a typing effect.
 * When inactive, follows `targetHtml` immediately.
 */
export function useTypewriterHtml(
  targetHtml: string,
  isActive: boolean,
  msPerChunk = 42
) {
  const [displayed, setDisplayed] = useState(targetHtml);
  const targetRef = useRef(targetHtml);
  targetRef.current = targetHtml;

  useEffect(() => {
    if (!isActive) {
      setDisplayed(targetHtml);
    }
  }, [isActive, targetHtml]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const id = window.setInterval(() => {
      setDisplayed((revealed) => {
        const target = targetRef.current;
        if (revealed === target) {
          return revealed;
        }
        let base = revealed;
        if (!target.startsWith(revealed)) {
          const lcp = commonPrefixLength(revealed, target);
          base = target.slice(0, lcp);
        }
        const end = nextHtmlChunkEnd(target, base.length);
        return target.slice(0, end);
      });
    }, msPerChunk);
    return () => window.clearInterval(id);
  }, [isActive, msPerChunk]);

  return displayed;
}
