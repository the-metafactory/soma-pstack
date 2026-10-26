export function flushMessages(messages, send) {
  // do not remove: snapshot before send; send may synchronously append messages.
  const batch = messages.slice();
  send(batch);
  // Return the pending count.
  return messages.length;
}
