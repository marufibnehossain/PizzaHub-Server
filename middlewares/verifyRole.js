import { ObjectId } from "mongodb";

export const verifyRole = (userCollection, ...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.sub;

      if (typeof userId !== "string" || !userId) {
        return res.status(401).json({
          message: "Unauthorized: User identity missing.",
        });
      }

      const user = await userCollection.findOne(
        {
          _id: ObjectId.isValid(userId)
            ? new ObjectId(userId)
            : userId,
        },
        {
          projection: {
            role: 1,
            isBlocked: 1,
          },
        }
      );

      if (!user) {
        return res.status(401).json({
          message: "Unauthorized: User not found.",
        });
      }

      if (user.isBlocked === true) {
        return res.status(403).json({
          message: "Forbidden: Your account is blocked.",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: "Forbidden: Insufficient permissions.",
        });
      }

      req.userRole = user.role;

      next();
    } catch (error) {
      console.error("Role verification failed:", error);

      return res.status(500).json({
        message: "Internal server error.",
      });
    }
  };
};