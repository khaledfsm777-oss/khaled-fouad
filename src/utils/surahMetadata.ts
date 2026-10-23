import { ALL_SURAHS } from './surahList';
import { NOORANI_SURAHS, ALL_29_NOORANI_SURAH } from './jummal';
import { quranData, QuranVerse } from './quranData';
import { MADANI_SURAH_IDS, REVELATION_ORDERS, getJuzForVerse } from './mushafData';

export interface SurahMetadata {
  id: number;
  name: string;
  orderInQuran: number;
  nooraniOrder: number | string;
  revelationOrder: number;
  revelationPlace: 'مكية' | 'مدنية';
  juzStartEnd: string;
  hizbStartEnd: string;
  totalVerses: number;
  totalWords: number;
  totalLetters: number;
  revelationReason: string;
  briefTopic: string;
}

/**
 * Detailed scholarly and academic metadata for the Noorani Surahs (and key reference Surahs)
 */
export const SURAH_METADATA: Record<number, SurahMetadata> = {
  // الفاتحة
  1: {
    id: 1,
    name: 'الفاتحة',
    orderInQuran: 1,
    nooraniOrder: 'فاتحة الكتاب',
    revelationOrder: 5,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 1',
    hizbStartEnd: 'الحزب 1',
    totalVerses: 7,
    totalWords: 29,
    totalLetters: 139,
    revelationReason: 'أم الكتاب والسبع المثاني والقرآن العظيم، افتتح بها الوحي المبارك كمنهاج جامع لمقاصد التوحيد والعبادة والاستعانة والهداية.',
    briefTopic: 'التوحيد والثناء على الله، إفراد العبودية والاستعانة، وطلب الهداية إلى الصراط المستقيم والثبات عليه.'
  },

  // البقرة
  2: {
    id: 2,
    name: 'البقرة',
    orderInQuran: 2,
    nooraniOrder: 1,
    revelationOrder: 87,
    revelationPlace: 'مدنية',
    juzStartEnd: 'الجزء 1 - 3',
    hizbStartEnd: 'الحزب 1 - 5',
    totalVerses: 286,
    totalWords: 6144,
    totalLetters: 25613,
    revelationReason: 'نزلت بعد الهجرة لتأسيس أركان المجتمع المسلم في المدينة المنورة، وبيان أحكام الشريعة، والرد على شبهات أهل الكتاب والمنافقين، وتوثيق قصة استخلاف آدم وقصة بقرة بني إسرائيل.',
    briefTopic: 'إعداد الأمة المسلمة لحمل أمانة الخلافة في الأرض، وبيان التكاليف الشرعية الشاملة للعقيدة والعبادات والمعاملات والأسرة والجهاد، مع ترسيخ التوحيد والتقوى.'
  },

  // آل عمران
  3: {
    id: 3,
    name: 'آل عمران',
    orderInQuran: 3,
    nooraniOrder: 2,
    revelationOrder: 89,
    revelationPlace: 'مدنية',
    juzStartEnd: 'الجزء 3 - 4',
    hizbStartEnd: 'الحزب 6 - 8',
    totalVerses: 200,
    totalWords: 3503,
    totalLetters: 14605,
    revelationReason: 'نزلت في وفد نجران النصارى ومحاججتهم في شأن عيسى عليه السلام، كما نزلت في التعقيب على أحداث غزوة أحد وتثبيت قلوب المؤمنين بعد الابتلاء.',
    briefTopic: 'الثبات على العقيدة والمنهج أمام الشبهات الفكرية الخارجية (محاورة أهل الكتاب) وأمام الابتلاءات والشدائد الداخلية (أحداث غزوة أحد).'
  },

  // الأعراف
  7: {
    id: 7,
    name: 'الأعراف',
    orderInQuran: 7,
    nooraniOrder: 3,
    revelationOrder: 39,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 8 - 9',
    hizbStartEnd: 'الحزب 16 - 18',
    totalVerses: 206,
    totalWords: 3344,
    totalLetters: 14072,
    revelationReason: 'نزلت في خضم الصراع المكّي لبيان سنن الله في الصراع بين الحق والباطل، وعاقبة المكذبين بالرسالات الإلهية، وتفصيل مواقف أصحاب الأعراف.',
    briefTopic: 'حتمية الصراع بين الحق والباطل عبر استعراض مواكب الأنبياء (نوح، هود، صالح، لوط، شعيب، موسى)، والتحذير من كيد الشيطان.'
  },

  // يونس
  10: {
    id: 10,
    name: 'يونس',
    orderInQuran: 10,
    nooraniOrder: 4,
    revelationOrder: 51,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 11',
    hizbStartEnd: 'الحزب 21 - 22',
    totalVerses: 109,
    totalWords: 1841,
    totalLetters: 7425,
    revelationReason: 'نزلت لتسلية النبي ﷺ حين استبعد كفار قريش أن يرسل الله رسولاً من البشر، فجاءت بإثبات الوحي وقدرة الخالق في ملكوته.',
    briefTopic: 'إثبات النبوة وصدق الوحي القرآني، وإبراز قدرة الله وحكمته في تدبير الكون وسنن الهداية والضلال.'
  },

  // هود
  11: {
    id: 11,
    name: 'هود',
    orderInQuran: 11,
    nooraniOrder: 5,
    revelationOrder: 52,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 11 - 12',
    hizbStartEnd: 'الحزب 22 - 24',
    totalVerses: 123,
    totalWords: 1948,
    totalLetters: 7605,
    revelationReason: 'نزلت بعد عام الحزن وتضييق المشركين، لتثبيت فؤاد النبي ﷺ وأصحابه ببيان استقامة الرسل وثباتهم في وجه الطغيان.',
    briefTopic: 'الاستقامة المطلقة على أمر الله («فَاسْتَقِمْ كَمَا أُمِرْتَ»)، وعرض مصارع الأمم الظالمة نصرةً للرسل وأتباعهم.'
  },

  // يوسف
  12: {
    id: 12,
    name: 'يوسف',
    orderInQuran: 12,
    nooraniOrder: 6,
    revelationOrder: 53,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 12 - 13',
    hizbStartEnd: 'الحزب 24 - 25',
    totalVerses: 111,
    totalWords: 1796,
    totalLetters: 7175,
    revelationReason: 'سأل المشركون واليهود النبي ﷺ عن أمر يوسف وقصته وانتقال بني إسرائيل إلى مصر، فنزلت القصة متكاملة أحسن القصص لتثبيت قلبه الشريف.',
    briefTopic: 'الفرج بعد الشدة والتمكين بعد المحنة، وأن عاقبة الصبر والتقوى هي النصر والتكريم الإلهي («إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ»).'
  },

  // الرعد
  13: {
    id: 13,
    name: 'الرعد',
    orderInQuran: 13,
    nooraniOrder: 7,
    revelationOrder: 96,
    revelationPlace: 'مدنية',
    juzStartEnd: 'الجزء 13',
    hizbStartEnd: 'الحزب 25 - 26',
    totalVerses: 43,
    totalWords: 854,
    totalLetters: 3450,
    revelationReason: 'نزلت رداً على منكري البعث والرسالة والمطالبين بمعجزات حسية، مظهرةً تسببح الرعد والملائكة بحمد الله.',
    briefTopic: 'قوة الحق وثباته وضعف الباطل وتلاشيه، وآيات الله في الآفاق والأنفس، وإقرار أن القلوب إنما تطمئن بذكر الله.'
  },

  // إبراهيم
  14: {
    id: 14,
    name: 'إبراهيم',
    orderInQuran: 14,
    nooraniOrder: 8,
    revelationOrder: 72,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 13',
    hizbStartEnd: 'الحزب 26',
    totalVerses: 52,
    totalWords: 831,
    totalLetters: 3461,
    revelationReason: 'نزلت لإبراز وظيفة الرسالات في إخراج الناس من الظلمات إلى النور، وتخليداً لدعوات خليل الرحمن إبراهيم لبلده وذريته.',
    briefTopic: 'رسالة التوحيد ومقارنة الكلمة الطيبة بالكلمة الخبيثة، ونعم الله على العباد، واستعراض مشاهد القيامة للظالمين.'
  },

  // الحجر
  15: {
    id: 15,
    name: 'الحجر',
    orderInQuran: 15,
    nooraniOrder: 9,
    revelationOrder: 54,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 14',
    hizbStartEnd: 'الحزب 27',
    totalVerses: 99,
    totalWords: 658,
    totalLetters: 2797,
    revelationReason: 'نزلت حين اشتد استهزاء المشركين بالدعوة وبالقرآن الكريم، فتكفل الله بحفظ ذكره وحفظ نبيه من المستهزئين.',
    briefTopic: 'حفظ الله لكتابه الحكيم («إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ»)، ومواساة النبي ﷺ ومصير قوم ثمود أصحاب الحجر.'
  },

  // مريم
  19: {
    id: 19,
    name: 'مريم',
    orderInQuran: 19,
    nooraniOrder: 10,
    revelationOrder: 44,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 16',
    hizbStartEnd: 'الحزب 31',
    totalVerses: 98,
    totalWords: 972,
    totalLetters: 3835,
    revelationReason: 'نزلت لتبرئة مريم عليها السلام وبيان حقيقة عيسى عليه السلام بالحق وتفنيد ادعاءات النصارى والمشركين في نسبة الولد للرحمن، وهي السورة التي قرأها جعفر بن أبي طالب عند النجاشي.',
    briefTopic: 'رحمة الله بعباده وأصفيائه (زكريا، يحيى، مريم، عيسى، إبراهيم، موسى)، وتنـزيه الرحمن عن اتخاذ الولد.'
  },

  // طه
  20: {
    id: 20,
    name: 'طه',
    orderInQuran: 20,
    nooraniOrder: 11,
    revelationOrder: 45,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 16',
    hizbStartEnd: 'الحزب 31 - 32',
    totalVerses: 135,
    totalWords: 1354,
    totalLetters: 5288,
    revelationReason: 'نزلت تسلية للنبي ﷺ بعد أن أجهد نفسه في قيام الليل والتبليغ، فقال المشركون إن القرآن أنزل ليشقى، فأنزل الله: «مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ»، وكانت سبباً في إسلام عمر بن الخطاب رضي الله عنه.',
    briefTopic: 'تيسير القرآن ورسالته، وقصة موسى عليه السلام وتفاصيل مواجهته لفرعون، وبيان عداوة إبليس لآدم.'
  },

  // الشعراء
  26: {
    id: 26,
    name: 'الشعراء',
    orderInQuran: 26,
    nooraniOrder: 12,
    revelationOrder: 47,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 19',
    hizbStartEnd: 'الحزب 37 - 38',
    totalVerses: 227,
    totalWords: 1322,
    totalLetters: 5542,
    revelationReason: 'نزلت مواساة للنبي ﷺ إزاء تكذيب قومه وإعراضهم واتهامه بالسحر والشعر، ففرقت بين هدي النبوة وتخبط الشعراء.',
    briefTopic: 'مواقف الأنبياء مع أقوامهم وبيان خاتمة المكذبين، والرد على دعوى شاعرية القرآن وتأكيد نزوله بالروح الأمين.'
  },

  // النمل
  27: {
    id: 27,
    name: 'النمل',
    orderInQuran: 27,
    nooraniOrder: 13,
    revelationOrder: 48,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 19 - 20',
    hizbStartEnd: 'الحزب 38 - 39',
    totalVerses: 93,
    totalWords: 1160,
    totalLetters: 4677,
    revelationReason: 'نزلت لإظهار مظاهر العلم والحكمة وتسخير الكون للمؤمنين الصالحين كداود وسليمان، واستسلام ملكة سبأ لرب العالمين.',
    briefTopic: 'العلم وشكر النعم وسخرية الملك لله، وبيان طغيان المكذبين، وآيات التوحيد في الخلق والرزق.'
  },

  // القصص
  28: {
    id: 28,
    name: 'القصص',
    orderInQuran: 28,
    nooraniOrder: 14,
    revelationOrder: 49,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 20',
    hizbStartEnd: 'الحزب 39 - 40',
    totalVerses: 88,
    totalWords: 1441,
    totalLetters: 5797,
    revelationReason: 'نزلت والنبي ﷺ في طريق هجرته متوجهاً إلى المدينة، فبشرته السورة بالعودة والظفر: «إِنَّ الَّذِي فَرَضَ عَلَيْكَ الْقُرْآنَ لَرَادُّكَ إِلَىٰ مَعَادٍ».',
    briefTopic: 'تفصيل نشأة موسى عليه السلام ونجاته وانتصاره على فرعون، والتحذير من فتنة المال (قارون)، وحتمية نصرة المستضعفين.'
  },

  // العنكبوت
  29: {
    id: 29,
    name: 'العنكبوت',
    orderInQuran: 29,
    nooraniOrder: 15,
    revelationOrder: 85,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 20 - 21',
    hizbStartEnd: 'الحزب 40 - 41',
    totalVerses: 69,
    totalWords: 980,
    totalLetters: 4195,
    revelationReason: 'نزلت في المستضعفين من المسلمين بمكة الذين فُتنوا في دينهم وعُذبوا ليتركوا الإسلام، فبينت أن الابتلاء سنة ماضية لا بد منها.',
    briefTopic: 'سنة الابتلاء وتمحيص الإيمان («أَحَسِبَ النَّاسُ أَن يُتْرَكُوا أَن يَقُولُوا آمَنَّا وَهُمْ لَا يُفْتَنُونَ»)، وهوان كل معبود من دون الله كبيت العنكبوت.'
  },

  // الروم
  30: {
    id: 30,
    name: 'الروم',
    orderInQuran: 30,
    nooraniOrder: 16,
    revelationOrder: 84,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 21',
    hizbStartEnd: 'الحزب 41',
    totalVerses: 60,
    totalWords: 819,
    totalLetters: 3472,
    revelationReason: 'نزلت حين غلبت فارس الروم وفرح كفار قريش بذلك، فأنزل الله الإخبار الغيبي المعجز بانتصار الروم في بضع سنين وتزامن ذلك مع فرح المؤمنين بنصر الله في بدر.',
    briefTopic: 'الإعجاز الغيبي والسنن التاريخية والكونية، والربط بين تقلبات الدول وآيات الله المبثوثة في الآفاق.'
  },

  // لقمان
  31: {
    id: 31,
    name: 'لقمان',
    orderInQuran: 31,
    nooraniOrder: 17,
    revelationOrder: 57,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 21',
    hizbStartEnd: 'الحزب 41 - 42',
    totalVerses: 34,
    totalWords: 550,
    totalLetters: 2171,
    revelationReason: 'نزلت رداً على النضر بن الحارث وشراء لهو الحديث ليضل عن سبيل الله، وعرضت الحكمة التربوية والإيمانية في وصايا لقمان لابنه.',
    briefTopic: 'الحكمة، وترسيخ أركان العقيدة والأخلاق ومراقبة الله، واختصاص الله بمفاتح الغيب الخمسة.'
  },

  // السجدة
  32: {
    id: 32,
    name: 'السجدة',
    orderInQuran: 32,
    nooraniOrder: 18,
    revelationOrder: 75,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 21',
    hizbStartEnd: 'الحزب 42',
    totalVerses: 30,
    totalWords: 374,
    totalLetters: 1518,
    revelationReason: 'نزلت في بيان خلق الإنسان وأطواره وإثبات البعث والحساب، وكان النبي ﷺ لا ينام حتى يقرأ بها وبتبارك الملك.',
    briefTopic: 'الخضوع والسجود لعظمة الخالق، وإثبات البعث والنشأة، والمقارنة بين المؤمنين الساجدين والفاسقين.'
  },

  // يس
  36: {
    id: 36,
    name: 'يس',
    orderInQuran: 36,
    nooraniOrder: 19,
    revelationOrder: 41,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 22 - 23',
    hizbStartEnd: 'الحزب 44 - 45',
    totalVerses: 83,
    totalWords: 733,
    totalLetters: 3000,
    revelationReason: 'نزلت رداً على منكري الرسالة والبعث وطغيان قريش وتآمرهم على النبي ﷺ، وعرفت بـ «قلب القرآن».',
    briefTopic: 'الرسالة، التوحيد، البعث والنشور، قصة أصحاب القرية ومؤمن آل يس، وآيات القدرة في تسيير الفلك والكون.'
  },

  // ص
  38: {
    id: 38,
    name: 'ص',
    orderInQuran: 38,
    nooraniOrder: 20,
    revelationOrder: 38,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 23',
    hizbStartEnd: 'الحزب 45 - 46',
    totalVerses: 88,
    totalWords: 735,
    totalLetters: 3029,
    revelationReason: 'نزلت إثر اجتماع أشراف قريش عند أبي طالب يطالبونه بكف النبي ﷺ عن دعوتهم وقولهم: «أَجَعَلَ الْآلِهَةَ إِلَٰهًا وَاحِدًا ۖ إِنَّ هَٰذَا لَشَيْءٌ عُجَابٌ».',
    briefTopic: 'الخصومة والصبر في مواجهة الكبر والإنكار، واستعراض ابتلاء الرسل الكرام (داود، سليمان، أيوب) وصبرهم وإنابتهم.'
  },

  // غافر
  40: {
    id: 40,
    name: 'غافر',
    orderInQuran: 40,
    nooraniOrder: 21,
    revelationOrder: 60,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 24',
    hizbStartEnd: 'الحزب 47 - 48',
    totalVerses: 85,
    totalWords: 1228,
    totalLetters: 5109,
    revelationReason: 'أولى سور الحواميم السبع (آل حم)، نزلت لرد الجدل العقيم والمراء في آيات الله، وعرضت حوار مؤمن آل فرعون الصادق.',
    briefTopic: 'سعة مغفرة الله وشدة عقابه، وإبطال الجدال بالباطل، ونصرة الرسل في الحياة الدنيا ويوم يقوم الأشهاد.'
  },

  // فصلت
  41: {
    id: 41,
    name: 'فصلت',
    orderInQuran: 41,
    nooraniOrder: 22,
    revelationOrder: 61,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 24 - 25',
    hizbStartEnd: 'الحزب 48 - 49',
    totalVerses: 54,
    totalWords: 796,
    totalLetters: 3364,
    revelationReason: 'نزلت حين جاء عتبة بن ربيعة مفاوضاً النبي ﷺ ليعطيه من المال والملك ليكف عن الدعوة، فتلا عليه النبي ﷺ أوائل فصلت حتى سجد، فعاد عتبة مبهوراً بعظمة القرآن.',
    briefTopic: 'تفصيل آيات القرآن وبيان إعجازه وعظمته، وعرض شهادة الجوارح والجلود على أصحابها يوم القيامة، ووعد ظهور آيات الله في الآفاق والأنفس.'
  },

  // الشورى
  42: {
    id: 42,
    name: 'الشورى',
    orderInQuran: 42,
    nooraniOrder: 23,
    revelationOrder: 62,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 25',
    hizbStartEnd: 'الحزب 49',
    totalVerses: 53,
    totalWords: 860,
    totalLetters: 3588,
    revelationReason: 'نزلت لتأكيد وحدة الوحي لجميع الأنبياء من نوح وإبراهيم وموسى وعيسى ومحمد، وتقرير مبدأ الشورى العظيم في الأمة.',
    briefTopic: 'وحدة منبع الوحي والشرائع الإلهية، والنهي عن التفرق، وبيان صفات المؤمنين المتوكلين ومبدأ الشورى بينهم.'
  },

  // الزخرف
  43: {
    id: 43,
    name: 'الزخرف',
    orderInQuran: 43,
    nooraniOrder: 24,
    revelationOrder: 63,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 25',
    hizbStartEnd: 'الحزب 49 - 50',
    totalVerses: 89,
    totalWords: 838,
    totalLetters: 3609,
    revelationReason: 'نزلت رداً على مقاييس قريش المادية في تفضيل أصحاب الأموال والزخارف وقولهم: «لَوْلَا نُزِّلَ هَٰذَا الْقُرْآنُ عَلَىٰ رَجُلٍ مِّنَ الْقَرْيَتَيْنِ عَظِيمٍ».',
    briefTopic: 'تصحيح مقاييس القيم الإنسانية، وهوان زينة الدنيا وزخرفها الزائل أمام نعيم الآخرة الباقي، وتوحيد العبادة.'
  },

  // الدخان
  44: {
    id: 44,
    name: 'الدخان',
    orderInQuran: 44,
    nooraniOrder: 25,
    revelationOrder: 64,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 25',
    hizbStartEnd: 'الحزب 50',
    totalVerses: 59,
    totalWords: 346,
    totalLetters: 1475,
    revelationReason: 'نزلت حين دعا النبي ﷺ على قريش بسنين كسني يوسف فأصابتهم مجاعة حتى رأوا مثل الدخان بين السماء والأرض من شدة الجوع.',
    briefTopic: 'نزول القرآن في ليلة مباركة حكيمة، والإنذار بالبطشة الكبرى، واستعراض مصير فرعون وجنده.'
  },

  // الجاثية
  45: {
    id: 45,
    name: 'الجاثية',
    orderInQuran: 45,
    nooraniOrder: 26,
    revelationOrder: 65,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 25',
    hizbStartEnd: 'الحزب 50',
    totalVerses: 37,
    totalWords: 488,
    totalLetters: 2085,
    revelationReason: 'نزلت لمناقشة أصحاب الفلسفات المادية والدهرية القائلين: «مَا هِيَ إِلَّا حَيَاتُنَا الدُّنْيَا نَمُوتُ وَنَحْيَا وَمَا يُهْلِكُنَا إِلَّا الدَّهْرُ».',
    briefTopic: 'إبطال المذهب الدهري المادي، وعرض مشهد جثو الأمم خاشعة يوم الحساب أمام كتاب الأعمال المحفوظ.'
  },

  // الأحقاف
  46: {
    id: 46,
    name: 'الأحقاف',
    orderInQuran: 46,
    nooraniOrder: 27,
    revelationOrder: 66,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 26',
    hizbStartEnd: 'الحزب 51',
    totalVerses: 35,
    totalWords: 646,
    totalLetters: 2668,
    revelationReason: 'خاتمة سور الحواميم، نزلت بعد خروج النبي ﷺ من الطائف وإيمان نفر من الجن بالقرآن بعد سماعه، وبر الوالدين.',
    briefTopic: 'صدق الوحي، ومصير قوم عاد في الأحقاف، واستماع الجن للقرآن وانصرافهم منذرين، والحث على صبر أولي العزم من الرسل.'
  },

  // ق
  50: {
    id: 50,
    name: 'ق',
    orderInQuran: 50,
    nooraniOrder: 28,
    revelationOrder: 34,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 26',
    hizbStartEnd: 'الحزب 51 - 52',
    totalVerses: 45,
    totalWords: 373,
    totalLetters: 1494,
    revelationReason: 'نزلت رداً على استغراب الكفار للبعث وتفتت العظام («أَإِذَا مِتْنَا وَكُنَّا تُرَابًا ۖ ذَٰلِكَ رَجْعٌ بَعِيدٌ»)، وكان النبي ﷺ يقرأ بها في خطب الجمعة والأعياد.',
    briefTopic: 'القرآن المجيد، إثبات البعث وإحياء الموتى كإحياء الأرض الهامدة بالماء، وإحاطة علم الله بالإنسان («وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ»).'
  },

  // القلم
  68: {
    id: 68,
    name: 'القلم',
    orderInQuran: 68,
    nooraniOrder: 29,
    revelationOrder: 2,
    revelationPlace: 'مكية',
    juzStartEnd: 'الجزء 29',
    hizbStartEnd: 'الحزب 57',
    totalVerses: 52,
    totalWords: 301,
    totalLetters: 1256,
    revelationReason: 'من أوائل ما نزل من الوحي بعد سورة العلق، نزلت للدفاع عن النبي ﷺ وإبطال تهمة الجنون عنه وإثبات خلقه العظيم.',
    briefTopic: 'القلم وأمانة الكتابة والعلم، وتزكية خلق النبي ﷺ («وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ»)، وضرب مثل أصحاب الجنة المغرورين.'
  }
};

