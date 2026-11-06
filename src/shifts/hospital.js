// Ca 3: Bệnh viện quận, ca đêm. Tuần tra đêm bằng đèn pin, bắt kẻ trộm thuốc, nghe ông Sáu kể chuyện 2006.
import { box, cyl, floor, room, lights, sign, pointLight, bounds } from "../engine.js";

const CHECKPOINTS = [
  { name: "Cửa cấp cứu", x: -6.5, z: 8.5 },
  { name: "Hành lang khoa Nội", x: -6.5, z: -12 },
  { name: "Kho thuốc", x: 2.5, z: -17.5 },
  { name: "Cầu thang bộ", x: 6.5, z: -2 },
];

export const ca3 = {
  place: "Bệnh viện Quận", time: "22:00", ambience: "hospital",
  title: "Hành lang không ngủ",
  doneTitle: "Trời sắp sáng",
  intro: `<p>Ca thứ ba, công ty bảo vệ điều bác sang trực đêm ở bệnh viện quận.</p>
    <p>Thuốc giảm đau trong kho cứ hao dần. Khoa nghi cô điều dưỡng trẻ tên Thảo.
    Đêm nay bác phải tuần tra đủ bốn điểm chấm công, đèn hành lang thì chập chờn.</p>`,
  build(c) {
    lights({ sky: 0x334455, ground: 0x111111, hemi: 0.35, sun: 0.1, bg: 0x05070a, fog: [0x05070a, 4, 26] });
    floor(0, -5, 18, 30, 0xb8c4c0);
    bounds(-9, 9, -20, 10);
    room(0, -5, 18, 30, 3.2, 0xdfe6e2);
    box(0, 3.2, -5, 18.4, 0.2, 30.4, 0x9aa5a2, { solid: false, shadow: false });
    // ông Sáu's ward (phòng 3) with a door on the west side, and the block of wards behind it
    room(0, 0, 8, 10, 3.2, 0xcfe0d8, { w: [0, 1.4] });
    box(0, 0, -10, 8, 3.2, 10, 0xcfe0d8);
    for (const z of [-13, -8]) box(-4.05, 0, z, 0.1, 2.2, 1.2, 0x5a7d9a, { solid: false });
    sign("PHÒNG 3", -4.2, 2.5, 0, -Math.PI / 2, { w: 1.2, h: 0.35, bg: "#2d6a4f" });
    sign("KHOA NỘI", -4.2, 2.5, -10.5, -Math.PI / 2, { w: 1.6, h: 0.4, bg: "#2d6a4f" });
    box(-1.5, 0, 2.5, 1, 0.6, 2, 0xffffff); box(-1.5, 0.6, 3.2, 1, 0.2, 0.6, 0xe0e8ff, { solid: false }); // bed
    box(1.8, 0, 2.5, 1, 0.6, 2, 0xffffff);
    cyl(-0.6, 0, 3.6, 0.05, 1.8, 0x999999, { solid: false });
    // nurse desk and benches
    box(7, 0, 8.2, 3, 1.1, 0.8, 0x6a8caf);
    sign("TRỰC ĐIỀU DƯỠNG", 7, 2.4, 9.83, Math.PI, { w: 2.6, h: 0.45, bg: "#1d4e89" });
    for (const z of [-6, 1]) box(-8.6, 0, z, 0.6, 0.45, 2.4, 0x2d6a4f);
    // medicine storage
    for (const x of [3, 5, 7.6]) box(x, 0, -19.5, 1.4, 2.2, 0.6, 0xe8e8e8);
    sign("KHO THUỐC", 5, 2.7, -19.75, 0, { w: 1.8, h: 0.4, bg: "#9c3b2a" });
    sign("CẦU THANG BỘ", 8.9, 2.4, -2, -Math.PI / 2, { w: 2.2, h: 0.4, bg: "#444" });
    sign("CẤP CỨU", -6.5, 2.6, 9.83, Math.PI, { w: 1.8, h: 0.45, bg: "#c0392b" });
    // flickering fluorescent lights along the ring corridor
    const ls = [[-6.5, 7], [-6.5, -3], [-6.5, -13], [0, -17.5], [6.5, -13], [6.5, -3], [6.5, 7], [0, 7.5], [0, 1.5]];
    ls.forEach(([x, z], i) => {
      const l = pointLight(x, 3, z, 0xd8f0ff, 5, 9);
      box(x, 3.05, z, 0.3, 0.06, 1.2, 0xeeffff, { solid: false, shadow: false });
      if (i % 3 === 1) c.onUpdate((dt, t) => { l.intensity = Math.sin(t * 13 + i) > 0.6 || Math.sin(t * 2.3 + i) > 0.2 ? 5 : 0.3; });
    });
  },
  async run(c) {
    const f = c.flags;
    c.flashlight(true);
    c.place(7, 5.5, 0);
    const thao = c.npc({ shirt: "#e8f4f8", pants: "#e8f4f8", hair: "#1a1a1a", hairStyle: "long" }, 7, 9.1, Math.PI);
    thao.rotation.y = Math.PI;
    c.objective("Gặp cô điều dưỡng Thảo ở quầy trực", 7, 7.2);
    await c.interact(7, 7.2, "Nói chuyện với cô Thảo");
    await c.talk([
      ["Cô Thảo", "Bác là bảo vệ mới hả bác? Con là Thảo, trực khoa Nội."],
      ["Cô Thảo", "Kho thuốc cứ mất morphin, sổ sách thì con giữ. Ai cũng nhìn con…"],
      ["Bác Năm", "Bác đi tuần một vòng. Có gì bác thấy, bác nói đúng cái bác thấy."],
      ["Cô Thảo", "Bốn điểm chấm công bác nhớ đi theo thứ tự nha. Đèn hành lang hư hoài, bác cầm đèn pin."],
    ]);

    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const cp = CHECKPOINTS[i];
      const m = c.marker(cp.x, cp.z, 0x58d0ff);
      c.objective(`Tuần tra đêm: chấm công điểm ${i + 1}/4, ${cp.name}`, cp.x, cp.z);
      await c.interact(cp.x, cp.z, `Chấm công: ${cp.name}`, 1.8);
      c.audio.beep();
      c.remove(m);
      c.toast(`Đã chấm công ${i + 1}/4: ${cp.name}`);
      if (i === 1) {
        await c.say("Bác Năm", "(Có tiếng lạch cạch ở cuối hành lang… phía kho thuốc.)");
      }
      if (i === 2) await thiefScene(c, f);
    }

    // ông Sáu calls from ward 3
    c.objective("Có tiếng gọi khẽ từ phòng 3", -2.7, 0.8);
    await c.interact(-2.7, 0.8, "Vào phòng 3", 2);
    const sau = c.npc({ shirt: "#9ab0c8", pants: "#9ab0c8", hair: "#dddddd", hairStyle: "short" }, -1.5, 2.6, Math.PI);
    sau.rotation.x = 0; sau.position.y = 0.2;
    await c.talk([
      ["Ông Sáu", "Chú… chú là Năm, bảo vệ trường Hòa Bình phải không? Tui là Sáu, hồi xưa quét dọn ở trường."],
      ["Bác Năm", "Ông Sáu! Trời đất, mười mấy năm rồi. Ông sao nằm đây?"],
      ["Ông Sáu", "Ung thư, bác sĩ nói không còn bao lâu. Tui có chuyện đè trong bụng mười tám năm…"],
    ]);
    const k = await c.choose("Bác Năm", "", ["Ngồi xuống bên giường, nghe ông kể.", "Ông ngủ đi, khuya rồi. Mai tôi ghé."]);
    if (k === 0) {
      await c.talk([
        ["Ông Sáu", "Đêm bão năm 2006, gần nửa đêm, tui thấy thầy Khải ôm cái bao tải ra cửa sau, bỏ lên xe hơi."],
        ["Ông Sáu", "Sáng ra người ta bắt ông Tư. Thầy Khải dúi cho tui năm triệu, biểu tui im."],
        ["Ông Sáu", "Tui hèn, chú Năm. Giờ tui muốn nói. Chú nhờ cô Thảo ghi âm giùm tui, làm chứng cho ông Tư."],
        ["Bác Năm", "Ông nói đi, tôi nghe đây."],
      ]);
      f.evidence.loiKhai = true;
      c.audio.good();
      c.toast("Có manh mối: Lời kể của ông Sáu");
    } else {
      await c.talk([["Ông Sáu", "…Ừ. Mai. Mai tui kể."], ["Bác Năm", "(Sáng hôm sau, phòng 3 đã kéo rèm. Ông Sáu chuyển viện lúc năm giờ.)"]]);
    }
    c.objective("Về quầy trực, ghi sổ", 7, 7.2);
    await c.interact(7, 7.2, "Ghi sổ trực đêm");
    c.audio.paper();
    return "done";
  },
};

