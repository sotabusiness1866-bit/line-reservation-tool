import liff from "@line/liff";

let initPromise: Promise<void> | null = null;

/**
 * LIFF SDKを初期化し、必要ならLINEログインへリダイレクトする。
 * 顧客側(/liff配下)の各ページはこれを呼んでからliff.getProfile()等を使う。
 */
export function initLiff(): Promise<void> {
  if (!initPromise) {
    initPromise = liff
      .init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login();
        }
      });
  }
  return initPromise;
}

export { liff };
