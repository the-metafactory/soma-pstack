export function flushMessages(messages, send) {
  const batch = messages.slice();
  send(batch);
  return messages.length;
}
