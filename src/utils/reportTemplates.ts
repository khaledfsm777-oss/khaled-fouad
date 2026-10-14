/**
 * Report Templates and Dynamic Academic Analysis Generator for Al-Banyan
 * Performs high-quality Arabic scholarly analysis completely offline and locally.
 */

import { getCompatibilityDetails, getAchievedCompatibilities, reduceDigitalRoot, isTripleMatchElite } from './jummal';

interface VerseAnalysisInput {
  verseNumber: string | number;
  text: string;
  jummalValue: number;
  wordCount: number;
  letterCount: number;
  isVerified: boolean;
  quotient: number;
  overlapCount?: number;
  overlapRatio?: number;
}

interface SurahInput {
  id: number;
  name: string;
  letters?: string;
  keyValue?: number;
  digitalRoot?: number;
}

export function generateLocalAcademicAnalysis(params: {
  activeSurah: SurahInput | null;
  surahMeta: any;
  verses: VerseAnalysisInput[];
  chunkIndex?: number;
  totalChunks?: number;
}): string {
  const { activeSurah, surahMeta, verses, chunkIndex, totalChunks } = params;

  if (activeSurah && activeSurah.id === 42) {
    const sName = "الشورى";
    const totalVerses = verses.length;
    const sumJummal = verses.reduce((sum, v) => sum + v.jummalValue, 0);
    const sumWords = verses.reduce((sum, v) => sum + v.wordCount, 0);
    const sumLetters = verses.reduce((sum, v) => sum + v.letterCount, 0);

    const formatNum = (num: number) => num.toLocaleString('ar-EG');

    // Case 1: Chunk-Based Analysis for Al-Shura
    if (chunkIndex !== undefined && totalChunks !== undefined) {
      const vStart = verses[0]?.verseNumber || 0;
      const vEnd = verses[verses.length - 1]?.verseNumber || 0;
      
      const countHameemVerified = verses.filter(v => v.jummalValue % 3 === 0).length;
      const countAsaqVerified = verses.filter(v => v.jummalValue % 5 === 0).length;
      const countBothVerified = verses.filter(v => v.jummalValue % 3 === 0 && v.jummalValue % 5 === 0).length;
      
      let text = `### 🌟 المبحث الاستقصائي للمقطع (من آية ${vStart} إلى آية ${vEnd}) - سورة الشورى (مسارات متوازية حم - عسق):\n`;
      text += `أظهرت الدراسة الهيكلية التراكمية لآيات هذا المقطع من سورة الشورى المباركة اتساقاً مذهلاً مبنياً على **مسارين متوازيين في نفس اللحظة** بدلاً من دمجهما في معامل كلي واحد، مما يكشف القوانين العددية المستقلة لكل من الفاتحتين النورانيتين:\n\n`;
      
      text += `1. **📈 مسار الحواميم المباشر (حم - معامل الاختزال 3):**\n`;
      text += `   * يبلغ مجموع حساب الجمل الكلي لهذا المقطع ${formatNum(sumJummal)}، محققاً توافقاً تاما بالقسمة الصرفة الخالية من الكسر العشري في **${formatNum(countHameemVerified)}** آية من أصل ${formatNum(totalVerses)} على معامل الاختزال 3. وهذا يؤكد دقة ضبط المسار الأول بشكل مستقل تماماً.\n\n`;
      
      text += `2. **✨ مسار عسق المستقل (عسق - معامل الاختزال 5):**\n`;
      text += `   * يكشف مسار الكلمات والحروف عند عرضه على المعامل النوراني الثاني (عسق - 5) عن توافق واستقامة عددية صرفة في **${formatNum(countAsaqVerified)}** آية، مما يبرز دور الطائفة الحرفية الثانية كقانون ميزاني موازٍ يعمل بانسجام مطلق.\n\n`;
      
      if (countBothVerified > 0) {
        text += `* **بؤرة الالتحام المشترك للخطين 🔗:** تم رصد **${formatNum(countBothVerified)}** آية في هذا المقطع حققت التوافق الرياضي الكامل والمزدوج مع كلا المسارين في نفس اللحظة (مضاعفات للعددين 3 و5 معاً، أي مضاعفات للعدد 15)، مما يمثل قمة الترابط والاتزان الرقمي النوراني.\n\n`;
      }
      
      text += `* **الخلاصة البنائية:** يثبت هذا التحليل العملي دقة رؤية الباحثين في المطالبة بفصل المعاملات، إذ يعطي كل حرف نوراني شفرته الرياضية الخاصة لتفسير العلاقات التوافقية الداخلية للمقطع العثماني الشريف.`;
      
      return text;
    }

    // Case 2: Full Surah Analysis for Al-Shura
    const orderInQuran = surahMeta?.orderInQuran || 42;
    const revelationPlace = surahMeta?.revelationPlace || 'مكية';
    const revelationOrder = surahMeta?.revelationOrder || 62;
    const totalWordsMeta = surahMeta?.totalWords || sumWords;
    const totalLettersMeta = surahMeta?.totalLetters || sumLetters;
    const revelationReason = surahMeta?.revelationReason || '';
    const briefTopic = surahMeta?.briefTopic || '';

    const s1 = { id: 42, name: 'الشورى (حم)', letters: 'حم', keyValue: 48, digitalRoot: 3 };
    const s2 = { id: 42, name: 'الشورى (عسق)', letters: 'عسق', keyValue: 230, digitalRoot: 5 };

    const versesWithComp = verses.map(v => {
      const comp1 = getCompatibilityDetails(v, s1);
      const comp2 = getCompatibilityDetails(v, s2);
      return {
        v,
        comp1,
        comp2,
        isHameemVerified: v.jummalValue % 3 === 0,
        isAsaqVerified: v.jummalValue % 5 === 0
      };
    });

    const hVerifiedCount = versesWithComp.filter(item => item.isHameemVerified).length;
    const aVerifiedCount = versesWithComp.filter(item => item.isAsaqVerified).length;
    const doubleVerifiedCount = versesWithComp.filter(item => item.isHameemVerified && item.isAsaqVerified).length;

    const hVerifiedPercentage = totalVerses > 0 ? Math.round((hVerifiedCount / totalVerses) * 100) : 0;
    const aVerifiedPercentage = totalVerses > 0 ? Math.round((aVerifiedCount / totalVerses) * 100) : 0;

    let htmlReport = `# دراسة استقصائية وبنيوية شاملة لسورة الشورى (بمنهجية المسارات المتوازية النورانية حم - عسق)

## تمهيد المنهجية: الإعجاز المزدوج لسورة الشورى
تنفرد سورة **الشورى** في البنيان القرآني بميزة استثنائية تجعلها محوراً أساسياً لدراسة الحروف النورانية؛ فهي السورة الوحيدة التي افتتحت بآيتين منفصلتين من الحروف المقطعة: الآية الأولى **"حم"** والآية الثانية **"عسق"**.
إن دمج هذين المعاملين في معامل افتراضي واحد (8) يحجب الخصائص الرياضية والهندسية المتفردة لكل طائفة حرفية. لذلك، تفخر هذه الدراسة بتطبيق **منهجية المسارات المتوازية** الحقيقية، والتي تحلل كل آية في السورة بموجب قانونين ميزانيين مستقلين يجريان معاً في آن واحد:
1. **مسار الحواميم (حم) - معامل الاختزال: 3** (حساب الجمل المرجعي: 48)
2. **مسار العين والسين والقاف (عسق) - معامل الاختزال: 5** (حساب الجمل المرجعي: 230)

---

## الفصل الأول: الهندسة الرياضية والمعايير الحاكمة للمسارات
تخضع آيات سورة الشورى البالغة **${formatNum(totalVerses)}** آية، والتي تشتمل على **${formatNum(totalWordsMeta)}** كلمة و**${formatNum(totalLettersMeta)}** حرفاً، للمقارنة الدقيقة مع المعايير التالية:

| المسار النوراني | الحروف المقطعة | الجمل المرجعي (N) | معامل الاختزال (R) | نسبة الاستقامة الرياضية |
| :--- | :---: | :---: | :---: | :---: |
| **المسار الأول (حم)** | حم | 48 | 3 | ${formatNum(hVerifiedPercentage)}% من الآيات (${formatNum(hVerifiedCount)} آية) |
| **المسار الثاني (عسق)** | عسق | 230 | 5 | ${formatNum(aVerifiedPercentage)}% من الآيات (${formatNum(aVerifiedCount)} آية) |

* **بؤرة التراكب والالتحام المزدوج 🔗:** تم الكشف عن **${formatNum(doubleVerifiedCount)}** آية كريمة تتوافق وتنسجم مع كلا المسارين في نفس اللحظة بالتمام (مضاعفات للعدد 15 الحاصل من ضرب 3 في 5). هذه الآيات تشكل القواعد الهيكلية المشتركة والركائز الكبرى للترابط الرياضي في السورة.

---

## الفصل الثاني: مفاتيح الاتزان والآيات المعجزة للمسارات المتوازية

### 🔑 مفاتيح مسار الحواميم الكبرى (حم - 3):
`;

    // Get up to 3 sample verified verses for Hameem
    const hSamples = versesWithComp.filter(item => item.isHameemVerified).slice(0, 3);
    hSamples.forEach((item, idx) => {
      htmlReport += `${idx + 1}. **الآية [${item.v.verseNumber}]:** « ${item.v.text} »\n`;
      htmlReport += `   * **بيانات الاتزان:** الجمل: **${formatNum(item.v.jummalValue)}** | حاصل القسمة الصرفة على 3: **${formatNum(item.v.jummalValue / 3)}**\n`;
      htmlReport += `   * **الدلالة البنائية:** تتناغم هذه الآية مع رتبة الميزان الرقمي لحرَف الحواميم كصوت تلاوة متزن يضبط الإيقاع الحرفي للسورة.\n\n`;
    });

    htmlReport += `### 🔑 مفاتيح مسار عسق الكبرى (عسق - 5):\n`;
    // Get up to 3 sample verified verses for Asaq
    const aSamples = versesWithComp.filter(item => item.isAsaqVerified).slice(0, 3);
    aSamples.forEach((item, idx) => {
      htmlReport += `${idx + 1}. **الآية [${item.v.verseNumber}]:** « ${item.v.text} »\n`;
      htmlReport += `   * **بيانات الاتزان:** الجمل: **${formatNum(item.v.jummalValue)}** | حاصل القسمة الصرفة على 5: **${formatNum(item.v.jummalValue / 5)}**\n`;
      htmlReport += `   * **الدلالة البنائية:** تعكس هذه الآية استقرار الكلمات والحروف على ثابت الميزان الخماسي لعسق، مما يعزز الصلة البيانية بالحروف المقطعة.\n\n`;
    });

    htmlReport += `---

## الفصل الثالث: المقاصد البلاغية والبيانية والربط الموضوعي
تتضافر آيات سورة **الشورى** في نسق بياني متفرد لخدمة قضايا الوحي والرسالة والشورى والتوحيد. وتبرز معاني الإعجاز في التوازي الصوتي والبلاغي بين مطلع الحواميم (حم) التي تؤكد على أن القرآن تنزيل من الله العزيز الحكيم، وبين فاتحة (عسق) التي تستكمل بسط سنن الوحي لرسل الله الكرام.
إن دراسة السورة نصياً وموضوعياً تكشف أن كل مقطع قرآني يحمل في ثناياه إشارات محكمة تربط بين حرية الاختيار الإنساني المنضبطة بالشورى، وبين الإقرار بالهيمنة والربوبية التامة لله رب العالمين.

---

## الفصل الرابع: الخلاصة والتوصيات الاستقصائية
تثبت هذه الدراسة الاستقصائية الفريدة لسورة **الشورى** أصالة التناسق البياني والموضوعي للقرآن الكريم. إن تكامل مساري الفواتح النورانية الشريفة يعكس اتساقاً مدهشاً يجري كخطين متكاملين لوحي السماء، دون أي تنافر، مما يقدم برهاناً علمياً ونصياً جلياً على الإعجاز الرباني المطلق في كتاب الله العزيز.`;

    return htmlReport;
  }

  const sName = activeSurah?.name || 'السورة';
  const sLetters = activeSurah?.letters || 'الفواتح النورانية';
  const sKeyValue = activeSurah?.keyValue || 0;
  const sDigitalRoot = activeSurah?.digitalRoot || 1;

  const totalVerses = verses.length;
  const sumJummal = verses.reduce((sum, v) => sum + v.jummalValue, 0);
  const sumWords = verses.reduce((sum, v) => sum + v.wordCount, 0);
  const sumLetters = verses.reduce((sum, v) => sum + v.letterCount, 0);

  const verifiedVerses = verses.filter(v => v.isVerified);
  const verifiedCount = verifiedVerses.length;
  const unverifiedCount = totalVerses - verifiedCount;
  const verifiedPercentage = totalVerses > 0 ? Math.round((verifiedCount / totalVerses) * 100) : 0;

  // Find extreme verses
  const maxQuotientVerse = verifiedCount > 0 
    ? [...verifiedVerses].sort((a, b) => b.quotient - a.quotient)[0] 
    : (verses.length > 0 ? [...verses].sort((a, b) => b.quotient - a.quotient)[0] : null);

  const maxDensityVerse = verses.length > 0 
    ? [...verses].sort((a, b) => (b.overlapRatio || 0) - (a.overlapRatio || 0))[0] 
    : null;

  // Helper for arabic formatting of numbers
  const formatNum = (num: number) => num.toLocaleString('ar-EG');

  // Case 1: Chunk-Based Analysis (for progressive build of QuranOutput)
  if (chunkIndex !== undefined && totalChunks !== undefined) {
    const vStart = verses[0]?.verseNumber || 0;
    const vEnd = verses[verses.length - 1]?.verseNumber || 0;

    // Academic variation of phrasing based on the chunk index to create an organic text flow
    const flowSeed = chunkIndex % 4;
    let intro = '';
    let bodyLetters = '';
    let bodyMath = '';
    let conclusion = '';

    if (flowSeed === 0) {
      intro = `### المبحث الأول: الاستقصاء الهيكلي لآيات المقطع (من آية ${vStart} إلى آية ${vEnd})
تبين الدراسة البنيوية الدقيقة لهذا الجزء من سورة ${sName} اتساقاً مذهلاً في الميزان الرقمي العام. يبلغ إجمالي القيم الحسابية (الجُمّل الكبير) لآيات هذا المقطع ${formatNum(sumJummal)}، موزعة بإحكام رياضي على ${formatNum(sumWords)} كلمة و${formatNum(sumLetters)} حرفاً عثمانياً.`;

      bodyLetters = `وقد أبدت حروف الفواتح المقطعة للمعامل النوراني المعتمد "${sLetters}" (وقيمته الحسابية المرجعية ${formatNum(sKeyValue)}) حضوراً لافتاً في الأنسجة اللفظية للآيات، حيث تداخلت هذه الحروف بمعدل ${formatNum(verses.reduce((acc, v) => acc + (v.overlapCount || 0), 0))} مرة مع نصوص الآيات، محققةً كثافة تداخل معيارية ملموسة تعزز من تلاحم الفواصل اللغوية للمقطع مع المحور الأصيل للسورة.`;

      bodyMath = `وبالنظر في معامل الاتزان الرقمي والاختزال لنسبة الكسر الرياضي (على ميزان الاختزال البالغ ${formatNum(sDigitalRoot)})، فقد سجل هذا المقطع تحقيق التوافق والاتزان الصرف الكلي في ${formatNum(verifiedCount)} آية من أصل ${formatNum(totalVerses)}، في حين ظهرت الآيات الأخرى في توازن وتكامل هندسي دقيق مع الموازين الهيكلية للمقاطع النورانية المجاورة.`;

      conclusion = `ومن أبرز اللطائف الرقمية المرصودة في هذا المقطع، تميز الآية الكريمة رقم [${maxDensityVerse?.verseNumber || vStart}] بكثافة تداخل حرفي استثنائية بلغت ${maxDensityVerse ? Math.round((maxDensityVerse.overlapRatio || 0) * 100) : 0}%، مما يجعلها بمثابة ركيزة بيانية وهيكلية مشعة في هذا المقطع المبارك.`;
    } else if (flowSeed === 1) {
      intro = `### المبحث الثاني: تفصيل الأوزان وتناظر المباني (من آية ${vStart} إلى آية ${vEnd})
تأتي قراءة موازين هذا المقطع من آيات سورة ${sName} لتؤكد ترابط النسق الحسابي البياني مع المتغير النوراني الفريد. حيث تبلغ القوة الرقمية الإجمالية للمقطع ${formatNum(sumJummal)}، موزعة بهندسة بلاغية معجزة على ${formatNum(sumWords)} من الكلمات القرآنية و${formatNum(sumLetters)} من الحروف الكريمة.`;

      bodyLetters = `ويظهر جلياً أثر حروف المعامل النوراني النشط "${sLetters}" في تشكيل الفراغ الصوتي للمقطع؛ إذ تم رصد تداخل مكثف في الحروف بمجموع ${formatNum(verses.reduce((acc, v) => acc + (v.overlapCount || 0), 0))} موضعاً، وهو ما يبرز التوافق النوراني الكامن في بناء الكلمات والآيات بحيث لا يخرج حرف واحد عن مكانه المقدر له في ميزان الوحي.`;

      bodyMath = `على مستوى التحقق من الكسر الميزاني، بلغت نسبة الاستقامة العددية للمقطع (القسمة الصرفة بدون كسر عشري على المعامل ${formatNum(sDigitalRoot)}) حداً لافتاً، حيث توافقت ${formatNum(verifiedCount)} آية كلياً، وجاءت القواسم المشتركة لبقية الآيات متسقة في كسرها العشري مع المخطط البنائي والتكاملي العام للأجزاء السابقة واللاحقة.`;

      conclusion = `وتتألق في هذا المقطع الآية الكريمة [${maxQuotientVerse?.verseNumber || vStart}]: "${maxQuotientVerse?.text || ''}"، حيث تبدي أقصى تماسك هيكلي مع ميزان السورة النورانية بقوة توافق وحساب جمل بلغ ${formatNum(maxQuotientVerse?.jummalValue || 0)}، مما يبرز دورها كبؤرة اتزان رياضي محورية في هذا المقطع.`;
    } else if (flowSeed === 2) {
      intro = `### المبحث الثالث: هندسة الكثافة الحرفية والتوافق الحسابي (من آية ${vStart} إلى آية ${vEnd})
يفصح الاستقصاء العددي للآيات من ${vStart} إلى ${vEnd} في سورة ${sName} عن مستويات عميقة من الترابط البنائي. يسجل الميزان الحسابي التراكمي لهذه الآيات القيمة ${formatNum(sumJummal)}، موزعة بهندسة حروف فائقة الإعجاز على ${formatNum(sumWords)} كلمة و${formatNum(sumLetters)} حرفاً عثمانياً مجيداً.`;

      bodyLetters = `عند تتبع شبكة حروف المفتاح المقطع "${sLetters}"، نكتشف تفوقاً إحصائياً في معدل شيوع هذه الحروف وتوزيعها على امتداد كلمات هذا المقطع، بمجموع تداخلات حرفية تبلغ ${formatNum(verses.reduce((acc, v) => acc + (v.overlapCount || 0), 0))} مرة، مما يشير إلى أن الحروف المقطعة في فواتح السور ليست رموزاً معزولة، بل هي جينات تركيبية سارية في خلايا الآيات كلها.`;

      bodyMath = `على مستوى التحقق من الكسر الميزاني، بلغت نسبة الاستقامة العددية للمقطع (القسمة الصرفة بدون كسر عشري على المعامل ${formatNum(sDigitalRoot)}) حداً لافتاً، حيث توافقت ${formatNum(verifiedCount)} آية كلياً، وجاءت القواسم المشتركة لبقية الآيات متسقة في كسرها العشري مع المخطط البنائي والتكاملي العام للأجزاء السابقة واللاحقة.`;

      conclusion = `ونشير في هذا السياق إلى الإعجاز العددي الكامن في ثنايا الآية الكريمة [${maxDensityVerse?.verseNumber || vStart}] التي تمثل مركز الثقل الحرفي للمجموعة بكثافة تداخل نوعية تبلغ ${maxDensityVerse ? Math.round((maxDensityVerse.overlapRatio || 0) * 100) : 0}%، مما يدعم بقوة الترابط الوثيق بين الشكل والمضمون.`;
    } else {
      intro = `### المبحث الرابع: التوافق البنيوي والاتزان الإحصائي (من آية ${vStart} إلى آية ${vEnd})
تستكمل هذه المجموعة من سورة ${sName} مسيرة الإعجاز الرياضي المتناسق. فبمجموع قيمي للجمل يبلغ ${formatNum(sumJummal)}، متوزعاً بالتناظر على ${formatNum(sumWords)} كلمات و${formatNum(sumLetters)} حروف، ينكشف أمام الباحثين نسق هندسي محكم تذوب فيه الفواصل العشوائية تماماً.`;

      bodyLetters = `ويظهر التدقيق الإحصائي لحروف الفواتح المقطعة "${sLetters}" حضوراً مهيمناً ومتناغماً بداخل التركيب اللفظي بمجموع ${formatNum(verses.reduce((acc, v) => acc + (v.overlapCount || 0), 0))} حرفاً، وهو تداخل مدروس يعكس الدقة المتناهية التي حُبكت بها السورة في تداخلاتها البنيوية والحرفية.`;

      bodyMath = `وقد أبان الفحص الرياضي (على ميزان الاختزال والتحقق من الكسر مع المعامل ${formatNum(sDigitalRoot)}) عن توافق بنيوي مستقيم لـ ${formatNum(verifiedCount)} آية، واستكمال الميزان التكاملي لـ ${formatNum(unverifiedCount)} آية كشفت بدورها عن توافقات غير مباشرة تثبت كفاءة موازين البنيان في الكشف التراكمي.`;

      conclusion = `ونلاحظ في هذا المقطع تفوق الآية الكريمة [${maxQuotientVerse?.verseNumber || vStart}] في قوة الميزان والحساب الرياضي بقوة توافق بلغت ${formatNum(maxQuotientVerse?.jummalValue || 0)}، مما يجعها مثالاً حياً وممتازاً لقواعد التناظر العددي البديع في البنيان القرآني.`;
    }

    return `${intro}\n\n${bodyLetters}\n\n${bodyMath}\n\n${conclusion}\n`;
  }

  // Case 2: Full Surah Analysis (for AiAnalysis component)
  const orderInQuran = surahMeta?.orderInQuran || 1;
  const revelationPlace = surahMeta?.revelationPlace || 'مكية';
  const revelationOrder = surahMeta?.revelationOrder || 1;
  const totalWordsMeta = surahMeta?.totalWords || sumWords;
  const totalLettersMeta = surahMeta?.totalLetters || sumLetters;
  const revelationReason = surahMeta?.revelationReason || '';
  const briefTopic = surahMeta?.briefTopic || '';

  const studyTitle = `دراسة تحليلية استقصائية وبنيوية شاملة لسورة ${sName}`;

  // Dedicated lookup for Noorani keys of compatibility
  const getNooraniCompatibilityKeysText = (surahId: number, versesList: VerseAnalysisInput[]): string => {
    const verified = versesList.filter(v => v.isVerified);
    if (verified.length === 0) {
      return `### 🔑 مفاتيح التوافق والاتزان النوراني لـ سورة ${sName} (${sLetters}):
لا توجد آيات متوافقة تماماً بالقسمة الصرفة تحت نطاق الآيات الحالية، ولكن تتكامل جميع الآيات في أوزانها الكسرية لتشكيل الميزان التراكمي الإجمالي للسورة الكريمة.`;
    }

    // Sort to get the most significant ones, or just take a sample (up to 5) distributed throughout the surah
    const keysCount = Math.min(verified.length, 5);
    const step = Math.max(1, Math.floor(verified.length / keysCount));
    const selectedKeys: VerseAnalysisInput[] = [];
    for (let i = 0; i < keysCount; i++) {
      const idx = Math.min(i * step, verified.length - 1);
      if (!selectedKeys.includes(verified[idx])) {
        selectedKeys.push(verified[idx]);
      }
    }

    let keysText = `### 🔑 مفاتيح التوافق والاتزان النوراني المعجز لـ سورة ${sName} (${sLetters}):\n`;
    keysText += `تفتتح سورة **${sName}** بالحروف النورانية **"${sLetters}"** التي يبلغ حساب جملها الإجمالي **${formatNum(sKeyValue)}**، وميزان اختزالها الرقمي **البلاد ${formatNum(sDigitalRoot)}**. وعند إخضاع آيات السورة للمطابقة الحسابية، برزت الآيات التالية كـ "مفاتيح نورانية توافقية كبرى" ترتبط ببيان الإعجاز الفعلي ومقاصد السورة:\n\n`;

    selectedKeys.forEach((v, index) => {
      const power = Math.round(v.jummalValue / sDigitalRoot);
      const text = v.text;
      
      let signType = "ميزان بنياني وهيكلي مكمل";
      let explanation = "يتحقق الاتزان الحسابي المباشر لهذه الآية الكريمة ليكون جزءاً لا يتجزأ من النسيج الهندسي التراكمي للسورة، مما يربط فواصلها اللفظية وأوزانها الكلمية بالبوابة الإيمانية وحروف الفاتحة النورانية.";

      // Match meanings
      if (/خلق|سما|سمو|أرض|شمس|قمر|ليل|نهار|آيات|ماء|بحر|فلك|رياح|سحاب/.test(text)) {
        signType = "ميزان كوني وعلمي دقيق (Cosmic & Scientific Balancer)";
        explanation = "تتحدث الآية الكريمة عن عجائب الخلق وجريان السنن الكونية في تماسك هندسي محكم. وجاء توافقها الحسابي مع المعامل النوراني للسورة (بواقع قوة مفتاح تبلغ " + formatNum(power) + ") ليؤكد بالبرهان الرياضي القاطع أن واضع موازين الأفلاك والكون المقدرة هو منزل هذا الذكر الحكيم بمثاقيل حروفه وكلماته.";
      } else if (/رسول|نبي|موسى|عيسى|إبر|نوح|لوط|صالح|هود|فرعون|آدم|سليمان|داوود|زكريا|يحيى/.test(text)) {
        signType = "ميزان نبوي وتاريخي (Prophetic & Historical Balancer)";
        explanation = "تستعرض هذه الآية جانباً من سيرة الأنبياء عليهم السلام وملاحم الإيمان التاريخية. ويرتبط توافقها الرقمي بقوة المفتاح النوراني ليثبت تكرار وتماثل القوانين الإلهية في التاريخ البشري، وأن الوحي المنطق بالحق يرتكز على سنن رياضية وبنائية ثابتة لا تتخلف.";
      } else if (/اللَّه|إله|رب|رحمن|رحيم|ملك|حي|قيوم|عزيز|عليم|حكيم/.test(text)) {
        signType = "ميزان عقائدي وتوحيدي خالص (Theological Balancer)";
        explanation = "آية جليلة تؤسس لأصل الألوهية والربوبية والتوحيد وتستعرض أسماء الله الحسنى وصفاته العلى. ويعكس توافقها الحسابي الصرف الخالي من الكسر العشري ارتباط صفات الهيمنة والقيومية الإلهية بالبنيان العددي للقرآن الكريم، لتكون الآية بؤرة التوحيد ومحوره العددي الأصيل.";
      } else if (/آمنوا|صالح|صلا|زكا|تقوى|متق|هدى|كتب|كتاب/.test(text)) {
        signType = "ميزان إيماني وتشريعي (Legislative & Faith Balancer)";
        explanation = "تفصّل الآية معالم الطريق الإيماني ومنظومة القيم والتشريعات المنظمة لروح وحياة الفرد والمجتمع. ويتسق ميزانها العددي بالتمام مع الحروف النورانية ليدل على أن شريعة الإسلام المطهرة تنزل من لدن حكيم خبير قدّر كل شيء فهدى، بحساب محكم وحروف موزونة.";
      }

      keysText += `${index + 1}. **الآية [${v.verseNumber}] (${signType}):**\n`;
      keysText += `   * **النص الميزاني الشريف:** « ${text} »\n`;
      keysText += `   * **بيانات الاتزان:** حساب الجمل الكبير للآية: **${formatNum(v.jummalValue)}** | قوة المفتاح النوراني (القسمة الصرفة): **${formatNum(power)}**\n`;
      keysText += `   * **الربط والدلالة التوافقية:** ${explanation}\n\n`;
    });

    return keysText;
  };

  const nooraniKeysText = getNooraniCompatibilityKeysText(activeSurah?.id || 1, verses);

  return `# ${studyTitle}
  
## تمهيد: السياق العام والبيئة البنائية للسورة الكريمة
تعد سورة **${sName}** إحدى السور النورانية المعجزة في القرآن الكريم، وتأتي في الترتيب **${formatNum(orderInQuran)}** في المصحف الشريف، وهي **${revelationPlace}** النزول، وترتيبها من حيث النزول هو **${formatNum(revelationOrder)}**. 
وتضم السورة وفق إحصائيات موازين الرسم العثماني الشريف ما مجموعه **${formatNum(totalVerses)}** آية، وتتألف من **${formatNum(totalWordsMeta)}** كلمة و**${formatNum(totalLettersMeta)}** حرفاً.

### 🏛️ سبب النزول والمقاصد التوجيهية الكبرى:
* **سبب النزول الشريف:** ${revelationReason || 'نزلت السورة بمقاصد جليلة لتثبيت دعائم التوحيد، وترسيخ البناء الإيماني والتشريعي في الأمة، وتوجيه الأنظار لسنن الله الماضية في كونه وخلقه.'}
* **المحور والبيان البلاغي:** ${briefTopic || 'تركز السورة على محاور العقيدة والاستقامة وعرض قصص الأنبياء والاعتبار بمصائر الغابرين لتثبيت القلوب على الحق والتحذير من سبل الغواية والاستكبار.'}

---

## الفصل الأول: المعيار الرقمي والمعامل النوراني النشط
افتتحت سورة **${sName}** بالحروف المقطعة المعجزة **"${sLetters}"**، والتي تمثل حجر الزاوية والمعامل النوراني الحاكم في هذا البحث الهيكلي للاتزان الحسابي.
* **المفتاح النوراني المعتمد:** \`${sLetters}\`
* **القيمة الإجمالية لحساب الجُمّل للمفتاح:** \`${formatNum(sKeyValue)}\`
* **معامل الاختزال العددي (الجذر الرقمي الحاكم):** \`${formatNum(sDigitalRoot)}\`

يمثل هذا المعامل العددي الحاكم بمثابة "ميزان كفتي المعادلة البنيوية" للآيات, حيث يُعرض عليه إجمالي القيمة الرقمية لكل آية وسياقها الحسابي لضبط وموازنة التوافق والاتساق ومنع العشوائية.

---

## الفصل الثاني: الإحصاء البنائي والتحقق من الاستقامة والكسر العددي
عند إخضاع جميع آيات السورة البالغة **${formatNum(totalVerses)}** آية للتحليل البنيوي الدقيق، ومقارنة مجموع حساب الجمل لكل آية بالمعامل النوراني الحاكم لـ سورة ${sName}، كانت النتائج الإحصائية كالتالي:

### 📊 الموازنة التوافقية الإجمالية:
1. **الآيات المتوافقة تماماً (القسمة الصرفة الخالية من الكسر العشري):** **${formatNum(verifiedCount)}** آية كريمة، وهو ما يعادل **${formatNum(verifiedPercentage)}%** من مجموع آيات السورة الكلي. هذا يحقق توازناً رقمياً تاماً واستقامة رياضية لا عشوائية فيها.
2. **الآيات ذات الاتزان التكاملي البنيوي (القسمة ذات الكسر العشري الدقيق):** **${formatNum(unverifiedCount)}** آية. تساهم هذه الآيات ذات النسب والكسور المتناهية في الحفاظ على التردد الهندسي التراكمي والاتزان الكلي لترتيب السورة وموقعها الشامل في القرآن الكريم.

---

## الفصل الثالث: بؤر الاتزان ومراكز الثقل الحسابي والنوراني في السورة
أظهر الفحص الإحصائي لآيات السورة الكريمة تمايز آيات معينة في أوزانها ومعاملاتها لتشكل ركائز الاتزان البنيوي والنوراني:

### ⚡ الآية الأكثر تماسكاً واتزاناً (ذروة ميزان القوة):
الآية رقم **[${maxQuotientVerse?.verseNumber || 1}]**: 
> "${maxQuotientVerse?.text || 'نص الآية الكريمة'}"
* **حساب الجمل الكبير للآية:** **${formatNum(maxQuotientVerse?.jummalValue || 0)}**
* **معامل التوافق الرياضي وقوة المفتاح:** **${maxQuotientVerse?.quotient ? maxQuotientVerse.quotient.toFixed(2) : '0'}**
* **المدلول البياني والعددي:** تشير هذه المعاملات المتناهية الارتفاع في هذه الآية تحديداً إلى قيامها بدور "مركز الثقل الحسابي التوافقي" للسورة بأكملها، حيث تتضاعف قيم كلماتها لتوافق ميزان الاختزال النوراني بنسبة كاملة وخالية من الكسور لضبط قمة الهرم الرياضي البنيوي.

### 🌸 الآية الأكثر تداخلاً وكثافة مع الفواتح النورانية:
الآية رقم **[${maxDensityVerse?.verseNumber || 1}]**:
> "${maxDensityVerse?.text || 'نص الآية الكريمة'}"
* **عدد حروف الفواتح المتداخلة:** **${formatNum(maxDensityVerse?.overlapCount || 0)}** حرفاً نورانياً من أصل **${formatNum(maxDensityVerse?.letterCount || 0)}** حرفاً كلياً في الآية.
* **كثافة التداخل والالتحام الحرفي:** **${maxDensityVerse?.overlapRatio ? Math.round(maxDensityVerse.overlapRatio * 100) : 0}%**
* **المدلول البياني والعددي:** تمثل هذه الآية الكريمة "البؤرة الحرفية الفائقة" في السورة. يشير التحام حروفها الشديد مع المعامل النوراني النشط إلى صلتها الوثيقة بمدلول الحروف المقطعة في الفاتحة الكريمة، حيث نسجت كلماتها لغوياً وحرفياً من ذات طينة تلك الحروف لخدمة المعاني العقائدية والبيانية ومحاور السورة الأساسية.

---

## الفصل الرابع: مفاتيح التوافق للحروف النورانية والأبعاد التاريخية والكونية
${nooraniKeysText}

---

## الفصل الخامس: المقاصد البلاغية والوحدة الموضوعية للسورة
تتجلى الوحدة الموضوعية لسورة **${sName}** في تناغم مطالعها مع مقاطعها وفواصلها، حيث ترتبط المعاني الإيمانية والتشريعية والقصصية بمحور أصيل يرسخ اليقين بالله تعالى وكمال حكمته في خلقه وأمره.
وتشير القراءات البلاغية والبيانية إلى أن السورة قد صيغت ألفاظها بتناسب فريد؛ فكل كلمة وكل حرف موضوع بمثقال حق يخدم الفكرة المحورية للسورة، وتتكامل الدلالات اللغوية مع النسق القرآني العام لتبهر العقول وتثبت القلوب على صراط مستقيم.

---

## الفصل السادس: لطائف الإعجاز البياني والترابط اللفظي
يكشف التأمل في المفردات القرآنية لسورة **${sName}** عن ترابط لفظي وصوتي عجيب، حيث تتكرر الكلمات والمشتقات الحرفية المتصلة بفاتحتها النورانية في مواضع محورية، مما يبرهن على أن حروف الفواتح ليست مجرد رموز معزولة، بل هي مفاتيح بيانية تفتح آفاق الفهم والتدبر في جمال النظم القرآني وبديع سبكه.

---

## الخلاصة والتوصيات الاستقصائية لبحوث الإعجاز
تثبت هذه الدراسة التحليلية البنيوية المستقلة والكاملة لسورة **${sName}** أن الأعداد والحروف والكلمات في القرآن الكريم منسوجة معاً بموازين غاية في الإتقان والدقة، حيث لا عشوائية ولا تفاوت.
إن التناسق البديع بين حساب الجمل للآيات ودلالاتها البلاغية يقدم برهاناً علمياً قاطعاً على الصدور الإلهي المطلق لهذا الكتاب الحكيم، ويفتح آفاقاً جديدة ومنهجية لباحثي الإعجاز القرآني للتوسع في استقصاء "البنيان البياني والعددي" للقرآن الكريم.
`;
}

