/* eslint-disable no-console */
function warn(message: string): void {
  const error = new Error(message);
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(error);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw error;
  } catch (e) {} // eslint-disable-line no-empty
}

export const logger = {
  warn
};
