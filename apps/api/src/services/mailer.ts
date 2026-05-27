import nodemailer from 'nodemailer';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  customizations?: Array<{ groupId: string; selectedOptionIds: string[] }>;
}

interface OrderData {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
}

function buildOrderReceiptHtml(order: OrderData): string {
  const itemRows = order.items
    .map(
      item => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#3d2b1f;font-size:14px;">
          ${item.name}
          ${item.customizations && item.customizations.length > 0
            ? `<br/><span style="font-size:11px;color:#9e9089;font-style:italic;">${
                item.customizations
                  .filter(c => c.selectedOptionIds.length > 0)
                  .map(c => c.selectedOptionIds.join(', '))
                  .join(' · ')
              }</span>`
            : ''}
          ${item.notes ? `<br/><span style="font-size:11px;color:#9e9089;font-style:italic;">${item.notes}</span>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#8c7b6b;font-size:14px;text-align:center;">×${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#3d2b1f;font-size:14px;text-align:right;font-weight:600;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join('');

  const shortId = order.id.slice(0, 8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Bistro Receipt</title>
</head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#3d2b1f;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;font-weight:700;">Intelligent Bistro</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">Order Confirmed</h1>
              <p style="margin:10px 0 0;font-size:13px;color:#a08060;">Order #${shortId}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #f0ebe3;border-right:1px solid #f0ebe3;">
              <p style="margin:0 0 24px;font-size:14px;color:#8c7b6b;line-height:1.6;">
                Thanks for dining with us! Here's a summary of your order.
              </p>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c9a84c;padding-bottom:10px;border-bottom:2px solid #f0ebe3;">Item</th>
                    <th style="text-align:center;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c9a84c;padding-bottom:10px;border-bottom:2px solid #f0ebe3;">Qty</th>
                    <th style="text-align:right;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c9a84c;padding-bottom:10px;border-bottom:2px solid #f0ebe3;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="font-size:13px;color:#8c7b6b;padding:5px 0;">Subtotal</td>
                  <td style="font-size:13px;color:#3d2b1f;text-align:right;padding:5px 0;">$${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#8c7b6b;padding:5px 0;">Tax (10%)</td>
                  <td style="font-size:13px;color:#3d2b1f;text-align:right;padding:5px 0;">$${order.tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top:2px solid #f0ebe3;padding-top:12px;"></td>
                </tr>
                <tr>
                  <td style="font-size:16px;font-weight:700;color:#3d2b1f;padding:4px 0;">Total</td>
                  <td style="font-size:16px;font-weight:700;color:#c9a84c;text-align:right;padding:4px 0;">$${order.total.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf7f2;border:1px solid #f0ebe3;border-top:none;border-radius:0 0 16px 16px;padding:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a08060;line-height:1.7;">
                Thank you for your order!<br/>
                Questions? Just reply to this email and we'll help.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderReceipt(to: string, order: OrderData): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[mailer] SMTP_USER/SMTP_PASS not set — skipping receipt email');
    return;
  }

  const from = process.env.SMTP_FROM || `Intelligent Bistro <${user}>`;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: `Your Bistro receipt — Order #${order.id.slice(0, 8).toUpperCase()}`,
    html: buildOrderReceiptHtml(order),
  });

  console.log(`[mailer] Receipt sent to ${to} for order ${order.id}`);
}