/**
 * Generates an academic report specifically for the Elite Triple Match verses.
 */
export function generateTripleMatchEliteReport(params: {
  activeSurah: SurahInput | null;
  surahMeta: any;
  verses: VerseAnalysisInput[];
}): string {
  const { activeSurah, surahMeta, verses } = params;
  if (!activeSurah) return "يرجى اختيار سورة نشطة لتوليد تقرير آيات النخبة النورانية المطلقة.";

  const sName = activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim();
  const revOrder = surahMeta?.revelationOrder || 1;

  let report = `# 🔘 تقرير آيات النخبة النورانية المطلقة (Triple Match) - سورة ${sName}\n\n`;
  report += `**تاريخ الاستخراج:** ${new Date().toLocaleDateString('ar-EG')}\n`;
  report += `**السورة النشطة:** سورة ${sName} (رقمها: ${activeSurah.id} | نزولها: ${revOrder})\n`;
  if (activeSurah.letters) {
    report += `**المعامل النوراني:** ${activeSurah.letters} (القيمة الحسابية: ${activeSurah.keyValue} | أس المعامل: ${activeSurah.digitalRoot})\n`;
  }
  report += `\n---\n\n`;
  report += `## 📑 شروط الفلترة الحصرية الحاكمة لـ (Triple Match):\n`;
  report += `1. **الشرط الأول (درجة التوافق العالية):** درجة التوافق 6/6 (مفتاح مطلق) أو 5/6.\n`;
  report += `2. **الشرط الثاني (تحقق البصمة الذاتية/السورية):** تطابق البصمة الأحادية للعمود الجديد مع [اختزال جمل الآية OR اختزال رقم الآية OR اختزال رقم السورة OR اختزال ترتيب النزول].\n`;
  report += `3. **الشرط الثالث (التأثر بالمعامل النوراني):** القابلية المباشرة للقسمة على المعامل النوراني OR تطابق البصمة مع [أس المعامل النوراني OR اختزال القيمة الحسابية للمعامل].\n\n`;
  report += `---\n\n`;

  const dummySurah = {
    id: activeSurah.id,
    name: activeSurah.name,
    letters: activeSurah.letters || '',
    keyValue: activeSurah.keyValue || 0,
    digitalRoot: activeSurah.digitalRoot || 1
  };

  const eliteVerses = verses.filter(v => {
    const res = isTripleMatchElite(v, dummySurah, surahMeta);
    return res.isTripleMatch;
  });

  report += `### 📊 إحصائية النتيجة المباشرة:\n`;
  report += `* **عدد آيات النخبة المطلقة المحققة للشروط الثلاثة:** **${eliteVerses.length}** آية من أصل **${verses.length}** آية.\n\n`;

  if (eliteVerses.length === 0) {
    report += `*لا توجد آيات تُحقق الشروط الثلاثة معاً في النطاق الحالي.*\n`;
    return report;
  }

  report += `## 🌟 جدول وآيات النخبة النورانية المطلقة:\n\n`;

  eliteVerses.forEach((v, idx) => {
    const comp = getCompatibilityDetails(v, dummySurah);

    report += `### ${idx + 1}. الآية رقم (${v.verseNumber}): « ${v.text} »\n`;
    report += `- **حساب الجمل الكلي:** \`${v.jummalValue}\` | **عدد الكلمات:** ${v.wordCount} | **عدد الحروف:** ${v.letterCount}\n`;
    report += `- **درجة التوافق والميزان:** \`${comp.score}/6\` (${comp.statusLabel})\n`;
    report += `- **🔮 البصمة الأحادية للعمود الجديد:** \`${comp.finalSingleDigit}\` (المعادلة: ${comp.verseDigitalRoot} × (${v.verseNumber} + ${comp.reducedFactor}) = ${comp.newColumnProduct})\n`;
    const statusText = (comp.compactStatus || '').trim();
    const subReasons = (Array.isArray(comp.compactReasons) ? comp.compactReasons : []).filter(Boolean);
    if (subReasons.length > 0) {
      report += `- **حالة التوافق المدمج:** **${statusText}** عبر: ${subReasons.join(' - ')}\n`;
    } else {
      report += `- **حالة التوافق المدمج:** **${statusText}**\n`;
    }
    report += `- **بيان الشروط الثلاثة المحققة:**\n`;
    report += `  - ✅ **الشرط الأول (درجة التوافق):** ${comp.score}/6 (عالية)\n`;
    report += `  - ✅ **الشرط الثاني (البصمة الذاتية):** محقق (البصمة ${comp.finalSingleDigit} متطابقة)\n`;
    report += `  - ✅ **الشرط الثالث (تأثير المعامل):** محقق (متأثرة بالمعامل ${dummySurah.letters || dummySurah.id})\n\n`;
  });

  return report;
}

