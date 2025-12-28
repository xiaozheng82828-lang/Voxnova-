
import { Language, VoiceOption, UserTier } from './types';

export const PLANS = [
  { id: 'starter', name: 'Starter', price: 99, chars: 35000, features: ['3 Premium Voices/Lang', 'Realistic Tone', 'Standard Fidelity'] },
  { id: 'elite', name: 'Elite', price: 199, chars: 50000, features: ['6 Hindi Specialties', '4 Realistic Premiums', '3 Realistic/Lang'] },
  { id: 'pro', name: 'Pro', price: 249, chars: 70000, features: ['All Premium Voices', 'Emotion Engine Unlocked', 'Max Fidelity', 'Infinite Realism Layer'] }
];

const LOCALIZED_NAMES: Record<string, any> = {
  [Language.ENGLISH]: {
    legacy: "English Crystal", neural: "English Studio", boy: "English Young Male", girl: "English Young Female", robot: "English Tech-Unit", utility: "English Reader",
    yboy: "Oliver", ygirl: "Sophia", narrator: "Alistair", sophisticated: "Victoria", man: "James", woman: "Emma", infinite: "Nova Prime",
    preview: "This is a sample of our high-quality studio voice in English."
  },
  [Language.HINDI]: {
    legacy: "हिंदी निर्मल", neural: "हिंदी स्पष्ट", boy: "हिंदी बालक", girl: "हिंदी बालिका", robot: "हिंदी यंत्र", utility: "हिंदी सूचक",
    yboy: "आरव", ygirl: "दिया", narrator: "कविता", sophisticated: "राजेश्वर", man: "अर्जुन", woman: "प्रिया", infinite: "आत्मा",
    preview: "यह हिंदी में हमारी उच्च गुणवत्ता वाली स्टूडियो आवाज का एक नमूना है।"
  },
  [Language.MARATHI]: {
    legacy: "मराठी स्फटिक", neural: "मराठी स्टुडिओ", boy: "मराठी मुलगा", girl: "मराठी मुलगी", robot: "मराठी रोबोट", utility: "मराठी वाचक",
    yboy: "आदित्य", ygirl: "ईश्वरी", narrator: "निवेदक", sophisticated: "मीनाक्षी", man: "विनायक", woman: "सायली", infinite: "अनंत",
    preview: "हे मराठीतील आमच्या उच्च-गुणवत्तेच्या स्टुडिओ आवाजाचे उदाहरण आहे."
  },
  [Language.NEPALI]: {
    legacy: "नेपाली निर्मल", neural: "नेपाली स्पष्ट", boy: "नेपाली केटो", girl: "नेपाली केटी", robot: "नेपाली यन्त्र", utility: "नेपाली पाठक",
    yboy: "सन्देश", ygirl: "प्रकृति", narrator: "वाचक", sophisticated: "लक्ष्मी", man: "राजेश", woman: "बिनीता", infinite: "आलोक",
    preview: "यो नेपालीमा हाम्रो उच्च गुणस्तरको स्टुडियो आवाजको नमूना हो।"
  },
  [Language.BHOJPURI]: {
    legacy: "भोजपुरी निर्मल", neural: "भोजपुरी स्पष्ट", boy: "भोजपुरी लइका", girl: "भोजपुरी लइकी", robot: "भोजपुरी मसीन", utility: "भोजपुरी वाचक",
    yboy: "बबलू", ygirl: "गुड़िया", narrator: "कथावाचक", sophisticated: "मुखिया जी", man: "बिरजू", woman: "सुनैना", infinite: "पूर्णिमा",
    preview: "ई हमनी के भोजपुरी के उच्च गुणवत्ता वाला स्टूडियो आवाज के नमूना ह।"
  },
  [Language.URDU]: {
    legacy: "اردو شفاف", neural: "اردو اسٹوڈیو", boy: "اردو لڑکا", girl: "اردو لڑکی", robot: "اردو روبوٹ", utility: "اردو قاری",
    yboy: "حمزہ", ygirl: "زینب", narrator: "راوی", sophisticated: "سلطانہ", man: "اقبال", woman: "پروین", infinite: "نور",
    preview: "یہ اردو میں ہماری اعلیٰ معیار کی اسٹوڈیو آواز کا ایک نمونہ ہے۔"
  },
  [Language.SPANISH]: {
    legacy: "Español Puro", neural: "Español Estudio", boy: "Español Joven", girl: "Español Niña", robot: "Español Androide", utility: "Español Datos",
    yboy: "Hugo", ygirl: "Valentina", narrator: "Narrador Real", sophisticated: "Isabella", man: "Alejandro", woman: "Elena", infinite: "Esencia",
    preview: "Esta es una muestra de nuestra voz de estudio de alta calidad en español."
  },
  [Language.FRENCH]: {
    legacy: "Français Cristal", neural: "Français Studio", boy: "Français Garçon", girl: "Français Fille", robot: "Français Automate", utility: "Français Flux",
    yboy: "Arthur", ygirl: "Manon", narrator: "Le Conteur", sophisticated: "Camille", man: "Julien", woman: "Sophie", infinite: "L'Infini",
    preview: "Ceci est un échantillon de notre voix de studio de haute qualité en français."
  },
  [Language.GERMAN]: {
    legacy: "Deutsch Kristall", neural: "Deutsch Studio", boy: "Deutsch Junge", girl: "Deutsch Mädchen", robot: "Deutsch Roboter", utility: "Deutsch Leser",
    yboy: "Max", ygirl: "Mia", narrator: "Erzähler", sophisticated: "Helga", man: "Klaus", woman: "Greta", infinite: "Unendlichkeit",
    preview: "Dies ist eine Probe unserer hochwertigen Studio-Stimme auf Deutsch."
  },
  [Language.JAPANESE]: {
    legacy: "日本語 透明", neural: "日本語 クリア", boy: "日本語 少年", girl: "日本語 少女", robot: "日本語 メカ", utility: "日本語 情報",
    yboy: "ハルト", ygirl: "アカリ", narrator: "語り部", sophisticated: "ケンジ", man: "ヒロシ", woman: "ユキ", infinite: "無限",
    preview: "これは日本語の高品質なスタジオ音声のサンプルです。"
  },
  [Language.ITALIAN]: {
    legacy: "Italiano Cristallo", neural: "Italiano Studio", boy: "Italiano Ragazzo", girl: "Italiano Ragazza", robot: "Italiano Robot", utility: "Italiano Lettore",
    yboy: "Luca", ygirl: "Giulia", narrator: "Narratore", sophisticated: "Francesca", man: "Marco", woman: "Sofia", infinite: "Infinito",
    preview: "Questo è un campione della nostra voce da studio di alta qualità in italiano."
  },
  [Language.PORTUGUESE]: {
    legacy: "Português Cristal", neural: "Português Estúdio", boy: "Português Menino", girl: "Português Menina", robot: "Português Robô", utility: "Português Leitor",
    yboy: "João", ygirl: "Maria", narrator: "Narrador", sophisticated: "Beatriz", man: "Ricardo", woman: "Ana", infinite: "Infinito",
    preview: "Este é um exemplo da nossa voz de estúdio de alta qualidade em português."
  },
  [Language.ARABIC]: {
    legacy: "عربي كريستال", neural: "عربي استوديو", boy: "عربي ولد", girl: "عربي بنت", robot: "عربي آلي", utility: "عربي قارئ",
    yboy: "يوسف", ygirl: "ليلى", narrator: "الراوي", sophisticated: "فاطمة", man: "أحمد", woman: "مريم", infinite: "نوفا",
    preview: "هذه عينة من صوتنا الإستوديو عالي الجودة باللغة العربية."
  },
  [Language.CHINESE]: {
    legacy: "中文 水晶", neural: "中文 工作室", boy: "中文 男孩", girl: "中文 女孩", robot: "中文 机器人", utility: "中文 阅读器",
    yboy: "小明", ygirl: "小红", narrator: "旁白", sophisticated: "张先生", man: "李先生", woman: "王女士", infinite: "无限",
    preview: "这是我们中文高品质录音室声音的样本。"
  },
  [Language.KOREAN]: {
    legacy: "한국어 크리스탈", neural: "한국어 스튜디오", boy: "한국어 소년", girl: "한국어 소녀", robot: "한국어 로봇", utility: "한국어 낭독자",
    yboy: "민준", ygirl: "서연", narrator: "성우", sophisticated: "지혜", man: "정우", woman: "은지", infinite: "무한",
    preview: "이것은 한국어 고품질 스튜디오 음성의 샘플입니다."
  },
  [Language.RUSSIAN]: {
    legacy: "Русский Кристалл", neural: "Русский Студия", boy: "Русский Мальчик", girl: "Русский Девочка", robot: "Русский Робот", utility: "Русский Чтец",
    yboy: "Иван", ygirl: "Анنا", narrator: "Диктор", sophisticated: "Елена", man: "Дмитрий", woman: "Ольга", infinite: "Нова",
    preview: "Это образец нашего высококачественного студийного голоса на русском языке."
  },
  [Language.TURKISH]: {
    legacy: "Türkçe Kristal", neural: "Türkçe Stüdyo", boy: "Türkçe Erkek Çocuk", girl: "Türkçe Kız Çocuk", robot: "Türkçe Robot", utility: "Türkçe Okuyucu",
    yboy: "Emre", ygirl: "Zeynep", narrator: "Anlatıcı", sophisticated: "Selin", man: "Can", woman: "Elif", infinite: "Sonsuz",
    preview: "Bu, Türkçe yüksek kaliteli stüdyo sesimizin bir örneğidir."
  },
  [Language.DUTCH]: {
    legacy: "Nederlands Kristal", neural: "Nederlands Studio", boy: "Nederlands Jongen", girl: "Nederlands Meisje", robot: "Nederlands Robot", utility: "Nederlands Voorlezer",
    yboy: "Daan", ygirl: "Sophie", narrator: "Verteller", sophisticated: "Emma", man: "Bram", woman: "Lotte", infinite: "Nova",
    preview: "Dit is een voorbeeld van onze hoogwaardige studiostem in het Nederlands."
  },
  [Language.VIETNAMESE]: {
    legacy: "Tiếng Việt Pha Lê", neural: "Tiếng Việt Studio", boy: "Tiếng Việt Con Trai", girl: "Tiếng Việt Con Gái", robot: "Tiếng Việt Robot", utility: "Tiếng Việt Người Đọc",
    yboy: "Minh", ygirl: "Linh", narrator: "Người kể chuyện", sophisticated: "Hương", man: "Tuấn", woman: "Lan", infinite: "Vô tận",
    preview: "Đây là mẫu giọng nói studio chất lượng cao của chúng tôi bằng tiếng Việt."
  },
  [Language.THAI]: {
    legacy: "ไทย คริสตัล", neural: "ไทย สตูดิโอ", boy: "ไทย เด็กชาย", girl: "ไทย เด็กหญิง", robot: "ไทย หุ่นยนต์", utility: "ไทย ผู้อ่าน",
    yboy: "ก้อง", ygirl: "ฟ้า", narrator: "ผู้บรรยาย", sophisticated: "พิมพ์", man: "นที", woman: "มะลิ", infinite: "โนวา",
    preview: "นี่คือตัวอย่างเสียงสตูดิโอคุณภาพสูงของเราในภาษาไทย"
  },
  [Language.SWEDISH]: {
    legacy: "Svenska Kristall", neural: "Svenska Studio", boy: "Svenska Pojke", girl: "Svenska Flicka", robot: "Svenska Robot", utility: "Svenska Uppläsare",
    yboy: "Oskar", ygirl: "Alice", narrator: "Berättare", sophisticated: "Astrid", man: "Erik", woman: "Maja", infinite: "Nova",
    preview: "Detta är ett prov på v\u00e5r högkvalitativa studioröst p\u00e5 svenska."
  },
  [Language.POLISH]: {
    legacy: "Polski Kryształ", neural: "Polski Studio", boy: "Polski Chłopiec", girl: "Polski Dziewczynka", robot: "Polski Robot", utility: "Polski Lektor",
    yboy: "Kuba", ygirl: "Zuzia", narrator: "Lektor", sophisticated: "Kasia", man: "Piotr", woman: "Magda", infinite: "Nova",
    preview: "To jest próbka naszego wysokiej jakości głosu studyjnego w języku polskim."
  },
  default: {
    legacy: "Crystal Alpha", neural: "Studio Beta", boy: "Young Male", girl: "Young Female", robot: "Tech Unit", utility: "Data Reader",
    yboy: "Premium Boy", ygirl: "Premium Girl", narrator: "Narrator", sophisticated: "Sophisticated", man: "Man", woman: "Woman", infinite: "Infinite",
    preview: "Voice sample preview."
  }
};

