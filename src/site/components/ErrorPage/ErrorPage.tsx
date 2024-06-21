import type { Component } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import YellowExclamationMark from '../../images/exclamation.svg';
import { Frame } from '../Frame/Frame.js';
import styles from './ErrorPage.module.css';

export const ErrorPage: Component = () => {
  const pageContext = usePageContext();

  let msg: string;
  const { abortReason } = pageContext;

  if (typeof abortReason === 'string') {
    // Handle `throw render(abortStatusCode, `You cannot access ${someCustomMessage}`)`
    msg = abortReason;
  } else {
    // Fallback error message
    msg = pageContext.is404
      ? "This page doesn't exist."
      : 'Something went wrong. Sincere apologies. Try again (later).';
  }

  return (
    <Frame variant="thin" class={styles.container}>
      <section class={styles.info}>
        <img src={YellowExclamationMark} class={styles.image} alt="yellow exclamation mark" />
        <p class={styles.message}>{msg}</p>
      </section>
    </Frame>
  );
};
