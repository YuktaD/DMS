import jwt from "jsonwebtoken";

export const userIdentifier = (req, res, next) => {
  try {
    let token = req.cookies?.UserAuthorization;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization;
    }
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (token.startsWith("Bearer ")) token = token.slice(7);
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
