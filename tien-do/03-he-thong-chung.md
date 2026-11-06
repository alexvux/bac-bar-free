# 03 — Hệ thống chung

- `src/game.js`: vòng lặp khung hình, chuyển ca, và API `ctx` để kịch bản từng ca viết tuần tự bằng `await`
  (`ctx.interact`, `ctx.reach`, `ctx.talk`, `ctx.choose`, `ctx.idCheck`, `ctx.chase`, `ctx.marker`, `ctx.flashlight`).
- `src/ui.js`: HUD (tên ca, nhiệm vụ, mũi tên chỉ hướng, thanh sức), hộp thoại có lựa chọn, màn kiểm tra giấy tờ
  (thẻ bên trái, người thật bên phải, ảnh chân dung vẽ bằng canvas), các màn hình toàn trang.
- `src/save.js`: tự lưu vào localStorage ở đầu mỗi ca. Màn hình chính có nút “Chơi tiếp”.
- `src/audio.js`: âm thanh tổng hợp bằng Web Audio (bước chân, còi, đóng dấu, mưa, sấm, nhạc nền từng ca).
- Tạm dừng bằng Esc / P / nút II: tiếp tục, bật/tắt âm, về màn hình chính.
