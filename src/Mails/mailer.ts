import nodemailer from "nodemailer";

export class EmailSender {
  transporter: any;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 587,
      secure: false,
      auth: {
        user: "35ad4dde86d934",
        pass: "76925293f718c5",
      },
    });
  }

  async sendEmail(to: string, subject: string, message: string) {
    try {
      let info = await this.transporter.sendMail({
        from: "support@stone.com",
        to: to,
        subject: subject,
        text: message,
      });
      console.log("E-mail envoyé avec succès : ", info.messageId);
      return info;
    } catch (err) {
      console.log("Erreur lors de l'envoi de l'e-mail : ", err);
      throw err;
    }
  }
}
