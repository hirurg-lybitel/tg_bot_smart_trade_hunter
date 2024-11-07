# Telegram bot signals
Telegram bot for getting notifications from tradingview

Run url after succesful deployment:
```bash
https://api.telegram.org/bot<telegram_bot_token>/setWebhook?url=https://<your-deployment.vercel.app>/api/bot
```

In TradingView you should make an Alert for `Smart Trader Strategy` with: 
- WebHook 
```bash
https://<your-deployment.vercel.app>/api/bot
```
- Message body
```json
{
  "type": "bot",
  "ticker": "{{ticker}}", 
  "order_direction": "{{strategy.market_position}}",
  "order_details": "{{strategy.order.alert_message}}",
  "order_action": "{{strategy.order.action}}",
  "order_price": "{{strategy.order.price}}"
}
```
