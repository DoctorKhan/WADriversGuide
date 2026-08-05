import fs from 'node:fs';
import path from 'node:path';

const files = [
  'output/driver-guide-english.html',
  'output/driver-guide-bengali.html',
  'output/driver-guide-unified.html',
];

// Captions verified against each page image's actual content (2026-08-05 audit).
// The array previously paired several page numbers with captions describing a
// DIFFERENT page's content (e.g. '058' was labeled "Balanced vehicle weight" but
// that page actually shows one-hand steering and braking). Corrected below.
const sourcePages = [
  ['022', 'Standard driver license and ID comparison', 'স্ট্যান্ডার্ড ড্রাইভার লাইসেন্স ও আইডি তুলনা'],
  ['023', 'Enhanced driver license and ID comparison', 'এনহ্যান্সড ড্রাইভার লাইসেন্স ও আইডি তুলনা'],
  ['052', 'Seat belts and occupant protection', 'সিট বেল্ট ও যাত্রী সুরক্ষা'],
  ['055', 'Steering basics', 'স্টিয়ারিংয়ের মূল বিষয়'],
  ['056', 'Hand-to-hand steering (pull/push)', 'হ্যান্ড-টু-হ্যান্ড স্টিয়ারিং (পুল/পুশ)'],
  ['058', 'One-hand steering and braking', 'এক-হাতে স্টিয়ারিং ও ব্রেকিং'],
  ['060', 'Balanced weight and pitch', 'সুষম ওজন ও পিচ'],
  ['061', 'Vehicle roll and yaw', 'যানবাহনের রোল ও ইয়াও'],
  ['063', 'Reference points and your blind zones', 'রেফারেন্স পয়েন্ট ও আপনার অন্ধ অঞ্চল'],
  ['065', 'Reducing blind zones', 'অন্ধ অঞ্চল কমানো'],
  ['110', 'Traffic-light signals — red', 'ট্রাফিক লাইটের সংকেত — লাল'],
  ['111', 'Traffic-light signals — yellow', 'ট্রাফিক লাইটের সংকেত — হলুদ'],
  ['114', 'Common traffic signs', 'সাধারণ ট্রাফিক সাইন'],
  ['116', 'Regulatory prohibition signs', 'নিয়ন্ত্রক নিষেধাজ্ঞা চিহ্ন'],
  ['120', 'Warning signs', 'সতর্কতামূলক চিহ্ন'],
  ['123', 'Turning at intersections', 'চৌরাস্তায় মোড় নেওয়া'],
  ['126', 'Roundabouts', 'গোলচত্বর'],
  ['130', 'Road markings and lanes', 'রাস্তার চিহ্ন ও লেন'],
  ['134', 'HOV and carpool lanes', 'HOV ও কারপুল লেন'],
  ['138', 'Bike lanes, stop lines, and fire lanes', 'বাইক লেন, স্টপ লাইন ও ফায়ার লেন'],
  ['142', 'Work zones and emergency zones', 'কর্মক্ষেত্র ও জরুরি অঞ্চল'],
  ['146', 'Perpendicular and angled parking', 'লম্ব ও কৌণিক পার্কিং'],
  ['148', 'Parking on a hill', 'পাহাড়ে পার্কিং'],
  ['154', 'Dangers of driving and risk awareness', 'গাড়ি চালানোর বিপদ ও ঝুঁকি সচেতনতা'],
  ['160', 'Merging and zipper merging', 'একীভূতকরণ ও জিপার মার্জিং'],
  ['170', 'Slippery roads', 'পিচ্ছিল রাস্তা'],
  ['180', 'Law enforcement and getting pulled over', 'আইন প্রয়োগকারী সংস্থা ও গাড়ি থামানো হলে'],
];

// data-source-page values verified against each section's actual topic; previously
// sec54/sec57/sec59 embedded images whose real content didn't match the section
// (e.g. sec54 "Common Intersections" embedded a regulatory-sign page instead of
// an intersection/roundabout page).
const sectionIllustrations = [
  ['sec52', '110', 'Traffic-light signals', 'ট্রাফিক লাইটের সংকেত'],
  ['sec53', '114', 'Common traffic signs', 'সাধারণ ট্রাফিক সাইন'],
  ['sec54', '126', 'Roundabouts', 'গোলচত্বর'],
  ['sec57', '130', 'Road markings and lanes', 'রাস্তার চিহ্ন ও লেন'],
  ['sec59', '146', 'Perpendicular and angled parking', 'লম্ব ও কৌণিক পার্কিং'],
  ['sec59', '148', 'Parking on a hill', 'পাহাড়ে পার্কিং'],
];

