// Ca 2: Ngân hàng Phương Nam, chi nhánh Hòa Bình. Kiểm tra giấy tờ vào khu két sắt, đuổi bắt kẻ mạo danh.
import { box, cyl, floor, room, lights, sign, pointLight, bounds } from "../engine.js";

function car(x, z, color) {
  box(x, 0.3, z, 1.8, 0.8, 3.6, color);
  box(x, 1.1, z + 0.2, 1.6, 0.6, 2, 0x223344, { solid: false });
  for (const [dx, dz] of [[-0.9, -1.2], [0.9, -1.2], [-0.9, 1.2], [0.9, 1.2]]) cyl(x + dx, 0, z + dz, 0.32, 0.25, 0x111111, { solid: false }).rotation.z = Math.PI / 2;
}

export const ca2 = {
  place: "Ngân hàng Phương Nam", time: "09:00", ambience: "bank",
  title: "Két sắt số 047",
  doneTitle: "Chuyện tiền bạc",
  intro: `<p>Ca thứ hai bác được điều sang trực thay ở chi nhánh ngân hàng đầu đường, nơi trường Hòa Bình từng mở tài khoản quỹ xây trường.</p>
    <p>Mấy hôm nay có người cầm giấy ủy quyền của bà cụ Chín ra vào khu két sắt. Chị Hằng ở quầy giao dịch thấy lạ, nhưng không ai tin chị.</p>`,
  build() {
    lights({ sky: 0xdfe8f0, ground: 0x777777, hemi: 1.0, sun: 1.2, bg: 0xbfd6e8, fog: [0xbfd6e8, 30, 70] });
    floor(0, 6, 60, 50, 0x55585c); // parking
    floor(0, 0, 22, 16, 0xd8d4cc, 0.01); // lobby
    bounds(-14, 14, -8, 21);
    room(0, 0, 22, 16, 4.2, 0xeeeae2, { s: [0, 3] });
    box(0, 4.2, 0, 22.4, 0.3, 16.4, 0xcfc9bd, { solid: false, shadow: false });
    sign("NGÂN HÀNG PHƯƠNG NAM", 0, 4.9, 8.2, Math.PI, { w: 8, h: 0.9, bg: "#0f5c45" });
    box(0, 4.2, 8.2, 9, 1.4, 0.3, 0x0f5c45, { solid: false });
    // counter
    box(-3, 0, -3.2, 12, 1.1, 0.8, 0x6e4b2e);
    box(-3, 1.1, -3.2, 12, 0.05, 0.9, 0xe0d8c0, { solid: false });
    for (let i = -8; i <= 2; i += 2.5) box(i, 1.15, -3.2, 0.06, 0.8, 0.8, 0x9fc6dd, { solid: false });
    sign("QUẦY GIAO DỊCH", -3, 3.2, -7.8, 0, { w: 4, h: 0.6, bg: "#0f5c45" });
    // vault zone in the north-east corner
    box(5.5, 0, -5.2, 0.3, 2.8, 5.2, 0x888888);
    cyl(8, 0.2, -7.75, 1.2, 0.3, 0x8a8f96, { seg: 12 }).rotation.x = Math.PI / 2;
    sign("KHU KÉT SẮT", 8, 3.3, -7.8, 0, { w: 3, h: 0.5, bg: "#333" });
    box(9.5, 0, -3.4, 2.6, 1, 0.1, 0xb03030); // rope barrier
    cyl(5.8, 0, -3.4, 0.12, 1.05, 0xd4af37); cyl(10.8, 0, -3.4, 0.12, 1.05, 0xd4af37);
    // pillars, chairs
    for (const x of [-6, 0, 6]) cyl(x, 0, 2.2, 0.45, 4.2, 0xe6e0d0);
    for (let i = -8; i <= -3; i += 1.2) box(i, 0, 5.2, 0.9, 0.5, 0.8, 0x3f6a8a);
    box(9, 0, 5, 2, 1, 0.8, 0x7a6a5a); // ATM-ish kiosk
    // parking with cars and planters
    car(-5, 15, 0xc0392b); car(0, 15.5, 0xeeeeee); car(5, 15, 0x2c3e50);
    for (const x of [-11, 11]) { box(x, 0, 11, 1.4, 0.6, 1.4, 0x7a6a5a); }
    pointLight(-3, 3.6, -1, 0xfff4e0, 6, 14); pointLight(6, 3.6, 2, 0xfff4e0, 6, 14);
  },
  async run(c) {
    const f = c.flags;
    c.place(0, 6, 0);
    const hang = c.npc({ shirt: "#2c7a5c", pants: "#222", hair: "#1a1a1a", hairStyle: "long" }, -2, -4.3, 0);
    c.npc({ shirt: "#2c7a5c", pants: "#222", hair: "#3a2a1a" }, -6.5, -4.3, 0);
    const quang = c.npc({ shirt: "#f0f0f0", pants: "#222", hair: "#111", glasses: true }, -4, -6.5, 0);
    c.objective("Chào chị Hằng ở quầy giao dịch", -2, -2.2);
    await c.interact(-2, -2.2, "Nói chuyện với chị Hằng");
    c.faceBoth(hang);
    await c.talk([
      ["Chị Hằng", "Bác Năm! Bác trực thay hôm nay hả? Vậy em yên tâm rồi."],
      ["Chị Hằng", "Tuần rồi có một anh cầm giấy ủy quyền của bà Chín vô mở két. Bà Chín tám mươi hai tuổi, không biết chữ, sao mà ký?"],
      ["Chị Hằng", "Em báo anh Quang, ảnh nói em đa nghi, làm mất khách."],
      ["Bác Năm", "Để bác đứng cửa két. Ai vô bác soi giấy kỹ."],
    ]);
    c.objective("Đứng trực ở lối vào khu két sắt", 8, -4.6);
    await c.reach(8, -4.6, 1.2);
    c.player.yaw = Math.PI;

    const rules = ["Vào khu két phải có CCCD còn hạn và thẻ két trùng tên", "Người được ủy quyền phải có giấy ủy quyền có dấu công chứng đỏ", "Ảnh phải khớp người đứng trước mặt"];
    const visitors = [
      { look: { shirt: "#8a6d3b", skin: "#c99a70", hair: "#999999", glasses: true }, doc: {
        title: "CĂN CƯỚC CÔNG DÂN + THẺ KÉT", stamp: "CÔNG AN TP", says: "Chào chú, tôi mở két lấy sổ đỏ.",
        fields: [["Họ tên", "Hồ Văn Lộc"], ["Số CCCD", "079 061 004 112"], ["Có giá trị đến", "12/03/2031"], ["Thẻ két", "Số 112 – Hồ Văn Lộc"]] } },
      { look: { shirt: "#b5651d", skin: "#e0b08a", hair: "#2a1a10", hairStyle: "long" }, doc: {
        title: "CĂN CƯỚC CÔNG DÂN + THẺ KÉT", stamp: "CÔNG AN TP", says: "Em gửi hợp đồng nhà ạ.", ask: "Dạ, em mở két ở đây năm năm rồi.",
        fields: [["Họ tên", "Lưu Thị Ngọc"], ["Số CCCD", "079 188 020 335"], ["Có giá trị đến", "05/08/2029"], ["Thẻ két", "Số 203 – Lưu Thị Ngọc"]] } },
      { look: { shirt: "#444444", skin: "#c08a60", hair: "#111111", hairStyle: "short", scar: true }, photoDiff: { scar: false, glasses: true, hairStyle: "long" }, invalid: true, thief: true, doc: {
        title: "GIẤY ỦY QUYỀN", stamp: null, says: "Tôi lấy đồ cho bà Chín, bà già yếu không đi được.", ask: "Công chứng gì, giấy tay là được rồi. Ông bảo vệ biết gì mà hỏi.",
        fields: [["Người được ủy quyền", "Trương Minh Đạt"], ["Người ủy quyền", "Nguyễn Thị Chín (82 tuổi)"], ["Thẻ két", "Số 047 – Nguyễn Thị Chín"], ["Công chứng", "(trống)"]] } },
    ];
    let dat = null;
    for (const v of visitors) {
      const n = c.npc(v.look, 0, 8.5, Math.PI);
      await c.walkTo(n, 3, -1, 2.2);
      await c.walkTo(n, 8, -2.4, 1.6);
      c.faceBoth(n);
      const r = await c.idCheck({ ...v.doc, rules, photo: { ...v.look, ...(v.photoDiff || {}) }, face: v.look, invalid: v.invalid });
      if (v.thief) { dat = { n, r }; break; }
      if (!r.allowed) { c.toast("Khách bực bội bỏ về. Chị Hằng nhìn bác lắc đầu."); await c.walkTo(n, 0, 9, 2); }
      else { await c.walkTo(n, 8.5, -6, 1.4); }
      c.remove(n);
    }
    const n = dat.n;
    if (dat.r.allowed) {
      await c.talk([["Chị Hằng", "Bác Năm! Người đó là cái anh hôm trước đó! Giấy đâu có dấu công chứng!"], ["Trương Minh Đạt", "…!"]]);
    } else {
      await c.talk([["Bác Năm", "Giấy không có dấu công chứng, ảnh cũng không giống anh. Anh ngồi đó, tôi gọi bà Chín."], ["Trương Minh Đạt", "Gọi cái gì mà gọi!"]]);
    }
    c.objective("Bắt lấy Trương Minh Đạt!");
    const caught = await c.chase({
      npc: n, name: "Trương Minh Đạt", speed: 4.2, time: 55, headStart: 1.6,
      path: [[4, -1], [3, 5], [0, 7], [0, 10], [9, 11.5], [9, 19], [-9, 19], [-9, 11.5]], loopFrom: 4,
    });
    if (caught) {
      c.audio.good();
      await c.talk([
        ["Trương Minh Đạt", "Thôi thôi, tôi khai! Có người thuê tôi lấy sổ đỏ của bà Chín. Miếng đất đó sát hàng rào trường Hòa Bình…"],
        ["Bác Năm", "Ai thuê?"],
        ["Trương Minh Đạt", "Tôi chỉ biết người của công ty Khải Hưng. Họ muốn gom hết đất quanh trường."],
      ]);
      c.toast("Đã giao Đạt cho công an phường.");
      f.reputation++;
      c.remove(n);
    } else {
      c.audio.bad();
      f.mistakes++;
      await c.talk([["Bác Năm", "(Hụt hơi… Chân không còn như hồi bốn mươi.)"], ["Bác Năm", "Hắn chạy mất rồi. Nhưng ít ra bà Chín còn giữ được két."]]);
      c.remove(n);
    }

    c.objective("Quay lại quầy giao dịch", -2, -2.2);
    await c.interact(-2, -2.2, "Nói chuyện", 2.4);
    c.faceBoth(quang);
    quang.position.set(-1, 0, -4.3);
    await c.talk([
      ["Anh Quang", "Chuyện này mà lên báo thì chi nhánh mất uy tín. Cô Hằng làm việc cẩu thả, để khách lạ vào tới khu két."],
      ["Chị Hằng", "Em báo anh từ tuần trước mà anh…"],
      ["Anh Quang", "Bác bảo vệ, bác thấy gì thì ghi biên bản vậy thôi, đừng thêm bớt."],
    ]);
    const k = await c.choose("Bác Năm", "", ["Cô Hằng phát hiện hắn trước, tôi làm chứng. Tôi ghi vậy.", "Tôi chỉ là bảo vệ, chuyện trong phòng các anh chị tự lo."]);
    if (k === 0) {
      f.helped.hang = true;
      c.audio.good();
      await c.talk([["Anh Quang", "…Được rồi. Cô Hằng, viết tường trình đầy đủ."], ["Chị Hằng", "Cảm ơn bác. Bác cần gì em giúp được không?"]]);
      const q = await c.choose("Bác Năm", "", ["Cô tra giúp tôi giao dịch quỹ xây trường Hòa Bình, tháng 9 năm 2006.", "Thôi, có gì đâu cô."]);
      if (q === 0) {
        c.audio.paper();
        await c.talk([
          ["Chị Hằng", "Hồ sơ cũ còn lưu trong hệ thống… đây rồi. Ngày 15/9/2006, 800 triệu từ tài khoản quỹ chuyển sang Công ty TNHH Khải Hưng."],
          ["Chị Hằng", "Người ký lệnh chuyển: Lâm Văn Khải, kế toán trường."],
          ["Bác Năm", "Một ngày sau đêm bão. Còn ông Tư thì bị bắt ngày 16…"],
          ["Chị Hằng", "Khải Hưng… là chủ tòa tháp mới bên quận Một đó bác."],
        ]);
        f.evidence.saoKe = true;
        c.toast("Có manh mối: Sao kê chuyển tiền 2006");
      }
    } else {
      await c.talk([["Chị Hằng", "…Dạ. Em hiểu mà bác."], ["Bác Năm", "(Cô ấy cúi xuống bàn phím, không nói thêm câu nào.)"]]);
    }
    c.objective("Hết ca. Ra về", 0, 9.5);
    await c.reach(0, 9.5, 1.6);
    return "done";
  },
};
