# Bác Bảo Vệ — Năm Ca Cuối

Game 3D chạy trên trình duyệt, viết bằng **Three.js** và **Bun**, hoàn toàn bằng tiếng Việt.

Bạn vào vai **bác Năm**, bảo vệ 59 tuổi, còn đúng **5 ca trực** nữa là về hưu. Mỗi ca ở một nơi:
trường học → ngân hàng → bệnh viện → tòa tháp → quay về trường trong đêm bão.
Các ca nối với nhau bằng một vụ án cũ: vụ mất quỹ xây trường năm 2006 mà ông Tư, người bảo vệ cũ, bị đổ oan.

## Cài Bun

- macOS / Linux: `curl -fsSL https://bun.sh/install | bash`
- Windows (PowerShell): `powershell -c "irm bun.sh/install.ps1 | iex"`

Kiểm tra: `bun --version`.

## Chạy game

```bash
bun install
bun run dev
```

Mở http://localhost:5173 trên trình duyệt.

Bản build tĩnh: `bun run build` (kết quả trong `dist/`), rồi `bun serve.js` để phục vụ ở http://localhost:8080.

## Cách chơi

| Việc | Bàn phím | Điện thoại |
|---|---|---|
| Đi lại | W A S D | Cần gạt bên trái |
| Nhìn quanh | Chuột (bấm vào màn hình để khóa chuột) hoặc phím ← → | Vuốt nửa phải màn hình |
| Chạy | Shift (tốn sức) | Nút **Chạy** |
| Tương tác / nói chuyện | E | Nút **E** |
| Chọn lời thoại | 1 2 3 hoặc bấm chuột | Chạm vào lựa chọn |
| Tạm dừng | Esc hoặc P | Nút **II** |

- **Kiểm tra giấy tờ**: so ảnh, tên, ngày hết hạn, con dấu với quy định của ca, rồi chọn *Cho qua* hoặc *Từ chối*.
- **Đuổi bắt**: giữ Shift để chạy, theo dõi thanh sức. Bác 59 tuổi rồi, đừng chạy quá sức; hãy cắt góc.
- **Tuần tra đêm**: đèn pin bật sẵn, đi qua các điểm chấm công theo thứ tự.
- **Chọn lời thoại**: lời bác nói ảnh hưởng ai sẽ tin bác và ai quay lại giúp ở ca cuối.

Tiến độ tự lưu vào trình duyệt (localStorage) sau mỗi ca. Ở màn hình chính chọn **Chơi tiếp**.

Có **3 kết thúc**, tùy bác giúp được những ai và giữ được bao nhiêu bằng chứng.

## Tài nguyên

Toàn bộ hình 3D low-poly dựng bằng code (khối hộp, trụ…), âm thanh tổng hợp bằng Web Audio API.
Không dùng mô hình, ảnh, nhạc hay phông chữ có bản quyền.

## Theo dõi tiến độ

Xem thư mục [`tien-do/`](tien-do/).

## Thử nhanh khi phát triển

- `http://localhost:5173/?ca=3` vào thẳng ca 3 (trạng thái mới, chưa giúp ai).
- `http://localhost:5173/?touch` bật điều khiển cảm ứng trên máy tính.
- Tự chơi thử từ đầu đến cuối trong Chrome headless (cần Google Chrome; đặt `CHROME_PATH` nếu không nằm ở `/usr/bin/google-chrome`):

  ```bash
  bun run dev                       # một cửa sổ terminal
  bun run choi-thu good             # terminal khác: ra kết thúc 1
  bun run choi-thu cold             # kết thúc 2
  bun run choi-thu bribe            # kết thúc 3
  ```

  Ảnh chụp lưu trong `anh-chup/`. Bot chỉ dùng bàn phím (W, mũi tên, Shift, E, phím số) và tự tìm đường.

## Cấu trúc mã

```
index.html, style.css
src/main.js          khởi động
src/engine.js        renderer Three.js, va chạm, hàm dựng khối low-poly, người, biển chữ
src/input.js         bàn phím, chuột, cần gạt cảm ứng
src/player.js        góc nhìn thứ nhất, chạy, thanh sức
src/game.js          vòng lặp, chuyển ca, API ctx cho kịch bản
src/ui.js            HUD, hội thoại, kiểm tra giấy tờ, màn hình
src/audio.js         âm thanh tổng hợp
src/save.js          lưu tiến độ
src/endings.js       3 kết thúc
src/shifts/*.js      5 ca trực
tools/choi-thu.mjs   bot tự chơi thử
```
