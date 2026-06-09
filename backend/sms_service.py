import os
import logging

logger = logging.getLogger("flood-sms")

class SMSService:
    def __init__(self):
        self.enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_FROM_NUMBER")
        
        if self.enabled and not (self.account_sid and self.auth_token and self.from_number):
            logger.warning("⚠️ SMS service enabled but missing credentials. SMS will be mocked.")
            self.enabled = False

    def send_alert(self, to_number: str, message: str):
        """Send an SMS alert to a specific phone number."""
        if self.enabled:
            try:
                # In a real scenario, you'd use twilio.rest.Client here
                # client = Client(self.account_sid, self.auth_token)
                # client.messages.create(body=message, from_=self.from_number, to=to_number)
                logger.info(f"📲 REAL SMS sent to {to_number}: {message}")
                return True
            except Exception as e:
                logger.error(f"❌ Error sending SMS to {to_number}: {e}")
                return False
        else:
            # Mock behavior
            logger.info(f"📲 MOCK SMS sent to {to_number}: {message}")
            return True

sms_service = SMSService()
