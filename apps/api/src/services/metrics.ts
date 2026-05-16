export const metrics = {
  chatRequests: 0,
  toolCallsApplied: 0,
  toolCallsRejected: 0,
  voiceTranscriptions: 0,
  ordersPlaced: 0,
  claudeLatencyMs: [] as number[],
  toolCallDistribution: {} as Record<string, number>,
};

export function recordChatRequest(latencyMs: number) {
  metrics.chatRequests++;
  metrics.claudeLatencyMs.push(latencyMs);
  if (metrics.claudeLatencyMs.length > 100) metrics.claudeLatencyMs.shift();
}

export function recordToolCall(name: string, applied: boolean) {
  if (applied) {
    metrics.toolCallsApplied++;
    metrics.toolCallDistribution[name] = (metrics.toolCallDistribution[name] || 0) + 1;
  } else {
    metrics.toolCallsRejected++;
  }
}

export function p95(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)];
}