async function thiefScene(c, f) {
  const lanh = c.npc({ shirt: "#4a7a5a", pants: "#4a7a5a", hair: "#222", hat: "#4a7a5a" }, 7.6, -18.4, Math.PI);
  await c.talk([
    ["Bác Năm", "Ai đó? Giờ này tạp vụ đâu có làm ở kho thuốc!"],
    ["Người lạ", "…!"],
  ]);
  c.objective("Đuổi bắt kẻ trộm thuốc!");
  const caught = await c.chase({
    npc: lanh, name: "Kẻ trộm thuốc", speed: 4.3, time: 60, headStart: 1.4, stunText: "Hắn hất xe đẩy vào bác!",
    path: [[7.2, -14], [6.5, 7.5], [-6.5, 7.5], [-6.5, -17.5], [6.5, -17.5]], loopFrom: 1,
  });
  if (caught) {
    c.audio.good();
    await c.talk([
      ["Kẻ trộm thuốc", "Đừng, bác ơi! Con là Lành, làm tạp vụ hợp đồng. Con lấy thuốc bán, con nợ tiền…"],
      ["Bác Năm", "Đứng dậy. Ra quầy trực với bác."],
    ]);
  } else {
    c.audio.bad();
    await c.say("Bác Năm", "(Hắn chạy ra cầu thang bộ mất rồi. Nhưng bác thấy rõ bộ đồ tạp vụ màu xanh.)");
  }
  c.remove(lanh);
  c.objective("Về quầy trực báo cô Thảo", 7, 7.2);
  await c.interact(7, 7.2, "Báo lại");
  await c.talk([
    ["Bác sĩ Phong", "Chuyện gì ồn ào vậy? Cô Thảo, tôi đã nói kho thuốc là trách nhiệm của cô…"],
    ["Cô Thảo", "Dạ…"],
  ]);
  const k = await c.choose("Bác Năm", "", [
    caught ? "Biên bản ghi rõ: người lấy thuốc là Lành, tạp vụ hợp đồng. Cô Thảo không liên quan." : "Biên bản ghi: tôi thấy rõ một người mặc đồ tạp vụ, không phải cô Thảo.",
    "Tôi không thấy rõ. Ai lấy thì khoa tự điều tra.",
  ]);
  if (k === 0) {
    f.helped.thao = true;
    c.audio.good();
    await c.talk([["Bác sĩ Phong", "…Vậy sáng mai lập biên bản. Xin lỗi cô Thảo."], ["Cô Thảo", "Bác Năm… con cảm ơn bác. Bác cần gì, bác cứ gọi con."]]);
  } else {
    await c.talk([["Cô Thảo", "(Thảo cúi đầu, cắn môi.)"]]);
  }
}
