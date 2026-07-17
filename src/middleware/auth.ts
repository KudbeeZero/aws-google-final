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
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    // Get or create user in Postgres
    const uid = decodedToken.uid;
    const email = decodedToken.email || `guest_${uid}@awsstudylabs.com`;

    let userRecord = await db.select().from(users).where(eq(users.uid, uid)).then(res => res[0]);
    if (!userRecord) {
      const inserted = await db.insert(users).values({
        uid,
        email,
      }).returning();
      userRecord = inserted[0];
    }

    req.dbUser = userRecord;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
