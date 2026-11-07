# 12 — Nhân vật khối kiểu R6

Hoàn tất trên nhánh `game/roblox-characters`; chưa merge/deploy.

- Thay builder `person()` chung bằng một rig 6 khối: thân rộng, đầu vuông lớn sát thân, tay/chân dày, có khe giữa các bộ phận.
- Người lớn cao khoảng 1,78 m (đội mũ: 1,83 m); Minh giữ tỉ lệ 0,72, cao khoảng 1,28 m.
- Mặt tự vẽ bằng canvas: mắt có điểm sáng, mũi và miệng cong nhẹ; dùng chung texture, không dùng logo hay decal Roblox.
- Tóc ngắn/dài, đầu trọc, mũ khối, gọng kính rỗng và ria mép khớp đầu mới; bổ sung sẹo của Hùng vốn chưa được dựng.
- Tay áo cùng màu áo, bàn tay màu da. Đi vung tay/chân đối nhau rõ hơn; dừng là trả về tư thế đứng.
- Giữ nguyên các tùy chọn và `userData.parts`; không đổi góc nhìn thứ nhất, điều khiển, va chạm, đường đi hay kiểm tra giấy tờ. `faceBoth` lùi người chơi ra khoảng 2,45 m (nhân với scale, ví dụ Minh gần hơn) để đầu khối không chiếm hết màn hình khi nói chuyện. Bản sửa z-fight đã có sẵn trên `origin/main`, không thêm sửa sàn trong nhánh này.

## Kiểm tra

- `bun run build`: thành công.
- `bun tools/check-characters.mjs`: dựng bằng Three.js thật, render WebGL trong Chrome headless riêng; kiểm tra 6 khối, chiều cao/tỉ lệ trẻ em, điểm xoay, khe chân, bóng, animation đối xứng, reset khi đứng và collider không đổi.
- Ảnh staged trong bản đồ trường học thật: Hoa + Minh, Khải đeo kính/ria, Hùng đội mũ/có sẹo, biến thể trọc; góc trước, sau, đang đi và cận cảnh. Đây là ảnh review nhân vật, không phải ảnh chụp các nhân vật xuất hiện cùng lúc trong cốt truyện.
- Ảnh lưu cục bộ tại `/workspace/bac-bar-free-screenshots/roblox-chars/`; chạy lại lệnh trên để tạo ảnh mới. Không đưa ảnh nhị phân vào repo.
- Smoke test game thật bằng `bun tools/choi-thu.mjs good /workspace/bac-bar-free-screenshots/roblox-chars/production-smoke http://localhost:18765/ 0.5`: vào ca trường, nói chuyện với Hoa, xử lý đủ ba thẻ (cho Mai/Tám vào, từ chối Lực), rồi đến mục tiêu dọn kho. Dừng đúng giới hạn 30 giây; không có PAGEERROR; có hai thông báo 404 tài nguyên phụ từ server tĩnh (`/favicon.ico` trả 404).
- Chưa chơi lại toàn bộ năm ca/ba kết thúc trong lần sửa hình dáng này.
