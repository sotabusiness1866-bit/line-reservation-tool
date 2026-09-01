const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

/**
 * LINE Messaging APIのPush Messageで、指定したLINEユーザーにテキストメッセージを送信する。
 * F-05(予約確定通知), F-06(前日リマインド)で使用。
 */
export async function sendLineMessage(lineUserId: string, text: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[line/messaging] LINE_CHANNEL_ACCESS_TOKENが未設定のため送信をスキップしました");
    return;
  }

  const res = await fetch(LINE_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[line/messaging] Push message送信失敗:", res.status, body);
  }
}
