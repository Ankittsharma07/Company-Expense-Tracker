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
}) => {
  const user = await prisma.user.findFirst({
    where: {
      id: toUserId,
      companyId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      title,
      message,
      type,
    },
  });

  const resolvedTemplate = normalizeEmailTemplate({ title, message, emailTemplate });
  if (resolvedTemplate && user.email) {
    await sendEmail({
      to: user.email,
      subject: resolvedTemplate.subject,
      html: resolvedTemplate.html,
      text: resolvedTemplate.text,
    });
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
}) => {
  const tasks = userIds.map((userId) =>
    sendNotification({
      companyId,
      toUserId: userId,
      title,
      message,
      type,
      emailTemplate,
    })
  );

  return Promise.allSettled(tasks);
};
