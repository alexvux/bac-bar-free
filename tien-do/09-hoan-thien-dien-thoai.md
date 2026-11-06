# 09 — Âm thanh, hoàn thiện, điện thoại

- Sửa lỗi: trên điện thoại vùng vuốt nhìn đè lên nút của màn hình chính và hộp thoại, không bấm được. Giờ điều khiển cảm ứng chỉ hiện khi đang chơi, và lớp giao diện luôn nằm trên.
- Thanh sức dời lên góc trên bên trái trên điện thoại cho khỏi đụng cần gạt.
- Cần gạt và vùng nhìn chịu được trình duyệt không cho `setPointerCapture`.
- Tiếng chuông khi hết ca. Về màn hình chính bỏ tham số `?ca=` để không bị vào lại ca đó.
- Ca 5: kẻ phóng hỏa chạy nhanh hơn một chút (4,9 m/s, có Tuấn chặn cổng thì 4,4) để đoạn đuổi cuối có sức nặng. Đã thử: không ai giúp vẫn bắt được; đứng yên thì kho cháy.
- Thêm `tools/choi-thu.mjs` và `bun run choi-thu good|cold|bribe|giveup`: bot tự chơi bằng bàn phím, tự tìm đường A*, chụp ảnh.
