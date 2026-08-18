type LogContext = Record<string, unknown>;

const write = (level: string, message: string, context?: unknown) => {
  const suffix = context === undefined ? "" : ` ${JSON.stringify(context)}`;
  console[level as "info" | "error"](`[${level}] ${message}${suffix}`);
};

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  error(message: string, context?: unknown) {
    write("error", message, context);
  },
};
