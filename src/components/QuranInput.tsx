import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Settings, Loader2, AlertCircle, BookOpen, ChevronLeft, LayoutGrid, Compass } from 'lucide-react';
import { NOORANI_SURAHS, ALL_SURAHS, NooraniSurah, stripBismillah, reduceDigitalRoot } from '../utils/jummal';
import quranData from '../utils/quranData';
import QuranFontSizeControl from './QuranFontSizeControl';


interface QuranInputProps {
  onAnalyze: (text: string, separator: 'parentheses' | 'curly' | 'auto', excludeBismillah: boolean) => void;
  isLoading: boolean;
  activeSurah: NooraniSurah | null;
  setActiveSurah: (surah: NooraniSurah | null) => void;
}

export default function QuranInput({ onAnalyze, isLoading, activeSurah, setActiveSurah }: QuranInputProps) {
  const [inputScope, setInputScope] = useState<'choose' | 'noorani' | 'all114'>('choose');
  const [selectedSurahId, setSelectedSurahId] = useState<number | ''>('');
  const [excludeBismillah, setExcludeBismillah] = useState(true);
  const [separator, setSeparator] = useState<'parentheses' | 'curly' | 'auto'>('auto');
  const [text, setText] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback preset text for Surah Al-Ankabut in case of offline usage
  const ankabutOfflineText = `الٓمٓ (1) أَحَسِبَ ٱلنَّاسُ أَن يُتۡرَكُوٓاْ أَن يَقُولُوٓاْ ءَامَنَّا وَهُمۡ لَا يُفۡتَنُونَ (2) وَلَقَدۡ فَتَنَّا ٱلَّذِينَ مِن قَبۡلِهِمۡۖ فَلَيَعۡلَمَنَّ ٱللَّهُ ٱلَّذِينَ صَدَقُواْ وَلَيَعۡلَمَنَّ ٱلۡكَٰذِبِينَ (3) أَمۡ حَسِبَ ٱلَّذِينَ يَعۡمَلُونَ ٱلسَّيِّـَٔاتِ أَن يَسۡبِقُونَاۚ سَآءَ مَا يَحۡكُمُونَ (4) مَن كَانَ يَرۡجُواْ لِقَآءَ ٱللَّهِ فَإِنَّ أَجَلَ ٱللَّهِ لَأٓتٖۚ وَهُوَ ٱلسَّمِيعُ ٱلۡعَلِيمُ (5) وَمَن جَٰهَدَ فَإِنَّمَا يُجَٰهِدُ لِنَفۡسِهِۦٓۚ إِنَّ ٱللَّهَ لَغَنِيٌّ عَنِ ٱلۡعَٰلَمِينَ (6) وَٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّٰلِحَٰتِ لَنُكَفِّرَنَّ عَنۡهُمۡ سَيِّـَٔاتِهِمۡ وَلَنَجۡزِيَنَّهُمۡ أَحۡسَنَ ٱلَّذِي كَانُواْ يَعۡمَلُونَ (7) وَوَصَّيۡنَا ٱلۡإِنسَٰنَ بِوَٰلِدَيۡهِ حُسۡنٗاۖ وَإِن جَٰهَدَاكَ لِتُشۡرِكَ بِي مَا لَيۡسَ لَكَ بِهِۦ عِلۡمٞ فَلَا تُطِعۡهُمَآۚ إِلَيَّ مَرۡجِعُكُمۡ فَأُنَبِّئُكُم بِمَا كُنتُمۡ تَعۡمَلُونَ (8) وَٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّٰلِحَٰتِ لَنُدۡخِلَنَّهُمۡ فِي ٱلصَّٰلِحِينَ (9) وَمِنَ ٱلنَّاسِ مَن يَقُولُ ءَامَنَّا بِٱللَّهِ فَإِذَآ أُوذِيَ فِي ٱللَّهِ جَعَلَ فِتۡنَةَ ٱلنَّاسِ كَعَذَابِ ٱللَّهِۖ وَلَئِن جَآءَ نَصۡرٞ مِّن رَّبِّكَ لَيَقُولُنَّ إِنَّا كُنَّا مَعَكُمۡۚ أَوَلَيۡسَ ٱللَّهُ بِأَعۡلَمَ بِمَا فِي صُدُورِ ٱلۡعَٰلَمِينَ (10) وَلَيَعۡلَمَنَّ ٱللَّهُ ٱلَّذِينَ ءَامَنُواْ وَلَيَعۡلَمَنَّ ٱلۡمُنَٰفِقِينَ (11) وَقَالَ ٱلَّذِينَ كَفَرُواْ لِلَّذِينَ ءَامَنُواْ ٱتَّبِعُواْ سَبِيلَنَا وَلۡنَحۡمِلۡ خَطَٰيَٰكُمۡ وَمَا هُم بِحَٰمِلِينَ مِنۡ خَطَٰيَٰهُم مِّن شَيۡءٍۖ إِنَّهُمۡ لَكَٰذِبُونَ (12) وَلَيَحۡمِلُنَّ أَثۡقَالَهُمۡ وَأَثۡقَالٗا مَّعَ أَثۡقَالِهِمۡۖ وَلَيُسۡـَٔلُنَّ يَوۡمَ ٱلۡقِيَٰمَةِ عَمَّا كَانُواْ يَفۡتَرُونَ (13) وَلَقَدۡ أَرۡسَلۡنَا نُوحًا إِلَىٰ قَوۡمِهِۦ فَلَبِثَ فِيهِمۡ أَلۡفَ سَنَةٍ إِلَّا خَمۡسِينَ عَامٗا فَأَخَذَهُمُ ٱلطُّوفَانُ وَهُمۡ ظَٰلِمُونَ (14) فَأَنجَيۡنَٰهُ وَأَصۡحَٰبَ ٱلسَّفِينَةِ وَجَعَلۡنَٰهَآ ءَايَةٗ لِّلۡعَٰلَمِينَ (15) وَإِبۡرَٰهِيمَ إِذۡ قَالَ لِقَوۡمِهِ ٱعۡبُدُواْ ٱللَّهَ وَٱتَّقوهُۖ ذَٰلِكُمۡ خَيۡرٞ لَّكُمۡ إِن كُنتُمۡ تَعۡلَمُونَ (16) إِنَّمَا تَعۡبُدُونَ مِن دُونِ ٱللَّهِ أَوۡثَٰنٗا وَتَخۡلُقُونَ إِفۡكًاۚ إِنَّ ٱلَّذِينَ تَعۡبُدُونَ مِن دُونِ ٱللَّهِ لَا يَمۡلِكُونَ لَكُمۡ رِزۡقٗا فَٱبۡتَغُواْ عِندَ ٱللَّهِ ٱلرِّزِّقَ وَٱعۡبُدُوهُ وَٱشۡكُرُواْ لَهُۥٓۖ إِلَيۡهِ تُرۡجَعُونَ (17) وَإِن تُكَذِّبُواْ فَقَدۡ كَذَّبَ أُمَمٞ مِّن قَبۡلِكُمۡۖ وَمَا عَلَى ٱلرَّسُولِ إِلَّا ٱلۡبَلَٰغُ ٱلۡمُبِينُ (18) أَوَلَمۡ يَرَوۡاْ كَيۡفَ يُبۡدِئُ ٱللَّهَ ٱلۡخَلۡقَ ثُمَّ يُعِيدُهُۥٓۚ إِنَّ ذَٰلِكَ عَلَى ٱللَّهِ يَسيرٞ (19) قُلۡ سِيرُواْ فِي ٱلۡأَرۡضِ فَٱنظُرُواْ كَيۡفَ بَدَأَ ٱلۡخَلۡقَۚ ثُمَّ ٱللَّهُ يُنشِئُ ٱلنَّشۡأَةَ ٱلۡأٓخِرَةَۚ إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَيۡءٖ قَدِيرٞ (20) يُعَذِّبُ مَن يَشَآءُ وَيَرۡحَمُ مَن يَشَآءُۖ وَإِلَيۡهِ تُقۡلَبُونَ (21) وَمَآ أَنتُم بِمُعۡجِزِينَ فِي ٱلۡأَرۡضِ وَلَا فِي ٱالسَّمَآءِۖ وَمَا لَكُم مِّن دُونِ ٱللَّهِ مِن وَلِيّٖ وَلَا نَصِيرٖ (22) وَٱلَّذِينَ كَفَرُواْ بِـَٔايَٰتِ ٱللَّهِ وَلِقَآئِهِۦٓ أُوْلَٰٓئِكَ يَئِسُواْ مِن رَّحۡمَتِي وَأُوْلَٰٓئِكَ لَهُمۡ عَذَابٌ أَلِيمٞ (23) فَمَا كَانَ جَوَابَ قَوۡمِهِۦٓ إِلَّآ أَن قَالُواْ ٱقۡتُلُوهُ أَوۡ حَرِّقُوهُ فَأَنجَىٰهُ ٱللَّهُ مِنَ ٱلنَّارِۚ إِنَّ فِي ذَٰلِكَ لَأٓيَٰتٖ لِّقَوۡمٖ يُؤۡمِنُونَ (24) وَقَالَ إِنَّمَا ٱتَّخَذۡتُم مِّن دُونِ ٱللَّهِ أَوۡثَٰنٗا مَّوَدَّةَ بَيۡنِكُمۡ فِي ٱلۡحَيَوٰةِ ٱلدُّنۡيَاۖ ثُمَّ يَوۡمَ ٱلۡقِيَٰمَةِ يَكۡفُرُ بَعۡضُكُم بِبَعۡضٖ وَيَلۡعَنُ بَعۡضُكُم بَعۡضٗا وَمَأۡوَىٰكُمُ ٱلنَّارُ وَمَا لَكُم مِّن نَّٰصِرِينَ (25) ۞فَـَٔامَنَ لَهُۥ لُوطٞۘ وَقَالَ إِنِّي مُهَاجِرٌ إِلَىٰ رَبِّيٓۖ إِنَّهُۥ هُوَ ٱلۡعَزِيزُ ٱلۡحَكِيمُ (26) وَوَهَبۡنَا لَهُۥٓ إِسۡحَٰقَ وَيَعۡقُوبَ وَجَعَلۡنَا فِي ذُرِّيَّتِهِ ٱلنُّبُوَّةَ وَٱلۡكِتَٰبَ وَءَاتَيۡنَٰهُ أَجۡرَهُۥ فِي ٱلدُّنۡيَاۖ وَإِنَّهُۥ فِي ٱلۡأٓخِرَةِ لَمِنَ ٱلصَّٰلِحِينَ (27) وَلُوطًا إِذۡ قَالَ لِقَوۡمِهِۦٓ إِنَّكُمۡ لَتَأۡتُونَ ٱلۡفَٰحِشَةَ مَا سَبَقَكُم بِهَا مِنۡ أَحَدٖ مِّنَ ٱلۡعَٰلَمِينَ (28) أَئِنَّكُمۡ لَتَأۡتُونَ ٱلرِّجَالَ وَتَقۡطَعُونَ ٱلسَّبِيلَ وَتَأۡتُونَ فِي نَادِيكُمُ ٱلۡمُنكَرَۖ فَمَا كَانَ جَوَابَ قَوۡمِهِۦٓ إِلَّآ أَن قَالُواْ ٱئۡتِنَا بِعَذَابِ ٱللَّهِ إِن كُنتَ مِنَ ٱلصَّٰدِقِينَ (29) قَالَ رَبِّ ٱنصُرۡنِي عَلَى ٱلۡقَوۡمِ ٱلۡمُفۡسِدِينَ (30) وَلَمَّا جَآءَتۡ رُسُلُنَآ إِبۡرَٰهِيمَ بِٱلۡبُشۡرَىٰ قَالُوٓاْ إِنَّا مُهۡلِكُوٓاْ أَهۡلِ هَٰذِهِ ٱلۡقَرۡيَةِۖ إِنَّ أَهۡلَهَا كَانُواْ ظَٰلِمِينَ (31) قَالَ إِنَّ فِيهَا لُوطٗاۚ قَالُواْ نَحۡنُ أَعۡلَمُ بِمَن فِيهَاۖ لَنُنَجِّيَنَّهُۥ وَأَهۡلَهُۥٓ إِلَّا ٱمۡرَأَتَهُۥ كَانَتۡ مِنَ ٱلۡغَٰبِرِينَ (32) وَلَمَّآ أَن جَآءَتۡ رُسُلُنَا لُوطٗا سِيٓءَ بِهِمۡ وَضَاقَ بِهِمۡ ذَرۡعٗاۖ وَقَالُواْ لَا تَخَفۡ وَلَا تَحۡزَنۡ إِنَّا مُنَجُّوكَ وَأَهۡلَكَ إِلَّا ٱمۡرَأَتَكَ كَانَتۡ مِنَ ٱلۡغَٰبِرِينَ (33) إِنَّا مُنزِلُونَ عَلَىٰٓ أَهۡلِ هَٰذِهِ ٱلۡقَرۡيَةِ رِجۡزٗا مِّنَ ٱلسَّمَآءِ بِمَا كَانُواْ يَفۡسُقُونَ (34) وَلَقَد تَّرَكۡنَا مِنۡهَآ ءَايَةَۢ بَيِّنَةٗ لِّقَوۡمٖ يَعۡقِلُونَ (35) وَإِلَىٰ مَدۡيَنَ أَخَاهُمۡ شُعَيۡبٗا فَقَالَ يَٰقَوۡمِ ٱعۡبُدُواْ ٱللَّهَ وَٱرۡجُواْ ٱلۡيَوۡمَ ٱلۡأٓخِرَ وَلَا تَعۡثَوۡاْ فِي ٱلۡأَرۡضِ مُفۡسِدِينَ (36) فَكَذَّبُوهُ فَأَخَذَتۡهُمُ ٱلرَّجۡفَةُ فَأَصۡبَحُواْ فِي دَارِهِمۡ جَٰثِمِينَ (37) وَعَادٗا وَثَمُودَاْ وَقَد تَّبَيَّنَ لَكُم مِّن مَّسَٰكِنِهِمۡۖ وَزَيَّنَ لَهُمُ ٱلشَّيۡطَٰنُ أَعۡمَٰلَهُمۡ فَصَدَّهُمۡ عَنِ ٱلسَّبِيلِ وَكانُواْ مُسۡتَبۡصِرِينَ (38) وَقَٰرُونَ وَفِرۡعَوۡنَ وَهَٰمَٰنَۖ وَلَقَدۡ جَآءَهُم مُّوسَىٰ بِٱلۡبَيِّنَٰتِ فَٱسۡتَكۡبَرُواْ فِي ٱلۡأَرۡضِ وَمَا كَانُواْ سَٰبِقِينَ (39) فَكُلًّا أَخَذۡنَا بِذَنۢبِهِۦۖ فَمِنۡهُم مَّنۡ أَرۡسَلۡنَا عَلَيۡهِ حَاصِبٗا وَمِنۡهُم مَّنۡ أَخَذَتۡهُ ٱلصَّيۡحَةُ وَمِنۡهُم مَّنۡ خسَفۡنَا بِهِ ٱلۡأَرۡضَ وَمِنۡهُم مَّنۡ أَغۡرَقۡنَاۚ وَمَا كَانَ ٱللَّهَ لِيَظۡلِمَهُمۡ وَلَٰكِن كَانُوٓاْ أَنفُسَهُمۡ يَظۡلِمُونَ (40) مَثَلُ ٱلَّذِينَ ٱتَّخَذُواْ مِن دُونِ ٱللَّهِ أَوۡلِيَآءَ كَمَثَلِ ٱلۡعَنكَبوتِ ٱتَّخَذَتۡ بَيۡتٗاۖ وَإِنَّ أَوۡهَنَ ٱلۡبُيُوتِ لَبَيۡتُ ٱلۡعَنكَبُوتِۚ لَوۡ كَانُواْ يَعۡلَمُونَ (41) إِنَّ ٱللَّهَ يَعۡلَمُ مَا يَدۡعُونَ مِن دُونِهِۦ مِن شَيۡءٖۚ وَهُوَ ٱلۡعَزِيزُ ٱلۡحَكِيمُ (42) وَتِلۡكَ ٱلۡأَمۡثَٰلُ نَضۡرِبُهَا لِلنَّاسِۖ وَمَا يَعۡقِلُهَآ إِلَّا ٱلۡعَٰلِمُونَ (43) خَلَقَ ٱللَّه ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضَ بِٱلۡحَقِّۚ إِنَّ فِي ذَٰلِكَ لَأٓيَةٗ لِّلۡمُؤۡمِنِينَ (44) ٱتۡلُ مَآ أُوحِيَ إِلَيۡكَ مِنَ ٱلۡكِتَٰبِ وَأَقِمِ ٱلصَّلَوٰةَۖ إِنَّ ٱلصَّلَوٰةَ تَنۡهَىٰ عَنِ ٱلۡفَحۡشَآءِ وَٱلۡمُنكَرِۗ وَلَذِكۡرُ ٱللَّهِ أَكۡبَرُۗ وَٱللَّهُ يَعۡلَمُ مَا تَصۡنَعُونَ (45) ۞وَلَا تُجَٰدِلُوٓاْ أَهۡلَ ٱلۡكِتَٰبِ إِلَّا بِٱلَّتِي هِيَ أَحۡسَنُ إِلَّا ٱلَّذِينَ ظَلَمُواْ مِنۡهُمۡۖ وَقُولُوٓاْ ءَامَنَّا بِٱلَّذيٓ أُنزِلَ إِلَيۡنَا وَأُنزِلَ إِلَيۡكُمۡ وَإِلَٰهُنَا وَإِلَٰهُكُمۡ وَٰحِدٞ وَنَحۡنُ لَهُۥ مُسۡلِمُونَ (46) وَكَذَٰلِكَ أَنزَلۡنَآ إِلَيۡكَ ٱلۡكِتَٰبَۚ فَٱلَّذِينَ ءَاتَيۡنَٰهُمُ ٱلۡكِتَٰبَ يُؤۡمِنُونَ بِهِۦۖ وَمِنۡ هَٰٓؤُلَآءِ مَن يُؤۡمِنُ بِهِۦۚ وَمَا يَجۡحَدُ بِـَٔايَٰتِنَآ إِلَّا ٱلۡكَٰفِرُونَ (47) وَمَا كُنتَ تَتۡلُواْ مِن قَبۡلِهِۦ مِن كِتَٰبٖ وَلَا تَخُطُّهُۥ بِيَمِينِكَۖ إِذٗا لَّٱرۡتَابَ ٱلۡمُبۡطِلُونَ (48) بَلۡ هُوَ ءَايَٰتُۢ بَيِّنَٰتٞ فِي صُدُورِ ٱلَّذِينَ أُوتُواْ ٱلۡعِلۡمَۚ وَمَا يَجۡحَدُ بِـَٔايَٰتِنَآ إِلَّا ٱلظَّٰلِمُونَ (49) وَقَالُواْ لَوۡلَآ أُنزِلَ عَلَيۡهِ ءَايَٰتٞ مِّن رَّبِّهِۦۚ قُلۡ إِنَّمَا ٱلۡأٓيَٰتُ عِندَ ٱللَّهِ وَإِنَّمَآ أَنَا۠ نذِيرٞ مُّبِينٌ (50) أَوَلَمۡ يَكۡفِهِمۡ أَنَّآ أَنزَلَّنَا عَلَيۡكَ ٱلۡكِتَٰبَ يُتۡلَىٰ عَلَيۡهِمۡۚ إِنَّ فِي ذَٰلِكَ لَرَحۡمَةٗ وَذِكۡرَىٰ لِقَوۡمٖ يُؤۡمِنُونَ (51) قُلۡ كَفَىٰ بِٱللَّهِ بَيۡنِي وَبَيۡنَكُمۡ شَهِيدٗاۖ يَعۡلَمُ مَا فِي ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضِۗ وَٱلَّذِينَ ءَامَنُواْ بِٱلۡبَٰطِلِ وَكَفَرُواْ بِٱللَّهِ أُوْلَٰٓئِكَ هُمُ ٱلۡخَٰسِرُونَ (52) وَيَسۡتَعۡجِلُونَكَ بِٱلۡعَذَابِ وَلَوۡلَآ أَجَلٞ مُّسَمّٗى لَّجَآءَهُمُ ٱلۡعَذَابُۚ وَلَيَأۡتِيَنَّهُم بَغۡتَةٗ وَهُمۡ لَا يَشۡعُرُونَ (53) يَسۡتَعۡجِلُونَكَ بِٱلۡعَذَابِ وَإِنَّ جَهَنَّمَ لَمُحِيطَةُۢ بِٱلۡكَٰفِرِينَ (54) يَوۡمَ يَغۡشَىٰهُمُ ٱلۡعَذَابُ مِن فَوۡقِهِمۡ وَمِن تَحۡتِ أَرۡجُلِهِمۡ وَيَقُولُ ذُوقُواْ مَا كُنتُمۡ تَعۡمَلُونَ (55) يَٰعِبَادِيَ ٱلَّذِينَ ءَامَنُوٓاْ إِنَّ أَرۡضِي وَٰسِعَةٞ فَإِيَّٰيَ فَٱعۡبُدُونِ (56) كُلُّ نَفۡسٖ ذَآئِقَةُ ٱلۡمَوۡتِۖ ثُمَّ إِلَيْنَا تُرۡجَعُونَ (57) وَٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّٰلِحَٰتِ لَنُبَوِّئَنَّهُم مِّنَ ٱلۡجَنَّةِ غُرَفٗا تَجۡرِي مِن تَحۡتِهَا ٱلۡأَنۡهَٰرُ خَٰلِدِينَ فِيهَاۚ نِعۡمَ أَجۡرُ ٱلۡعَٰمِلِينَ (58) ٱلَّذِينَ صَبَرُواْ وَعَلَىٰ رَبِّهِمۡ يَتَوَكَّلُونَ (59) وَكَأَيِّن مِّن دَآبَّةٖ لَّا تَحۡمِلُ رِزۡقَهَا ٱللَّهُ يَرۡزُقُهَا وَإِيَّاكُمۡۚ وَهُوَ ٱلسَّمِيعُ ٱلۡعَلِيمُ (60) وَلَئِن سَأَلۡتَهُم مَّنۡ خَلَقَ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضَ وَسَخَّرَ ٱلشَّمۡسَ وَٱلۡقَمَرَ لَيَقُولُنَّ ٱللَّهُۖ فَأَنَّىٰ يُؤۡفَكُونَ (61) ٱللَّهُ يَبۡسُطُ ٱلرِّزۡقَ لِمَن يَشَآءُ مِنۡ عِبَادِهِۦ وَيَقۡدِرُ لَهُۥٓۚ إِنَّ ٱللَّهَ بِكُلِّ شَيۡءٍ عَلِيمٞ (62) وَلَئِن سَأَلۡتَهُم مَّن نَّزَّلَ مِنَ ٱالسَّمَآءِ مَآءٗ فَأَحۡيَا بِهِ ٱلۡأَرۡضَ مِنۢ بَعۡدِ مَوۡتِهَا لَيَقُولُنَّ ٱللَّهُۚ قُلِ ٱلۡحَمۡدُ لِلَّهِۚ بَلۡ أَكۡثَرُهُمۡ لَا يَعۡقِلُونَ (63) وَمَا هَٰذِهِ ٱلۡحَيَوٰةُ ٱلدُّنۡيَآ إِلَّا لَهۡوٞ وَلَعِبٞۚ وَإِنَّ ٱالدَّارَ ٱلۡأٓخِرَةَ لَهِيَ ٱلۡحَيَوَانُۚ لَوۡ كَانُواْ يَعۡلَمُونَ (64) فَإِذَا رَكِبُواْ فِي ٱلۡفُلۡكِ دَعَوُاْ ٱللَّهَ مُخۡلِصِينَ لَهُ ٱالدِّينَ فَلَمَّا نَجَّىٰهُمۡ إِلَى ٱلۡبَرِّ إِذَا هُمۡ يُشۡرِكُونَ (65) لِيَكۡفُرُواْ بِمَآ ءَاتَيۡنَٰهُمۡ وَلِيَتَمَتَّعُواْۚ فَسَوْفَ يَعۡلَمُونَ (66) أَوَلَمۡ يَرَوۡاْ أَنَّا جَعَلۡنَا حَرَمًا ءَامِنٗا وَيُتَخَطَّفُ ٱالنَّاسُ مِنۡ حَوۡلِهِمۡۚ أَفَبِٱلۡبَٰطِلِ يُؤۡمِنُونَ وَبِنِعۡمَةِ ٱللَّهِ يَكۡفُرُونَ (67) وَمَنۡ أَظۡلَمُ مِمَّنِ ٱفۡتَرَىٰ عَلَى ٱللَّهِ كَذِبًا أَوۡ كَذَّبَ بِٱلۡحَقِّ لَمَّا جَآءَهُۥٓۚ أَلَيۡسَ فِي جَنَّمَ مَثۡوٗى لِّلۡكَٰفِرِينَ (68) وَٱلَّذِينَ جَٰهَدُواْ فِينَا لَنَهۡدِيَنَّهُمۡ سُبُلَنَاۚ وَإِنَّ ٱللَّهَ لَمَعَ ٱلۡمُحۡسِنِينَ (69)`;

  // Fetch Surah when activeSurah matches
  useEffect(() => {
    if (!activeSurah) {
      setText('');
      setErrorMsg('');
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
    
    // Find if selected surah is in Noorani list or general list
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze(text, separator, excludeBismillah);
    }
  };

  const isFormValid = text.trim().length > 0 && !loadingText;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-none p-6 md:p-8 text-right space-y-8 relative" dir="rtl">
      <div className="absolute top-0 right-0 left-0 h-1 bg-slate-900" />

      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-slate-100 rounded-none text-slate-900 border border-slate-200">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">بوابـة المدخـلات وتحليـل السـور</h3>
            <p className="text-xs text-slate-400 font-medium">نظام الاختزال الرقمي المزدوج والموازين الإحصائية</p>
          </div>
        </div>
      </div>

      {/* 2-Option Selector Clean Gateway (If no surah has been activated or still in choosing mode) */}
      {!activeSurah && inputScope === 'choose' && (
        <div className="space-y-6">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">الرجاء تحديد نطاق الدراسة البحثية للبدء:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card A: Noorani 29 Surahs */}
            <button
              onClick={() => {
                setInputScope('noorani');
                setSelectedSurahId('');
              }}
              className="bg-white border-2 border-slate-200 hover:border-slate-900 p-8 text-center transition-all group hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center space-y-4 min-h-[180px]"
            >
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full group-hover:scale-110 transition-transform">
                <Compass className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-950">موازين الحروف النورانية (29 سورة)</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  السور الـ 29 المفتتحة بالحروف المقطعة (مثل ألم، الر، طسم) لتطبيق حساب الجمل وميزان الاختزال المتراكم 29/29.
                </p>
              </div>
            </button>

            {/* Card B: All 114 Surahs */}
            <button
              onClick={() => {
                setInputScope('all114');
                setSelectedSurahId('');
              }}
              className="bg-white border-2 border-slate-200 hover:border-slate-900 p-8 text-center transition-all group hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center space-y-4 min-h-[180px]"
            >
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-950">النطاق الإحصائي العام (114 سورة)</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  الدراسة الإحصائية الشاملة لكامل سور المصحف الشريف الـ 114، مع إخفاء موازين الحروف النورانية تلقائياً.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* If scope chosen but no active Surah confirmed yet */}
      {!activeSurah && inputScope !== 'choose' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setInputScope('choose');
                setSelectedSurahId('');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              تغيير نطاق الدراسة 🔄
            </button>
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 border">
              نطاق البحث النشط: {inputScope === 'noorani' ? '29 سورة نورانية' : 'المصحف كاملاً 114 سورة'}
            </span>
          </div>

          <div className="bg-slate-50 p-6 border border-slate-200 rounded-none space-y-4">
            <label htmlFor="surah-select-dropdown" className="block text-xs font-black text-slate-700 uppercase tracking-widest">
              {inputScope === 'noorani' ? 'اختر سورة من الـ 29 سورة النورانية:' : 'اختر السورة المطلوبة من الـ 114 سورة:'}
            </label>
            <div className="relative">
              <select
                id="surah-select-dropdown"
                value={selectedSurahId}
                onChange={handleDropdownChange}
                className="w-full bg-white border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 focus:ring-0 rounded-none p-4 text-sm font-black text-slate-800 leading-normal transition-all cursor-pointer outline-none appearance-none text-right"
              >
                <option value="">-- يرجى اختيار السورة الكريّمة --</option>
                {inputScope === 'noorani'
                  ? NOORANI_SURAHS.map((surah, idx) => (
                      <option key={surah.id} value={surah.id}>
                        {idx + 1}. سورة {surah.name} (رقم {surah.id}) [مفتتحة بـ {surah.letters}]
                      </option>
                    ))
                  : ALL_SURAHS.map((surah) => {
                      const isNoorani = NOORANI_SURAHS.some(s => s.id === surah.id);
                      return (
                        <option key={surah.id} value={surah.id}>
                          {surah.id}. سورة {surah.name} {isNoorani ? '✨ [سورة نورانية]' : ''}
                        </option>
                      );
                    })}
              </select>
            </div>

            {selectedSurahId !== '' && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={triggerProcess}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-none text-sm uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center gap-3 cursor-pointer animate-bounce-slow"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>توليد وعرض جداول السورة الشاملة ➡️</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading state rendering */}
      {loadingText && (
        <div className="min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 space-y-3 bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
          <span className="text-xs font-bold text-slate-600">جارٍ جلب وتحميل آيات السورة من خادم الـ API السحابي للقرآن الكريم...</span>
        </div>
      )}

      {/* Main layout container with read-only view or fallback text box (Shown when activeSurah is loaded) */}
      {activeSurah && !loadingText && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest block">
              ﴿ نص آيات سورة {activeSurah.name} : (شاشة عرض فقط 🔒) ﴾
            </span>
            <div className="flex items-center gap-2">
              <QuranFontSizeControl compact={true} />
              {activeSurah.letters && (
                <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1">
                  مفتتح فواتح: {activeSurah.letters} (جمل الفاتحة = {activeSurah.keyValue})
                </span>
              )}
            </div>
          </div>

          <div className="border-2 border-double border-slate-300 p-6 md:p-8 bg-amber-50 text-slate-950 leading-loose rounded-none quran-font text-lg text-center max-h-[300px] overflow-y-auto font-medium select-none shadow-inner shadow-slate-100/50">
            <div className="max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-bold text-amber-900/60 block border-b border-amber-900/20 pb-2 mb-4">
                ﴿ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴾
              </span>
              <p className="leading-widest tracking-wide text-justify text-slate-900">
                {text.split(' ').map((word, wIdx) => {
                  const isVerseNumber = word.match(/^\((\d+)\)$/);
                  if (isVerseNumber) {
                    return (
                      <span key={wIdx} className="inline-flex items-center justify-center font-sans font-black text-amber-800 text-xs bg-amber-100 text-center rounded-full w-5 h-5 mx-1 shadow border border-amber-200">
                        {isVerseNumber[1]}
                      </span>
                    );
                  }
                  return <span key={wIdx} className="mx-0.5 inline-block">{word}</span>;
                })}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 border border-slate-200 rounded-none">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 justify-start">
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    ضوابط تقسيم ونص الآية:
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    تحديد المعيار والرمز المستهدف لقص وفصل النص تلقائياً إلى آيات مستقلة في شيت المخرجات للتأكد من المخطط الرقمي.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none bg-white p-3 border border-slate-200">
                  <input
                    type="checkbox"
                    checked={excludeBismillah}
                    onChange={(e) => setExcludeBismillah(e.target.checked)}
                    className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer accent-slate-900"
                  />
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800 block">استبعاد البسملة الاستفتاحية</span>
                    <span className="text-[10px] text-slate-400 block font-medium">عدم إدخال بسملة أول آية في حساب الجمل والتحقق النوراني</span>
                  </div>
                </label>
              </div>

              <div className="flex flex-col gap-2.5 justify-center">
                <span className="text-xs font-bold text-slate-500">نمط القوس والمحدد لتقسيم الآيات:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeparator('auto')}
                    className={`py-2 text-xs font-bold rounded-none transition-all cursor-pointer border ${
                      separator === 'auto'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    تلقائي (الكل)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeparator('parentheses')}
                    className={`py-2 text-xs font-bold rounded-none transition-all cursor-pointer border ${
                      separator === 'parentheses'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    أقواس دائرية (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeparator('curly')}
                    className={`py-2 text-xs font-bold rounded-none transition-all cursor-pointer border ${
                      separator === 'curly'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    أقواس مجعدة {'{1}'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSurah(null);
                  setSelectedSurahId('');
                  setInputScope('choose');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs rounded-none cursor-pointer"
              >
                ⬅️ العودة واختيار سورة أخرى
              </button>
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-none text-xs uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>إعادة معالجة وحوسبة السورة ⚡</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