const replacements = [
  [/ﬂy/g, 'fly'],
  [/a la w/g, 'a law'],
  [/turn\.In/g, 'turn. In'],
  [/DrivingTeen Passengers/g, 'Driving | Teen Passengers'],
  [/Drugs and AlcoholSpeed/g, 'Drugs and Alcohol | Speed'],
  [/No Seatbelts/g, 'No Seatbelts'],
  [/safelyThese/g, 'safely. These'],
  [/EnterA/g, 'Enter. A'],
  [/treadWorn/g, 'tread. Worn'],
  [/StopPut/g, 'Stop. Put'],
  [/BoosterAges/g, 'Booster. Ages'],
  [/Scan to the frontTo/g, 'Scan to the front. To'],
  [/roadsCHAPTER/g, 'roads. CHAPTER'],
  [/dol\.wa\.govCHAPTER/g, 'dol.wa.gov. CHAPTER'],
  [/LinkedIn\.com\/company\/Washington-<\/p>/g, 'LinkedIn.com/company/Washington-DOL</p>'],
  [/Teen PassengersDrugs and Alcohol/g, 'Teen Passengers | Drugs and Alcohol'],
  [/FatigueNo Seatbelts/g, 'Fatigue | No Seatbelts'],
  [/Night DrivingWet Roads/g, 'Night Driving | Wet Roads'],
  [/Accessibility and AccommodationsDisclaimer/g, 'Accessibility and Accommodations | Disclaimer'],
  [/RestrictionsFrom Issue Date to 6 MonthsFrom 6 months to age 18 or one year/g, 'Restrictions | From Issue Date to 6 Months | From 6 months to age 18 or one year'],
  ["<p>Passengers No passengers under age 20 except immediate family membersNo more than 3 passengers under age  20 except immediate family members</p>", "<p>Passengers | No passengers under age 20 except immediate family members | No more than 3 passengers under age  20 except immediate family members</p>"],
  [/Hours of drivingNo driving between 1 a\.m\. and 5 a\.m\. unless accompanied by a parent, guardian, or licensed driver at least age 25Nighttime restrictions expire after one year of safe driving/g, 'Hours of driving | No driving between 1 a.m. and 5 a.m. unless accompanied by a parent, guardian, or licensed driver at least age 25 | Nighttime restrictions expire after one year of safe driving'],
  [/Violation Penalty/g, 'Violation | Penalty'],
  [/1st Current restrictions apply until you’re 18\./g, '1st | Current restrictions apply until you’re 18.'],
  [/2nd License is suspended for 6 months or until you turn 18, whichever comes first\./g, '2nd | License is suspended for 6 months or until you turn 18, whichever comes first.'],
  [/3rd License is suspended until you’re 18\./g, '3rd | License is suspended until you’re 18.'],
  [/<p( class="en-text")?>Flashing RedStop\. A flashing red traffic light functions as a stop sign\. Come to a full stop, and then go when it’s your turn\.<\/p>/g, (m, cls) => `<p${cls || ''}>Flashing Red</p>\n<p${cls || ''}>Stop. A flashing red traffic light functions as a stop sign. Come to a full stop, and then go when it’s your turn.</p>`],
  [/<p( class="en-text")?>Flashing GreenYou won’t see a flashing green light in Washington state\. However, you might see them in British Columbia, Canada, as warning that pedestrians are waiting to cross\.<\/p>/g, (m, cls) => `<p${cls || ''}>Flashing Green</p>\n<p${cls || ''}>You won’t see a flashing green light in Washington state. However, you might see them in British Columbia, Canada, as warning that pedestrians are waiting to cross.</p>`],
  [/Yellow GreenWarning of school, pedestrian, and bicycling activity/g, 'Yellow Green Warning of school, pedestrian, and bicycling activity'],
  [/<p( class="en-text")?>Stoplight IntersectionCrossover point<\/p>/g, (m, cls) => `<p${cls || ''}>Stoplight Intersection</p>\n<p${cls || ''}>Crossover point</p>`],
  [/to applyWashington’s rules of the road/g, 'to apply Washington’s rules of the road'],
  [/Tire pressureLow tire pressure can affect/g, 'Tire pressure. Low tire pressure can affect'],
  [/impacts the environmentWhen you leave/g, 'impacts the environment. When you leave'],
  [/impacts the environmentMost vehicle manufacturers/g, 'impacts the environment. Most vehicle manufacturers'],
  [/advanced notificationThese digital signs/g, 'advanced notification. These digital signs'],
  [/turn onlyThis sign indicates/g, 'turn only. This sign indicates'],
  [/lock your doorLocking your door prevents theft/g, 'lock your door. Locking your door prevents theft'],
  [/ফ্ল্যাশিং RedStop\. একটি ঝলকানি লাল ট্রাফিক লাইট/g, 'ফ্ল্যাশিং লাল। থামুন। একটি ঝলকানি লাল ট্রাফিক লাইট'],
  [/ঝলকানি সবুজ আপনি ওয়াশিংটন রাজ্যে একটি ঝলকানি সবুজ আলো দেখতে পাবেন না/g, 'ঝলকানি সবুজ। আপনি ওয়াশিংটন রাজ্যে একটি ঝলকানি সবুজ আলো দেখতে পাবেন না'],
  [/ইস্যু তারিখ থেকে 6 মাস পর্যন্ত সীমাবদ্ধতা 6 মাস থেকে 18 বা এক বছর বয়স পর্যন্ত<\/p>/g, 'ইস্যু তারিখ থেকে 6 মাস পর্যন্ত | সীমাবদ্ধতা | 6 মাস থেকে 18 বা এক বছর বয়স পর্যন্ত</p>'],
  ["যাত্রীরা 20 বছরের কম বয়সী কোন যাত্রী নেই তাৎক্ষণিক পরিবারের সদস্য ব্যতীত 3 জনের বেশি যাত্রী নেই  20 বছরের কম বয়সী পরিবারের সদস্য ছাড়া ড্রাইভিং করার সময়ঃ সকাল 1 টা থেকে 5 টার মধ্যে কোন গাড়ি চালানো না হলে, যদি না একজন অভিভাবক, অভিভাবক বা লাইসেন্সপ্রাপ্ত ড্রাইভারের সাথে কমপক্ষে 25 বছর বয়সী নিরাপদে গাড়ি চালানোর এক বছর পরে রাত্রিকালীন বিধিনিষেধের মেয়াদ শেষ হয় মধ্যবর্তী লাইসেন্স আইন সেল ফোন ব্যবহার সীমিত এবং আপনি গাড়ি চালানোর সময় ওয়্যারলেস কমিউনিকেশন ডিভাইস, এমনকি হ্যান্ডস-ফ্রি প্রযুক্তি সহ। আপনি শুধুমাত্র একটি জরুরী রিপোর্ট করতে আপনার ফোন ব্যবহার করতে পারেন.</p>", "<p>যাত্রীরা | 20 বছরের কম বয়সী কোন যাত্রী নেই তাৎক্ষণিক পরিবারের সদস্য ব্যতীত | 3 জনের বেশি যাত্রী নেই  20 বছরের কম বয়সী পরিবারের সদস্য ছাড়া। ড্রাইভিং করার সময়ঃ | সকাল 1 টা থেকে 5 টার মধ্যে কোন গাড়ি চালানো না হলে, যদি না একজন অভিভাবক, অভিভাবক বা লাইসেন্সপ্রাপ্ত ড্রাইভারের সাথে কমপক্ষে 25 বছর বয়সী | নিরাপদে গাড়ি চালানোর এক বছর পরে রাত্রিকালীন বিধিনিষেধের মেয়াদ শেষ হয়। মধ্যবর্তী লাইসেন্স আইন সেল ফোন ব্যবহার সীমিত এবং আপনি গাড়ি চালানোর সময় ওয়্যারলেস কমিউনিকেশন ডিভাইস, এমনকি হ্যান্ডস-ফ্রি প্রযুক্তি সহ। আপনি শুধুমাত্র একটি জরুরী রিপোর্ট করতে আপনার ফোন ব্যবহার করতে পারেন.</p>"],
];

