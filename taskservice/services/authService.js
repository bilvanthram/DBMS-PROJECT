import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRETE_KEY = process.env.SECRETE_KEY;

/**
 * Verify the JWT and return the logged-in user id.
 * DBMS PROJECT Spring Boot stores the user id in the "userId" claim.
 * (Falls back to "crid" so reference-style tokens also work.)
 */
export function getUserId(token) {
    if (!token) {
        throw new Error("Token missing");
    }
    // Accept "Bearer <token>" as well as a raw token.
    const clean = token.startsWith("Bearer ") ? token.slice(7) : token;
    const payload = jwt.verify(clean, SECRETE_KEY);
    const uid = payload.userId ?? payload.crid ?? payload.id;
    if (uid === undefined || uid === null) {
        throw new Error("User id not found in token");
    }
    return Number(uid);
}
