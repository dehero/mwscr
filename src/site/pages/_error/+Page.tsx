import { usePageContext } from 'vike-solid/usePageContext';

export default function Page() {
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

  return <p>{msg}</p>;
}
