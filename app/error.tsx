"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="narrow"><section className="panel stack"><h1>Chưa tải được trang</h1><p>Kiểm tra kết nối rồi thử lại.</p><button className="button primary" onClick={reset}>Thử lại</button></section></div>;
}