function stripBismillahForMetadata(text: string): string {
  if (!text) return '';
  return text
    .replace(/\uFDFD/g, '')
    .replace(/^\s*[\(\{\[﴿\uFD3E][\s\u200B]*(?:بسم\s+الله\s+الرحمن\s+الرحيم|﷽)[\s\u200B]*[\)\}\]﴾\uFD3F]\s*/, '')
    .replace(/^(?:بِسۡمِ|بِسْمِ|بِسمِ|بسم)\s+(?:ٱللَّهِ|اللَّهِ|اللهِ|الله)\s+(?:ٱلرَّحۡمَٰنِ|ٱلرَّحْمَٰنِ|الرَّحْمَنِ|الرحمن)\s+(?:ٱلرَّحِيمِ|الرَّحِيمِ|الرحيم)\s*/, '')
    .trim();
}

// Topic and context dictionary for common reference surahs outside SURAH_METADATA
const SPECIAL_SURAH_TOPICS: Record<number, { reason: string; topic: string }> = {
  4: {
    reason: 'نزلت لتنظيم شؤون الأسرة والمجتمع وحماية حقوق المستضعفين واليتامى بعد معركة أحد.',
    topic: 'حقوق النساء واليتامى، أحكام المواريث والأسرة، والعدل والتحذير من النفاق.'
  },
  5: {
    reason: 'من أواخر ما نزل من القرآن، تضمنت إتمام الدين وأحكام العهود والمواثيق والحلال والحرام.',
    topic: 'الوفاء بالعقود، أحكام الأطعمة والذبائح، عقائد أهل الكتاب، وتوثيق مائدة عيسى عليه السلام.'
  },
  6: {
    reason: 'نزلت جملة واحدة ليلاً بمكة يشيعها سبعون ألف ملك، لترسيخ أصول التوحيد وإبطال الشرك.',
    topic: 'تقرير عقيدة التوحيد والربوبية والألوهية ومحاجة المشركين ومناقشة سنن الخلق.'
  },
  8: {
    reason: 'نزلت بعد معركة بدر الكبرى لتنظيم أحكام الغنائم والسلم والحرب ومظاهر النصر الإلهي.',
    topic: 'أسباب النصر الحقيقي، طاعة الله ورسوله، وأحكام الغنائم والأسرى والإعداد.'
  },
  9: {
    reason: 'نزلت في أواخر العهد النبوي عام غزوة تبوك لإعلان البراءة من المشركين وفضح المنافقين.',
    topic: 'البراءة من عهود المشركين، كشف خفايا المنافقين، وفرائض الصدقة والجهاد.'
  },
  18: {
    reason: 'نزلت جواباً لأسئلة مشركي مكة بالتنسيق مع اليهود عن الفتية وذي القرنين والروح.',
    topic: 'العصمة من الفتن الأربع (الدين، المال، العلم، السلطة) عبر قصص الكهف وصاحب الجنتين وموسى والخضر وذي القرنين.'
  },
  67: {
    reason: 'سورة تبارك المانعة من عذاب القبر والشفيعة لصاحبها، تحث على التدبر في ملكوت الله.',
    topic: 'عظمة الملك الإلهي، حكمة الموت والحياة والابتلاء بالعمل الأحسن، وتأمل عوالم السماء والأرض.'
  },
  103: {
    reason: 'سورة مكية عظيمة أقسم الله فيها بالدهر والزمن على خسران الإنسان إلا من استكمل شروط النجاة الأربعة.',
    topic: 'قانون النجاة الشامل: الإيمان بالله، والعمل الصالح، والتواصي بالحق، والتواصي بالصبر.'
  },
  108: {
    reason: 'نزلت تسلية للنبي ﷺ ورداً على المشركين حين زعموا انقطاع عقبه، فبشره الله بالكوثر.',
    topic: 'البشارة بالخير العظيم والكوثر، وإخلاص الصلاة والنحر لله تعالى، وقطع دابر كل شانئ.'
  },
  112: {
    reason: 'نزلت جواباً للمشركين حين سألوا النبي ﷺ أن ينسب لهم ربه، فأنزل الله سورة الإخلاص المحضة.',
    topic: 'إثبات الوحدانية التامة والأحدية والصمدية لله تعالى وتنزيهه عن الوالد والولد والشريك.'
  },
  113: {
    reason: 'سورة المعوذة الأولى نزلت للتحصن والاعتصام برب الفلق من شرور المخلوقات والظلمات والسحرة والحاسدين.',
    topic: 'الاستعاذة برب الصبح من شر ما خلق، ومن شر غاسق إذا وقب، وحاسد إذا حسد.'
  },
  114: {
    reason: 'خاتمة المصحف الشريف والمعوذة الثانية، نزلت للالتجاء إلى ملك الناس وإلههم من وسوسة الشياطين الخفية.',
    topic: 'الاستعاذة بربوبية الله وملكه وألوهيته من شر الوسواس الخناس من الجنة والناس.'
  }
};

