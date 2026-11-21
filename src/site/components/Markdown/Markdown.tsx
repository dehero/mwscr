import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import { type Component, onCleanup } from 'solid-js';
import { type MarkdownLinkReplacer, markdownToHtml } from '../../../core/entities/markdown.ts';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
import { useToaster } from '../Toaster/Toaster.tsx';
import styles from './Markdown.module.css';

interface MarkdownProps {
  children: string;
  linkReplacer?: MarkdownLinkReplacer;
  class?: string;
}

export const Markdown: Component<MarkdownProps> = (props) => {
  const { addToast } = useToaster();

  let textRef: HTMLDivElement | undefined;

  const html = () => markdownToHtml(props.children, props.linkReplacer).html;

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const code = target?.closest('pre, code');

    if (!code) {
      return;
    }

    writeClipboard(code.textContent ?? '');
    addToast(localize(texts.content.codeCopied));
  };

  onCleanup(() => {
    textRef?.removeEventListener('click', handleClick);
  });

  return (
    <div
      ref={(el) => {
        textRef = el;
        el.addEventListener('click', handleClick);
      }}
      class={clsx(styles.markdown, props.class)}
      innerHTML={html()}
    />
  );
};
