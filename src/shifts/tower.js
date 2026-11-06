// Ca 4: Tòa tháp Khải Hưng, tối tiệc khai trương. Soát thiệp mời, giấy tờ của Tuấn, gặp Lâm Văn Khải.
import * as THREE from "three";
import { box, cyl, floor, room, lights, sign, pointLight, add, bounds } from "../engine.js";

const OX = 40; // the 39th-floor office is built off to the side and reached by elevator

export const ca4 = {
  place: "Tòa tháp Khải Hưng", time: "19:00", ambience: "tower",
  title: "Tầng ba mươi chín",
  doneTitle: "Đèn tòa tháp vẫn sáng",
  intro: `<p>Ca thứ tư, công ty điều bác tăng cường cho tiệc khai trương Tòa tháp Khải Hưng, bốn mươi tầng kính.</p>
    <p>Chủ tòa tháp là ông Lâm Văn Khải. Mười tám năm trước, ông ta là kế toán trường Hòa Bình.</p>`,
  build() {
    lights({ sky: 0xfff0e0, ground: 0x5a4a3a, hemi: 1.5, sun: 0.4, sunColor: 0xffd0a0, bg: 0x140f22 });
    bounds(-12, 12, -19, 9);
    floor(0, -5, 24, 28, 0x8a8290);
    room(0, 0, 24, 18, 6, 0xd9cfbf, { s: [0, 3], n: [0, 3], e: [-2, 1.6] });
    box(0, 6, 0, 24.4, 0.3, 18.4, 0xb8a98f, { solid: false, shadow: false });
    sign("KHẢI HƯNG TOWER", 0, 4.8, -8.83, 0, { w: 6, h: 0.9, bg: "#1a1a1a", fg: "#e0b84a" });
    sign("TIỆC KHAI TRƯƠNG", 0, 3.6, -8.83, 0, { w: 3.5, h: 0.5, bg: "#7a1f2b", fg: "#f6e3b0" });
    box(-7, 0, 2.6, 4, 1.1, 1, 0x3a2a1a); // reception
    box(-7, 1.1, 2.6, 4.2, 0.06, 1.2, 0xe0b84a, { solid: false });
    for (const x of [-6, 6]) for (const z of [-4, 4]) cyl(x, 0, z, 0.5, 6, 0xe8e0d0);
    cyl(-1.6, 0, -6.4, 0.1, 1, 0xe0b84a); cyl(1.6, 0, -6.4, 0.1, 1, 0xe0b84a);
    box(-1.6, 0.85, -6.4, 0.2, 0.05, 0.2, 0xe0b84a, { solid: false });
    box(11.85, 0, -2, 0.1, 2.6, 1.6, 0xb0b0b8, { solid: false }); // elevator doors (in the east gap)
    box(12.6, 0, -2, 1.2, 3, 2, 0x555555);
    sign("THANG MÁY", 11.8, 3, -2, -Math.PI / 2, { w: 1.6, h: 0.35, bg: "#222", fg: "#e0b84a" });
    // ballroom behind the gala doors
    room(0, -14, 14, 10, 5, 0x5a2a35, { s: [0, 3] });
    for (const [x, z] of [[-3, -14], [3, -15], [0, -17]]) { cyl(x, 0, z, 0.8, 0.75, 0xf6f0e6); }
    pointLight(0, 4, -14, 0xffc070, 12, 14);
    pointLight(0, 5, 0, 0xfff0d8, 30, 22); pointLight(-7, 4, 3, 0xffe0b0, 15, 12); pointLight(0, 4, -6, 0xffe0b0, 15, 10);

    // office on the 39th floor
    floor(OX, 0, 12, 10, 0x3a3028);
    room(OX, 0, 12, 10, 3.5, 0x2e2a28, { n: [0, 11] });
    box(OX, 3.5, 0, 12.4, 0.2, 10.4, 0x1a1816, { solid: false, shadow: false });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(11, 3.5, 0.05), new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.12 }));
    glass.position.set(OX, 1.75, -5); add(glass);
    box(OX, 0, -5, 11, 3.5, 0.05, 0x000000, { solid: true }).visible = false;
    // night skyline below
    const win = new THREE.MeshBasicMaterial({ color: 0xffd27a });
    for (let i = 0; i < 40; i++) {
      const w = 2 + Math.random() * 3, h = 5 + Math.random() * 25, x = OX - 40 + i * 2.1 + Math.random(), z = -15 - Math.random() * 30;
      const b = box(x, -35, z, w, h, w, 0x15182a, { solid: false, shadow: false });
      for (let k = 0; k < 6; k++) {
        const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), win);
        wm.position.set(x - w / 2 + Math.random() * w, -35 + Math.random() * h, z + w / 2 + 0.01); add(wm);
      }
      b.castShadow = false;
    }
    box(OX, 0, -1, 3, 0.8, 1.1, 0x4a2c1a); // desk
    box(OX, 0, -2.4, 0.8, 1.2, 0.8, 0x111111); // chair
    box(OX + 4.6, 0, -4.3, 1.6, 2, 0.6, 0x5a3a24); // cabinet
    box(OX - 4.5, 0, 2, 0.9, 0.45, 2.6, 0x7a1f2b); // sofa
    box(OX + 5.85, 0, 3, 0.1, 2.6, 1.6, 0xb0b0b8, { solid: false });
    sign("THANG MÁY", OX + 5.8, 2.9, 3, -Math.PI / 2, { w: 1.4, h: 0.3, bg: "#222", fg: "#e0b84a" });
    pointLight(OX, 3, 0, 0xffd8a0, 25, 14); pointLight(OX + 4, 2.5, -3, 0xffd8a0, 8, 6);
  },
  async run(c) {
    const f = c.flags;
    c.place(-3, 6.5, 0);
    const tuan = c.npc({ shirt: "#2b4a7a", pants: "#1a1a2a", hair: "#111" }, -7, 1.6, 0);
    c.objective("Gặp cậu bảo vệ trẻ ở quầy lễ tân", -6, 3.8);
    await c.interact(-6.2, 4, "Nói chuyện với Tuấn");
    c.faceBoth(tuan);
    await c.talk([
      ["Tuấn", "Dạ con chào bác. Con là Tuấn, quê Quảng Ngãi, mới vô làm hai tháng."],
      ["Tuấn", "Bác ơi… giấy tạm trú của con hết hạn tuần trước. Phường hẹn tuần sau mới làm lại. Anh Bảo mà soi là con mất việc."],
      ["Bác Năm", "Ráng làm cho đàng hoàng. Chuyện giấy tờ để tính."],
    ]);
    c.objective("Đứng soát thiệp mời ở cửa tiệc", 0, -7.2);
    await c.reach(0, -7.2, 1.2);
    c.player.yaw = Math.PI;

    const rules = ["Tên phải có trong danh sách khách mời", "Thiệp thật có dấu nổi KH màu đỏ, không nhận bản photo (dấu đen)", "Khách mời: Phan Quốc Bình, Vương Ngọc Diệp, Trịnh Mỹ Linh"];
    const guests = [
      { look: { shirt: "#1a1a1a", skin: "#d9a77c", hair: "#333", glasses: true }, doc: { title: "THIỆP MỜI KHAI TRƯƠNG", stamp: "KH · KHẢI HƯNG",
        says: "Phan Quốc Bình, bên ngân hàng Phương Nam.", fields: [["Khách mời", "Phan Quốc Bình"], ["Đơn vị", "NH Phương Nam"], ["Số thiệp", "018"], ["Bàn", "A2"]] } },
      { look: { shirt: "#5a7a9a", skin: "#e0b08a", hair: "#2a1a10", hairStyle: "long", glasses: true }, invalid: true, doc: { title: "THIỆP MỜI KHAI TRƯƠNG", stamp: "KH (bản photo)", stampBlack: true,
        says: "Tôi là khách mời mà, chú xem tên đi.", ask: "…Thôi được, tôi là phóng viên. Tôi chỉ muốn hỏi ông Khải một câu về quỹ trường Hòa Bình năm 2006.",
        fields: [["Khách mời", "Trịnh Mỹ Linh"], ["Đơn vị", "Báo Tuổi Trẻ Phố"], ["Số thiệp", "041"], ["Bàn", "C5"]] } },
      { look: { shirt: "#8a2b4a", skin: "#e8c09a", hair: "#111", hairStyle: "long" }, doc: { title: "THIỆP MỜI KHAI TRƯƠNG", stamp: "KH · KHẢI HƯNG",
        says: "Chào chú. Đông vui quá ha.", fields: [["Khách mời", "Vương Ngọc Diệp"], ["Đơn vị", "Cty CP Địa ốc Sao Mai"], ["Số thiệp", "007"], ["Bàn", "A1"]] } },
    ];
    for (const g of guests) {
      const n = c.npc(g.look, 0, 8, Math.PI);
      await c.walkTo(n, 0, -4.9, 2.4);
      c.faceBoth(n);
      const r = await c.idCheck({ ...g.doc, rules, photo: g.look, face: g.look, invalid: g.invalid });
      if (r.allowed) { await c.walkTo(n, 0, -13, 1.8); }
      else {
        if (g.invalid) await c.talk([["Trịnh Mỹ Linh", "Chú giữ cái này. Nếu chú biết gì về vụ 2006, gọi cho tôi."], ["Bác Năm", "(Một tấm danh thiếp nhà báo. Bác bỏ vào túi áo, cạnh cuốn sổ.)"]]);
        await c.walkTo(n, 0, 9, 2);
      }
      c.remove(n);
    }

    const bao = c.npc({ shirt: "#222", pants: "#222", hair: "#111", glasses: true }, 3, -2, Math.PI);
    tuan.position.set(1.5, 0, -4.6);
    c.faceBoth(bao);
    await c.talk([
      ["Anh Bảo", "Ông Năm, tối nay công an phường có thể ghé. Tiện ông kiểm tra giấy tờ thằng Tuấn luôn."],
      ["Anh Bảo", "Tạm trú hết hạn là tôi cho nghỉ, khỏi rắc rối."],
    ]);
    c.faceBoth(tuan);
    const t = await c.idCheck({
      title: "THẺ NHÂN VIÊN + GIẤY TẠM TRÚ", stamp: "CÔNG AN PHƯỜNG", moral: true, invalid: true,
      rules: ["Nhân viên phải có thẻ nhân viên", "Giấy tạm trú phải còn hạn (hôm nay 06/11/2026)"],
      photo: { shirt: "#2b4a7a", hair: "#111" }, face: { shirt: "#2b4a7a", hair: "#111" },
      says: "…", ask: "Dạ con có giấy hẹn của phường, tuần sau con lên làm liền. Mẹ con ở quê đang bệnh, con cần việc này…",
      fields: [["Họ tên", "Nguyễn Đức Tuấn"], ["Quê quán", "Quảng Ngãi"], ["Thẻ nhân viên", "KH-0921"], ["Tạm trú đến", "31/10/2026"]],
    });
    if (t.allowed) {
      f.helped.tuan = true;
      c.audio.good();
      await c.talk([["Bác Năm", "Giấy tờ đủ cả, anh Bảo. Thằng nhỏ làm được việc."], ["Anh Bảo", "Ừ… vậy thôi."], ["Tuấn", "(nói nhỏ) Mai con đi phường liền. Con nhớ ơn bác."]]);
    } else {
      await c.talk([["Anh Bảo", "Thấy chưa. Tuấn, mai khỏi đi làm."], ["Tuấn", "…Dạ."], ["Bác Năm", "(Đúng quy định. Sao lòng mình nặng vậy.)"]]);
      c.remove(tuan);
    }
    c.remove(bao);

    const khai = c.npc({ shirt: "#1b2440", pants: "#1b2440", hair: "#888", glasses: true, mustache: true }, 11, -2, -Math.PI / 2);
    await c.walkTo(khai, 2.5, -5.5, 1.4);
    c.faceBoth(khai);
    await c.talk([
      ["Lâm Văn Khải", "Ông Năm phải không? Trời, ba mươi năm vẫn đứng cổng. Tôi là Khải đây, hồi xưa làm kế toán trường."],
      ["Lâm Văn Khải", "Lên phòng tôi uống tách trà. Tầng ba mươi chín."],
    ]);
    c.remove(khai);
    c.objective("Đi thang máy lên tầng 39", 10.8, -2);
    await c.interact(10.8, -2, "Gọi thang máy");
    c.audio.door();
    c.flash("#000", 400);
    c.place(OX + 4.6, 3, Math.PI / 2);
    const k2 = c.npc({ shirt: "#1b2440", pants: "#1b2440", hair: "#888", glasses: true, mustache: true }, OX, -2.1, 0);
    c.objective("Nói chuyện với ông Khải", OX, 0.3);
    await c.interact(OX, 0.4, "Ngồi xuống", 2.4);
    c.faceBoth(k2);
    await c.talk([
      ["Lâm Văn Khải", "Ông Năm, tôi nghe nói tuần sau ông về hưu. Ba mươi năm, lương bảo vệ được bao nhiêu đâu."],
      ...(f.evidence.soTruc ? [["Lâm Văn Khải", "Người ta nói ông giữ cuốn sổ trực cũ của ông Tư. Giấy cũ, mối mọt, giữ làm gì."]] : []),
      ["Lâm Văn Khải", "Đây là chút quà về hưu. Hai trăm triệu. Coi như tôi cảm ơn ông đã giữ trường bao năm."],
    ]);
    const k = await c.choose("Bác Năm", "(Phong bì dày cộm nằm trên bàn kính.)", [
      "Nhận phong bì. Mình sắp về hưu, con cháu còn khó khăn…",
      "Từ chối phong bì. Lương bảo vệ ít, nhưng sạch.",
      "Hỏi thẳng: đêm 14/9/2006, anh vào phòng tài vụ làm gì?",
    ]);
    if (k === 0) {
      f.bribe = true;
      c.audio.bad();
      await c.talk([["Lâm Văn Khải", "Ông là người biết điều."], ["Bác Năm", "(Phong bì nặng hơn bác tưởng.)"]]);
    } else if (k === 1) {
      await c.talk([["Lâm Văn Khải", "…Tùy ông. Người già hay cố chấp."]]);
    } else {
      await c.talk([["Lâm Văn Khải", "(Ông ta im lặng một lúc lâu, rồi cười.) Ông Năm, ông trực ca ngày. Ông biết gì về ca đêm?"]]);
    }
    c.audio.beep();
    await c.talk([
      ["Lâm Văn Khải", "(nghe điện thoại, bước ra hành lang) …Ừ. Cái kho cũ ở trường Hòa Bình. Tối mai bão vào, làm cho gọn. Đừng để sót gì."],
    ]);
    await c.walkTo(k2, OX - 5, 3.5, 1.6);
    c.remove(k2);
    if (!f.bribe) {
      c.objective("Ông ta ra ngoài rồi. Lục tủ hồ sơ", OX + 4.6, -3.4);
      await c.interact(OX + 4.6, -3.4, "Mở tủ hồ sơ", 1.6);
      c.audio.paper();
      await c.talk([
        ["Bác Năm", "Hợp đồng “tư vấn xây dựng” giữa trường Hòa Bình và Công ty Khải Hưng, ký ngày 16/9/2006. Tám trăm triệu."],
        ["Bác Năm", "Ký sau khi tiền đã chuyển. Hợp đồng ký khống để hợp thức hóa."],
      ]);
      f.evidence.hopDong = true;
      c.audio.good();
      c.toast("Có manh mối: Hợp đồng ký khống");
    }
    c.objective("Rời khỏi đây trước khi ông ta quay lại", OX + 5.2, 3);
    await c.interact(OX + 5.2, 3, "Đi thang máy xuống", 1.8);
    c.audio.door();
    return "done";
  },
};
