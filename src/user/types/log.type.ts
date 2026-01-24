interface Log {
  message: string;
  level: LogLevel;
  action: LogAction;
  version: string;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';
type LogAction = 'DEFAULT' | 'SEARCH';
