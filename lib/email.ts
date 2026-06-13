/**
 * 邮件通知服务（Resend）
 *
 * 环境变量：
 *   RESEND_API_KEY — Resend API 密钥
 *   ADMIN_EMAIL    — 管理员通知接收邮箱
 *   EMAIL_FROM     — 发件人地址（默认 "Secure Trade <noreply@secure-global-trade.com>"）
 *
 * 缺少 API 密钥时静默跳过发送，不阻断主流程。
 */

type OrderEmailData = {
  orderId: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; priceUsd: number }>;
  totalUsd: number;
};

// 仅在 API 密钥存在时动态导入 Resend
async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  try {
    const { Resend } = await import("resend");
    return new Resend(process.env.RESEND_API_KEY);
  } catch {
    return null;
  }
}

const FROM = process.env.EMAIL_FROM || "Secure Trade <noreply@secure-global-trade.com>";

/** 订单确认邮件 */
export async function sendOrderConfirmation(data: OrderEmailData) {
  const resend = await getResend();
  if (!resend) return;

  const subject = `Order Confirmed — ${data.orderId.slice(0, 8)}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
<div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
<h1 style="font-size: 22px; color: #0f172a; margin: 0 0 4px;">Order Confirmed</h1>
<p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">Thank you for your purchase at Secure Trade.</p>
<p style="color: #64748b; font-size: 12px; margin: 0 0 4px;">Order <strong style="color:#0f172a;">${data.orderId}</strong></p>
<table style="width:100%; border-collapse: collapse; margin-top: 12px;">
<thead><tr style="border-bottom:1px solid #e2e8f0;">
<th style="text-align:left;padding:8px 4px;font-size:11px;color:#94a3b8;">Item</th>
<th style="text-align:right;padding:8px 4px;font-size:11px;color:#94a3b8;">Qty</th>
<th style="text-align:right;padding:8px 4px;font-size:11px;color:#94a3b8;">Price</th>
</tr></thead>
<tbody>${data.items.map(item => `
<tr style="border-bottom:1px solid #f1f5f9;">
<td style="padding:8px 4px;font-size:13px;color:#0f172a;">${item.name}</td>
<td style="text-align:right;padding:8px 4px;font-size:13px;color:#475569;">${item.quantity}</td>
<td style="text-align:right;padding:8px 4px;font-size:13px;color:#475569;">$${item.priceUsd.toFixed(2)}</td>
</tr>`).join("")}</tbody></table>
<p style="text-align:right;font-size:16px;font-weight:700;color:#0f172a;margin-top:12px;">Total: $${data.totalUsd.toFixed(2)}</p>
<p style="color:#94a3b8;font-size:11px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;">
Secure Trade — End-to-end encrypted B2B marketplace</p>
</div></body></html>`;

  try {
    await resend.emails.send({ from: FROM, to: data.customerEmail, subject, html });
  } catch (e) {
    console.error("[email] sendOrderConfirmation failed", e);
  }
}

/** 订单状态更新通知 */
export async function sendOrderStatusUpdate(
  data: OrderEmailData & { newStatus: string },
) {
  const resend = await getResend();
  if (!resend) return;

  const subject = `Order ${data.orderId.slice(0, 8)} — ${data.newStatus}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
<div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
<h1 style="font-size: 22px; color: #0f172a; margin: 0;">Order Status Update</h1>
<p style="color: #64748b; font-size: 14px; margin: 12px 0;">Your order <strong style="color:#0f172a;">${data.orderId}</strong> is now <strong style="color:#0891b2;">${data.newStatus}</strong>.</p>
<p style="color:#94a3b8;font-size:11px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;">Secure Trade</p>
</div></body></html>`;

  try {
    await resend.emails.send({ from: FROM, to: data.customerEmail, subject, html });
  } catch (e) {
    console.error("[email] sendOrderStatusUpdate failed", e);
  }
}

/** 管理员通知 */
export async function sendAdminNotification(subject: string, body: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const resend = await getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `[Admin] ${subject}`,
      html: `<div style="font-family:sans-serif;padding:24px;">${body}</div>`,
    });
  } catch (e) {
    console.error("[email] sendAdminNotification failed", e);
  }
}
