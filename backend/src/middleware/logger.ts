import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom token for response time
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '0ms';
});

// Custom format for development
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Custom format for production
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Create logger middleware
export const logger = process.env.NODE_ENV === 'production'
  ? morgan(prodFormat)
  : morgan(devFormat);

export default logger;
