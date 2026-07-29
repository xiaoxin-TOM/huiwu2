import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: "smtp.126.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * 发送一封业务通知邮件。只被投递队列调用——业务代码一律走 notifications.ts 入队，
 * 不要在请求路径里直连 SMTP。
 */
export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("邮件服务未配置");
  }
  await transporter.sendMail({
    from: `"会务系统" <${EMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

export async function sendVerificationCode(email: string, code: string) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("邮件服务未配置");
  }

  await transporter.sendMail({
    from: `"会务系统" <${EMAIL_USER}>`,
    to: email,
    subject: "注册验证码",
    text: `您的注册验证码是：${code}，有效期 3 分钟，请尽快完成注册。`,
    html: `<p>您的注册验证码是：<strong>${code}</strong></p><p>有效期 3 分钟，请尽快完成注册。</p>`,
  });
}
