const escapeHtml = (value) => {
  if (!value) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const buildNotificationEmail = ({ title, message, preview }) => {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const safePreview = escapeHtml(preview || message || "");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f7fb;font-family:Arial,Helvetica,sans-serif;color:#111;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safePreview}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e6e6ef;">
            <tr>
              <td style="padding:28px 32px 12px 32px;">
                <h1 style="margin:0;font-size:20px;line-height:1.4;color:#111;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#333;">${safeMessage}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#666;">
                  This is an automated notification from your expense tracking workspace.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
