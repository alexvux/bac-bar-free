// Ca 5: quay về trường Hòa Bình trong đêm bão. Tuần tra, những người bác từng giúp quay lại, đuổi kẻ đốt kho, quyết định cuối.
import * as THREE from "three";
import { add, box, pointLight, scene } from "../engine.js";
import { buildSchool } from "./school.js";

export const ca5 = {
  place: "Trường Hòa Bình", time: "23:00 · bão", ambience: "storm",
  title: "Đêm bão cuối cùng",
  doneTitle: "",
  intro: `<p>Ca cuối. Đúng mười tám năm sau đêm ông Tư trực, bão lại vào thành phố.</p>
    <p>Điện cúp cả khu. Bác Năm khoác áo mưa, cầm đèn pin, đi tuần ba điểm: cổng trường, máy phát điện, kho cũ.</p>
    <p>Tuần sau kho cũ bị đập. Và bác nhớ câu ông Khải nói qua điện thoại: <i>“Tối mai bão vào, làm cho gọn.”</i></p>`,
  build(c) {
    buildSchool({ night: true });
    // rain: short line streaks recycled in a box around the player
    const N = 2500, pos = new Float32Array(N * 6);
    const drop = (i, y) => {
      const x = (Math.random() - 0.5) * 36, z = (Math.random() - 0.5) * 36;
      pos.set([x, y, z, x + 0.12, y + 0.55, z], i * 6);
    };
    for (let i = 0; i < N; i++) drop(i, Math.random() * 14);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x8fa8c8, transparent: true, opacity: 0.45 }));
    rain.frustumCulled = false;
    add(rain);
    const hemi = scene.children.find((o) => o.isGroup)?.children.find((o) => o.isHemisphereLight);
    let next = 3;
    c.onUpdate((dt, t) => {
      const p = c.player;
      rain.position.set(p.x, 0, p.z);
      const fall = dt * 18, drift = dt * 4;
      for (let i = 0; i < N; i++) {
        const o = i * 6;
        pos[o + 1] -= fall; pos[o + 4] -= fall; pos[o] -= drift; pos[o + 3] -= drift;
        if (pos[o + 1] < 0) drop(i, 14);
      }
      geo.attributes.position.needsUpdate = true;
      next -= dt;
      if (next <= 0) {
        next = 6 + Math.random() * 8;
        c.flash("#cfe0ff", 160);
        if (hemi) { hemi.intensity = 2.2; setTimeout(() => (hemi.intensity = 0.35), 140); }
        setTimeout(() => c.audio.thunder(), 300 + Math.random() * 900);
      }
    });
  },
  async run(c) {
    const f = c.flags, h = f.helped;
    c.flashlight(true);
    c.place(5, 7.4, 0.2);
    await c.talk([
      ["Bác Năm", "Ông Tư à. Mười tám năm trước ông cũng đứng đây, mưa cũng như vầy."],
      ["Bác Năm", "Ca cuối của tui. Tui trực cho cả hai đứa mình."],
    ]);

    // checkpoint 1: gate
    let m = c.marker(0, 10.2, 0xffd060);
    c.objective("Tuần tra đêm: chấm công điểm 1/3, cổng trường", 0, 10.2);
    await c.interact(0, 10.2, "Chấm công: Cổng trường", 1.8);
    c.audio.beep(); c.remove(m);
    if (h.tuan) {
      const bike = box(1.5, 0.3, 14.5, 0.5, 0.7, 1.8, 0x8a1f1f, { solid: false });
      const tuan = c.npc({ shirt: "#2b4a7a", pants: "#1a1a2a", hair: "#111" }, 1.5, 15, Math.PI);
      await c.walkTo(tuan, 1, 12.8, 2);
      c.faceBoth(tuan);
      await c.talk([
        ["Tuấn", "Bác Năm! Tối qua con nghe tụi bên tháp nói chuyện, có người được sai qua trường mình. Con tới trực với bác."],
        ["Bác Năm", "Mưa vầy mà mày chạy xe qua… Được. Mày đứng chặn cổng cho bác."],
      ]);
      c.toast("Tuấn chặn cổng trường. Kẻ gian khó thoát hơn.");
      bike.position.set(0, 0.3, 12.8);
    }
    if (h.hang) {
      box(-5, 0.3, 15.5, 1.8, 0.8, 3.6, 0xeeeeee, { solid: false });
      pointLight(-5, 0.8, 13.5, 0xfff6d0, 10, 14);
      const hang = c.npc({ shirt: "#2c7a5c", pants: "#222", hair: "#1a1a1a", hairStyle: "long" }, -4, 14.5, Math.PI);
      await c.walkTo(hang, -1, 12.8, 1.8);
      c.faceBoth(hang);
      await c.talk([
        ["Chị Hằng", "Bác Năm, em in bản sao kê có dấu ngân hàng rồi. Có chuyện gì em quay phim lại hết."],
        ["Bác Năm", "Cô bật đèn xe lên giùm bác. Tối quá."],
      ]);
      f.video = true;
      c.toast("Đèn xe chị Hằng rọi sáng sân trường.");
      pointLight(0, 3, 4, 0xfff6d0, 12, 22);
    }

    // checkpoint 2: generator
    m = c.marker(12, 5.4, 0xffd060);
    c.objective("Tuần tra đêm: chấm công điểm 2/3, máy phát điện", 12, 5.4);
    await c.interact(12, 5.4, "Kiểm tra máy phát", 1.8);
    c.audio.beep(); c.remove(m);
    await c.say("Bác Năm", "Dây máy phát bị cắt gọn. Không phải chuột cắn.");
    let bonus = 0;
    if (h.minh) {
      const minh = c.npc({ shirt: "#ffcc33", pants: "#1f3c88", hair: "#111", height: 0.72 }, 12.5, -3.5, Math.PI);
      const me = c.npc({ shirt: "#3a7a8a", pants: "#333", hair: "#111", hairStyle: "long" }, 11.5, -3.8, Math.PI);
      await c.walkTo(minh, 11.6, 3.6, 2.2);
      c.faceBoth(minh);
      me.position.set(10.6, 0, 3.2);
      await c.talk([
        ["Minh", "Bác Năm! Con với mẹ mang cháo cho bác. Mẹ nói đêm bão bác trực một mình tội lắm."],
        ["Minh", "Mà bác ơi, hồi nãy con thấy một ông lạ chui chỗ hàng rào lủng, xách can gì nặng lắm, đi về phía kho!"],
        ["Chị Duyên", "Bác lo đi, con với cháu đứng dưới mái hiên, có gì con gọi công an."],
      ]);
      bonus = 12;
      c.toast("Nhờ Minh, bác biết sớm kẻ lạ đang ở kho cũ.");
    }
    if (h.thao) {
      const thao = c.npc({ shirt: "#e8f4f8", pants: "#e8f4f8", hair: "#1a1a1a", hairStyle: "long" }, 6, 10.5, Math.PI);
      await c.walkTo(thao, 10, 6, 2);
      c.faceBoth(thao);
      await c.talk([
        ["Cô Thảo", "Con tan ca, ghé đưa bác cái này. Ông Sáu mất hôm qua rồi bác…"],
        [
          "Cô Thảo",
          f.evidence.loiKhai
            ? "Trước khi đi ông nhờ con ghi âm lời ông kể. Ông dặn đưa tận tay bác Năm."
            : "Ông có kể con nghe chuyện năm 2006, con ghi âm lại được một đoạn. Ông dặn đưa bác Năm.",
        ],
        ["Cô Thảo", "Còn đây là miếng cao dán, bác dán vô gối. Đêm nay chắc bác phải chạy."],
      ]);
      f.evidence.loiKhai = true;
      c.player.drainMul = 0.6;
      c.toast("Cao dán của cô Thảo: bác chạy bền hơn.");
    }

    // checkpoint 3: old storeroom on fire
    m = c.marker(-8, 1, 0xff7040);
    c.objective("Tuần tra đêm: điểm 3/3, kho cũ", -8, 1);
    await c.reach(-4.8, 1, 2);
    c.remove(m);
    const fire = makeFire(c, -11, 1);
    c.audio.fire();
    const hung = c.npc({ shirt: "#222", pants: "#222", hair: "#111", scar: true, hat: "#222" }, -7.8, -1.4, Math.PI / 2);
    await c.talk([
      ["Bác Năm", "Ê! Ai đó! Bỏ cái can xuống!"],
      ["Kẻ phóng hỏa", "Lão già này…!"],
    ]);
    c.objective("Bắt kẻ phóng hỏa trước khi lửa lan!");
    const caught = await c.chase({
      npc: hung, name: "Kẻ phóng hỏa", speed: h.tuan ? 4.2 : 4.7, time: 38 + bonus, headStart: 1.0, stunText: "Hắn hất can xăng vào bác!",
      path: [[-6.8, -5.5], [7, -5.5], [7, 6.5], [-6.5, 6.5]], loopFrom: 0,
    });
    if (!caught) {
      fire.grow(2.5);
      c.audio.bad();
      await c.talk([
        ["Bác Năm", "(Hắn trèo qua hàng rào, mất hút trong mưa.)"],
        ["Bác Năm", "Kho cháy rồi… Mấy thùng hồ sơ cũ của trường, cháy hết rồi."],
      ]);
      return "storm";
    }
    c.audio.good();
    await c.talk([
      ["Kẻ phóng hỏa", "Buông tôi ra! Người ta trả tiền, tôi làm thôi!"],
      ["Bác Năm", "Ai trả?"],
      ["Kẻ phóng hỏa", "…Ông Khải. Ông Khải bên Khải Hưng."],
    ]);
    const anyHelper = h.tuan || h.hang || h.thao || h.minh;
    if (anyHelper) {
      c.toast("Mọi người xách bình chữa cháy chạy tới. Lửa tắt dần.");
      await c.wait(600);
    } else {
      c.objective("Lấy bình chữa cháy ở chòi bảo vệ", 5, 7.8);
      await c.interact(5, 7.8, "Lấy bình chữa cháy");
      c.objective("Dập lửa ở kho cũ", -8, 1);
      await c.interact(-8, 1, "Xịt bình chữa cháy", 2.4);
    }
    fire.out();
    await c.say("Bác Năm", "Thùng hồ sơ trong góc còn nguyên. Sổ quỹ gốc năm 2006 đây rồi.");

    // Khải arrives
    box(2.5, 0.3, 15.5, 1.9, 0.9, 4, 0x111111, { solid: false });
    pointLight(2.5, 0.8, 13.3, 0xffffff, 10, 12);
    const khai = c.npc({ shirt: "#1b2440", pants: "#1b2440", hair: "#888", glasses: true, mustache: true }, 2.5, 13.5, Math.PI);
    await c.walkTo(khai, 0.5, 12.8, 1.4);
    c.objective("Ra cổng gặp ông Khải", 0.5, 10.6);
    await c.interact(0.5, 10.6, "Đối mặt ông Khải", 2.4);
    c.faceBoth(khai);
    const evidence = ["soTruc", "saoKe", "loiKhai", "hopDong"].filter((k) => f.evidence[k]).length + (f.video ? 1 : 0);
    const helpers = Object.values(h).filter(Boolean).length;
    await c.talk([
      ["Lâm Văn Khải", "Ông Năm. Đêm mưa gió, ông bắt người lung tung. Thằng đó tôi không quen."],
      ["Lâm Văn Khải", f.bribe ? "Ông đã nhận của tôi một lần rồi. Thêm năm trăm triệu nữa, coi như đêm nay không có gì." : "Năm trăm triệu. Ông về hưu sung sướng, coi như đêm nay không có gì."],
      ...(helpers ? [["Bác Năm", `(Sau lưng bác: ${helperNames(h)}. Không ai bỏ đi.)`]] : [["Bác Năm", "(Chỉ có bác và tiếng mưa.)"]]),
    ]);
    const k = await c.choose("Bác Năm", "", [
      f.bribe ? "Trả lại phong bì. Giao hết cho công an: kẻ phóng hỏa, sổ sách, mọi thứ." : "Giao hết cho công an: kẻ phóng hỏa, sổ sách, mọi thứ.",
      "Nhận tiền. Coi như chưa có gì.",
    ]);
    if (k === 1) {
      await c.talk([["Lâm Văn Khải", "Ông là người biết điều. Thằng kia để tôi lo."], ["Bác Năm", "(Bác đứng nhìn chiếc xe đen lăn bánh. Mưa vẫn không tạnh.)"]]);
      return "storm";
    }
    await c.talk([
      ["Bác Năm", "Ông Tư trực đêm đó, không ngủ gật. Ổng ghi rõ giờ anh vào phòng tài vụ. Tui giữ cuốn sổ."],
      ["Bác Năm", `Tui có ${evidence} thứ để nộp. Phần còn lại để công an hỏi anh.`],
    ]);
    return evidence >= 3 && helpers >= 2 ? "truth" : "quiet";
  },
};

