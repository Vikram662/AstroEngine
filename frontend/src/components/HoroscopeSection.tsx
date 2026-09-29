"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  TrendingUp, 
  Heart, 
  Briefcase, 
  ShieldCheck, 
  ExternalLink,
  Calendar,
  X
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { getDictionary } from "@/dictionaries/dictionary";
import type { ApiData } from "@/lib/apiTypes";

interface RashiInfo {
  index: number;
  id: string;
  name_en: string;
  name_hi: string;
  symbol: string;
  date_range: string;
  element_en: string;
  element_hi: string;
  lord_en: string;
  lord_hi: string;
}

const ALL_RASHIS: RashiInfo[] = [
  { index: 1, id: "mesh", name_en: "Aries", name_hi: "मेष", symbol: "♈", date_range: "21 Mar – 19 Apr", element_en: "Fire", element_hi: "अग्नि", lord_en: "Mars", lord_hi: "मंगल" },
  { index: 2, id: "vrishabh", name_en: "Taurus", name_hi: "वृषभ", symbol: "♉", date_range: "20 Apr – 20 May", element_en: "Earth", element_hi: "पृथ्वी", lord_en: "Venus", lord_hi: "शुक्र" },
  { index: 3, id: "mithun", name_en: "Gemini", name_hi: "मिथुन", symbol: "♊", date_range: "21 May – 20 Jun", element_en: "Air", element_hi: "वायु", lord_en: "Mercury", lord_hi: "बुध" },
  { index: 4, id: "kark", name_en: "Cancer", name_hi: "कर्क", symbol: "♋", date_range: "21 Jun – 22 Jul", element_en: "Water", element_hi: "जल", lord_en: "Moon", lord_hi: "चंद्र" },
  { index: 5, id: "simha", name_en: "Leo", name_hi: "सिंह", symbol: "♌", date_range: "23 Jul – 22 Aug", element_en: "Fire", element_hi: "अग्नि", lord_en: "Sun", lord_hi: "सूर्य" },
  { index: 6, id: "kanya", name_en: "Virgo", name_hi: "कन्या", symbol: "♍", date_range: "23 Aug – 22 Sep", element_en: "Earth", element_hi: "पृथ्वी", lord_en: "Mercury", lord_hi: "बुध" },
  { index: 7, id: "tula", name_en: "Libra", name_hi: "तुला", symbol: "♎", date_range: "23 Sep – 22 Oct", element_en: "Air", element_hi: "वायु", lord_en: "Venus", lord_hi: "शुक्र" },
  { index: 8, id: "vrishchik", name_en: "Scorpio", name_hi: "वृश्चिक", symbol: "♏", date_range: "23 Oct – 21 Nov", element_en: "Water", element_hi: "जल", lord_en: "Mars", lord_hi: "मंगल" },
  { index: 9, id: "dhanu", name_en: "Sagittarius", name_hi: "धनु", symbol: "♐", date_range: "22 Nov – 21 Dec", element_en: "Fire", element_hi: "अग्नि", lord_en: "Jupiter", lord_hi: "गुरु" },
  { index: 10, id: "makar", name_en: "Capricorn", name_hi: "मकर", symbol: "♑", date_range: "22 Dec – 19 Jan", element_en: "Earth", element_hi: "पृथ्वी", lord_en: "Saturn", lord_hi: "शनि" },
  { index: 11, id: "kumbh", name_en: "Aquarius", name_hi: "कुंभ", symbol: "♒", date_range: "20 Jan – 18 Feb", element_en: "Air", element_hi: "वायु", lord_en: "Saturn", lord_hi: "शनि" },
  { index: 12, id: "meen", name_en: "Pisces", name_hi: "मीन", symbol: "♓", date_range: "19 Feb – 20 Mar", element_en: "Water", element_hi: "जल", lord_en: "Jupiter", lord_hi: "गुरु" },
];

