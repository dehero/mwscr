import clsx from 'clsx';
import type { Component } from 'solid-js';
import { markdownToInlineHtml } from '../../../core/entities/markdown.js';
import styles from './Markdown.module.css';

interface MarkdownProps {
  children: string;
  disableLinks?: boolean;
  class?: string;
}

export const Markdown: Component<MarkdownProps> = (props) => {
  const html = () => markdownToInlineHtml(props.children, props.disableLinks ? () => [] : undefined).html;

  return <p class={clsx(styles.markdown, props.class)} innerHTML={html()} />;
};