// Canonical official verse counts of all 114 Surahs (Hafs / Kufic standard)
export const CANONICAL_VERSE_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6
};

const DYNAMIC_SURAH_CACHE: Record<number, SurahMetadata> = {};

/**
 * Robust getter providing authentic metadata for any Surah ID (1 to 114)
 */
export function getSurahMetadata(surahId: number): SurahMetadata {
  if (SURAH_METADATA[surahId]) {
    return SURAH_METADATA[surahId];
  }

  if (DYNAMIC_SURAH_CACHE[surahId]) {
    return DYNAMIC_SURAH_CACHE[surahId];
  }

  const found = ALL_SURAHS.find(s => s.id === surahId);
  const name = found ? found.name : `السورة ${surahId}`;

  const nooraniIndex = NOORANI_SURAHS.findIndex(ns => ns.id === surahId);
  const nooraniOrder = nooraniIndex !== -1 ? nooraniIndex + 1 : 'غير نورانية';

  // Compute live accurate statistics from quranData
  const surahVerses = (quranData as QuranVerse[]).filter(v => v.surahId === surahId);
  const totalVerses = CANONICAL_VERSE_COUNTS[surahId] || surahVerses.length || 1;

  let totalWords = 0;
  let totalLetters = 0;

  surahVerses.forEach((v, idx) => {
    let t = v.text;
    if (idx === 0 && surahId !== 1 && surahId !== 9) {
      t = stripBismillahForMetadata(t);
    }
    const words = t.split(/\s+/).filter(Boolean);
    totalWords += words.length;

    const matchedLetters = t.match(/[\u0621-\u063A\u0641-\u064A\u0670\u0671]/g);
    if (matchedLetters) {
      totalLetters += matchedLetters.length;
    }
  });

  const isMadani = MADANI_SURAH_IDS.has(surahId);
  const revOrder = REVELATION_ORDERS[surahId] || surahId;

  const startJuz = getJuzForVerse(surahId, 1);
  const endJuz = getJuzForVerse(surahId, Math.max(1, totalVerses));
  const juzStartEnd = startJuz === endJuz ? `الجزء ${startJuz}` : `الجزء ${startJuz} - ${endJuz}`;

  const hizbStart = (startJuz - 1) * 2 + 1;
  const hizbEnd = endJuz * 2;
  const hizbStartEnd = hizbStart === hizbEnd ? `الحزب ${hizbStart}` : `الحزب ${hizbStart} - ${hizbEnd}`;

  const special = SPECIAL_SURAH_TOPICS[surahId];
  const revelationReason = special?.reason || `سورة قرآنية كريمة نزلت في العهد ${isMadani ? 'المدني' : 'المكي'} لتثبيت التوحيد وتعزيز مكارم الشريعة.`;
  const briefTopic = special?.topic || `مقاصد القرآن الكريم ومحاور التوحيد والعبادة والسنن الإلهية ومكارم الأخلاق.`;

  const meta: SurahMetadata = {
    id: surahId,
    name,
    orderInQuran: surahId,
    nooraniOrder,
    revelationOrder: revOrder,
    revelationPlace: isMadani ? 'مدنية' : 'مكية',
    juzStartEnd,
    hizbStartEnd,
    totalVerses: totalVerses || 1,
    totalWords: totalWords || 1,
    totalLetters: totalLetters || 1,
    revelationReason,
    briefTopic
  };

  DYNAMIC_SURAH_CACHE[surahId] = meta;
  return meta;
}
