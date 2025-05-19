import { FastifyRequest, FastifyReply } from 'fastify';

// Extend FastifyRequest to include the user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
import jwt from 'jsonwebtoken';

export async function authMiddleware(req: FastifyRequest, res: FastifyReply) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    return res.status(401).send({ message: 'Access token is invalid or expired' });
  }
}
