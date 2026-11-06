// Progress is stored once per shift start, so "Chơi tiếp" resumes at the shift you were on.
const KEY = "bac-bao-ve-save-v1";

export function freshFlags() {
  return {
    helped: { minh: false, hang: false, thao: false, tuan: false },
    evidence: { soTruc: false, saoKe: false, loiKhai: false, hopDong: false },
    bribe: false,
    mistakes: 0,
    reputation: 0,
  };
}

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.shift === "number" && s.flags) return s;
  } catch {}
  return null;
}

export function writeSave(shift, flags) {
  localStorage.setItem(KEY, JSON.stringify({ shift, flags, savedAt: Date.now() }));
}

export function clearSave() {
  localStorage.removeItem(KEY);
}
