import { createRemoteJWKSet, jwtVerify } from "jose";
import "dotenv/config";

const JWKS = createRemoteJWKSet(
  new URL(process.env.JWKS_URL)
);

export const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized: No token provided.",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      algorithms: ["EdDSA"],
      requiredClaims: ["sub", "exp", "iat"],
    });

    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token.",
    });
  }
};