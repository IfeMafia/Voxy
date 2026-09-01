export interface LogContext {
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  userId?: string;
  error?: string;
}

export function logRequest(ctx: LogContext): void {
  const timestamp = new Date().toISOString();
  const logStr = `[${timestamp}] ${ctx.method} ${ctx.path} ${ctx.status} ${ctx.latencyMs}ms${
    ctx.userId ? ` user:${ctx.userId}` : ''
  }${ctx.error ? ` error:"${ctx.error}"` : ''}`;

  if (ctx.status >= 500) {
    console.error(logStr);
  } else if (ctx.status >= 400) {
    console.warn(logStr);
  } else {
    console.log(logStr);
  }
}
