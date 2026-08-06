import { Request, Response, NextFunction } from 'express';

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per minute per IP

// In-memory sliding window rate limiter for heavy AI/TTS endpoints
const aiRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const AI_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_AI_REQUESTS_PER_WINDOW = 20; // 20 requests per minute per IP

/**
 * Express Security Middleware for Rate Limiting
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - 1);
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Strict security policy enforced. Please wait a minute before retrying.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count += 1;
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - record.count);
  next();
};

/**
 * Express Security Middleware for AI & Text-to-Speech Rate Limiting
 */
export const aiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  const record = aiRateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    aiRateLimitMap.set(clientIp, { count: 1, resetTime: now + AI_RATE_LIMIT_WINDOW_MS });
    res.setHeader('X-AIRateLimit-Limit', MAX_AI_REQUESTS_PER_WINDOW);
    res.setHeader('X-AIRateLimit-Remaining', MAX_AI_REQUESTS_PER_WINDOW - 1);
    return next();
  }

  if (record.count >= MAX_AI_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many AI Requests',
      message: 'Professor AI rate limit exceeded (max 20 requests/min). Please wait a moment before asking another question or playing another audio clip.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count += 1;
  res.setHeader('X-AIRateLimit-Limit', MAX_AI_REQUESTS_PER_WINDOW);
  res.setHeader('X-AIRateLimit-Remaining', MAX_AI_REQUESTS_PER_WINDOW - record.count);
  next();
};

/**
 * Express Security Headers Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS - Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

/**
 * Anti-XSS and Input Sanitization Helper
 */
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Strip script tags and dangerous HTML attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input !== null && typeof input === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      sanitizedObj[key] = sanitizeInput(input[key]);
    }
    return sanitizedObj;
  }
  return input;
};

/**
 * Prompt Injection Guard
 */
export const promptInjectionGuard = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    const bodyString = JSON.stringify(req.body).toLowerCase();
    const maliciousPatterns = [
      'ignore previous instructions',
      'system prompt override',
      'you are now dan',
      'jailbreak',
      'forget all guidelines',
      'reveal system prompt'
    ];

    for (const pattern of maliciousPatterns) {
      if (bodyString.includes(pattern)) {
        return res.status(400).json({
          error: 'Security Audit Violation',
          message: 'Potential prompt injection attempt detected and blocked by Guardian Agent Security Shield.'
        });
      }
    }

    // Sanitize payload body
    req.body = sanitizeInput(req.body);
  }
  next();
};