const generateLanguageVoices = (lang: Language, langName: string): VoiceOption[] => {
  const code = lang.toLowerCase();
  const names = LOCALIZED_NAMES[lang] || LOCALIZED_NAMES.default;
  const preview = names.preview;

  // Ultra-Emphatic studio quality prompt
  const studioQuality = "CRITICAL REQUIREMENT: Output must be indistinguishable from a high-end studio recording. ABSOLUTELY NO background static, hum, room reverb, hiss, or digital artifacts. Ensure a clean, ultra-professional, and natural human-like realism with precise articulation. The voice must sound warm, vivid, and close to the listener.";

  const voices: VoiceOption[] = [
    { 
      id: `${code}-legacy-ai`, 
      name: `${names.legacy}`, 
      prebuiltVoice: 'Charon', 
      description: 'Ultra-Clear Studio Neural', 
      language: lang, 
      tier: 'free',
      previewText: preview,
      persona: `${studioQuality} Speak with a warm, authoritative, and perfectly realistic professional tone.`
    },
    { 
      id: `${code}-neural-static`, 
      name: `${names.neural}`, 
      prebuiltVoice: 'Fenrir', 
      description: 'Studio Fluid / Hyper-Realistic', 
      language: lang, 
      tier: 'free',
      previewText: preview,
      persona: `${studioQuality} Speak in a friendly, conversational, and exceptionally clear natural human voice.`
    },
    { 
      id: `${code}-simple-boy`, 
      name: `${names.boy}`, 
      prebuiltVoice: 'Puck', 
      description: 'Studio Youth Male', 
      language: lang, 
      tier: 'free',
      isUnlimited: true,
      previewText: preview,
      persona: `${studioQuality} A bright, clear, and very realistic youthful male voice.`
    },
    { 
      id: `${code}-simple-girl`, 
      name: `${names.girl}`, 
      prebuiltVoice: 'Kore', 
      description: 'Studio Youth Female', 
      language: lang, 
      tier: 'free',
      isUnlimited: true,
      previewText: preview,
      persona: `${studioQuality} A bright, clear, and very realistic youthful female voice.`
    },
    { 
      id: `${code}-robot`, 
      name: `${names.robot}`, 
      prebuiltVoice: 'Fenrir', 
      description: 'Next-Gen AI Voice', 
      language: lang, 
      tier: 'free',
      previewText: preview,
      persona: `${studioQuality} A crisp, futuristic, and perfectly clear premium AI interface voice with no noise.`
    }
  ];

  const isIndic = [Language.HINDI, Language.MARATHI, Language.NEPALI, Language.BHOJPURI, Language.URDU, Language.ENGLISH].includes(lang);
  
  if (isIndic) {
    voices.push({
      id: `${code}-utility-core`,
      name: `${names.utility}`,
      prebuiltVoice: 'Puck',
      description: 'Studio Audio Reader',
      language: lang,
      tier: 'free',
      previewText: preview,
      persona: `${studioQuality} A calm, articulate, and highly realistic voice optimized for long readings.`
    });
  }

  // --- STARTER TIER ---
  voices.push(
    { 
      id: `${code}-young-boy`, 
      name: `${names.yboy} (${langName})`, 
      prebuiltVoice: 'Puck', 
      description: 'High Fidelity Realistic Child', 
      language: lang, 
      tier: 'starter',
      previewText: preview,
      persona: `${studioQuality} Highly realistic cheerful boy voice with studio enunciation.`
    },
    { 
      id: `${code}-young-girl`, 
      name: `${names.ygirl} (${langName})`, 
      prebuiltVoice: 'Zephyr', 
      description: 'High Fidelity Realistic Child', 
      language: lang, 
      tier: 'starter',
      previewText: preview,
      persona: `${studioQuality} Highly realistic cheerful girl voice with studio enunciation.`
    },
    { 
      id: `${code}-clear-narrator`, 
      name: `${names.narrator} (${langName})`, 
      prebuiltVoice: 'Charon', 
      description: 'Deep Studio Narrator', 
      language: lang, 
      tier: 'starter',
      previewText: preview,
      persona: `${studioQuality} A steady, deep, and perfectly clear narrator voice for professional usage.`
    }
  );

  // --- ELITE TIER ---
  voices.push(
    { 
      id: `${code}-sophisticated`, 
      name: `${names.sophisticated} (${langName})`, 
      prebuiltVoice: 'Kore', 
      description: 'Elite Sophisticated Tone', 
      language: lang, 
      tier: 'elite',
      previewText: preview,
      persona: `${studioQuality} An elegant, high-class adult voice with perfect articulation.`
    }
  );

  if (lang === Language.HINDI || lang === Language.URDU || lang === Language.MARATHI) {
    voices.push(
      { 
        id: `${code}-adult-man`, 
        name: `${names.man} (${langName})`, 
        prebuiltVoice: 'Charon', 
        description: 'Elite Pro Man', 
        language: lang, 
        tier: 'elite',
        previewText: preview,
        persona: `${studioQuality} Mature professional male voice with deep realism.`
      },
      { 
        id: `${code}-adult-woman`, 
        name: `${names.woman} (${langName})`, 
        prebuiltVoice: 'Kore', 
        description: 'Elite Pro Woman', 
        language: lang, 
        tier: 'elite',
        previewText: preview,
        persona: `${studioQuality} Mature professional female voice with deep realism.`
      }
    );
  }

  // --- PRO TIER ---
  voices.push(
    { 
      id: `${code}-infinite-realism`, 
      name: `${names.infinite} (${langName})`, 
      prebuiltVoice: 'Zephyr', 
      description: 'Absolute Realism Layer', 
      language: lang, 
      tier: 'pro',
      previewText: preview,
      persona: `${studioQuality} Indistinguishable from human speech. Maximum realism with natural breathing and perfect tone.`
    }
  );

  const isRest = ![Language.HINDI, Language.URDU, Language.MARATHI].includes(lang);
  if (isRest) {
    voices.push(
      { 
        id: `${code}-adult-man`, 
        name: `${names.man} (${langName})`, 
        prebuiltVoice: 'Charon', 
        description: 'Infinite Pro Man', 
        language: lang, 
        tier: 'pro',
        previewText: preview,
        persona: `${studioQuality} Mature professional male voice.`
      },
      { 
        id: `${code}-adult-woman`, 
        name: `${names.woman} (${langName})`, 
        prebuiltVoice: 'Kore', 
        description: 'Infinite Pro Woman', 
        language: lang, 
        tier: 'pro',
        previewText: preview,
        persona: `${studioQuality} Mature professional female voice.`
      }
    );
  }

  return voices;
};

export const VOICE_OPTIONS: VoiceOption[] = Object.values(Language).flatMap(lang => 
  generateLanguageVoices(lang, lang.toUpperCase())
);

export const MAX_TEXT_LENGTH = 2500;