const introTranslations = new Map([
  ['SLOW', 'ধীরে গতি কমান'],
  ['DOWNMOVE', 'সরে যান'],
  ['OVERSTATE LAW', 'সরে যাওয়ার আইন'],
  ['Everyone', 'সবাই'],
  ['gets home safe.', 'নিরাপদে বাড়ি ফিরুন।'],
  ['OVERSTATE LAWMove over 200 feet before', 'সরে যাওয়ার আইন: ঘটনাস্থলের আগে'],
  ['and after the scene.', 'ও পরে ২০০ ফুট দূরে সরে যান।'],
  ['Slow down to 10 mph below', 'গতিসীমার চেয়ে ১০ মাইল/ঘণ্টা কম গতিতে চলুন'],
  ['the posted speed limit.', 'পোস্ট করা গতিসীমা।'],
  ['EMERGENCY', 'জরুরি'],
  ['SCENE', 'ঘটনাস্থল'],
  ['AHEAD', 'সামনে'],
  ['Car crashes are a leading cause of death', 'গাড়ি দুর্ঘটনা মৃত্যুর একটি প্রধান কারণ'],
  ['and injury for young drivers in America.', 'এবং আমেরিকার তরুণ চালকদের আহত হওয়ার কারণ।'],
  ['KNOW THE CRASH RISKS', 'দুর্ঘটনার ঝুঁকি জানুন'],
  ['for ages', 'বয়সসীমার জন্য'],
  ['Distracted Driving | Teen PassengersDrugs and Alcohol | Speed | FatigueNo Seatbelts', 'বিক্ষিপ্তভাবে গাড়ি চালানো | কিশোর যাত্রী | মাদক ও অ্যালকোহল | গতি | ক্লান্তি | সিটবেল্ট না পরা'],
  ['Night DrivingWet Roads', 'রাতে গাড়ি চালানো | ভেজা রাস্তা'],
  ['Inexperience', 'অনভিজ্ঞতা'],
  ['How many people are killed', 'প্রতি বছর কতজন নিহত হন'],
  ['on America’s roads each year?', 'আমেরিকার রাস্তায়?'],
  ['What should Washington’s', 'ওয়াশিংটনের'],
  ['Traffic death goal be?', 'ট্রাফিক মৃত্যুর লক্ষ্য কত হওয়া উচিত?'],
  ['English', 'ইংরেজি'],
  ['520-400 (R/4/25)', '৫২০-৪০০ (R/4/25)'],
]);

const css = `
figure.source-art { margin: 24px 0; padding: 12px; background: #fff; border: 1px solid #d8d8d8; border-radius: 8px; }
figure.source-art img { display: block; width: 100%; height: auto; }
figure.source-art figcaption { margin-top: 8px; color: #555; font-size: .85rem; }
 .quiz { background: #eef6ff; border: 1px solid #b7d4f2; padding: 16px; border-radius: 10px; margin: 24px 0; }
 .quiz-question { margin: 18px 0; padding: 12px; background: #fff; border-radius: 8px; }
 .quiz-question legend { font-weight: 700; margin-bottom: 8px; }
 .quiz-option { display: block; margin: 7px 0; }
 .quiz button { background: #003087; color: #fff; border: 0; border-radius: 6px; padding: 9px 14px; cursor: pointer; }
 .quiz-result { margin-top: 12px; font-weight: 700; }
.bn-mode .bn-fallback { display: block !important; }
table.comparison { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: .95rem; }
table.comparison caption { text-align: left; font-weight: 700; margin-bottom: 6px; }
table.comparison th, table.comparison td { border: 1px solid #bbb; padding: 8px; vertical-align: top; text-align: left; }
table.comparison th { background: #eef4fb; }
@media (max-width: 600px) { table.comparison { display: block; overflow-x: auto; white-space: normal; } }
@media print { @page { margin: 14mm; } body { max-width: none; padding: 0; background: #fff; } .lang-toggle { display: none !important; } .toc { break-after: page; } section { break-inside: avoid; box-shadow: none; } figure.source-art { break-inside: avoid; } a { color: inherit; text-decoration: none; } }
section h3 { margin-top: 24px; margin-bottom: 8px; color: #005a9e; font-size: 1.05rem; line-height: 1.35; }
section h3:first-child { margin-top: 0; }
@media print { section h3 { break-after: avoid; } }
`;

