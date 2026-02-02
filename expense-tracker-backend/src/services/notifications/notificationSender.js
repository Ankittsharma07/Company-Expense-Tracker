import { prisma } from "../../config/db.js";
import { sendEmail } from "../../utils/email.js";
import { buildNotificationEmail } from "../../utils/emailTemplates.js";

const normalizeEmailTemplate = ({ title, message, emailTemplate }) => {
  if (!emailTemplate) {
    return null;
  }

  if (typeof emailTemplate === "string") {
    return { subject: title, html: emailTemplate, text: message };
  }

  if (typeof emailTemplate === "function") {
    return normalizeEmailTemplate({
      title,
      message,
      emailTemplate: emailTemplate({ title, message }),
    });
  }

  return {
    subject: emailTemplate.subject || title,
    html: emailTemplate.html || buildNotificationEmail({ title, message }),
    text: emailTemplate.text || message,
  };
};

export const sendNotification = async ({
  companyId,
  toUserId,
  title,
  message,
  type = "INFO",
  emailTemplate,
  notificationType = "GENERAL",
}) => {
  const user = await prisma.user.findFirst({
    where: {
      id: toUserId,
      companyId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
    },
  });

  if (!user) {
    return null;
  }

  const createAuditLog = async ({ channel, status, reason }) => {
    try {
      await prisma.notificationAuditLog.create({
        data: {
          userId: user.id,
          userRole: user.role,
          notificationType,
          channel,
          status,
          reason: reason || null,
        },
      });
    } catch (auditError) {
      console.error("Notification audit log failed:", auditError.message);
    }
  };

  let notification = null;
  if (user.inAppNotificationsEnabled) {
    try {
      notification = await prisma.notification.create({
        data: {
          userId: user.id,
          title,
          message,
          type,
        },
      });
      await createAuditLog({ channel: "IN_APP", status: "SENT" });
    } catch (error) {
      await createAuditLog({ channel: "IN_APP", status: "FAILED", reason: error.message });
    }
  } else {
    await createAuditLog({ channel: "IN_APP", status: "SKIPPED", reason: "User disabled in-app" });
  }

  const resolvedTemplate = normalizeEmailTemplate({ title, message, emailTemplate });
  if (!resolvedTemplate) {
    await createAuditLog({ channel: "EMAIL", status: "SKIPPED", reason: "Email template not provided" });
    return notification;
  }

  if (!user.emailNotificationsEnabled) {
    await createAuditLog({ channel: "EMAIL", status: "SKIPPED", reason: "User disabled email" });
    return notification;
  }

  try {
    const result = await sendEmail({
      to: user.email,
      subject: resolvedTemplate.subject,
      html: resolvedTemplate.html,
      text: resolvedTemplate.text,
    });
    if (result?.skipped) {
      await createAuditLog({ channel: "EMAIL", status: "FAILED", reason: "SMTP not configured" });
    } else if (result?.error) {
      await createAuditLog({ channel: "EMAIL", status: "FAILED", reason: result.error.message });
    } else {
      await createAuditLog({ channel: "EMAIL", status: "SENT" });
    }
  } catch (error) {
    await createAuditLog({ channel: "EMAIL", status: "FAILED", reason: error.message });
  }

  return notification;
};

export const sendBulkNotifications = async ({
  companyId,
  userIds,
  title,
  message,
  type = "INFO",
  emailTemplate,
  notificationType = "GENERAL",
}) => {
  const tasks = userIds.map((userId) =>
    sendNotification({
      companyId,
      toUserId: userId,
      title,
      message,
      type,
      emailTemplate,
      notificationType,
    })
  );

  return Promise.allSettled(tasks);
};