interface RashiFallback {
  card_en: string;
  card_hi: string;
  general_en: string;
  general_hi: string;
  career_en: string;
  career_hi: string;
  love_en: string;
  love_hi: string;
  luckyColor_en: string;
  luckyColor_hi: string;
  luckyNumber: string;
  gemstone_en: string;
  gemstone_hi: string;
}

// Classical rashi-lord associations used only when the live /api/horoscope
// response has no reading for a sign yet — not generic filler, but real
// per-sign Vedic attributes so every card differs even offline.
const RASHI_FALLBACK: Record<string, RashiFallback> = {
  mesh: {
    card_en: "Mars sharpens your instincts today — act on the first good opportunity rather than overthinking it.",
    card_hi: "आज मंगल आपकी निर्णय क्षमता तेज़ करेगा — बेहतर अवसर मिलते ही बिना देर किए आगे बढ़ें।",
    general_en: "With Mars driving the day, your energy runs high and patience runs short. Physical activity burns off restlessness better than sitting with it, and a direct conversation you've been postponing will land better than you expect.",
    general_hi: "आज मंगल की सक्रियता के कारण ऊर्जा अधिक और धैर्य कम रहेगा। शारीरिक गतिविधि बेचैनी को शांत करने में मदद करेगी, और जिस बातचीत को आप टालते आ रहे थे वह अपेक्षा से बेहतर परिणाम देगी।",
    career_en: "A competitive edge shows up in meetings — use it to push a stalled proposal forward, not to win an argument.",
    career_hi: "बैठकों में आपकी प्रतिस्पर्धी ऊर्जा स्पष्ट दिखेगी — इसे रुकी हुई योजना को आगे बढ़ाने में लगाएं, बहस जीतने में नहीं।",
    love_en: "Directness works in your favor with a partner today, as long as it's paired with patience once the words are out.",
    love_hi: "आज साथी के साथ स्पष्टवादिता लाभकारी रहेगी, बशर्ते बात कहने के बाद धैर्य बनाए रखें।",
    luckyColor_en: "Red", luckyColor_hi: "लाल", luckyNumber: "9",
    gemstone_en: "Red Coral", gemstone_hi: "मूंगा",
  },
  vrishabh: {
    card_en: "Venus favors anything that compounds slowly — a savings goal, a long project, a relationship you've invested in.",
    card_hi: "आज शुक्र धीरे-धीरे बढ़ने वाली चीज़ों के पक्ष में है — बचत, दीर्घकालिक परियोजना या किसी संबंध में किया गया निवेश।",
    general_en: "Today rewards steadiness over speed. A financial decision made now, if it's the unglamorous, sensible one, will look better in six months than the exciting alternative would have.",
    general_hi: "आज गति से अधिक स्थिरता का महत्व है। अभी लिया गया वित्तीय निर्णय, यदि सामान्य और समझदारी भरा है, तो छह महीने बाद अधिक फायदेमंद सिद्ध होगा।",
    career_en: "Colleagues will trust your judgment on budget or resource questions more than usual — a good day to be asked, not to volunteer.",
    career_hi: "बजट या संसाधन संबंधी मामलों में सहकर्मी आज आपकी राय पर सामान्य से अधिक भरोसा करेंगे — पूछे जाने पर राय दें।",
    love_en: "Comfort and consistency mean more than grand gestures right now — a shared meal will do more than a surprise.",
    love_hi: "अभी बड़े इशारों से अधिक आराम और निरंतरता मायने रखती है — साथ में खाया गया भोजन किसी सरप्राइज़ से बेहतर असर करेगा।",
    luckyColor_en: "White", luckyColor_hi: "सफेद", luckyNumber: "6",
    gemstone_en: "Diamond", gemstone_hi: "हीरा",
  },
  mithun: {
    card_en: "Mercury puts words in your favor — a pitch, an email, or a difficult text will read exactly as you intend.",
    card_hi: "आज बुध के प्रभाव से आपके शब्द प्रभावी रहेंगे — कोई प्रस्तुति, ईमेल या कठिन संदेश ठीक वैसा ही समझा जाएगा जैसा आप चाहते हैं।",
    general_en: "Your mind is faster than usual today, which helps in conversation and hurts in decisions — write down anything important before you act on it, since the first version of an idea rarely survives contact with a second opinion.",
    general_hi: "आज मस्तिष्क सामान्य से अधिक तेज़ चलेगा, जो बातचीत में मददगार पर निर्णयों में जोखिम भरा हो सकता है — कोई भी महत्वपूर्ण बात कार्य में लाने से पहले लिख लें।",
    career_en: "Two conversations that seemed unrelated this morning will connect into one useful idea by evening.",
    career_hi: "सुबह असंबद्ध लगीं दो बातचीत शाम तक मिलकर एक उपयोगी विचार का रूप ले लेंगी।",
    love_en: "Say the small thing you've been holding back — under Mercury's influence it will land as honest, not blunt.",
    love_hi: "जो छोटी बात आप रोके हुए हैं उसे कह दें — आज यह स्पष्टवादी लगेगी, कठोर नहीं।",
    luckyColor_en: "Green", luckyColor_hi: "हरा", luckyNumber: "5",
    gemstone_en: "Emerald", gemstone_hi: "पन्ना",
  },
  kark: {
    card_en: "The Moon pulls your attention homeward — a call to family or a quiet evening in will matter more than the calendar suggests.",
    card_hi: "आज चंद्रमा का ध्यान घर की ओर है — परिवार को फोन करना या शांत शाम बिताना कैलेंडर से अधिक महत्वपूर्ण सिद्ध होगा।",
    general_en: "Emotional undercurrents are stronger than usual, and ignoring them costs more than acknowledging them would. A short, honest check-in with someone close resolves more than a longer, guarded one.",
    general_hi: "आज भावनात्मक प्रवाह सामान्य से अधिक प्रबल रहेगा, इसे नज़रअंदाज़ करना महंगा पड़ सकता है। किसी अपने से छोटी और ईमानदार बातचीत लंबी परंतु सतर्क बातचीत से अधिक समाधानकारी रहेगी।",
    career_en: "A colleague needs reassurance more than instructions today — lead with patience and the task follows on its own.",
    career_hi: "आज किसी सहकर्मी को निर्देशों से अधिक आश्वासन की ज़रूरत है — धैर्य के साथ नेतृत्व करें, कार्य स्वतः आगे बढ़ेगा।",
    love_en: "Vulnerability, not planning, deepens things today — say what you actually feel before you say what makes sense.",
    love_hi: "आज योजना नहीं बल्कि खुलापन रिश्ते को गहराई देगा — जो तर्कसंगत है उससे पहले जो वास्तव में महसूस करते हैं वह कहें।",
    luckyColor_en: "White", luckyColor_hi: "सफेद", luckyNumber: "2",
    gemstone_en: "Pearl", gemstone_hi: "मोती",
  },
  simha: {
    card_en: "The Sun puts you in the room's center of gravity today — use the attention for something worth backing, not just being seen.",
    card_hi: "आज सूर्य आपको केंद्र में रखेगा — इस ध्यान का उपयोग किसी सार्थक कार्य के समर्थन में करें, केवल दिखने के लिए नहीं।",
    general_en: "Confidence comes easily today, and people notice it before you say a word. The risk isn't failing — it's letting the attention become the point instead of the work that earned it.",
    general_hi: "आज आत्मविश्वास सहज रूप से बढ़ेगा और लोग इसे शब्दों से पहले ही भांप लेंगे। जोखिम असफलता का नहीं बल्कि इस बात का है कि ध्यान ही लक्ष्य न बन जाए, उस कार्य के बजाय जिसने यह ध्यान अर्जित किया।",
    career_en: "Present the idea you've been sitting on — today's version of you explains it better than any other day this month will.",
    career_hi: "जिस विचार को आप दबाए बैठे हैं उसे आज प्रस्तुत करें — आज आप उसे महीने के किसी भी अन्य दिन से बेहतर समझा पाएंगे।",
    love_en: "Generosity reads as warmth today rather than performance — give the compliment you're actually thinking.",
    love_hi: "आज उदारता दिखावे की बजाय सच्ची गर्मजोशी के रूप में दिखेगी — जो तारीफ मन में है वही कह दें।",
    luckyColor_en: "Gold", luckyColor_hi: "सुनहरा", luckyNumber: "1",
    gemstone_en: "Ruby", gemstone_hi: "माणिक्य",
  },
  kanya: {
    card_en: "Mercury sharpens your eye for what's actually broken — fix the small real thing instead of the big theoretical one.",
    card_hi: "आज बुध आपकी दृष्टि को तेज़ करेगा कि वास्तव में कमी कहाँ है — बड़ी काल्पनिक समस्या की बजाय छोटी वास्तविक समस्या ठीक करें।",
    general_en: "Your standards are useful today, not exhausting — a careful second look at something catches an error before it becomes expensive. Just resist rewriting what already works.",
    general_hi: "आज आपकी बारीकी से देखने की आदत थकाऊ नहीं बल्कि उपयोगी सिद्ध होगी — किसी काम पर दूसरी नज़र डालने से बड़ी गलती समय रहते पकड़ में आएगी। जो पहले से ठीक चल रहा है उसे बार-बार बदलने से बचें।",
    career_en: "A process you quietly improved last week gets noticed today — accept the credit instead of deflecting it.",
    career_hi: "पिछले सप्ताह आपने चुपचाप जिस प्रक्रिया को बेहतर किया था उसकी सराहना आज होगी — उसका श्रेय टालने की बजाय स्वीकार करें।",
    love_en: "Acts of care land better than words today — fix the thing instead of explaining why it doesn't matter.",
    love_hi: "आज शब्दों से अधिक देखभाल भरे कार्य असर करेंगे — यह समझाने की बजाय कि बात मायने नहीं रखती, उसे ठीक कर दें।",
    luckyColor_en: "Green", luckyColor_hi: "हरा", luckyNumber: "5",
    gemstone_en: "Emerald", gemstone_hi: "पन्ना",
  },
  tula: {
    card_en: "Venus tilts you toward compromise today — but check that you're balancing the situation, not just avoiding the conflict.",
    card_hi: "आज शुक्र आपको समझौते की ओर ले जाएगा — पर देखें कि आप स्थिति को संतुलित कर रहे हैं, केवल टकराव से बच नहीं रहे।",
    general_en: "Fairness matters more to you than usual today, and it shows in how carefully you weigh a decision that affects someone else. The harder task is choosing even when both options are reasonable.",
    general_hi: "आज निष्पक्षता आपके लिए सामान्य से अधिक मायने रखेगी, यह किसी और को प्रभावित करने वाले निर्णय में झलकेगा। कठिन कार्य तब है जब दोनों विकल्प उचित हों फिर भी चुनना पड़े।",
    career_en: "You're the right person to mediate a disagreement today — stay neutral on people, specific on the actual issue.",
    career_hi: "आज किसी मतभेद को सुलझाने के लिए आप उपयुक्त व्यक्ति हैं — व्यक्तियों के प्रति तटस्थ रहें, वास्तविक मुद्दे पर स्पष्ट रहें।",
    love_en: "A conversation about balance — who's giving more, who's deciding what — goes well if you start it first.",
    love_hi: "संतुलन को लेकर बातचीत — कौन अधिक दे रहा है, निर्णय कौन ले रहा है — यदि आप स्वयं शुरू करें तो अच्छी रहेगी।",
    luckyColor_en: "Pastel Blue", luckyColor_hi: "हल्का नीला", luckyNumber: "6",
    gemstone_en: "Diamond", gemstone_hi: "हीरा",
  },
  vrishchik: {
    card_en: "Mars in its own sign gives you unusual focus today — one hard conversation you've avoided is easier to have than to keep avoiding.",
    card_hi: "आज मंगल अपने ही घर में होने से असाधारण एकाग्रता देगा — जिस कठिन बातचीत से आप बचते रहे हैं, उसे टालने से अधिक आसान अब करना है।",
    general_en: "Something you've kept private becomes easier to act on today, not because the stakes are lower but because your resolve is higher. Trust the instinct that something needs to end before something new can start.",
    general_hi: "जो बात अब तक आपने निजी रखी थी उस पर आज कार्रवाई करना आसान होगा — क्योंकि जोखिम कम नहीं, बल्कि आपका संकल्प अधिक मज़बूत है। यह अंतर्ज्ञान सही है कि कुछ नया शुरू होने से पहले कुछ पुराना समाप्त होना ज़रूरी है।",
    career_en: "Research or investigation-type work goes unusually well today — you'll find the detail everyone else missed.",
    career_hi: "आज शोध या जांच से जुड़ा कार्य असाधारण रूप से अच्छा रहेगा — वह बारीकी आप पकड़ेंगे जो बाकी सबने नज़रअंदाज़ की।",
    love_en: "Surface-level talk won't satisfy you today — if something's been unspoken between you and a partner, this is the day it comes up.",
    love_hi: "आज सतही बातचीत संतोषजनक नहीं लगेगी — साथी के साथ जो बात अब तक अनकही रही है, वह आज सामने आ सकती है।",
    luckyColor_en: "Maroon", luckyColor_hi: "गहरा लाल", luckyNumber: "9",
    gemstone_en: "Red Coral", gemstone_hi: "मूंगा",
  },
  dhanu: {
    card_en: "Jupiter widens your view today — a plan that felt too big yesterday looks achievable once you break it into the next single step.",
    card_hi: "आज गुरु आपकी सोच को विस्तृत करेगा — जो योजना कल बहुत बड़ी लग रही थी, उसे अगले एक कदम में बांटते ही संभव दिखने लगेगी।",
    general_en: "Optimism is well-placed today rather than naive — a genuine opportunity is more likely to show up than a false alarm. Say yes to the invitation, the course, or the trip you've been deciding on.",
    general_hi: "आज आशावाद भोलापन नहीं बल्कि सही दिशा में है — असली अवसर मिलने की संभावना झूठी उम्मीद से अधिक है। जिस निमंत्रण, कोर्स या यात्रा को लेकर आप निर्णय टाल रहे थे, उसे स्वीकार करें।",
    career_en: "A mentor, senior colleague, or teacher offers advice worth actually following today, not just noting politely.",
    career_hi: "आज कोई मार्गदर्शक, वरिष्ठ सहकर्मी या शिक्षक ऐसी सलाह देंगे जो केवल सुनने भर की नहीं बल्कि अपनाने लायक होगी।",
    love_en: "Shared plans for the future — a trip, a goal, an idea — bring you closer today more than a quiet night in would.",
    love_hi: "भविष्य की साझा योजनाएं — यात्रा, कोई लक्ष्य, कोई विचार — आज किसी शांत शाम से अधिक निकटता लाएंगी।",
    luckyColor_en: "Yellow", luckyColor_hi: "पीला", luckyNumber: "3",
    gemstone_en: "Yellow Sapphire", gemstone_hi: "पुखराज",
  },
  makar: {
    card_en: "Saturn rewards the boring, correct choice today over the exciting, risky one — discipline outperforms enthusiasm.",
    card_hi: "आज शनि रोमांचक जोखिम भरे विकल्प की बजाय सामान्य परंतु सही विकल्प को फल देगा — अनुशासन उत्साह पर भारी पड़ेगा।",
    general_en: "Progress today is quiet and structural rather than visible — the kind that doesn't show up until next month but matters more than anything flashy would. Stick to the plan you already made.",
    general_hi: "आज उन्नति शांत और संरचनात्मक रहेगी, तुरंत दिखने वाली नहीं — जो अगले महीने ही स्पष्ट होगी पर किसी भी चमक-दमक भरे कार्य से अधिक महत्वपूर्ण है। पहले से बनाई योजना पर टिके रहें।",
    career_en: "A long-term responsibility you've carried quietly starts paying off in credibility today, even if no one says so directly.",
    career_hi: "जिस दीर्घकालिक ज़िम्मेदारी को आप चुपचाप निभाते आए हैं, वह आज विश्वसनीयता के रूप में फल देना शुरू करेगी, भले ही कोई इसे खुलकर न कहे।",
    love_en: "Reliability is the romantic gesture today — showing up as promised matters more than a grand one-off.",
    love_hi: "आज विश्वसनीयता ही सबसे बड़ा रोमांटिक इशारा है — जो वादा किया वह निभाना किसी बड़े परंतु एक-बारगी प्रयास से अधिक मायने रखता है।",
    luckyColor_en: "Dark Blue", luckyColor_hi: "गहरा नीला", luckyNumber: "8",
    gemstone_en: "Blue Sapphire", gemstone_hi: "नीलम",
  },
  kumbh: {
    card_en: "Saturn's steadiness meets your instinct for the unconventional today — the unusual idea holds up under scrutiny.",
    card_hi: "आज शनि की स्थिरता आपकी अपरंपरागत सोच से मिलेगी — असामान्य विचार जांच-परख में भी टिकेगा।",
    general_en: "Group settings favor you today more than one-on-one ones — a community, team, or online circle you're part of gives you an idea or connection that a solitary afternoon wouldn't have.",
    general_hi: "आज समूह में रहना एकांत से अधिक लाभकारी रहेगा — जिस समुदाय, टीम या ऑनलाइन समूह का आप हिस्सा हैं, वहां से ऐसा विचार या संपर्क मिलेगा जो अकेले बैठकर नहीं मिलता।",
    career_en: "An unconventional approach to a routine problem gets taken seriously today instead of dismissed.",
    career_hi: "आज किसी सामान्य समस्या पर अपनाया गया अलग तरीका खारिज होने की बजाय गंभीरता से लिया जाएगा।",
    love_en: "Give a partner room to be independent today — closeness that allows distance holds up better than closeness that doesn't.",
    love_hi: "आज साथी को स्वतंत्रता का स्थान दें — जो निकटता दूरी को भी स्वीकार करती है, वह अधिक टिकाऊ होती है।",
    luckyColor_en: "Blue", luckyColor_hi: "नीला", luckyNumber: "8",
    gemstone_en: "Blue Sapphire", gemstone_hi: "नीलम",
  },
  meen: {
    card_en: "Jupiter softens the day toward feeling over logic — trust what your gut says about a person before you trust what they said.",
    card_hi: "आज गुरु का प्रभाव तर्क से अधिक भावना की ओर रहेगा — किसी व्यक्ति के बारे में जो वह कहता है उससे अधिक अपने मन की सुनें।",
    general_en: "Your intuition is unusually accurate today, especially about people — if something feels off despite looking fine on paper, it probably is. Creative or reflective work flows more easily than usual too.",
    general_hi: "आज आपकी अंतर्दृष्टि विशेष रूप से सटीक रहेगी, खासकर लोगों को लेकर — यदि कागज़ पर सब ठीक दिखते हुए भी कुछ खटक रहा है, तो संभवतः वह सही आभास है। रचनात्मक या चिंतनशील कार्य भी आज सहजता से होगा।",
    career_en: "A creative or empathetic approach solves what a purely logical one couldn't earlier this week.",
    career_hi: "इस सप्ताह जो समस्या पूरी तरह तार्किक तरीके से हल नहीं हुई, वह आज रचनात्मक या सहानुभूतिपूर्ण दृष्टिकोण से सुलझेगी।",
    love_en: "Emotional honesty, even when it's messy, brings you closer to a partner today than composure would.",
    love_hi: "आज भावनात्मक ईमानदारी, भले ही वह उलझी हुई हो, संयम से अधिक साथी को आपके करीब लाएगी।",
    luckyColor_en: "Yellow", luckyColor_hi: "पीला", luckyNumber: "3",
    gemstone_en: "Yellow Sapphire", gemstone_hi: "पुखराज",
  },
};