function appendix(unified, isBengali) {
  if (unified) {
    return `<section id="source-illustrations" class="source-illustrations">\n<h2 class="en-text">Source illustrations</h2>\n<h2 class="bn-text">মূল দৃষ্টান্ত</h2>\n<p class="en-text">These instructional illustrations are reproduced from the original Washington Driver Guide. Source-page numbers refer to the original PDF. Sign artwork retains the English wording used on actual roadway signs.</p>\n<p class="bn-text">এই চিত্রগুলো মূল ওয়াশিংটন ড্রাইভার গাইডের ইংরেজি পাতা থেকে হুবহু পুনরুৎপাদন করা হয়েছে, অডিট ও যাচাইয়ের জন্য। ছবির ভেতরের লেখা তাই ইংরেজিতেই থাকে — এই গাইডের বাংলা পাঠ্যাংশে একই তথ্য অনুবাদ করা আছে। উৎস-পৃষ্ঠা নম্বরগুলো মূল PDF নির্দেশ করে। প্রকৃত রাস্তার চিহ্নে ব্যবহৃত ইংরেজি শব্দ সাইন আর্টওয়ার্কে অপরিবর্তিত রাখা হয়েছে।</p>\n${sourcePages.map(([page, caption, captionBn]) => `<figure class="source-art"><img src="assets/source-pages/page-${page}.jpg" alt="${caption}; original PDF page ${page}"><figcaption><span class="en-text">${caption} — original PDF page ${page}.</span><span class="bn-text">${captionBn} — মূল ইংরেজি পাতার প্রতিলিপি, PDF পৃষ্ঠা ${page}।</span></figcaption></figure>`).join('\n')}\n</section>`;
  }
  if (isBengali) {
    return `<section id="source-illustrations" class="source-illustrations">\n<h2>মূল দৃষ্টান্ত</h2>\n<p>এই চিত্রগুলো মূল ওয়াশিংটন ড্রাইভার গাইডের ইংরেজি পাতা থেকে হুবহু পুনরুৎপাদন করা হয়েছে, অডিট ও যাচাইয়ের জন্য। ছবির ভেতরের লেখা তাই ইংরেজিতেই থাকে — এই গাইডের বাংলা পাঠ্যাংশে একই তথ্য অনুবাদ করা আছে। উৎস-পৃষ্ঠা নম্বরগুলো মূল PDF নির্দেশ করে। প্রকৃত রাস্তার চিহ্নে ব্যবহৃত ইংরেজি শব্দ সাইন আর্টওয়ার্কে অপরিবর্তিত রাখা হয়েছে।</p>\n${sourcePages.map(([page, caption, captionBn]) => `<figure class="source-art"><img src="assets/source-pages/page-${page}.jpg" alt="${captionBn}; মূল PDF পৃষ্ঠা ${page}" loading="lazy"><figcaption>${captionBn} — মূল ইংরেজি পাতার প্রতিলিপি, PDF পৃষ্ঠা ${page}।</figcaption></figure>`).join('\n')}\n</section>`;
  }
  return `<section id="source-illustrations" class="source-illustrations">\n<h2>Source illustrations</h2>\n<p>These instructional illustrations are reproduced from the original Washington Driver Guide. Source-page numbers refer to the original PDF. Sign artwork retains the English wording used on actual roadway signs.</p>\n${sourcePages.map(([page, caption]) => `<figure class="source-art"><img src="assets/source-pages/page-${page}.jpg" alt="${caption}; original PDF page ${page}" loading="lazy"><figcaption>${caption} — original PDF page ${page}.</figcaption></figure>`).join('\n')}\n</section>`;
}

function insertSectionIllustrations(html, unified, isBengali) {
  for (const [section, page, en, bn] of sectionIllustrations) {
    if (html.includes(`data-source-page="${page}"`)) continue;
    const figure = unified
      ? `<figure class="source-art in-section" data-source-page="${page}"><img src="assets/source-pages/page-${page}.jpg" alt="${en}; original PDF page ${page}"><figcaption><span class="en-text">${en} — original PDF page ${page}.</span><span class="bn-text">${bn} — মূল ইংরেজি পাতার প্রতিলিপি, PDF পৃষ্ঠা ${page}। নিচের লেখাই মূল বাংলা বিবরণ।</span></figcaption></figure>`
      : `<figure class="source-art in-section" data-source-page="${page}"><img src="assets/source-pages/page-${page}.jpg" alt="${isBengali ? bn : en}; original PDF page ${page}"><figcaption>${isBengali ? `${bn} — মূল ইংরেজি পাতার প্রতিলিপি, PDF পৃষ্ঠা ${page}। নিচের লেখাই মূল বাংলা বিবরণ।` : `${en} — original PDF page ${page}.`}</figcaption></figure>`;
    html = html.replace(`<section id="${section}">`, `<section id="${section}">\n${figure}`);
  }
  return html;
}

