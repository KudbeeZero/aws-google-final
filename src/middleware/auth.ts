import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: any;
  dbUser?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  let decodedToken: any;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
  } catch (authErr: any) {
    console.warn('Firebase ID Token verification warning:', authErr.message || authErr);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email || `guest_${uid}@awsstudylabs.com`;

  // DB Lookup / Sync with graceful fallback for network dropouts or DB pool timeouts
  try {
    let userRecord = await db.select().from(users).where(eq(users.uid, uid)).then(res => res[0]);
    if (!userRecord) {
      const inserted = await db.insert(users).values({
        uid,
        email,
      }).returning();
      userRecord = inserted[0];
    }
    req.dbUser = userRecord;
  } catch (dbErr: any) {
    console.warn('Postgres DB pool query timeout or network dropout in auth middleware (using guest fallback):', dbErr.message || dbErr);
    req.dbUser = { id: uid, uid, email, isFallback: true };
  }

  next();
};
