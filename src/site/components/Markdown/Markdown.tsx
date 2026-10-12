import clsx from 'clsx';
import type { Component } from 'solid-js';
import { type MarkdownLinkReplacer, markdownToHtml } from '../../../core/entities/markdown.ts';
import styles from './Markdown.module.css';

interface MarkdownProps {
  children: string;
  linkReplacer?: MarkdownLinkReplacer;
  class?: string;
}

export const Markdown: Component<MarkdownProps> = (props) => {
  const html = () => markdownToHtml(props.children, props.linkReplacer).html;

  return <div class={clsx(styles.markdown, props.class)} innerHTML={html()} />;
};
