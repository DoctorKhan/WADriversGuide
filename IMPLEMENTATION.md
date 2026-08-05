# Driver Guide HTML/PDF remediation plan

## Scope

Bring the English, Bengali, and unified guide outputs into a publishable web format while preserving the Washington DOL source content and clearly identifying information that is not safe to infer from a PDF text extraction.

## Work items

1. **Extraction cleanup**
   - Remove cover, campaign, social-media, and raw table-of-contents fragments from the body content.
   - Repair ligatures, split words, duplicated phrases, and missing spaces introduced by positioned PDF text.
   - Keep the guide's actual introduction and disclaimer as normal content.

2. **Semantic HTML and navigation**
   - Use one heading per section and heading elements for subsection labels.
   - Represent comparisons, restrictions, legal thresholds, and classifications as accessible tables with captions and header cells.
   - Ensure section IDs and TOC targets are unique and that the two ID-comparison pages are represented as one section with two labeled columns.
   - Add `lang`, `dir`, focus-visible styles, responsive table behavior, and meaningful image `alt` text.

3. **Source artwork**
   - Restore instructional artwork from the original PDF for ID comparisons, occupant protection, steering, vehicle dynamics, blind zones, traffic controls/signs, intersections, markings, parking, merging, visibility, adverse conditions, collisions, and traffic stops.
   - Omit only decorative cover/chapter art and repeated branding where the surrounding text remains complete.
   - Use source-page metadata for every restored image so it can be audited.

4. **Translation quality**
   - Translate every Bengali prose element, heading, TOC entry, caption, and table label; retain English only for URLs, statutory citations, acronyms, and words that appear on real road signs.
   - Replace literal or misleading safety/legal terminology with fluent Bengali equivalents.
   - Have a fluent Bengali reviewer verify all safety rules, thresholds, penalties, and agency names before publication.

5. **Rendering and QA**
   - Disable browser print headers/footers and local file-path leakage.
   - Validate HTML, check keyboard/mobile behavior, verify all internal links, and compare every restored table/image against the source PDF.
   - Re-render English, Bengali, and unified PDFs and inspect representative pages plus the final disclaimer.

## Execution status

- [x] Audit findings recorded.
- [x] Extraction cleanup and semantic scaffolding applied to the delivered HTML files.
- [x] Critical source-artwork references added to the HTML outputs.
- [x] Print CSS and accessibility metadata added.
- [x] Regenerated PDFs with artwork embedded and browser headers/footers disabled (`output/driver-guide-*.pdf`); prior generated PDFs are retained under `output/original-pdf/`.
- [x] Collapsed exact English/Bengali duplicate nodes in the unified toggle; untranslated content now appears once as an explicit English fallback instead of twice.
- [x] Added a five-question bilingual practice quiz with interactive scoring in HTML and printable questions in PDF.
- [x] Embedded source illustrations directly in traffic-light, sign, intersection, road-marking, and parking sections; the reference gallery remains available at the end.
- [x] Merged the duplicate 1.6 ID-comparison section (previously split across two sections with an incomplete table) into one section with a complete 7-row Standard/Enhanced comparison, in all three files.
- [x] Fixed ~20 missing-space/missing-punctuation extraction artifacts (e.g. "Flashing RedStop.", the intermediate-license restrictions/penalty table) across English, Bengali, and unified.
- [x] Machine-translated the remaining 243 English-only prose blocks in `driver-guide-bengali.html` to Bengali (previously untranslated: several full subsections — Informed Decisions on the Road, Sharing with School Buses, Sharing with Agricultural Vehicles, Traffic Laws, and all of 5.10 Law Enforcement/Getting Pulled Over — plus scattered paragraphs elsewhere). This is a first-pass machine translation, not yet human-reviewed; see the open item below.
- [x] Audited all 27 embedded source-page images against their actual content and found the caption/page-topic metadata (`sourcePages` and `sectionIllustrations` in `scripts/remediate-html.mjs`) was wrong for about 20 of them — e.g. the page labeled "Blind zones" actually showed vehicle roll/yaw, and the image embedded inline in the "4.13 Common Intersections" section actually showed regulatory prohibition signs. Corrected all captions and the inline section→image assignments in all three files.
- [x] Clarified figure captions to state explicitly that embedded source-page images are reproductions of the original English PDF page (kept for audit purposes) and that the surrounding prose carries the translation, rather than cropping the images — the images are low-resolution (378×603px) scans with diagrams and text interleaved throughout, so a clean text-only crop wasn't achievable without visibly degrading the image.
- [ ] Full Bengali translation review by a fluent human reviewer — now covers the newly machine-translated content above in addition to the original translation pass.
- [ ] Final visual/legal sign-off against the source PDF.

The two unchecked items are human review gates; automated work must not claim that a machine translation is legally or safety accurate without that review.
