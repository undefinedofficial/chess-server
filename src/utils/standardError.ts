import sendToSentry, { SentryOptions } from "./sendToSentry";

const standardError = (
  error: Error,
  options: SentryOptions = { tags: { hz: "'undefined' guilty" } }
) => {
  const { message } = error;
  sendToSentry(error, options);
  return { error: { message } };
};

export default standardError;