/**
 * Generates an academic report for Integrated Compatibilities (التوافقات المدمجة المسجلة وغير المسجلة)
 * and Researcher Notes.
 */
export function generateIntegratedCompatibilityReport(params: {
  activeSurah: SurahInput | null;
  surahMeta: any;
  verses: VerseAnalysisInput[];
  researcherNotes?: Record<string, string>;
}): string {
  const { activeSurah, surahMeta, verses, researcherNotes = {} } = params;
  const sName = activeSurah ? activeSurah.name.replace(/\s*\([^)]*\)/g, '').trim() : 'النطاق الشامل';

  let report = `# 📊 تقرير التوافقات المدمجة والبصمة الأحادية وملاحظات الباحث - ${sName}\n\n`;
  report += `**تاريخ التقرير:** ${new Date().toLocaleDateString('ar-EG')}\n`;
  if (activeSurah) {
    report += `**السورة:** ${activeSurah.name} (رقمها: ${activeSurah.id})\n`;
  }
  report += `**إجمالي الآيات المدروسة:** ${verses.length} آية\n\n`;
  report += `---\n\n`;

  const dummySurah = {
    id: activeSurah?.id || 1,
    name: activeSurah?.name || '',
    letters: activeSurah?.letters || '',
    keyValue: activeSurah?.keyValue || 0,
    digitalRoot: activeSurah?.digitalRoot || 1
  };

  const analyzed = verses.map(v => {
    const comp = getCompatibilityDetails(v, dummySurah);
    const surahId = (v as any).surahId || activeSurah?.id || 1;
    const vKey = `${surahId}:${v.verseNumber}`;
    const note = researcherNotes[vKey] || '';
    const isPerfect = comp.score >= 5 || comp.isDirectMatch;
    return { v, comp, note, isPerfect, vKey };
  });

  const perfectVerses = analyzed.filter(item => item.isPerfect);
  const versesWithNotes = analyzed.filter(item => Boolean(item.note.trim()));

  report += `## 📑 ملخص إحصائيات التوافقات المدمجة:\n`;
  report += `* 🏆 **التوافقات التامة (5/6 إلى 6/6):** ${perfectVerses.length} آية.\n`;
  report += `* 📝 **الآيات ذات الملاحظات المدونة من الباحث:** ${versesWithNotes.length} آية.\n\n`;

  report += `## 🏆 سجل الآيات ذات التوافق التام (5/6 إلى 6/6):\n\n`;
  if (perfectVerses.length === 0) {
    report += `*لا توجد آيات بدرجة توافق تام (5/6 إلى 6/6) في النطاق المحدد.*\n\n`;
  } else {
    perfectVerses.forEach((item, idx) => {
      report += `### ${idx + 1}. الآية (${item.v.verseNumber}): « ${item.v.text} »\n`;
      report += `- **درجة التوافق:** \`${item.comp.score}/6\` (${item.comp.statusLabel}) - توافق تام ومثبت.\n`;
      report += `- **حساب الجمل:** \`${item.v.jummalValue}\` | **الكلمات:** ${item.v.wordCount} | **الحروف:** ${item.v.letterCount}\n`;
      const statusText = (item.comp.compactStatus || 'محقق').trim();
      const subReasons = (Array.isArray(item.comp.compactReasons) ? item.comp.compactReasons : []).filter(Boolean);
      if (subReasons.length > 0) {
        report += `- **البصمة الأحادية للناتج:** \`${item.comp.finalSingleDigit}\` | **التوافق المدمج:** ${statusText} عبر: ${subReasons.join(' - ')}\n`;
      } else {
        report += `- **البصمة الأحادية للناتج:** \`${item.comp.finalSingleDigit}\` | **التوافق المدمج:** ${statusText}\n`;
      }
      if (item.note) {
        report += `- 📝 **ملاحظة الباحث:** ${item.note}\n`;
      }
      report += `\n`;
    });
  }

  if (versesWithNotes.length > 0) {
    report += `---\n\n## 📝 سجل ملاحظات واستقصاءات الباحث المخصصة:\n\n`;
    versesWithNotes.forEach((item, idx) => {
      report += `### ${idx + 1}. الآية (${item.v.verseNumber}): « ${item.v.text} »\n`;
      report += `> 📌 **الملاحظة المسجلة:** ${item.note}\n\n`;
    });
  }

  return report;
}

