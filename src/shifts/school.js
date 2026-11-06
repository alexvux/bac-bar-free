// Ca 1: Trường Tiểu học Hòa Bình, giờ tan học. Also exports the school map reused by ca 5.
import { box, cyl, floor, room, lights, sign, pointLight, add, mat, bounds } from "../engine.js";
import * as THREE from "three";

export const SCHOOL = {
  gate: [0, 11.2], booth: [5, 9], kho: [-11, 1], khoShelf: [-12.6, 1], fenceBack: [11, -5.5], flag: [0, -1],
  generator: [12, 4],
};

export function buildSchool({ night = false } = {}) {
  if (night) lights({ sky: 0x223044, ground: 0x111111, hemi: 0.35, sun: 0.15, sunColor: 0x8899bb, bg: 0x0b0f18, fog: [0x0b0f18, 6, 40] });
  else lights({ sky: 0xffd9a8, ground: 0x6a5a40, hemi: 1.1, sun: 1.3, sunColor: 0xffc890, bg: 0xf2b88a, fog: [0xf2b88a, 30, 80] });
  floor(0, 0, 80, 80, night ? 0x2a3326 : 0x7d8f56);
  bounds(-14, 14, -14, 21);
  floor(0, 1, 26, 22, night ? 0x3a3a3e : 0xb9ad94); // sân trường
  floor(0, 18, 80, 10, night ? 0x202024 : 0x4a4a4e); // đường
  // main classroom block (yellow, like many Vietnamese schools)
  const wall = night ? 0x8a7a40 : 0xf0c94a;
  box(0, 0, -12, 28, 6.5, 5, wall);
  box(0, 6.5, -12, 29, 0.4, 6, 0x9c3b2a, { solid: false });
  for (let i = -12; i <= 12; i += 3) {
    box(i, 1, -9.45, 1.4, 1.5, 0.1, night ? 0x223344 : 0x6fa3c8, { solid: false });
    box(i, 4, -9.45, 1.4, 1.5, 0.1, night ? 0x223344 : 0x6fa3c8, { solid: false });
  }
  box(0, 0, -9.45, 2, 2.6, 0.12, 0x5a3a22, { solid: false });
  sign("TRƯỜNG TIỂU HỌC HÒA BÌNH", 0, 5.6, -9.38, 0, { w: 9, h: 0.9, bg: "#1f4e8c" });
  // fence with gate gap at x -2..2 on the south side
  const fence = night ? 0x555a60 : 0x7c8a96;
  box(-8, 0, 12, 12, 1.8, 0.2, fence); box(8, 0, 12, 12, 1.8, 0.2, fence);
  box(-14, 0, 0, 0.2, 1.8, 24, fence); box(14, 0, 0, 0.2, 1.8, 24, fence);
  box(-2.2, 0, 12, 0.4, 2.4, 0.4, 0xcccccc); box(2.2, 0, 12, 0.4, 2.4, 0.4, 0xcccccc);
  sign("CỔNG TRƯỜNG", 0, 2.7, 12.1, Math.PI, { w: 3, h: 0.5, bg: "#9c3b2a" });
  // guard booth
  box(5, 0, 9.5, 2.4, 2.6, 2.2, 0xe8e2d0);
  box(5, 2.6, 9.5, 2.8, 0.2, 2.6, 0x3a6e4a, { solid: false });
  box(5, 1.1, 8.38, 1.6, 0.9, 0.05, 0x9fc6dd, { solid: false });
  sign("BẢO VỆ", 5, 2.2, 8.37, 0, { w: 1.4, h: 0.35, bg: "#3a6e4a" });
  // flag pole and trees
  cyl(0, 0, -1, 0.08, 8, 0xdddddd);
  const flag = box(0.6, 7.2, -1, 1.2, 0.8, 0.03, 0xd52b1e, { solid: false });
  flag.userData.flag = true;
  for (const [x, z] of [[-9, -5], [9, -5], [-9, 6], [10, 7], [12, -5]]) {
    cyl(x, 0, z, 0.25, 2, 0x6b4a2b);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), mat(night ? 0x1f3a22 : 0x3f8a3c));
    c.position.set(x, 3, z); c.castShadow = true; add(c);
  }
  // benches
  box(-4, 0, 3, 2, 0.45, 0.5, 0x8a5a33); box(4, 0, 3, 2, 0.45, 0.5, 0x8a5a33);
  // old storeroom (kho cũ) on the west side, door facing east
  room(-11, 1, 5, 5, 3, night ? 0x6a6a60 : 0xc8bfa8, { e: [0, 1.4] });
  box(-11, 3, 1, 5.4, 0.2, 5.4, 0x7a4a2a, { solid: false });
  sign("KHO CŨ", -8.34, 2.4, 1, Math.PI / 2, { w: 1.4, h: 0.4, bg: "#5a4a3a" });
  box(-12.9, 0, 1, 0.6, 2, 3, 0x7a5a3a); // shelf
  for (let i = 0; i < 6; i++) box(-12.8, 0.3 + (i % 3) * 0.6, -0.5 + Math.floor(i / 3) * 1.8, 0.4, 0.3, 0.6, [0x996644, 0x775533, 0xaa8855][i % 3], { solid: false });
  box(-10, 0, 2.6, 1, 1, 1, 0x8a6a44); box(-10.2, 1, 2.6, 0.7, 0.6, 0.7, 0x997755, { solid: false });
  // generator shed
  box(12, 0, 4, 1.4, 1.2, 1, 0x556b2f);
  pointLight(5, 2.4, 8, 0xffe2a0, night ? 4 : 1, 8);
}

