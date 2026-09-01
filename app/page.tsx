import { redirect } from "next/navigation";

// 顧客はLINEのリッチメニューから直接 /liff に入る想定のため、
// ルートは動作確認用に予約画面へ流すだけにしている
export default function RootPage() {
  redirect("/liff");
}