function quiz() {
  return `<section id="quiz" class="quiz"><h2 class="en-text">Practice quiz</h2><h2 class="bn-text">অনুশীলনী কুইজ</h2><p class="en-text">Test what you learned. Select one answer for each question.</p><p class="bn-text">আপনি যা শিখেছেন তা যাচাই করুন। প্রতিটি প্রশ্নে একটি উত্তর বেছে নিন।</p>
<form id="driver-quiz"><fieldset class="quiz-question"><legend><span class="en-text">1. What should you do at a solid red light?</span><span class="bn-text">১. স্থির লাল বাতিতে কী করবেন?</span></legend><label class="quiz-option"><input type="radio" name="q1" value="a"> <span class="en-text">Stop and wait until it is safe and legal to proceed.</span><span class="bn-text">থামুন এবং নিরাপদ ও আইনসম্মতভাবে চলার সময় পর্যন্ত অপেক্ষা করুন।</span></label><label class="quiz-option"><input type="radio" name="q1" value="b"> <span class="en-text">Speed up to clear the intersection.</span><span class="bn-text">চৌরাস্তা পার হতে গতি বাড়ান।</span></label></fieldset>
<fieldset class="quiz-question"><legend><span class="en-text">2. How should you check a blind zone?</span><span class="bn-text">২. ব্লাইন্ড জোন কীভাবে পরীক্ষা করবেন?</span></legend><label class="quiz-option"><input type="radio" name="q2" value="a"> <span class="en-text">Use mirrors only.</span><span class="bn-text">শুধু আয়না ব্যবহার করুন।</span></label><label class="quiz-option"><input type="radio" name="q2" value="b"> <span class="en-text">Check mirrors and look over your shoulder.</span><span class="bn-text">আয়না দেখুন এবং কাঁধের ওপর দিয়ে তাকান।</span></label></fieldset>
<fieldset class="quiz-question"><legend><span class="en-text">3. What is the safest response to a stopped school bus with flashing red lights?</span><span class="bn-text">৩. লাল বাতি জ্বলা থেমে থাকা স্কুল বাস দেখলে সবচেয়ে নিরাপদ কাজ কী?</span></legend><label class="quiz-option"><input type="radio" name="q3" value="a"> <span class="en-text">Stop as required and watch for children.</span><span class="bn-text">আইন অনুযায়ী থামুন এবং শিশুদের দিকে নজর রাখুন।</span></label><label class="quiz-option"><input type="radio" name="q3" value="b"> <span class="en-text">Pass using the center turn lane.</span><span class="bn-text">মাঝের টার্ন লেন ব্যবহার করে পাশ কাটান।</span></label></fieldset>
<fieldset class="quiz-question"><legend><span class="en-text">4. What does zipper merging mean?</span><span class="bn-text">৪. জিপার মার্জিং বলতে কী বোঝায়?</span></legend><label class="quiz-option"><input type="radio" name="q4" value="a"> <span class="en-text">Use both lanes and take turns merging.</span><span class="bn-text">দুই লেন ব্যবহার করে পালা করে একীভূত হওয়া।</span></label><label class="quiz-option"><input type="radio" name="q4" value="b"> <span class="en-text">Move into the other lane as early as possible.</span><span class="bn-text">যত তাড়াতাড়ি সম্ভব অন্য লেনে চলে যাওয়া।</span></label></fieldset>
<fieldset class="quiz-question"><legend><span class="en-text">5. If a collision involves power lines, what should you generally do?</span><span class="bn-text">৫. সংঘর্ষে বিদ্যুৎ লাইন জড়িত হলে সাধারণত কী করবেন?</span></legend><label class="quiz-option"><input type="radio" name="q5" value="a"> <span class="en-text">Stay in the vehicle, call 911, and wait for instructions.</span><span class="bn-text">গাড়ির ভেতরে থাকুন, ৯১১-এ কল করুন এবং নির্দেশের অপেক্ষা করুন।</span></label><label class="quiz-option"><input type="radio" name="q5" value="b"> <span class="en-text">Immediately touch the vehicle to test whether it is energized.</span><span class="bn-text">বিদ্যুৎ আছে কি না পরীক্ষা করতে সঙ্গে সঙ্গে গাড়ি স্পর্শ করুন।</span></label></fieldset><button type="button" onclick="gradeQuiz()"><span class="en-text">Check answers</span><span class="bn-text">উত্তর যাচাই করুন</span></button><div id="quiz-result" class="quiz-result" aria-live="polite"></div></form></section>`;
}