export const ca1 = {
  place: "Trường Tiểu học Hòa Bình", time: "16:30", ambience: "school",
  title: "Tiếng trống tan trường",
  doneTitle: "Một ngày bình thường, gần như vậy",
  intro: `<p>Bác Năm làm bảo vệ ở trường Hòa Bình đã ba mươi năm. Còn năm ca nữa thôi.</p>
    <p>Mười tám năm trước, cũng ở trường này, quỹ xây trường 800 triệu biến mất trong một đêm bão.
    Ông Tư, người trực đêm đó và là bạn thân của bác, bị đuổi việc. Ông mất năm 2010, vẫn mang tiếng ăn cắp.</p>
    <p>Chiều nay là giờ tan học. Có tin kẻ lạ giả phụ huynh đón trẻ ở trường bên cạnh.</p>`,
  build() { buildSchool(); },
  async run(c) {
    c.place(5, 7, 0.3);
    const f = c.flags;
    const hoa = c.npc({ shirt: "#f4f0e8", pants: "#2b3a6b", hair: "#222", hairStyle: "long" }, 2, 4, 0);
    c.objective("Nói chuyện với cô hiệu trưởng Hoa", 2, 4);
    await c.interact(2, 4, "Nói chuyện với cô Hoa");
    c.faceBoth(hoa);
    await c.talk([
      ["Cô Hoa", "Bác Năm, tuần sau bác nghỉ rồi mà vẫn đi sớm hơn ai hết."],
      ["Bác Năm", "Quen rồi cô. Ba mươi năm, cái chân nó tự đi ra cổng."],
      ["Cô Hoa", "Trường bên có người giả phụ huynh đón trẻ. Hôm nay bác soi thẻ đón kỹ giúp em nha."],
    ]);
    c.objective("Ra cổng, kiểm tra thẻ đón học sinh", ...SCHOOL.gate);
    await c.reach(0, 10.2, 1.8);
    c.player.yaw = Math.PI;

    const rules = ["Chỉ đón: Bảo An (1A), Gia Huy (2B), Ngọc Hân (3A)", "Ảnh trên thẻ phải khớp người đón", "Thẻ phải là năm học 2026–2027"];
    const parents = [
      { look: { shirt: "#c0504d", skin: "#e0b08a", hair: "#2a1a10", hairStyle: "long" }, doc: {
        fields: [["Người đón", "Phạm Thị Mai"], ["Quan hệ", "Mẹ"], ["Học sinh", "Bảo An – 1A"], ["Năm học", "2026–2027"]],
        says: "Bé An nhà em hôm nay có tiết vẽ, bác thấy nó chưa?", ask: "Em là mẹ bé, tháng nào em cũng gặp bác mà." } },
      { look: { shirt: "#333333", skin: "#c99a70", hair: "#111111", hairStyle: "bald" }, photoDiff: { glasses: true, mustache: true, hairStyle: "short" }, invalid: true, doc: {
        fields: [["Người đón", "Đỗ Văn Lực"], ["Quan hệ", "Chú"], ["Học sinh", "Gia Huy – 2B"], ["Năm học", "2026–2027"]],
        says: "Ba thằng Huy nhờ tôi đón. Nhanh lên bác, tôi kẹt xe.", ask: "Ảnh hồi trước, giờ tôi cạo đầu, bỏ kính rồi. Bác lằng nhằng quá." } },
      { look: { shirt: "#6b8e5a", skin: "#d0a07a", hair: "#bbbbbb", hairStyle: "short" }, doc: {
        fields: [["Người đón", "Lê Thị Tám"], ["Quan hệ", "Bà ngoại"], ["Học sinh", "Ngọc Hân – 3A"], ["Năm học", "2026–2027"]],
        says: "Bác Năm khỏe không? Con bé Hân hay quên nón lắm.", ask: "Tui đón con Hân hai năm nay rồi, bác nhớ không?" } },
    ];
    let correct = 0;
    for (const p of parents) {
      const n = c.npc(p.look, 0, 16, Math.PI);
      await c.walkTo(n, 0, 12.9, 1.8);
      c.faceBoth(n);
      const photo = { ...p.look, ...(p.photoDiff || {}) };
      const r = await c.idCheck({ title: "THẺ ĐÓN HỌC SINH", rules, fields: p.doc.fields, photo, face: p.look, stamp: "TRƯỜNG TH HÒA BÌNH", says: p.doc.says, ask: p.doc.ask, invalid: p.invalid });
      if (r.correct) correct++;
      if (p.invalid && !r.allowed) {
        await c.talk([["Đỗ Văn Lực", "Lão già lẩm cẩm!"], ["Bác Năm", "Ảnh không khớp thì tôi không giao cháu. Anh gọi ba cháu tới đây."]]);
        c.toast("Gã đàn ông bỏ đi. Lát sau ba bé Huy tới, cảm ơn bác rối rít.");
        f.reputation++;
        await c.walkTo(n, 6, 17, 2.6);
      } else if (p.invalid) {
        c.audio.bad();
        await c.talk([["Cô Hoa", "Bác Năm! Người đó không phải chú bé Huy! May mà cô giáo chủ nhiệm giữ bé lại kịp…"], ["Bác Năm", "(Mình già thật rồi. Ảnh rõ ràng khác mà.)"]]);
        await c.walkTo(n, -6, 17, 2.6);
      } else {
        await c.walkTo(n, 0, 11, 1.5);
        await c.walkTo(n, 2, 16, 1.5);
      }
      c.remove(n);
    }
    c.toast(`Đã kiểm tra 3 thẻ đón: đúng ${correct}/3.`);

    c.objective("Cô Hoa nhờ dọn kho cũ, chuẩn bị đập để xây nhà đa năng", -9.5, 1);
    c.remove(hoa);
    await c.reach(-9.8, 1, 1.4);
    c.objective("Lục kệ hồ sơ trong kho", -12, 1);
    await c.interact(-12, 1, "Lục kệ hồ sơ", 1.8);
    c.audio.paper();
    await c.talk([
      ["Bác Năm", "Sổ trực đêm… năm 2006. Chữ ông Tư đây mà."],
      ["Sổ trực", "“Đêm 14/9/2006. Mưa bão. 23 giờ 40: thầy Khải (kế toán) vào phòng tài vụ, nói lấy giấy tờ bỏ quên.”"],
      ["Bác Năm", "Dòng này bị ai gạch đi. Hồi đó người ta bảo ông Tư ngủ gật, không ai nhắc tới thầy Khải."],
    ]);
    const keep = await c.choose("Bác Năm", "Tuần sau kho này bị đập. Cuốn sổ thì sao đây?", ["Cất sổ vào túi áo. Ông Tư đáng được nói lại.", "Để lại. Chuyện mười tám năm rồi."]);
    if (keep === 0) { f.evidence.soTruc = true; c.audio.good(); c.toast("Có manh mối: Sổ trực đêm 2006"); }

    c.objective("Đi một vòng sân trước khi khóa cổng", 9, -3);
    await c.reach(9, -3, 2.2);
    const minh = c.npc({ shirt: "#ffffff", pants: "#1f3c88", hair: "#111", height: 0.72 }, 11.5, -6.2, -2.5);
    c.objective("Có đứa nhỏ ngồi một mình ở góc sân", 11.5, -6.2);
    await c.interact(11.5, -6.2, "Hỏi chuyện đứa nhỏ");
    c.faceBoth(minh);
    await c.talk([
      ["Bác Năm", "Ủa, giờ này con còn ở đây? Con tên gì, lớp mấy?"],
      ["Minh", "Dạ… con là Minh, lớp 5A. Mẹ con làm ca tối ở xưởng may, chín giờ mới về."],
      ["Minh", "Ở nhà một mình con sợ, nên con ngồi đây chờ…"],
    ]);
    const k = await c.choose("Bác Năm", "", [
      "Vô chòi ngồi với bác. Bác có ổ bánh mì nè, để bác gọi mẹ con.",
      "Trường đóng cửa rồi. Con về đi, không bác ghi tên.",
      "Để bác báo cô chủ nhiệm lo cho con.",
    ]);
    if (k === 0) {
      f.helped.minh = true;
      c.audio.good();
      await c.talk([
        ["Minh", "Dạ! Bác ơi… hàng rào phía sau có chỗ lủng, tụi con hay chui ra. Con chỉ bác thôi đó, bác đừng la."],
        ["Bác Năm", "Bác biết rồi. Ăn đi con. Mẹ con nói tám giờ rưỡi tới đón."],
      ]);
      c.toast("Minh sẽ nhớ bác.");
    } else if (k === 1) {
      await c.talk([["Minh", "…Dạ."], ["Bác Năm", "(Thằng nhỏ cúi đầu đi ra cổng. Mình có nặng lời quá không?)"]]);
    } else {
      await c.talk([["Minh", "Dạ thôi, con tự về được."], ["Bác Năm", "(Nó đi mất trước khi mình kịp gọi điện.)"]]);
    }
    c.remove(minh);
    c.objective("Ra khóa cổng trường", ...SCHOOL.gate);
    await c.interact(0, 11.2, "Khóa cổng", 2.4);
    c.audio.door();
    return "done";
  },
};
