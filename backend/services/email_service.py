import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class EmailService:
    def __init__(self, smtp_server="smtp.gmail.com", smtp_port=587):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port

    def send_daily_report(self, smtp_email: str, smtp_password: str, target_emails: str, trends_data: dict) -> bool:
        if not smtp_email or not smtp_password or not target_emails:
            print("[EmailService] Missing SMTP credentials or target emails. Skip sending.")
            return False
            
        try:
            today_str = datetime.now().strftime("%Y-%m-%d")
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[自動化通報] 每日蝦皮與 Google 趨勢選品報告 ({today_str})"
            msg["From"] = smtp_email
            msg["To"] = target_emails
            
            # 建立信件內容
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                    蝦皮自動化選品系統 - 每日報告
                </h2>
                <p>您好，</p>
                <p>系統已於 <strong>{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</strong> 自動完成趨勢爬蟲與分析。以下為今日平台重點關鍵字摘要：</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background-color: #f8fafc;">
                        <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">排名</th>
                        <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">關鍵字</th>
                        <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">前期熱度</th>
                        <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">近期熱度</th>
                        <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">分類標籤</th>
                    </tr>
            """
            
            if "items" in trends_data:
                for item in trends_data["items"][:10]: # Top 10
                    html_content += f"""
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">{item.get('rank', '-')}</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold; color: #1d4ed8;">{item.get('keyword', '-')}</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">{item.get('prev_volume', '-')}</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">{item.get('curr_volume', '-')}</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;"><span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{item.get('tag', '-')}</span></td>
                    </tr>
                    """
                    
            html_content += """
                </table>
                <p style="margin-top: 30px; font-size: 13px; color: #6b7280; text-align: center;">
                    此信件由「蝦皮自動化選品系統」自動發送，請勿直接回覆。<br>
                    如需查看詳細雷達圖分析，請登入主管後台或開啟桌面應用程式。
                </p>
            </body>
            </html>
            """
            
            part = MIMEText(html_content, "html")
            msg.attach(part)
            
            print(f"[EmailService] Connecting to {self.smtp_server}:{self.smtp_port}...")
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(smtp_email, smtp_password)
            
            recipient_list = [email.strip() for email in target_emails.split(",") if email.strip()]
            server.sendmail(smtp_email, recipient_list, msg.as_string())
            server.quit()
            
            print("[EmailService] Email sent successfully!")
            return True
        except Exception as e:
            print(f"[EmailService] Error sending email: {e}")
            return False