function normalizeLineWrappedParagraphs(html) {
  let changed = true;
  while (changed) {
    changed = false;
    html = html.replace(/<p class="en-text">([^<]*)<\/p>\s*<p class="bn-text">([^<]*)<\/p>\s*<p class="en-text">([^<]*)<\/p>\s*<p class="bn-text">([^<]*)<\/p>/g, (whole, first, firstBn, second, secondBn) => {
      const a = first.trim();
      const b = second.trim();
      const sentenceEnds = /[.!?;:]$/u.test(a);
      const lowerContinuation = /^[a-z]/u.test(b);
      const bengaliContinuation = /[\u0980-\u09ff]/u.test(secondBn) && firstBn.length > 25 && secondBn.length > 20;
      if (!sentenceEnds && (lowerContinuation || bengaliContinuation)) {
        changed = true;
        return `<p class="en-text">${a} ${b}</p><p class="bn-text">${firstBn.trim()} ${secondBn.trim()}</p>`;
      }
      return whole;
    });
    html = html.replace(/<p>([^<]*)<\/p>\s*<p>([^<]*)<\/p>/g, (whole, first, second) => {
      const a = first.trim();
      const b = second.trim();
      const sentenceEnds = /[.!?;:]$/u.test(a);
      const lowerContinuation = /^[a-z]/u.test(b);
      const bengaliContinuation = /[\u0980-\u09ff]/u.test(b) && a.length > 25 && b.length > 20;
      if (!sentenceEnds && (lowerContinuation || bengaliContinuation)) {
        changed = true;
        changed = true;
        return `<p>${a} ${b}</p>`;
      }
      return whole;
    });
  }
  return html;
}

