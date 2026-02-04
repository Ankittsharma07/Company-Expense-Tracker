import { z } from "zod";
import { adminResetPasswordService } from "../auth/auth.service.js";

const resetUserPasswordSchema = z.object({
  userId: z.string().min(1),
});

export const resetUserPassword = async (req, res) => {
  try {
    const params = resetUserPasswordSchema.parse(req.params);
    const result = await adminResetPasswordService({
      actorId: req.user.id,
      companyId: req.user.companyId,
      targetUserId: params.userId,
    });
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    const message = error.message || "Failed to reset password";
    const status = message === "User not found" ? 404 : 400;
    return res.status(status).json({ message });
  }
};
