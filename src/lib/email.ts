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
