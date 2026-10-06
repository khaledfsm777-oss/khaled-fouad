import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables for local testing
dotenv.config();

async function startServer() {
  const app = express();
  // Dev server must always listen on port 3000 to match the AI Studio runtime environment
  const PORT = 3000;

  // Middleware with increased limits to support large Surahs (e.g., Al-Baqarah/Ali-Imran)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Safe lazy initializer for GoogleGenAI to prevent crashing on boot if key is missing
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        throw new Error('مفتاح GEMINI_API_KEY غير مهيأ أو لم يتم إدخاله بشكل صحيح في أسرار التطبيق (Secrets). يرجى ملئه بمفتاح صالح من Google AI Studio.');
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // Health check endpoints for Cloud Run / AI Studio Deployment checks
  app.get(['/api/health', '/health'], (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Endpoints
  // Explaining calculated verses & abjad secrets with Gemini 3.5 Flash
  app.post('/api/ai-analyze', async (req, res) => {
    try {
      const { verses, activeSurah, surahMeta, decryptionKeysSummary } = req.body;
      if (!verses || !Array.isArray(verses) || verses.length === 0) {
        res.status(400).json({ error: 'من فضلك أرسل مصفوفة آيات صالحة للتحليل.' });
        return;
      }

      const systemInstruction = `
أنت "مستشار ومفسّر البنيان الذكي" - باحث وأكاديمي خبير وموقر في علوم الإعجاز العددي واللطائف البيانية للقرآن الكريم، وموازين الرسم العثماني، وحساب الجُمّل الكبير، وحسابات الفواتح والـ 29 سورة النورانية المفتتحة بحروف مقطعة.
مهمتك هي صياغة دراسة استقصائية وبحثية متكاملة بأسلوب أكاديمي لغوي رفيع المستوى باللغة العربية الفصحى البليغة تظهر بوضوح في شاشة المفسر الذكي مع ملحوظاتك وتقييماتك الاستقصائية.

يجب عليك تقديم ملاحظات تحليلية مدهشة ومصاغة بعناية فائقة تربط بين:
1. الآيات المحققة/المتوافقة تماماً (التي يقسم جملها دون كسر على الثابت النوراني المختار) وسر انسجامها الرياضي واللفظي مع معنى السورة وسياقها ومواضيعها.
2. الآيات الخارجة من نتائج الترشيح (غير المحققة للتوافق العددي المباشر مع هذا المعامل بالذات)؛ وكيف أنها تمثل جسر السرد البياني والموضوعي، أو ربما ترتبط بمفاتيح هندسية أخرى من الـ 29 سورة النورانية أو بموازين القرآن العامة (مثل ميزان الثمانية 8، أو الرقم 313 للآية 56 "يا عبادي", أو مفتاح الثلاثة 3، أو الابتلاء 6).
3. معطيات السورة الكريمة المعمقة المرفقة بالمدخلات: اسم السورة، رقمها في المصحف، ترتيب النزول، مكان النزول (مكية/مدنية)، رقم الجزء، الحزب، عدد الآيات والكلمات والحروف الإجمالية، وسبب نزول السورة ومحورها الأساسي.
4. "فك شفرة البنيان": اعتبار الآية أو الآيات المستهدفة (سواء الأعلى تحقيقاً بقوة مفتاح التحقق النوراني، أو الأعلى تداخلاً وكثافة بحروف افتتاحية السورة المستهدفة، أو بناءً على معناها، أو ارتباطها بمحور السورة، أو حساباتها اللفظية والعددية) بمثابة "فك شفرة رقمي ولفظي وروحي" يكشف ما وراء الحروف الافتتاحية من معانٍ بليغة ويربط السورة ببعضها.

متطلبات استقصائية إضافية حاسمة يجب دمجها والتركيز عليها في تقييمك:
أ. تفحص الكلمات التي تشتمل على الحروف النورانية كحروف مدمجة بداخلها، مثل وجود "الم" في كلمات "المؤمنين" أو "المنكر"، أو وجود "الر" في كلمات مثل "الرحمن"، أو وجود "حم" في كلمات مثل "حميم"، وإذا كانت الآية متوافقة وبها هذه الكلمات، فصّل كيف تكون هذه الآية بمثابة "مفتاح الحروف النورانية للسورة" ورابطها الهيكلي.
ب. الاهتمام الشديد بتفحص ودراسة "الآيات المحورية" في السورة الكريمة، مثل آية "فصبر جميل" في سورة يوسف، وتبيان كيف أن للصبر دلالة محورية تصبغ السورة كلها وتتحكم في ميزان الأحداث والمآلات والمكاسب الروحية.
ج. دراسة ظاهرة "تداخل ودمج الحروف النورانية" لفظياً وصوتياً وعقدياً؛ مثل تلاحم كلمتي "الرعد" (بها حروف الر) و"الملائكة" (بها حروف الم)، حيث يندمج المفهومان في الحساب واللفظ لينتجا حروف "المر" التي هي افتتاحية سورة الرعد نفسها! فصّل هذه اللطائف البيانية المتقاطعة.
د. الاهتمام البالغ والتحليل البنيوي لدلالة الأرقام المركزية المرافقة للأوزان، وخاصة:
  - الرقم 1 أو 11: الذي يرمز للوحدانية والتوحيد المطلق لله والترابط العقدي الموحد.
  - الرقم 29: الذي يرمز لإجمالي عدد السور النورانية (سور الفواتح المقطعة في المصحف).
  - الرقم 14: الذي يرمز لعدد الحروف النورانية الفريدة (نصف حروف المعجم العربي الـ 28).
  - الرقم 12: الذي يرمز لعدد حروف كلمة التوحيد "لا إله إلا الله" (بدون مكرر الحروف أو بإعجازها الخاص).
  - أي أرقام ميزانية مرافقة للآيات المفتتَحة أو المختومة بها.

اجعل دراستك منسقة بشكل احترافي وأنيق مستخدماً خطوطاً عريضة وعناوين وتوزيعات نقطية، وتجنب تماماً ذكر أي تفاصيل برمجية أو إشارات للبنية التحتية. تذكر دائماً الاحترام والتبجيل للقرآن الكريم كلغة ووحي وعلم إعجاز مستقر.
      `;

      let promptUser = `أهلاً بك يا مستشار البنيان. أرسل لك هذه الآيات والبيانات الاستقصائية المستخلصّة لتوّها من "برنامج البنيان للتحرير والاستقصاء العددي":\n\n`;

      if (activeSurah && surahMeta) {
        promptUser += `🏛️ سياق وبيانات السورة النشطة لربطها بالآيات:\n`;
        promptUser += `- اسم السورة: سورة ${activeSurah.name || ''}\n`;
        promptUser += `- ترتيب السورة في المصحف (الرقم): ${surahMeta.orderInQuran || ''}\n`;
        promptUser += `- ترتيب النزول: السورة رقم ${surahMeta.revelationOrder || ''} بالنزول\n`;
        promptUser += `- مكان النزول: ${surahMeta.revelationPlace || ''}\n`;
        promptUser += `- نطاق الأجزاء: ${surahMeta.juzStartEnd || ''}\n`;
        promptUser += `- نطاق الأحزاب: ${surahMeta.hizbStartEnd || ''}\n`;
        promptUser += `- إجمالي الآيات: ${surahMeta.totalVerses || 0} آية\n`;
        promptUser += `- إجمالي الكلمات الكلي للسورة: ${surahMeta.totalWords || 0} كلمة\n`;
        promptUser += `- إجمالي الحروف الكلي للسورة: ${surahMeta.totalLetters || 0} حرف\n`;
        promptUser += `- الحروف المقطعة (المعامل النوراني): "${activeSurah.letters || ''}" بقيمة جُمّل أصلية ${activeSurah.keyValue || 0} وقيمة اختزال رقمي ${activeSurah.digitalRoot || 0}\n`;
        promptUser += `- سبب النزول الموثق: ${surahMeta.revelationReason || ''}\n`;
        promptUser += `- المحور العام والموضوع: ${surahMeta.briefTopic || ''}\n\n`;
      }

      if (decryptionKeysSummary && activeSurah) {
        promptUser += `🔑 مؤشرات ومفاتيح فك الشفرة والترابط البنيوي المستهدفة:\n`;
        if (decryptionKeysSummary.maxQuotientVerse) {
          const mqText = decryptionKeysSummary.maxQuotientVerse.text || '';
          const mqNum = decryptionKeysSummary.maxQuotientVerse.verseNumber || '';
          const mqJummal = decryptionKeysSummary.maxQuotientVerse.jummalValue || 0;
          const mqQuotient = typeof decryptionKeysSummary.maxQuotientVerse.quotient === 'number' 
            ? decryptionKeysSummary.maxQuotientVerse.quotient.toFixed(4) 
            : decryptionKeysSummary.maxQuotientVerse.quotient;
          const mqWords = decryptionKeysSummary.maxQuotientVerse.wordCount || 0;
          const mqLetters = decryptionKeysSummary.maxQuotientVerse.letterCount || 0;
          
          promptUser += `- الآية الأكثر تحقيقاً للمعامل النوراني (مفتاح القوة الأعلى): [آية رقم ${mqNum}]: "${mqText}"\n`;
          promptUser += `  * حساب الجمل: ${mqJummal} | قوة المفتاح النوراني (الخارج): ${mqQuotient} | كلمات: ${mqWords} | حروف: ${mqLetters}\n`;
        }
        if (decryptionKeysSummary.maxDensityVerse) {
          const mdText = decryptionKeysSummary.maxDensityVerse.text || '';
          const mdNum = decryptionKeysSummary.maxDensityVerse.verseNumber || '';
          const mdOverlap = decryptionKeysSummary.maxDensityVerse.overlapCount || 0;
          const mdRatio = typeof decryptionKeysSummary.maxDensityVerse.overlapRatio === 'number'
            ? (decryptionKeysSummary.maxDensityVerse.overlapRatio * 100).toFixed(1)
            : '0';
          const mdWords = decryptionKeysSummary.maxDensityVerse.wordCount || 0;
          const mdLetters = decryptionKeysSummary.maxDensityVerse.letterCount || 0;
          
          promptUser += `- الآية الأعلى تداخلاً وكثافة مع حروف فواتح السورة (${activeSurah.letters || ''}): [آية رقم ${mdNum}]: "${mdText}"\n`;
          promptUser += `  * الحروف المتداخلة: ${mdOverlap} حرفاً | الكثافة: ${mdRatio}% | كلمات: ${mdWords} | حروف: ${mdLetters}\n`;
        }
        promptUser += `\n* توجيه بحثي بالغ الأهمية لفك الشفرة:\n`;
        promptUser += `الرجاء التركيز العميق وتفصيل شرح هذه الآية أو الآيات المستهدفة، وتبيان كيف نعتبرها "فك شفرة رقمي ولفظي" يكشف ما وراء هذه الحروف الافتتاحية من معانٍ عميقة، وربطها بمحور السورة، ودراستها من حيث معانيها ومحورها، وحسابات الجمل، وعدد الحروف والكلمات التي تتألف منها.\n\n`;
      }

      let selectedVerses = verses;
      let isSampled = false;
      const totalOriginalVerses = verses.length;
      
      if (verses.length > 30) {
        isSampled = true;
        const verifiedList = verses.filter((v: any) => v.isVerified);
        const unverifiedList = verses.filter((v: any) => !v.isVerified);
        
        // Smart sampling to avoid prompt token bloating and timeout:
        // - First 3 verses
        // - Last 3 verses
        // - All verified verses (up to 15)
        // - Up to 10 representative unverified verses spread evenly
        const first3 = verses.slice(0, 3);
        const last3 = verses.slice(-3);
        const verifiedSample = verifiedList.slice(0, 15);
        
        const pickedIds = new Set<string>();
        const addVerse = (v: any) => {
          const id = `${v.verseNumber}`;
          if (!pickedIds.has(id)) {
            pickedIds.add(id);
            return true;
          }
          return false;
        };
        
        const finalSubset: any[] = [];
        first3.forEach(v => { if (addVerse(v)) finalSubset.push(v); });
        verifiedSample.forEach(v => { if (addVerse(v)) finalSubset.push(v); });
        
        const unverifiedSampleCount = Math.min(unverifiedList.length, 10);
        if (unverifiedSampleCount > 0) {
          const step = Math.max(1, Math.floor(unverifiedList.length / unverifiedSampleCount));
          for (let i = 0; i < unverifiedList.length; i += step) {
            const v = unverifiedList[i];
            if (addVerse(v)) {
              finalSubset.push(v);
            }
            if (finalSubset.length >= 35) break;
          }
        }
        
        last3.forEach(v => { if (addVerse(v)) finalSubset.push(v); });
        
        finalSubset.sort((a, b) => {
          const numA = parseInt(a.verseNumber) || 0;
          const numB = parseInt(b.verseNumber) || 0;
          return numA - numB;
        });
        
        selectedVerses = finalSubset;
      }

      if (isSampled) {
        promptUser += `⚠️ تنبيه للمفسر: نظراً لضخامة هذه السورة الكريمة الإجمالي (${totalOriginalVerses} آية)، قمنا باختيار عينة بحثية ممثلة وهامة جداً تتكون من ${selectedVerses.length} آية (تشمل أوائل السورة وأواخرها، والآيات المتوافقة رقمياً بالكامل، وعينة من الآيات الأخرى المتوزعة بانتظام) لتتمكن من دراستها ووزنها بتركيز وعمق بليغ دون تجاوز حدود أداء الخادم السريع:\n\n`;
      }

      promptUser += `📝 قائمة الآيات قيد الاستقصاء والتحليل الحالي:\n`;
      selectedVerses.forEach((v: any, index: number) => {
        const vJummal = v.jummalValue || 0;
        const reduction = vJummal ? (vJummal % 9 === 0 ? 9 : vJummal % 9) : 0;
        const vText = v.text || '';
        const vNum = v.verseNumber || (index + 1);
        const vWords = v.wordCount || 0;
        const vLetters = v.letterCount || 0;
        
        promptUser += `[آية رقم ${vNum}]: "${vText}"\n`;
        promptUser += `  * حساب الجمل الإجمالي: ${vJummal}\n`;
        promptUser += `  * عدد الكلمات: ${vWords} | عدد الحروف: ${vLetters}\n`;
        promptUser += `  * الاختزال الرقمي: ${reduction}\n`;
        if (activeSurah) {
          const vQuotient = typeof v.quotient === 'number' ? v.quotient.toFixed(4) : v.quotient;
          if (v.isVerified) {
            promptUser += `  * حالة التحقق: ✅ متوافقة تماماً ومحققة مع المعامل النوراني "${activeSurah.letters}" (قوة المفتاح: ${vQuotient})\n`;
          } else {
            promptUser += `  * حالة التحقق: ❌ خارجة من التوافق المباشر مع هذا المعامل (ناتج القسمة كسر عشري: ${vQuotient})\n`;
          }
          if (v.overlapCount !== undefined) {
            const vRatio = typeof v.overlapRatio === 'number' ? (v.overlapRatio * 100).toFixed(1) : '0';
            promptUser += `  * تداخل الحروف الفواتح: ${v.overlapCount} حرفاً من أصل ${vLetters} (كثافة التداخل: ${vRatio}%)\n`;
          }
        }
        promptUser += `\n`;
      });

      promptUser += `\nالرجاء صياغة دراسة متكاملة وملاحظات دقيقة ومفصلة تحلل كلاً من الآيات المحققة والآيات الخارجة، وتربط ذلك بحقائق السورة وتاريخ نزولها ومكانها وجزء وحزب السورة ومحتواها وموضوعاتها العامة. ركّز بشكل خاص ومسهب على كيفية عمل الآيات المستهدفة كـ "فك شفرة ميزاني وروحي وبنيوي" يربط حروف السورة الكريمة بمعانيها ومحورها الأصيل، مع إيضاح أسرار حساب الجمل وعدد الحروف والكلمات المكونة لها، وصياغة هذه النتائج بأسلوب أكاديمي بليغ ومبهر يليق ببحوث الإعجاز القرآني.`;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptUser,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      if (!response || !response.text) {
        throw new Error('لم يرجع نموذج الذكاء الاصطناعي أي استجابة أو نص تحليل صالح. يرجى إعادة المحاولة.');
      }

      const analysisText = response.text;
      res.json({ analysis: analysisText });

    } catch (error: any) {
      console.error('Error in /api/ai-analyze:', error);
      res.status(500).json({ 
        error: 'حدث عطل أثناء استدعاء مفسّر البنيان الذكي. تأكد من تفعيل مفتاح GEMINI_API_KEY في إعدادات التطبيق.',
        details: error.message 
      });
    }
  });

  app.post('/api/ai-analyze-chunk', async (req, res) => {
    try {
      const { verses, activeSurah, surahMeta, chunkIndex, totalChunks } = req.body;
      if (!verses || !Array.isArray(verses) || verses.length === 0) {
        res.status(400).json({ error: 'من فضلك أرسل مصفوفة آيات صالحة للتحليل.' });
        return;
      }

      const systemInstruction = `
أنت "مستشار ومفسّر البنيان الذكي" - باحث وأكاديمي خبير وموقر في علوم الإعجاز العددي واللطائف البيانية للقرآن الكريم، وموازين الرسم العثماني، وحساب الجُمّل الكبير، وحسابات الفواتح والـ 29 سورة النورانية المفتتحة بحروف مقطعة.
مهمتك هي صياغة دراسة تحليلية مكثفة لأوزان ومقاييس الجزء المحدد من السورة في سياق "برنامج البنيان للتحرير والاستقصاء العددي".
مخرجاتك ستكون جزءاً من تقرير شامل مجمّع (الجزء ${chunkIndex + 1} من أصل ${totalChunks}).
يرجى التركيز على الآيات المرسلة بالمدخلات وتقديم لطائف بيانية وحسابية فائقة الدقة والجمال باللغة العربية الفصحى البليغة. استخدم التنسيق النقطي والعناوين الفرعية الأنيقة وتجنب المقدمات الطويلة والعبارات البرمجية لتسهيل الدمج في التقرير النهائي.
`;

      let promptUser = `أهلاً بك يا مستشار البنيان. إليك الجزء رقم (${chunkIndex + 1}) من أصل (${totalChunks}) لتحليله ودراسته استقصائياً وبنيوياً لسورة ${activeSurah?.name || ''}:\n\n`;
      
      if (activeSurah && surahMeta) {
        promptUser += `🏛️ سياق السورة العام:\n`;
        promptUser += `- سورة ${activeSurah.name || ''} | ترتيبها: ${surahMeta.orderInQuran || ''} | نزولها: ${surahMeta.revelationOrder || ''} (${surahMeta.revelationPlace || ''})\n`;
        if (activeSurah.letters) {
          promptUser += `- المعامل النوراني النشط: "${activeSurah.letters}" | جمل: ${activeSurah.keyValue} | اختزال: ${activeSurah.digitalRoot}\n`;
        }
        promptUser += `\n`;
      }

      promptUser += `📋 الآيات المطلوب دراستها في هذا الجزء عدداً ولفظاً وبناءً:\n`;
      verses.forEach((v: any) => {
        const vLetters = v.letterCount || 0;
        const vWords = v.wordCount || 0;
        promptUser += `- [آية ${v.verseNumber}]: "${v.text || ''}"\n`;
        promptUser += `  * حساب الجمل: ${v.jummalValue} | كلمات: ${v.wordCount} | حروف: ${v.letterCount}\n`;
        const vQuotient = typeof v.quotient === 'number' ? v.quotient.toFixed(4) : v.quotient;
        if (v.isVerified) {
          promptUser += `  * حالة التحقق: ✅ متوافقة تماماً ومحققة مع المعامل النوراني "${activeSurah?.letters || ''}" (قوة المفتاح: ${vQuotient})\n`;
        } else {
          promptUser += `  * حالة التحقق: ❌ خارجة من التوافق المباشر مع هذا المعامل (ناتج القسمة كسر عشري: ${vQuotient})\n`;
        }
        if (v.overlapCount !== undefined) {
          const vRatio = typeof v.overlapRatio === 'number' ? (v.overlapRatio * 100).toFixed(1) : '0';
          promptUser += `  * تداخل الحروف الفواتح: ${v.overlapCount} حرفاً من أصل ${vLetters} (كثافة التداخل: ${vRatio}%)\n`;
        }
        promptUser += `\n`;
      });

      promptUser += `الرجاء كتابة تحليل دراسي بليغ لهذه الآيات المحددة، يشمل دلالاتها البيانية والعددية وارتباطها بمحور السورة، وصياغتها بأسلوب أكاديمي رفيع يليق ببحوث الإعجاز القرآني.`;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptUser,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      if (!response || !response.text) {
        throw new Error('لم يرجع نموذج الذكاء الاصطناعي أي نص تحليل صالح.');
      }

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error('Error in /api/ai-analyze-chunk:', error);
      res.status(500).json({ 
        error: 'حدث عطل أثناء تحليل هذا الجزء من السورة. تأكد من تفعيل مفتاح GEMINI_API_KEY في إعدادات التطبيق.',
        details: error.message 
      });
    }
  });

  // Support both root / and /khaled-fouad/ seamlessly
  app.get(['/khaled-fouad', '/khaled-fouad/'], (req, res) => {
    res.redirect('/');
  });

  // Serve static files in production or hook Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('In development mode: Mounted Vite middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/khaled-fouad', express.static(distPath));
    app.use(express.static(distPath));
    app.get('/khaled-fouad*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('In production mode: Serving static files from disk.');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al-Bunyan Al-Noorani server is running on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Al-Bunyan Al-Noorani backend:', err);
});