function promoteSubheadings(html, unified) {
  if (unified) {
    return html.replace(/<p class="en-text">([A-Z][A-Z0-9 &'’/().,:\-]{2,70})<\/p>\s*<p class="bn-text">([^<]{2,100})<\/p>/g, '<h3 class="en-text">$1</h3><h3 class="bn-text">$2</h3>');
  }
  return html.replace(/<p>([A-Z][A-Z0-9 &'’/().,:\-]{2,70})<\/p>/g, '<h3>$1</h3>');
}

function comparisonTable(bengali = false) {
  if (bengali) return `<table class="comparison" aria-label="স্ট্যান্ডার্ড এবং এনহ্যান্সড পরিচয়পত্রের ব্যবহার"><caption>স্ট্যান্ডার্ড ও এনহ্যান্সড ড্রাইভার লাইসেন্স/আইডি</caption><thead><tr><th>ব্যবহার</th><th>স্ট্যান্ডার্ড</th><th>এনহ্যান্সড</th></tr></thead><tbody><tr><td>পরিচয়</td><td>হ্যাঁ</td><td>হ্যাঁ</td></tr><tr><td>মোটরযান চালানো (শুধুমাত্র ড্রাইভার লাইসেন্স)</td><td>হ্যাঁ</td><td>হ্যাঁ</td></tr><tr><td>দেশীয় বিমান ভ্রমণ</td><td>না</td><td>হ্যাঁ</td></tr><tr><td>আন্তর্জাতিক বিমান ভ্রমণ</td><td>না</td><td>না</td></tr><tr><td>স্থল বা সমুদ্রপথে আন্তর্জাতিক সীমান্ত অতিক্রম</td><td>না</td><td>হ্যাঁ (কানাডা, মেক্সিকো, ক্যারিবিয়ান)</td></tr><tr><td>ফেডারেল স্থাপনায় প্রবেশাধিকার</td><td>না</td><td>হ্যাঁ</td></tr><tr><td>REAL ID মান পূরণ</td><td>না</td><td>হ্যাঁ</td></tr></tbody></table>`;
  return `<table class="comparison" aria-label="Standard and Enhanced ID comparison"><caption>Standard and Enhanced Driver License/ID</caption><thead><tr><th>Use</th><th>Standard</th><th>Enhanced</th></tr></thead><tbody><tr><td>Identification</td><td>Yes</td><td>Yes</td></tr><tr><td>Operating a motor vehicle (driver license only)</td><td>Yes</td><td>Yes</td></tr><tr><td>Domestic air travel</td><td>No</td><td>Yes</td></tr><tr><td>International air travel</td><td>No</td><td>No</td></tr><tr><td>International border crossing by land or sea</td><td>No</td><td>Yes (Canada, Mexico, Caribbean)</td></tr><tr><td>Access to federal facilities</td><td>No</td><td>Yes</td></tr><tr><td>Meets REAL ID standards</td><td>No</td><td>Yes</td></tr></tbody></table>`;
}

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const illustrationSections = [...html.matchAll(/<section id="source-illustrations"[\s\S]*?<\/section>/g)];
  if (illustrationSections.length > 1) {
    for (let i = illustrationSections.length - 1; i > 0; i--) {
      const { index } = illustrationSections[i];
      html = html.slice(0, index) + html.slice(index + illustrationSections[i][0].length);
    }
  }
  const isBengali = file.includes('bengali');
  for (const [pattern, replacement] of replacements) html = html.replace(pattern, replacement);
  for (const [english, bengali] of introTranslations) {
    if (file.includes('unified')) {
      html = html.split(`<p class="en-text bn-fallback">${english}</p>`).join(`<p class="en-text">${english}</p><p class="bn-text">${bengali}</p>`);
    } else if (isBengali) {
      html = html.split(`<p>${english}</p>`).join(`<p>${bengali}</p>`);
    }
  }
  if (file.includes('unified')) html = html.replace('<p class="en-text bn-fallback">Lo</p>', '');
  if (isBengali) html = html.replace('<p>Lo</p>', '');
  const coherentEnBn = `<p class="en-text">SLOW DOWN</p><p class="bn-text">গতি কমান</p>\n<p class="en-text">MOVE OVER — STATE LAW</p><p class="bn-text">সরে যান — রাজ্য আইন</p>\n<p class="en-text">Everyone gets home safe.</p><p class="bn-text">সবাই নিরাপদে বাড়ি ফিরুক।</p>\n<p class="en-text">Move over 200 feet before and after the emergency scene.</p><p class="bn-text">জরুরি ঘটনাস্থলের আগে ও পরে ২০০ ফুট দূরে সরে যান।</p>\n<p class="en-text">Slow down to 10 mph below the posted speed limit.</p><p class="bn-text">পোস্ট করা গতিসীমার চেয়ে ঘণ্টায় ১০ মাইল কম গতিতে চলুন।</p>\n<p class="en-text">EMERGENCY SCENE AHEAD</p><p class="bn-text">সামনে জরুরি ঘটনাস্থল</p>\n<p class="en-text">Car crashes are a leading cause of death and injury for young drivers in America.</p><p class="bn-text">আমেরিকায় তরুণ চালকদের মৃত্যু ও আহত হওয়ার অন্যতম প্রধান কারণ গাড়ি দুর্ঘটনা।</p>\n<p class="en-text">KNOW THE CRASH RISKS FOR YOUR AGE GROUP</p><p class="bn-text">আপনার বয়সের জন্য দুর্ঘটনার ঝুঁকি সম্পর্কে জানুন</p>\n<p class="en-text">Distracted driving · teen passengers · drugs and alcohol · speed · fatigue · no seat belts · night driving · wet roads · inexperience</p><p class="bn-text">বিক্ষিপ্তভাবে গাড়ি চালানো · কিশোর যাত্রী · মাদক ও অ্যালকোহল · অতিরিক্ত গতি · ক্লান্তি · সিটবেল্ট না পরা · রাতে গাড়ি চালানো · ভেজা রাস্তা · অনভিজ্ঞতা</p>\n<p class="en-text">How many people are killed on America’s roads each year?</p><p class="bn-text">প্রতি বছর আমেরিকার সড়কে কতজন মানুষ মারা যান?</p>\n<p class="en-text">What should Washington’s traffic-death goal be?</p><p class="bn-text">ওয়াশিংটনের ট্রাফিক-মৃত্যুর লক্ষ্যমাত্রা কত হওয়া উচিত?</p>\n<p class="en-text">520-400 (R/4/25)</p><p class="bn-text">৫২০-৪০০ (R/4/25)</p>\n<p class="en-text">English</p><p class="bn-text">ইংরেজি</p>`;
  if (file.includes('unified')) html = html.replace(/<p class="en-text">SLOW<\/p>[\s\S]*?<p class="bn-text">ইংরেজি<\/p>/, coherentEnBn);
  if (isBengali) html = html.replace(/<p>ধীরে গতি কমান<\/p>[\s\S]*?<p>ইংরেজি<\/p>/, coherentEnBn.replace(/<p class="en-text">[^<]*<\/p>/g, '').replace(/ class="bn-text"/g, '').replace(/<p>English<\/p>/g, '<p>ইংরেজি</p>'));
  html = normalizeLineWrappedParagraphs(html);
  const coherentLargeVehicleBn = [
    ['থামছে। বড় যানবাহন ছোট হিসাবে দ্রুত থামাতে পারে না যানবাহন সঠিকভাবে সামঞ্জস্য করা ব্রেক সহ একটি লোড করা ট্রাক লাগে, সম্পূর্ণ স্টপে আসতে 55 মাইল, 450 ফুট বেগে ভ্রমণ করে।', 'থামার সময়। বড় যানবাহন ছোট গাড়ির মতো দ্রুত থামতে পারে না। সঠিকভাবে সামঞ্জস্য করা ব্রেকসহ ঘণ্টায় ৫৫ মাইল গতিতে চলা একটি বোঝাই ট্রাক পুরোপুরি থামতে ৪৫০ ফুট দূরত্ব প্রয়োজন।'],
    ['মার্জিং। বড় গাড়ির সামনে ট্রাফিক প্রবেশ করার সময়, অপেক্ষা করুন যতক্ষণ না আপনি তাদের সামনে একত্রিত হওয়ার আগে আপনার রিয়ারভিউ আয়নায় তাদের দুটি হেডলাইট স্পষ্টভাবে দেখতে পাচ্ছেন।', 'একীভূত হওয়া। বড় গাড়ির সামনে লেনে ঢোকার সময়, তার সামনে ঢোকার আগে রিয়ারভিউ আয়নায় গাড়িটির দুটি হেডলাইট স্পষ্টভাবে দেখা পর্যন্ত অপেক্ষা করুন।'],
    ['বাঁক স্থান. কিছু আঘাত এড়াতে, বড় যানবাহন একটি বাঁক সম্পূর্ণ করার জন্য একাধিক লেনের প্রয়োজন হতে পারে।', 'বাঁক নেওয়ার জায়গা। কোনো কিছুর সঙ্গে ধাক্কা এড়াতে বড় গাড়ির বাঁক সম্পূর্ণ করতে একাধিক লেন প্রয়োজন হতে পারে।'],
  ];
  for (const [bad, good] of coherentLargeVehicleBn) html = html.split(bad).join(good);
  if (file.includes('unified')) {
    html = html.replace(/<p class="en-text">([^<]{20,})<\/p>\s*<p class="bn-text">([^<]{20,})<\/p>\s*<p class="en-text">([a-z][^<]{20,})<\/p>\s*<p class="bn-text">([^<]{20,})<\/p>/g, '<p class="en-text">$1 $3</p><p class="bn-text">$2 $4</p>');
  } else {
    html = html.replace(/<p>([^<]{20,})<\/p>\s*<p>([a-z][^<]{20,})<\/p>/g, '<p>$1 $2</p>');
  }
  html = promoteSubheadings(html, file.includes('unified'));
  html = insertSectionIllustrations(html, file.includes('unified'), isBengali);
  html = html.replace(/ loading="lazy"/g, '');
  if (file.includes('unified')) {
    html = html.replace(/<([a-z0-9]+) class="en-text">([\s\S]*?)<\/\1>\s*<\1 class="bn-text">\2<\/\1>/g, '<$1 class="en-text bn-fallback">$2</$1>');
  }
  html = html.replace('<html lang="bn">', '<html lang="bn" dir="ltr">');
  html = html.replace('<html lang="en">', '<html lang="en" dir="ltr">');
  if (!html.includes('/* driver-guide-remediation-css */')) html = html.replace('</style>', `/* driver-guide-remediation-css */\n${css}\n</style>`);
  if (!file.includes('unified') && !html.includes('quiz-language-css')) {
    const quizLanguageCss = isBengali ? '.quiz .en-text { display: none; }' : '.quiz .bn-text { display: none; }';
    html = html.replace('</style>', `/* quiz-language-css */ ${quizLanguageCss}\n</style>`);
  }
  html = html.replace(/<ul(?: class="[^"]+")?>\n<li><\/li>\n<\/ul>/g, '');
  if (!html.includes('aria-label="Standard and Enhanced ID comparison"') && !html.includes('aria-label="স্ট্যান্ডার্ড এবং এনহ্যান্সড পরিচয়পত্রের ব্যবহার"')) {
    if (file.includes('unified')) {
      html = html.replace(/(<section id="sec7">[\s\S]*?<\/h2>)/, `$1\n<div class="en-text">${comparisonTable()}</div><div class="bn-text">${comparisonTable(true)}</div>`);
    } else {
      html = html.replace(/(<section id="sec7">[\s\S]*?<\/h2>)/, `$1\n${comparisonTable(isBengali)}`);
    }
  }
  // Keep the comparison table content current even when a stale version was already inserted by a prior run.
  html = html.replace(/<table class="comparison" aria-label="Standard and Enhanced ID comparison">[\s\S]*?<\/table>/, comparisonTable());
  html = html.replace(/<table class="comparison" aria-label="স্ট্যান্ডার্ড এবং এনহ্যান্সড পরিচয়পত্রের ব্যবহার">[\s\S]*?<\/table>/, comparisonTable(true));
  // The 1.6 ID-comparison content was extracted from two source pages (standard vs. enhanced ID) into two
  // separate sections (sec7, sec8) with the same heading and leftover unmerged label fragments. Collapse
  // into the single sec7 section, which already carries the merged two-column table, and drop sec8's TOC entry.
  {
    const sec7Sec8 = html.match(/<section id="sec7">([\s\S]*?)<\/section>\s*<section id="sec8">[\s\S]*?<\/section>/);
    if (sec7Sec8) {
      const headings = [...sec7Sec8[1].matchAll(/<h2[^>]*>[\s\S]*?<\/h2>/g)].map((m) => m[0]).join('\n');
      const tableMarkup = [...sec7Sec8[1].matchAll(/<div class="(?:en|bn)-text"><table class="comparison"[\s\S]*?<\/table><\/div>|<table class="comparison"[\s\S]*?<\/table>/g)].map((m) => m[0]).join('');
      html = html.slice(0, sec7Sec8.index) + `<section id="sec7">\n${headings}\n${tableMarkup}\n</section>` + html.slice(sec7Sec8.index + sec7Sec8[0].length);
    }
    html = html.replace(/\n<a href="#sec8"[^>]*>[^<]*<\/a>/g, '');
  }
  if (!html.includes('id="quiz"')) html = html.replace('</body>', `${quiz()}\n</body>`);
  if (!html.includes('id="source-illustrations"')) html = html.replace('</body>', `${appendix(file.includes('unified'), isBengali)}\n</body>`);
  if (html.includes('id="source-illustrations"') && ((isBengali && !file.includes('unified') && html.includes('<h2>Source illustrations</h2>')) || (file.includes('unified') && !html.includes('<h2 class="bn-text">মূল দৃষ্টান্ত</h2>')))) {
    const oldAppendixMatch = html.match(/<section id="source-illustrations"[\s\S]*?<\/section>/);
    if (oldAppendixMatch) html = html.replace(oldAppendixMatch[0], appendix(file.includes('unified'), isBengali));
  }
  if (!html.includes('function gradeQuiz')) html = html.replace('</script>', `function gradeQuiz() { const answers = {q1:'a', q2:'b', q3:'a', q4:'a', q5:'a'}; let score = 0; for (const [q, answer] of Object.entries(answers)) { const selected = document.querySelector('input[name="' + q + '"]:checked'); if (selected && selected.value === answer) score++; } const result = document.getElementById('quiz-result'); result.textContent = document.documentElement.lang === 'bn' ? ('আপনার স্কোর: ' + score + '/5') : ('Your score: ' + score + '/5'); }\n</script>`);
  if (!html.includes('name="description"')) {
    html = html.replace(/<title>[^<]*<\/title>/, (m) => `${m}\n<meta name="description" content="Washington State Driver Guide">`);
  }
  fs.writeFileSync(file, html);
}
