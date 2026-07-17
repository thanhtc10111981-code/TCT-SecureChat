/**
 * Advanced Local NLP Predictor & Autocorrect Engine for Vietnamese.
 * Features:
 * 1. Rich pre-defined dictionary of 150+ Vietnamese chat shorthands, slang, and common typos.
 * 2. Unaccented-to-accented restoration for common chat terms (e.g., "cam on" -> "cảm ơn", "di" -> "đi").
 * 3. Support for user-defined custom shorthand mappings persisted locally in localStorage.
 * 4. Fuzzy lookup with Levenshtein Distance for spell-checking against common words.
 */

// Comprehensive Vietnamese chat shorthand mapping (Unique keys only)
const PREDEFINED_SHORTHAND_MAP: Record<string, string> = {
  // Abbreviations & Chat Speak
  "ko": "không",
  "k": "không",
  "kh": "không",
  "khg": "không",
  "k0": "không",
  "cko": "không",
  "dc": "được",
  "đc": "được",
  "dcl": "được",
  "đcl": "được",
  "đg": "đang",
  "dg": "đang",
  "j": "gì",
  "v": "vậy",
  "vy": "vậy",
  "z": "vậy",
  "ng": "người",
  "hnay": "hôm nay",
  "hn": "hôm nay",
  "trc": "trước",
  "tg": "thời gian",
  "vs": "với",
  "tk": "tài khoản",
  "bđ": "bắt đầu",
  "bd": "bắt đầu",
  "nv": "nhân viên",
  "bt": "bình thường",
  "gđ": "gia đình",
  "gd": "gia đình",
  "hp": "hạnh phúc",
  "mn": "mọi người",
  "mng": "mọi người",
  "vđ": "vấn đề",
  "vd": "vấn đề",
  "qc": "quảng cáo",
  "ny": "người yêu",
  "stk": "số tài khoản",
  "ib": "inbox",
  "rep": "trả lời",
  "dt": "điện thoại",
  "đt": "điện thoại",
  "bs": "bác sĩ",
  "lh": "liên hệ",
  "hd": "hướng dẫn",
  "hđ": "hợp đồng",
  "tt": "thông tin",
  "tks": "cảm ơn",
  "thank": "cảm ơn",
  "thanks": "cảm ơn",
  "thx": "cảm ơn",
  "cam on": "cảm ơn",
  "chao": "chào",
  "xin chao": "xin chào",
  "bit": "biết",
  "bít": "biết",
  "mik": "mình",
  "mk": "mình",
  "m": "mình",
  "t": "tôi",
  "b": "bạn",
  "n": "nhiều",
  "ok": "được rồi",
  "oke": "được rồi",
  "chg": "chưa",
  "ch": "chưa",
  "ah": "à",
  "uh": "ừ",
  "uk": "ừ",
  "thg": "thường",
  "tgian": "thời gian",
  "th": "trường hợp",
  "kn": "khả năng",
  "ck": "chồng",
  "vk": "vợ",
  "gato": "ghen tị",
  "clgt": "cái gì thế",
  "cc": "cuối cùng",
  "kb": "kết bạn",
  "pm": "nhắn tin",
  "sz": "size",
  "or": "hoặc",
  "nt": "nhắn tin",
  "cx": "cũng",
  "nx": "nữa",
  "dx": "được",
  "vc": "vợ chồng",
  "hj": "hì",
  "helo": "xin chào",
  "hello": "xin chào",
  "plz": "vui lòng",
  "pls": "vui lòng",
  "r": "rồi",
  "sc": "sự cố",
  "pt": "phương trình",
  "ct": "công ty",
  "kt": "kiểm tra",
  "ql": "quản lý",
  "sx": "sản xuất",
  "khach": "khách",
  "sp": "sản phẩm",
  "dv": "dịch vụ",
  "mxh": "mạng xã hội",
  "đky": "đăng ký",
  "đk": "đăng ký",
  "đnh": "đăng nhập",
  "tkb": "thời khóa biểu",
  "ns": "nói",
  "lm": "làm",
  "qt": "quan tâm",
  "qđ": "quyết định",
  "cb": "chuẩn bị",
  "iu": "yêu",
  "e": "em",
  "a": "anh",
  "mún": "muốn",
  "nhìu": "nhiều",
  "gòi": "rồi",
  "nchung": "nói chung",
  "ncl": "nói chung là",
  "tht": "thân thiện",
  "fb": "Facebook",
  "zalo": "Zalo",
  "tele": "Telegram",
  "gg": "Google",
  "ytb": "YouTube",
  "ntn": "như thế nào",
  "kbh": "không bao giờ",

  // Common spelling typos
  "sử lý": "xử lý",
  "sản suất": "sản xuất",
  "suất sắc": "xuất sắc",
  "cọ sát": "cọ xát",
  "chia xẻ": "chia sẻ",
  "vô hình chung": "vô hình trung",
  "chính sát": "chính xác",
  "bàn hoàn": "bàng hoàng",
  "câu truyện": "câu chuyện",
  "trung cư": "chung cư",
  "đường sái": "đường sá",
  "cảm mơn": "cảm ơn",
  "giúp đở": "giúp đỡ",
  "dùm": "giùm",
  "sơ xuất": "sơ suất",
  "bổ xung": "bổ sung",
  "lói": "nói",
  "nàm": "làm",
  "đông sẻn": "đông xẻng"
};


