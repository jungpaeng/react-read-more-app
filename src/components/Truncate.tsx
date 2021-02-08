import React from 'react';

interface TruncateProps {
  width?: number;

  ellipsis?: string;
  lines?: false | number;
  trimWhitespace?: boolean;
  children: React.ReactNode;
  onTruncate?: (didTruncated: boolean) => void;
}

function Truncate({ width, ellipsis = '...', lines = 1, trimWhitespace = false, children, onTruncate }: TruncateProps) {
  const [textElContent, setTextElContent] = React.useState<React.ReactNode>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [targetWidth, setTargetWidth] = React.useState(0);

  const targetElRef = React.useRef<HTMLSpanElement | null>(null);
  const textElRef = React.useRef<HTMLSpanElement | null>(null);
  const ellipsisElRef = React.useRef<HTMLSpanElement | null>(null);

  const canvasContext = React.useRef<CanvasRenderingContext2D | null>(null);

  const innerText = React.useCallback((node: HTMLElement) => {
    const div = document.createElement('div');
    const contentKey = 'innerText' in window.HTMLElement.prototype ? 'innerText' : 'textContent';

    div.innerHTML = node.innerText.replace(/\r\n|\r|\n/g, ' ');
    let text = div[contentKey];

    const test = document.createElement('div');
    test.innerHTML = 'foo<br/>bar';

    if (test[contentKey]?.replace(/\r\n|\r/g, '\n') !== 'foo\nbar') {
      div.innerHTML = div.innerHTML.replace(/<br.*?[\/]?>/gi, '\n');
      text = div[contentKey];
    }

    return text;
  }, []);

  const getEllipsisWidth = (node: HTMLElement) => node.offsetWidth;
  const trimRight = (text: string) => text.replace(/\s+$/, '');
  const measureWidth = (text: string) => canvasContext.current?.measureText(text).width!;

  const getLines = () => {
    const lineList: string[] = [];
    const text = innerText(textElRef.current!);
    const textLines = text?.split('\n').map((line) => line.split(' '))!;
    const ellipsisWidth = getEllipsisWidth(ellipsisElRef.current!);

    let didTruncate = true;

    for (let line = 1; line <= lines; line++) {
      const textWords = textLines[0];

      if (!textWords.length) {
        lineList.push();
        textLines.shift();
        line -= 1;
        continue;
      }

      let resultLine = textWords.join(' ');

      if (measureWidth(resultLine) <= targetWidth) {
        if (textLines.length === 1) {
          didTruncate = false;

          lineList.push(resultLine);
          break;
        }
      }

      if (line === lines) {
        const textReset = textWords.join(' ');

        let lower = 0;
        let upper = textReset.length - 1;

        while (lower <= upper) {
          const middle = Math.floor((lower + upper) / 2);
          const testLine = textReset.slice(0, middle + 1);

          if (measureWidth(testLine) + ellipsisWidth <= targetWidth) {
            lower = middle + 1;
          } else {
            upper = middle - 1;
          }
        }

        let lastLineText = textReset.slice(0, lower);

        if (trimWhitespace) {
          lastLineText = trimRight(lastLineText);

          while (!lastLineText.length && lineList.length) {
            const prevLine = lineList.pop()!;
            lastLineText = trimRight(prevLine);
          }
        }

        resultLine = ((<span>{lastLineText}</span>) as unknown) as string;
      } else {
        let lower = 0;
        let upper = textWords.length - 1;

        while (lower <= upper) {
          const middle = Math.floor((lower + upper) / 2);
          const testLine = textWords.slice(0, middle + 1).join(' ');

          if (measureWidth(testLine) <= targetWidth) {
            lower = middle + 1;
          } else {
            upper = middle - 1;
          }
        }

        if (lower === 0) {
          line = (lines as number) - 1;
          continue;
        }

        resultLine = textWords.slice(0, lower).join(' ');
        textLines[0].splice(0, lower);
      }

      lineList.push(resultLine);
    }

    return lineList;
  };

  const renderLine = React.useCallback((line: string, idx: number, arr: string[]) => {
    if (idx === arr.length - 1) {
      return <span>{line}</span>;
    } else {
      const br = <br key={idx + 'br'} />;

      if (line) {
        return [<span key={idx}>{line}</span>, br];
      } else {
        return br;
      }
    }
  }, []);

  React.useEffect(() => {
    const calcTargetWidth = (callback?: () => void): any => {
      if (!targetElRef.current) return null;

      const targetWidth =
        width || Math.floor((targetElRef.current.parentNode as Element)?.getBoundingClientRect().width);

      if (!targetWidth) return window.requestAnimationFrame(() => calcTargetWidth(callback));

      const style = window.getComputedStyle(targetElRef.current);
      // @ts-ignore
      const font = [style['font-weight'], style['font-style'], style['font-size'], style['font-family']].join(' ');
      canvasContext.current!.font = font;

      setTargetWidth(targetWidth);
      callback?.();
    };

    const onResize = () => {
      calcTargetWidth();
    };

    const canvas = document.createElement('canvas');
    canvasContext.current = canvas.getContext('2d');

    calcTargetWidth(() => {
      if (textElRef.current) {
        (textElRef.current.parentNode as Element).removeChild(textElRef.current);
      }
    });

    window.addEventListener('resize', onResize);

    return () => {
      if (ellipsisElRef.current?.parentNode) {
        ellipsisElRef.current.parentNode.removeChild(ellipsisElRef.current);
      }

      window.removeEventListener('resize', onResize);
      // window.cancelAnimationFrame(timeout);
    };
  }, [width]);

  React.useEffect(() => {
    const mounted = !!(targetElRef.current && targetWidth);

    if (typeof window !== 'undefined' && mounted) {
      if (lines > 0) {
        setTextElContent(getLines().map(renderLine));
      } else {
        setTextElContent(children);
      }
    }
  }, [lines, targetWidth]);

  return (
    <span ref={targetElRef}>
      <span>{textElContent}</span>
      <span ref={textElRef}>{children}</span>
      <span ref={ellipsisElRef}>{ellipsis}</span>
    </span>
  );
}

export default Truncate;
