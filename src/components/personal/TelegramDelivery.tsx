export default function TelegramDelivery() {
  return (
    <div className="space-y-2 rounded-lg bg-muted/40 p-3">
      <h3 className="font-semibold">Telegram delivery</h3>
      <p role="status" className="text-sm text-muted-foreground">
        Routine reminders are sent from the server to the private Telegram chat
        configured for this workspace. No browser permission or device
        subscription is needed.
      </p>
      <p className="text-xs text-muted-foreground">
        In-app reminders still appear while NOVA is open. Career, weigh-in and
        focus reminder slots remain in-app; contact alerts already use the same
        Telegram bot.
      </p>
    </div>
  );
}
