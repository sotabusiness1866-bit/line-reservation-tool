// LIFFのIDトークンをLINE側に問い合わせて検証し、なりすましのできない本物のLINEユーザーIDを取得する
export async function verifyLiffIdToken(idToken: string): Promise<string | null> {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return null;
  const channelId = liffId.split("-")[0];

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { sub?: unknown };
  return typeof data.sub === "string" ? data.sub : null;
}
