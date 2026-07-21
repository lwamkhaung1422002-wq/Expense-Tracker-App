export function logInfo(event, details = {}) {
  console.log(JSON.stringify({ level: "info", event, ...details }));
}

export function logError(event, details = {}) {
  console.error(JSON.stringify({ level: "error", event, ...details }));
}