function helperNames(h) {
  return [h.tuan && "Tuấn", h.hang && "chị Hằng", h.thao && "cô Thảo", h.minh && "Minh và mẹ"].filter(Boolean).join(", ");
}

function makeFire(c, x, z) {
  const g = new THREE.Group();
  const flames = [];
  const fm = [0xff5a1a, 0xffa020, 0xffd040].map((color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.35 + Math.random() * 0.3, 1 + Math.random(), 5), fm[i % 3]);
    f.position.set((Math.random() - 0.5) * 2.5, 0.5, (Math.random() - 0.5) * 2.5);
    g.add(f); flames.push(f);
  }
  const light = new THREE.PointLight(0xff7a30, 15, 14, 1.5);
  light.position.y = 1.5;
  g.add(light);
  g.position.set(x, 0, z);
  add(g);
  let scale = 0.6, alive = true;
  c.onUpdate((dt, t) => {
    if (!alive) return;
    if (scale < 2) scale += dt * 0.02;
    flames.forEach((f, i) => { f.scale.set(scale, scale * (0.8 + Math.sin(t * 9 + i) * 0.3), scale); f.rotation.y += dt * 2; });
    light.intensity = 12 + Math.sin(t * 17) * 4;
  });
  return {
    grow(s) { scale = s; },
    out() { alive = false; c.remove(g); },
  };
}
