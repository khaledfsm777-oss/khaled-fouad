import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Loader2, BookOpen, Layers, Compass, CheckCircle2 } from 'lucide-react';
import { NOORANI_SURAHS, ALL_SURAHS, NooraniSurah, stripBismillah, reduceDigitalRoot, ALL_29_NOORANI_SURAH } from '../utils/jummal';
import quranData from '../utils/quranData';
import QuranFontSizeControl from './QuranFontSizeControl';

interface QuranInputProps {
  onAnalyze: (text: string, separator: 'parentheses' | 'curly' | 'auto', excludeBismillah: boolean) => void;
  onAnalyze29?: () => void;
  isLoading: boolean;
  activeSurah: NooraniSurah | null;
  setActiveSurah: (surah: NooraniSurah | null) => void;
}

export default function QuranInput({ onAnalyze, onAnalyze29, isLoading, activeSurah, setActiveSurah }: QuranInputProps) {
  const [inputScope, setInputScope] = useState<'noorani' | 'all114'>('noorani');
  const [selectedSurahId, setSelectedSurahId] = useState<number | ''>('');
  const [excludeBismillah, setExcludeBismillah] = useState(true);
  const [separator, setSeparator] = useState<'parentheses' | 'curly' | 'auto'>('auto');
  const [text, setText] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback preset text for Surah Al-Ankabut in case of offline usage
  const ankabutOfflineText = `الٓمٓ (1) أَحَسِبَ ٱلنَّاسُ أَن يُتۡرَكُوٓاْ أَن يَقُولُوٓاْ ءَامَنَّا وَهُمۡ لَا يُفۡتَنُونَ (2) وَلَقَدۡ فَتَنَّا ٱلَّذِينَ مِن قَبۡلِهِمۡۖ فَلَيَعۡلَمَنَّ ٱللَّهُ ٱلَّذِينَ صَدَقُواْ وَلَيَعۡلَمَنَّ ٱلۡكَٰذِبِينَ (3) أَمۡ حَسِبَ ٱلَّذِينَ يَعۡمَلُونَ ٱلسَّيِّـَٔاتِ أَن يَسۡبِقُونَاۚ سَآءَ مَا يَحۡكُمُونَ (4) مَن كَانَ يَرۡجُواْ لِقَآءَ ٱللَّهِ فَإِنَّ أَجَلَ ٱللَّهِ لَأٓتٖۚ وَهُوَ ٱلسَّمِيعُ ٱلۡعَلِيمُ (5) وَمَن جَٰهَدَ فَإِنَّمَا يُجَٰهِدُ لِنَفۡسِهِۦٓۚ إِنَّ ٱللَّهَ لَغَنِيٌّ عَنِ ٱلۡعَٰلَمِينَ (6) وَٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّٰلِحَٰتِ لَنُكَفِّرَنَّ عَنۡهُمۡ سَيِّـَٔاتِهِمۡ وَلَنَجۡزِيَنَّهُمۡ أَحۡسَنَ ٱلَّذِي كَانُواْ يَعۡمَلُونَ (7) وَوَصَّيۡنَا ٱلۡإِنسَٰنَ بِوَٰلِدَيۡهِ حُسۡنٗاۖ وَإِن جَٰهَدَاكَ لِتُشۡرِكَ بِي مَا لَيۡسَ لَكَ بِهِۦ عِلۡمٞ فَلَا تُطِعۡهُمَآۚ إِلَيَّ مَرۡجِعُكُمۡ فَأُنَبِّئُكُم بِمَا كُنتُمۡ تَعۡمَلُونَ (8) وَٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّٰلِحَٰتِ لَنُدۡخِلَنَّهُمۡ فِي ٱلصَّٰلِحِينَ (9) وَمِنَ ٱلنَّاسِ مَن يَقُولُ ءَامَنَّا بِٱللَّهِ فَإِذَآ أُوذِيَ فِي ٱللَّهِ جَعَلَ فِتۡنَةَ ٱلنَّاسِ كَعَذَابِ ٱللَّهِۖ وَلَئِن جَآءَ نَصۡرٞ مِّن رَّبِّكَ لَيَقُولُنَّ إِنَّا كُنَّا مَعَكُمۡۚ أَوَلَيۡسَ ٱللَّهُ بِأَعۡلَمَ بِمَا فِي صُدُورِ ٱلۡعَٰلَمِينَ (10) وَلَيَعۡلَمَنَّ ٱللَّهُ ٱلَّذِينَ ءَامَنُواْ وَلَيَعۡلَمَنَّ ٱلۡمُنَٰفِقِينَ (11) وَقَالَ ٱلَّذِينَ كَفَرُواْ لِلَّذِينَ ءَامَنُواْ ٱتَّبِعُواْ سَبِيلَنَا وَلۡنَحۡمِلۡ خَطَٰيَٰكُمۡ وَمَا هُم بِحَٰمِلِينَ مِنۡ خَطَٰيَٰهُم مِّن شَيۡءٍۖ إِنَّهُمۡ لَكَٰذِبُونَ (12) وَلَيَحۡمِلُنَّ أَثۡقَالَهُمۡ وَأَثۡقَالٗا مَّعَ أَثۡقَالِهِمۡۖ وَلَيُسۡـَٔلُنَّ يَوۡمَ ٱلۡقِيَٰمَةِ عَمَّا كَانُواْ يَفۡتَرُونَ (13) وَلَقَدۡ أَرۡسَلۡنَا نُوحًا إِلَىٰ قَوۡمِهِۦ فَلَبِثَ فِيهِمۡ أَلۡفَ سَنَةٍ إِلَّا خَمۡسِينَ عَامٗا فَأَخَذَهُمُ ٱلطُّوفَانُ وَهُمۡ ظَٰلِمُونَ (14) فَأَنجَيۡنَٰهُ وَأَصۡحَٰبَ ٱلسَّفِينَةِ وَجَعَلۡنَٰهَآ ءَايَةٗ لِّلۡعَٰلَمِينَ (15) وَإِبۡرَٰهِيمَ إِذۡ قَالَ لِقَوۡمِهِ ٱعۡبُدُواْ ٱللَّهَ وَٱتَّقوهُۖ ذَٰلِكُمۡ خَيۡرٞ لَّكُمۡ إِن كُنتُمۡ تَعۡلَمُونَ (16) إِنَّمَا تَعۡبُدُونَ مِن دُونِ ٱللَّهِ أَوۡثَٰنٗا وَتَخۡلُقُونَ إِفۡكًاۚ إِنَّ ٱلَّذِينَ تَعۡبُدُونَ مِن دُونِ ٱللَّهِ لَا يَمۡلِكُونَ لَكُمۡ رِزۡقٗا فَٱبۡتَغُواْ عِندَ ٱللَّهِ ٱلرِّزۡقَ وَٱعۡبُدُوهُ وَٱشۡكُرُواْ لَهُۥٓۖ إِلَيۡهِ تُرۡجَعُونَ (17) وَإِن تُكَذِّبُواْ فَقَدۡ كَذَّبَ أُمَمٞ مِّن قَبۡلِكُمۡۖ وَمَا عَلَى ٱلرَّسُولِ إِلَّا ٱلۡبَلَٰغُ ٱلۡمُبِينُ (18) أَوَلَمۡ يَرَوۡاْ كَيۡفَ يُبۡدِئُ ٱللَّهُ ٱلۡخَلۡقَ ثُمَّ يُعِيدُهُۥٓۚ إِنَّ ذَٰلِكَ عَلَى ٱللَّهِ يَسِيرٞ (19) قُلۡ سِيرُواْ فِي ٱلۡأَرۡضِ فَٱنظُرُواْ كَيۡفَ بَدَأَ ٱلۡخَلۡقَۚ ثُمَّ ٱللَّهُ يُنشِئُ ٱلنَّشۡأَةَ ٱلۡأٓخِرَةَۚ إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَيۡءٖ قَدِيرٞ (20) يُعَذِّبُ مَن يَشَآءُ وَيَرۡحَمُ مَن يَشَآءُۖ وَإِلَيۡهِ تُقۡلَبُونَ (21) وَمَآ أَنتُم بِمُعۡجِزِينَ فِي ٱلۡأَرۡضِ وَلَا فِي ٱالسَّمَآءِۖ وَمَا لَكُم مِّن دُونِ ٱللَّهِ مِن وَلِيّٖ وَلَا نَصِيرٖ (22) وَٱلَّذِينَ كَفَرُواْ بِـَٔايَٰتِ ٱللَّهِ وَلِقَآئِهِۦٓ أُوْلَٰٓئِكَ يَئِسُواْ مِن رَّحۡمَتِي وَأُوْلَٰٓئِكَ لَهُمۡ عَذَابٌ أَلِيمٞ (23) فَمَا كَانَ جَوَابَ قَوۡمِهِۦٓ إِلَّآ أَن قَالُواْ ٱقۡتُلُوهُ أَوۡ حَرِّقُوهُ فَأَنجَىٰهُ ٱللَّهُ مِنَ ٱلنَّارِۚ إِنَّ فِي ذَٰلِكَ لَأٓيَٰتٖ لِّقَوۡمٖ يُؤۡمِنُونَ (24) وَقَالَ إِنَّمَا ٱتَّخَذۡتُم مِّن دُونِ ٱللَّهِ أَوۡثَٰنٗا مَّوَدَّةَ بَيۡنِكُمۡ فِي ٱلۡحَيَوٰةِ ٱلدُّنۡيَاۖ ثُمَّ يَوۡمَ ٱلۡقِيَٰمَةِ يَكۡفُرُ بَعۡضُكُم بِبَعۡضٖ وَيَلۡعَنُ بَعۡضُكُم بَعۡضٗا وَمَأۡوَىٰكُمُ ٱلنَّارُ وَمَا لَكُم مِّن نَّٰصِرِينَ (25) ۞فَـَٔامَنَ لَهُۥ لُوطٞۘ وَقَالَ إِنِّي مُهَاجِرٌ إِلَىٰ رَبِّيٓۖ إِنَّهُۥ هُوَ ٱلۡعَزِيزُ ٱلۡحَكِيمُ (26) وَوَهَبۡنَا لَهُۥٓ إِسۡحَٰقَ وَيَعۡقُوبَ وَجَعَلۡنَا فِي ذُرِّيَّتِهِ ٱلنُّبُوَّةَ وَٱلۡكِتَٰبَ وَءَاتَيۡنَٰهُ أَجۡرَهُۥ فِي ٱلدُّنۡيَاۖ وَإِنَّهُۥ فِي ٱلۡأٓخِرَةِ لَمِنَ ٱلصَّٰلِحِينَ (27) وَلُوطًا إِذۡ قَالَ لِقَوۡمِهِۦٓ إِنَّكُمۡ لَتَأۡتُونَ ٱلۡفَٰحِشَةَ مَا سَبَقَكُم بِهَا مِنۡ أَحَدٖ مِّنَ ٱلۡعَٰلَمِينَ (28) أَئِنَّكُمۡ لَتَأۡتُونَ ٱلرِّجَالَ وَتَقۡطَعُونَ ٱلسَّبِيلَ وَتَأۡتُونَ فِي نَادِيكُمُ ٱلۡمُنكَرَۖ فَمَا كَانَ جَوَابَ قَوۡمِهِۦٓ إِلَّآ أَن قَالُواْ ٱئۡتِنَا بِعَذَابِ ٱللَّهِ إِن كُنتَ مِنَ ٱلصَّٰدِقِينَ (29) قَالَ رَبِّ ٱنصُرۡنِي عَلَى ٱلۡقَوۡمِ ٱلۡمُفۡسِدِينَ (30) وَلَمَّا جَآءَتۡ رُسُلُنَآ إِبۡرَٰهِيمَ بِٱلۡبُشۡرَىٰ قَالُوٓاْ إِنَّا مُهۡلِكُوٓاْ أَهۡلِ هَٰذِهِ ٱلۡقَرۡيَةِۖ إِنَّ أَهۡلَهَا كَانُواْ ظَٰلِمِينَ (31) قَالَ إِنَّ فِيهَا لُوطٗاۚ قَالُواْ نَحۡنُ أَعۡلَمُ بِمَن فِيهَاۖ لَنُنَجِّيَنَّهُۥ وَأَهۡلَهُۥٓ إِلَّا ٱمۡرَأَتَهُۥ كَانَتۡ مِنَ ٱلۡغَٰبِرِينَ (32) وَلَمَّآ أَن جَآءَتۡ رُسُلُنَا لُوطٗا سِيٓءَ بِهِمۡ وَضَاقَ بِهِمۡ ذَرۡعٗاۖ وَقَالُواْ لَا تَخَفۡ وَلَا تَحۡزَنۡ إِنَّا مُنَجُّوكَ وَأَهۡلَكَ إِلَّا ٱمۡرَأَتَكَ كَانَتۡ مِنَ ٱلۡغَٰبِرِينَ (33) إِنَّا مُنزِلُونَ عَلَىٰٓ أَهۡلِ هَٰذِهِ ٱلۡقَرۡيَةِ رِجۡزٗا مِّنَ ٱلسَّمَآءِ بِمَا كَانُواْ يَفۡسُقُونَ (34) وَلَقَد تَّرَكۡنَا مِنۡهَآ ءَايَةَۢ بَيِّنَةٗ لِّقَوۡمٖ يَعۡقِلُونَ (35) وَإِلَىٰ مَدۡيَنَ أَخَاهُمۡ شُعَيۡبٗا فَقَالَ يَٰقَوۡمِ ٱعۡبُدُواْ ٱللَّهَ وَٱرۡجُواْ ٱلۡيَوۡمَ ٱلۡأٓخِرَ وَلَا تَعۡثَوۡاْ فِي ٱلۡأَرۡضِ مُفۡسِدِينَ (36) فَكَذَّبُوهُ فَأَخَذَتۡهُمُ ٱلرَّجۡفَةُ فَأَصۡبَحُواْ فِي دَارِهِمۡ جَٰثِمِينَ (37) وَعَادٗا وَثَمُودَاْ وَقَد تَّبَيَّنَ لَكُم مِّن مَّسَٰكِنِهِمۡۖ وَزَيَّنَ لَهُمُ ٱلشَّيۡطَٰنُ أَعۡمَٰلَهُمۡ فَصَدَّهُمۡ عَنِ ٱلسَّبِيلِ وَكَانُواْ مُسۡتَبۡصِرِينَ (38) وَقَٰرُونَ وَفِرۡعَوۡنَ وَهَٰمَٰنَۖ وَلَقَدۡ جَآءَهُم مُّوسَىٰ بِٱلۡبَيِّنَٰتِ فَٱسۡتَكۡبَرُواْ فِي ٱلۡأَرۡضِ وَمَا كَانُواْ سَٰبِقِينَ (39) فَكُلًّا أَخَذۡنَا بِذَنۢبِهِۦۖ فَمِنۡهُم مَّنۡ أَرۡسَلۡنَا عَلَيۡهِ حَاصِبٗا وَمِنۡهُم مَّنۡ أَخَذَتۡهُ ٱلصَّيۡحَةُ وَمِنۡهُم مَّنۡ خَسَفۡنَا بِهِ ٱلۡأَرۡضَ وَمِنۡهُم مَّنۡ أَغۡرَقۡنَاۚ وَمَا كَانَ ٱللَّهُ لِيَظۡلِمَهُمۡ وَلَٰكِن كَانُوٓاْ أَنفُسَهُمۡ يَظۡلِمُونَ (40) مَثَلُ ٱلَّذِينَ ٱتَّخَذُواْ مِن دُونِ ٱللَّهِ أَوۡلِيَآءَ كَمَثَلِ ٱلۡعَنكَبُوتِ ٱتَّخَذَتۡ بَيۡتٗاۖ وَإِنَّ أَوۡهَنَ ٱلۡبُيُوتِ لَبَيۡتُ ٱلۡعَنكَبُوتِۚ لَوۡ كَانُواْ يَعۡلَمُونَ (41) إِنَّ ٱللَّهَ يَعۡلَمُ مَا يَدۡعُونَ مِن دُونِهِۦ مِن شَيۡءٖۚ وَهُوَ ٱلۡعَزِيزُ ٱلۡحَكِيمُ (42) وَتِلۡكَ ٱلۡأَمۡثَٰلُ نَضۡرِبُهَا لِلنَّاسِۖ وَمَا يَعۡقِلُهَآ إِلَّا ٱلۡعَٰلِمُونَ (43) خَلَقَ ٱللَّهُ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضَ بِٱلۡحَقِّۚ إِنَّ فِي ذَٰلِكَ لَأٓيَةٗ لِّلۡمُؤۡمِنِينَ (44) ٱتۡلُ مَآ أُوحِيَ إِلَيۡكَ مِنَ ٱلۡكِتَٰبِ وَأَقِمِ ٱلصَّلَوٰةَۖ إِنَّ ٱلصَّلَوٰةَ تَنۡهَىٰ عَنِ ٱلۡفَحۡشَآءِ وَٱلۡمُنكَرِۗ وَلَذِكۡرُ ٱللَّهِ أَكۡبَرُۗ وَٱللَّهُ يَعۡلَمُ مَا تَصۡنَعُونَ (45) ۞وَلَا تُجَٰدِلُوٓاْ أَهۡلَ ٱلۡكِتَٰبِ إِلَّا بِٱلَّتِي هِيَ أَحۡسَنُ إِلَّا ٱلَّذِينَ ظَلَمُواْ مِنۡهُمۡۖ وَقُولُوٓاْ ءَامَنَّا بِٱلَّذِيٓ أُنزِلَ إِلَيۡنَا وَأُنزِلَ إِلَيۡكُمۡ وَإِلَٰهُنَا وَإِلَٰهُكُمۡ وَٰحِدٞ وَنَحۡنُ لَهُۥ مُسۡلِمُونَ (46) وَكَذَٰلِكَ أَنزَلۡنَآ إِلَيۡكَ ٱلۡكِتَٰبَۚ فَٱلَّذِينَ ءَاتَيۡنَٰهُمُ ٱلۡكِتَٰبَ يُؤۡمِنُونَ بِهِۦۖ وَمِنۡ هَٰٓؤُلَآءِ مَن يُؤۡمِنُ بِهِۦۚ وَمَا يَجۡحَدُ بِـَٔايَٰتِنَآ إِلَّا ٱلۡكَٰفِرُونَ (47) وَمَا كُنتَ تَتۡلُواْ مِن قَبۡلِهِۦ مِن كِتَٰبٖ وَلَا تَخُطُّهُۥ بِيَمِينِكَۖ إِذٗا لَّٱرۡتَابَ ٱلۡمُبۡطِلُونَ (48) بَلۡ هُوَ ءَايَٰتُۢ بَيِّنَٰتٞ فِي صُدُورِ ٱلَّذِينَ أُوتُواْ ٱلۡعِلۡمَۚ وَمَا يَجۡحَدُ بِـَٔايَٰتِنَآ إِلَّا ٱلظَّٰلِمُونَ (49) وَقَالُواْ لَوۡلَآ أُنزِلَ عَلَيۡهِ ءَايَٰتٞ مِّن رَّبِّهِۦۚ قُلۡ إِنَّمَا ٱلۡأٓيَٰتُ عِندَ ٱللَّهِ وَإِنَّمَآ أَنَا۠ نَذِيرٞ مُّبِينٌ (50) أَوَلَمۡ يَكۡفِهِمۡ أَنَّآ أَنزَلۡنَا عَلَيۡكَ ٱلۡكِتَٰبَ يُتۡلَىٰ عَلَيۡهِمۡۚ إِنَّ فِي ذَٰلِكَ لَرَحۡمَةٗ وَذِكۡرَىٰ لِقَوۡمٖ يُؤۡمِنُونَ (51) قُلۡ كَفَىٰ بِٱللَّهِ بَيۡنِي وَبَيۡنَكُمۡ شَهِيدٗاۖ يَعۡلَمُ مَا فِي ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضِۗ وَٱلَّذِينَ ءَامَنُواْ بِٱلۡبَٰطِلِ وَكَفَرُواْ بِٱللَّهِ أُوْلَٰٓئِكَ هُمُ ٱلۡخَٰسِرُونَ (52) وَيَسۡتَعۡجِلُونَكَ بِٱلۡعَذَابِ وَلَوۡلَآ أَجَلٞ مُّسَمّٗى لَّجَآءَهُمُ ٱلۡعَذَابُۚ وَلَيَأۡتِيَنَّهُم بَغۡتَةٗ وَهُمۡ لَا يَشۡعُرُونَ (53) يَسۡتَعۡجِلُونَكَ بِٱلۡعَذَابِ وَإِنَّ جَهَنَّمَ لَمُحِيطَةُۢ بِٱلۡكَٰفِرِينَ (54) يَوۡمَ يَغۡشَىٰهُمُ ٱلۡعَذَابُ مِن فَوۡقِهِمۡ وَمِن تَحۡتِ أَرۡجُلِهِمۡ وَيَقُولُ ذُوقُواْ مَا كُنتُمۡ تَعۡمَلُونَ (55) يَٰعِبَادِيَ ٱلَّذِينَ ءَامَنُوٓاْ إِنَّ أَرۡضِي وَٰسِعَةٞ فَإِيَّٰيَ فَٱعۡبُدُونِ (56) كُلُّ نَفۡسٖ ذَآئِقَةُ ٱلۡمَوۡتِۖ ثُمَّ إِلَيۡنَا تُرۡجَعُونَ (57) وَٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّٰلِحَٰتِ لَنُبَوِّئَنَّهُم مِّنَ ٱلۡجَنَّةِ غُرَفٗا تَجۡرِي مِن تَحۡتِهَا ٱلۡأَنۡهَٰرُ خَٰلِدِينَ فِيهَاۚ نِعۡمَ أَجۡرُ ٱلۡعَٰمِلِينَ (58) ٱلَّذِينَ صَبَرُواْ وَعَلَىٰ رَبِّهِمۡ يَتَوَكَّلُونَ (59) وَكَأَيِّن مِّن دَآبَّةٖ لَّا تَحۡمِلُ رِزۡقَهَا ٱللَّهُ يَرۡزُقُهَا وَإِيَّاكُمۡۚ وَهُوَ ٱلسَّمِيعُ ٱلۡعَلِيمُ (60) وَلَئِن سَأَلۡتَهُم مَّنۡ خَلَقَ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضَ وَسَخَّرَ ٱلشَّمۡسَ وَٱلۡقَمَرَ لَيَقُولُنَّ ٱللَّهُۖ فَأَنَّىٰ يُؤۡفَكُونَ (61) ٱللَّهُ يَبۡسُطُ ٱلرِّزۡقَ لِمَن يَشَآءُ مِنۡ عِبَادِهِۦ وَيَقۡدِرُ لَهُۥٓۚ إِنَّ ٱللَّهَ بِكُلِّ شَيۡءٍ عَلِيمٞ (62) وَلَئِن سَأَلۡتَهُم مَّن نَّزَّلَ مِنَ ٱلسَّمَآءِ مَآءٗ فَأَحۡيَا بِهِ ٱلۡأَرۡضَ مِنۢ بَعۡدِ مَوۡتِهَا لَيَقُولُنَّ ٱللَّهُۚ قُلِ ٱلۡحَمۡدُ لِلَّهِۚ بَلۡ أَكۡثَرُهُمۡ لَا يَعۡقِلُونَ (63) وَمَا هَٰذِهِ ٱلۡحَيَوٰةُ ٱلدُّنۡيَآ إِلَّا لَهۡوٞ وَلَعِبٞۚ وَإِنَّ ٱلدَّارَ ٱلۡأٓخِرَةَ لَهِيَ ٱلۡحَيَوَانُۚ لَوۡ كَانُواْ يَعۡلَمُونَ (64) فَإِذَا رَكِبُواْ فِي ٱلۡفُلۡكِ دَعَوُاْ ٱللَّهَ مُخۡلِصِينَ لَهُ ٱلدِّينَ فَلَمَّا نَجَّىٰهُمۡ إِلَى ٱلۡبَرِّ إِذَا هُمۡ يُشۡرِكُونَ (65) لِيَكۡفُرُواْ بِمَآ ءَاتَيۡنَٰهُمۡ وَلِيَتَمَتَّعُواْۚ فَسَوْفَ يَعۡلَمُونَ (66) أَوَلَمۡ يَرَوۡاْ أَنَّا جَعَلۡنَا حَرَمًا ءَامِنٗا وَيُتَخَطَّفُ ٱلنَّاسُ مِنۡ حَوۡلِهِمۡۚ أَفَبِٱلۡبَٰطِلِ يُؤۡمِنُونَ وَبِنِعۡمَةِ ٱللَّهِ يَكۡفُرُونَ (67) وَمَنۡ أَظۡلَمُ مِمَّنِ ٱفۡتَرَىٰ عَلَى ٱللَّهِ كَذِبًا أَوۡ كَذَّبَ بِٱلۡحَقِّ لَمَّا جَآءَهُۥٓۚ أَلَيۡسَ فِي جَهَنَّمَ مَثۡوٗى لِّلۡكَٰفِرِينَ (68) وَٱلَّذِينَ جَٰهَدُواْ فِينَا لَنَهۡدِيَنَّهُمۡ سُبُلَنَاۚ وَإِنَّ ٱللَّهَ لَمَعَ ٱلۡمُحۡسِنِينَ (69)`;

  // Fetch Surah when activeSurah changes
  useEffect(() => {
    if (!activeSurah) {
      setText('');
      setErrorMsg('');
      return;
    }

    if (activeSurah.id === 0) {
      // 29 Noorani Surahs batch handled directly via onAnalyze29
      return;
    }

    if (activeSurah.id === 29) {
      setText(ankabutOfflineText);
      setErrorMsg('');
      onAnalyze(ankabutOfflineText, separator, excludeBismillah);
      return;
    }

    const loadSurahText = async () => {
      setLoadingText(true);
      setErrorMsg('');
      try {
        const surahVerses = (quranData as any[]).filter((v: any) => v.surahId === activeSurah.id);
        if (surahVerses && surahVerses.length > 0) {
          const surahFormatted = surahVerses
            .map((a: any, idx: number) => {
              let ayahText = a.text;
              if (idx === 0) {
                ayahText = stripBismillah(ayahText);
              }
              return `${ayahText} (${a.verseNumber})`;
            })
            .join(' ');
          setText(surahFormatted);
          onAnalyze(surahFormatted, separator, excludeBismillah);
        } else {
          throw new Error('Local Surah data not found');
        }
      } catch (err) {
        console.error('Failed to load Surah from local data:', err);
        setErrorMsg('فشل تحميل السورة من قاعدة البيانات المحلية.');
        setText('');
      } finally {
        setLoadingText(false);
      }
    };

    loadSurahText();
  }, [activeSurah]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      setSelectedSurahId('');
    } else {
      setSelectedSurahId(parseInt(value, 10));
    }
  };

  const triggerProcess = () => {
    if (selectedSurahId === '') return;
    
    const matchedNoorani = NOORANI_SURAHS.find(s => s.id === selectedSurahId);
    if (matchedNoorani) {
      setActiveSurah(matchedNoorani);
    } else {
      const matchedGeneral = ALL_SURAHS.find(s => s.id === selectedSurahId);
      if (matchedGeneral) {
        setActiveSurah({
          id: matchedGeneral.id,
          name: matchedGeneral.name,
          letters: '',
          keyValue: 0,
          digitalRoot: reduceDigitalRoot(matchedGeneral.id)
        });
      }
    }
  };

  const selectedSurahName = selectedSurahId !== '' 
    ? (NOORANI_SURAHS.find(s => s.id === selectedSurahId)?.name || ALL_SURAHS.find(s => s.id === selectedSurahId)?.name || '')
    : '';

  return (
    <div className="bg-white border-2 border-slate-200 rounded-none p-6 md:p-8 text-right space-y-8 relative" dir="rtl">
      <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />

      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-slate-100 rounded-xl text-slate-900 border border-slate-200 shadow-sm">
            <FileText className="w-6 h-6" />
          </span>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">بوابـة المدخـلات وتحليـل السـور</h3>
            <p className="text-sm text-slate-600 font-semibold mt-0.5">نظام الاختزال الرقمي المزدوج والموازين الإحصائية لمنظومة البنيان</p>
          </div>
        </div>

        {/* Quick Scope Indicator */}
        <span className="text-sm font-black text-slate-800 bg-slate-100 px-3.5 py-1.5 border border-slate-300">
          {inputScope === 'noorani' ? '✨ السور النورانية (29)' : '📖 كامل المصحف (114)'}
        </span>
      </div>

      {/* 1. Dedicated Action Card: 29 Noorani Surahs Batch Search */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-2 border-amber-400 p-6 md:p-7 relative overflow-hidden transition-all shadow-sm hover:shadow-md">
        <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0 border border-amber-300">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg md:text-xl font-black text-slate-950">
                  مجموعة السور النورانية (29 سورة) — التنقيب والبحث الشامل
                </h4>
                <span className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-sm tracking-wide">
                  2,743 آية
                </span>
              </div>
              <p className="text-sm md:text-base text-slate-700 max-w-2xl leading-relaxed font-semibold">
                البحث والتنقيب التلقائي الفوري داخل جميع السور النورانية الـ 29 دفعة واحدة، مع استخراج التوافقات التامة (5/6 إلى 6/6)، البصمة الأحادية، والتوافقات المدمجة المنظمة في شاشات وتقارير مستقلة.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0">
            <button
              id="btn-batch-29-analyze"
              type="button"
              onClick={() => {
                if (onAnalyze29) {
                  onAnalyze29();
                } else {
                  setActiveSurah(ALL_29_NOORANI_SURAH);
                }
              }}
              disabled={isLoading}
              className="w-full md:w-auto px-7 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-sm md:text-base rounded-none border border-amber-300 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>تنشيط البحث الشامل لـ 29 سورة نورانية دفعة واحدة 🚀</span>
            </button>
          </div>

        </div>
      </div>

      {/* Visual Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-sm font-black text-slate-500 bg-white px-4 uppercase tracking-wider">
          أو اختر سورة محددة للدراسة والتحليل المستقل
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* 2. Surah Selector Box */}
      <div className="bg-slate-50 p-6 md:p-7 border-2 border-slate-200 rounded-none space-y-5">
        
        {/* Scope Switcher tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200">
          <label htmlFor="surah-select-dropdown" className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-700" />
            <span>قائمة اختيار السور الكريمة:</span>
          </label>

          <div className="flex items-center gap-1.5 bg-white p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setInputScope('noorani');
                setSelectedSurahId('');
              }}
              className={`px-4 py-2 text-sm font-black transition-all cursor-pointer ${
                inputScope === 'noorani'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              السور النورانية (29 سورة)
            </button>
            <button
              type="button"
              onClick={() => {
                setInputScope('all114');
                setSelectedSurahId('');
              }}
              className={`px-4 py-2 text-sm font-black transition-all cursor-pointer ${
                inputScope === 'all114'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              كامل المصحف (114 سورة)
            </button>
          </div>
        </div>

        {/* The Dropdown: starts strictly empty without preselecting Al-Baqarah */}
        <div className="relative">
          <select
            id="surah-select-dropdown"
            value={selectedSurahId}
            onChange={handleDropdownChange}
            className="w-full bg-white border-2 border-slate-300 hover:border-slate-500 focus:border-slate-900 focus:ring-0 rounded-none p-4 text-base md:text-lg font-black text-slate-900 leading-normal transition-all cursor-pointer outline-none appearance-none text-right"
          >
            {/* General Empty Default Placeholder - no auto-selection, no auto-filter */}
            <option value="">
              {inputScope === 'noorani' 
                ? 'اختر سورة قرانية نورانية ..' 
                : 'اختر سورة من الـ 114 سورة ..'}
            </option>

            {inputScope === 'noorani'
              ? NOORANI_SURAHS.map((surah, idx) => (
                  <option key={surah.id} value={surah.id}>
                    {idx + 1}. سورة {surah.name} (رقم {surah.id}) [مفتتحة بـ: {surah.letters}]
                  </option>
                ))
              : ALL_SURAHS.map((surah) => {
                  const isNoorani = NOORANI_SURAHS.some(s => s.id === surah.id);
                  return (
                    <option key={surah.id} value={surah.id}>
                      {surah.id}. سورة {surah.name} {isNoorani ? '✨ [نورانية]' : ''}
                    </option>
                  );
                })}
          </select>
        </div>

        {/* Action button appears only after deliberate user selection */}
        {selectedSurahId !== '' && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-50/70 p-4 border border-amber-300">
            <div className="text-sm md:text-base font-bold text-slate-800">
              السورة المحددة: <span className="font-black text-amber-950 text-base md:text-lg">سورة {selectedSurahName}</span>
            </div>
            <button
              id="btn-trigger-single-analyze"
              type="button"
              onClick={triggerProcess}
              disabled={isLoading}
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm md:text-base rounded-none shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>بدء استقصاء وتحليل سورة {selectedSurahName} ➡️</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading state rendering */}
      {loadingText && (
        <div className="min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 space-y-3 bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
          <span className="text-sm font-bold text-slate-700">جارٍ جلب وتحميل آيات السورة من قاعدة البيانات المحلية...</span>
        </div>
      )}

      {/* Main layout container with read-only view (Shown when single activeSurah is confirmed) */}
      {activeSurah && activeSurah.id !== 0 && !loadingText && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 border border-slate-200 rounded-none">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm md:text-base font-black text-slate-950">
                ﴿ سورة {activeSurah.name} ﴾
              </span>
              {activeSurah.letters && (
                <span className="text-xs md:text-sm font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-none">
                  مفتتح: {activeSurah.letters} (الجُمّل: {activeSurah.keyValue} | المعامل: {activeSurah.digitalRoot})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <QuranFontSizeControl compact={true} />
              <button
                type="button"
                onClick={() => {
                  setActiveSurah(null);
                  setSelectedSurahId('');
                }}
                className="px-4 py-2 border border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-none cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>🔄 تغيير السورة</span>
              </button>
            </div>
          </div>

          {/* Reading Mode Display - Always Rendered */}
          <div className="border-2 border-amber-300 p-6 md:p-10 bg-amber-50/70 text-slate-950 leading-loose rounded-none quran-font text-2xl md:text-3xl text-center max-h-[500px] overflow-y-auto font-medium select-text shadow-inner">
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="text-center pb-3 border-b border-amber-300/40">
                <span className="text-lg md:text-xl font-bold text-amber-950 block">
                  ﴿ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴾
                </span>
              </div>
              <p className="leading-[2.6] tracking-wide text-justify text-slate-950 font-normal">
                {text.split(' ').map((word, wIdx) => {
                  const isVerseNumber = word.match(/^\((\d+)\)$/);
                  if (isVerseNumber) {
                    return (
                      <span key={wIdx} className="inline-flex items-center justify-center font-sans font-black text-amber-950 text-sm bg-amber-200/90 border border-amber-400/80 rounded-full w-7 h-7 mx-1.5 shadow-sm">
                        {isVerseNumber[1]}
                      </span>
                    );
                  }
                  return <span key={wIdx} className="mx-0.5 inline-block hover:text-emerald-900 transition-colors">{word}</span>;
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