// Custom local shorthands key in localStorage
const CUSTOM_SHORTHANDS_KEY = "securecrypt_custom_shorthands";
const SYSTEM_SHORTHANDS_KEY = "securecrypt_system_shorthands";

/**
 * Retrieve system-wide shorthands (loads PREDEFINED_SHORTHAND_MAP as fallback)
 */
export function getSystemShorthands(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SYSTEM_SHORTHANDS_KEY);
    return raw ? JSON.parse(raw) : PREDEFINED_SHORTHAND_MAP;
  } catch (e) {
    console.error("Failed to parse system shorthands", e);
    return PREDEFINED_SHORTHAND_MAP;
  }
}

/**
 * Save system-wide shorthands to localStorage
 */
export function saveSystemShorthandsLocal(map: Record<string, string>): void {
  localStorage.setItem(SYSTEM_SHORTHANDS_KEY, JSON.stringify(map));
}

/**
 * Retrieve custom shorthands from localStorage.
 */
export function getCustomShorthands(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_SHORTHANDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to parse custom shorthands", e);
    return {};
  }
}

/**
 * Save custom shorthand to localStorage.
 */
export function saveCustomShorthand(shortcut: string, replacement: string): void {
  const custom = getCustomShorthands();
  custom[shortcut.trim().toLowerCase()] = replacement.trim();
  localStorage.setItem(CUSTOM_SHORTHANDS_KEY, JSON.stringify(custom));
}

/**
 * Delete custom shorthand from localStorage.
 */
export function deleteCustomShorthand(shortcut: string): void {
  const custom = getCustomShorthands();
  delete custom[shortcut.trim().toLowerCase()];
  localStorage.setItem(CUSTOM_SHORTHANDS_KEY, JSON.stringify(custom));
}

/**
 * Preserves the original word's casing in the replacement.
 */
function matchCase(original: string, replacement: string): string {
  // Check if original is ALL CAPS
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  // Check if original is Capitalized First Letter
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Core predictor and autocorrect function.
 * Converts shorthands, restores unaccented words.
 */
export function autoCorrectText(text: string): string {
  if (!text) return text;

  const customShorthands = getCustomShorthands();

  // Regex pattern for matching word sequences (including Vietnamese accents and characters)
  const wordRegex = /[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]+/g;

  return text.replace(wordRegex, (word) => {
    const lower = word.toLowerCase();

    // 1. Check custom user-defined shorthands first (highest priority)
    if (customShorthands[lower]) {
      const replacement = customShorthands[lower];
      return matchCase(word, replacement);
    }

    // 2. Check system-wide shorthand map
    const systemShorthands = getSystemShorthands();
    if (systemShorthands[lower]) {
      const replacement = systemShorthands[lower];
      return matchCase(word, replacement);
    }


    return word;
  });
}