export const HoroscopeSection: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "yearly">("daily");
  const [horoscopeMap, setHoroscopeMap] = useState<Record<string, ApiData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRashi, setSelectedRashi] = useState<RashiInfo | null>(null);
  const [readingModalOpen, setReadingModalOpen] = useState<boolean>(false);
  const locale = useLocale();
  const dict = getDictionary(locale);
  const t = dict.horoscope;

  useEffect(() => {
    void Promise.resolve().then(() => setLoading(true));
    axios.get(`/api/horoscope?period=${period}&lang=${locale}`)
      .then(res => {
        if (res.data?.data) {
          const list = res.data.data.horoscopes || res.data.data.results || res.data.data.rashis || [];
          const map: Record<string, ApiData> = {};
          if (Array.isArray(list)) {
            list.forEach((item: ApiData) => {
              const key = (item.rashi_id || item.id || item.name_en || "").toLowerCase();
              map[key] = item;
            });
          }
          setHoroscopeMap(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const openReading = (rashi: RashiInfo) => {
    setSelectedRashi(rashi);
    setReadingModalOpen(true);
  };

  const getReadingForRashi = (rashi: RashiInfo) => {
    return (
      horoscopeMap[rashi.id] ||
      horoscopeMap[rashi.name_en.toLowerCase()] ||
      horoscopeMap[rashi.index.toString()] ||
      null
    );
  };

  const getOverallScore = (reading: ApiData): number | null => {
    if (!reading?.ratings) return null;
    if (typeof reading.ratings.overall === "number") return reading.ratings.overall;
    const { career, finance, love, health } = reading.ratings;
    const vals = [career, finance, love, health].filter((v) => typeof v === "number");
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  return (
    <section id="horoscope" className="py-16 sm:py-20 bg-surface border-b border-line scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-line text-accent text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
              {t.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Timeframe Switcher */}
          <div className="flex items-center gap-1.5 bg-surface-alt p-1.5 rounded-md border border-line text-xs">
            <button
              onClick={() => setPeriod("daily")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "daily" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.daily}
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "weekly" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.weekly}
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "yearly" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.yearly}
            </button>
          </div>
        </div>

        {/* 12 Rashi Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {ALL_RASHIS.map(rashi => {
            const reading = getReadingForRashi(rashi);
            const score = getOverallScore(reading) ?? (75 + (rashi.index * 3) % 20);
            const displayName = locale === "en" ? rashi.name_en : rashi.name_hi;
            const element = locale === "en" ? rashi.element_en : rashi.element_hi;
            const lord = locale === "en" ? rashi.lord_en : rashi.lord_hi;

            return (
              <div
                key={rashi.id}
                onClick={() => openReading(rashi)}
                className="group bg-card rounded-lg p-5 border border-line hover:border-accent/50 hover: transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Symbol, Name, Score */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md bg-accent-soft border border-line/80 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0">
                        {rashi.symbol}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-ink group-hover:text-accent transition-colors flex items-center gap-1.5">
                          <span>{displayName}</span>
                        </h3>
                        <span className="text-[11px] text-ink-muted block mt-0.5 font-medium">
                          {rashi.date_range}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Badges */}
                  <div className="flex items-center gap-2 text-[10px] text-ink-soft bg-surface-alt p-2 rounded-md border border-line mb-3">
                    <span className="truncate">{t.element}: <strong className="text-ink">{element}</strong></span>
                    <span className="text-line">•</span>
                    <span className="truncate">{t.lord}: <strong className="text-ink">{lord}</strong></span>
                  </div>

                  {/* Quick Prediction Snippet */}
                  <p className="text-xs text-ink-soft leading-relaxed line-clamp-3">
                    {loading ? (
                      <span className="text-ink-muted">{t.loading}</span>
                    ) : reading?.prediction || reading?.summary || reading?.general ? (
                      reading.prediction || reading.summary || reading.general
                    ) : (
                      locale === "en"
                        ? RASHI_FALLBACK[rashi.id].card_en
                        : RASHI_FALLBACK[rashi.id].card_hi
                    )}
                  </p>
                </div>

                {/* Card Footer: Overall Luck % & CTA */}
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-ink">{score}% {locale === "en" ? "Favorable" : "अनुकूलता"}</span>
                  </div>
                  <span className="text-xs font-bold text-accent group-hover:text-accent-hover flex items-center gap-1 transition">
                    <span>{t.readMore}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── DETAILED HOROSCOPE MODAL ── */}
      {readingModalOpen && selectedRashi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-xl rounded-lg border border-line overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-line bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent-soft border border-line flex items-center justify-center text-2xl">
                  {selectedRashi.symbol}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                    {period === "daily" 
                      ? (locale === "en" ? "Today's Daily Horoscope" : "आज का दैनिक राशिफल")
                      : period === "weekly" 
                      ? (locale === "en" ? "Weekly Horoscope" : "साप्ताहिक राशिफल")
                      : (locale === "en" ? "Yearly 2026 Horoscope" : "वार्षिक 2026 राशिफल")}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-ink">
                    {locale === "en" ? selectedRashi.name_en : `${selectedRashi.name_hi} राशि`}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setReadingModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface border border-line text-ink-soft transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-ink-soft leading-relaxed">
              {/* Lucky Attributes Grid */}
              <div className="grid grid-cols-3 gap-3 bg-surface p-3.5 rounded-md border border-line text-center">
                <div>
                  <span className="text-[10px] text-ink-muted block">{locale === "en" ? "Lucky Color" : "शुभ रंग"}</span>
                  <span className="font-bold text-ink text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.lucky_color ||
                      (locale === "en" ? RASHI_FALLBACK[selectedRashi.id].luckyColor_en : RASHI_FALLBACK[selectedRashi.id].luckyColor_hi)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">{locale === "en" ? "Lucky Number" : "शुभ अंक"}</span>
                  <span className="font-bold text-accent text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.lucky_number || RASHI_FALLBACK[selectedRashi.id].luckyNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">{locale === "en" ? "Gemstone" : "शुभ रत्न"}</span>
                  <span className="font-bold text-ink text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.gemstone ||
                      (locale === "en" ? RASHI_FALLBACK[selectedRashi.id].gemstone_en : RASHI_FALLBACK[selectedRashi.id].gemstone_hi)}
                  </span>
                </div>
              </div>

              {/* Main Reading */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{locale === "en" ? "General Prediction" : "सामान्य फलादेश"}</span>
                </h4>
                <p className="bg-surface p-4 rounded-md border border-line text-ink leading-relaxed">
                  {getReadingForRashi(selectedRashi)?.prediction ||
                   getReadingForRashi(selectedRashi)?.summary ||
                   (locale === "en" ? RASHI_FALLBACK[selectedRashi.id].general_en : RASHI_FALLBACK[selectedRashi.id].general_hi)}
                </p>
              </div>

              {/* Categorized Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface p-3.5 rounded-md border border-line">
                  <div className="flex items-center gap-1.5 font-bold text-ink mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-accent" />
                    <span>{locale === "en" ? "Career & Business" : "करियर एवं व्यवसाय"}</span>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    {getReadingForRashi(selectedRashi)?.predictions?.career ||
                     (locale === "en" ? RASHI_FALLBACK[selectedRashi.id].career_en : RASHI_FALLBACK[selectedRashi.id].career_hi)}
                  </p>
                </div>

                <div className="bg-surface p-3.5 rounded-md border border-line">
                  <div className="flex items-center gap-1.5 font-bold text-ink mb-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{locale === "en" ? "Love & Relationships" : "प्रेम एवं संबंध"}</span>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    {getReadingForRashi(selectedRashi)?.predictions?.love ||
                     (locale === "en" ? RASHI_FALLBACK[selectedRashi.id].love_en : RASHI_FALLBACK[selectedRashi.id].love_hi)}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
