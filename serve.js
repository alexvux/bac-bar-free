// Phục vụ bản build trong dist/ (sau khi chạy `bun run build`).
const port = Number(process.env.PORT || 8080);
Bun.serve({
  port,
  async fetch(req) {
    let path = new URL(req.url).pathname;
    if (path === "/") path = "/index.html";
    const file = Bun.file("./dist" + path);
    return (await file.exists()) ? new Response(file) : new Response("Không tìm thấy", { status: 404 });
  },
});
console.log(`Mở http://localhost:${port}`);
