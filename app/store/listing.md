# Store listing: PULSE Daily

Copy these into App Store Connect and Google Play Console. Character limits are in brackets.
Screenshots are in `store/screenshots` (rebuild with `npm run build && node scripts/make-screenshots.cjs`).

## Shared

- **Privacy policy URL:** https://https-pulse-dailygame-netlify-app.pages.dev/privacy.html
- **Support / website URL:** https://https-pulse-dailygame-netlify-app.pages.dev/
- **Support email:** tbookatz@gmail.com
- **Price:** Free. No in-app purchases in this version.

## Apple App Store

| Field | Value |
| --- | --- |
| Name [30] | PULSE Daily (fallback if taken: PULSE Daily: Memory Game) |
| Subtitle [30] | One memory pattern a day |
| Primary category | Games, then Puzzle |
| Secondary category | Games, then Casual |
| Keywords [100] | memory,pattern,daily,puzzle,brain,sequence,streak,focus,reflex,lights,colour,training,quick |
| Copyright | 2026 (your full name) |
| Age rating | Answer "None" or "No" to every question. Result: 4+ |
| Devices | iPhone only (it still runs on iPad in iPhone mode) |

**Promotional text [170]**
A new pattern and a new twist every day. Watch the pads light up, repeat the pattern and see how far you get. One minute, no sign-up, works offline.

**Description [4000]**
PULSE is a one-minute memory game with a new pattern every day.

Watch nine glowing pads flash in sequence, then tap them back. Each round adds one more step. Miss three and your run is over. Everyone plays the same pattern on the same day, so you can compare scores with friends.

A NEW TWIST EVERY DAY
Each day brings a rule change that keeps you on your toes:
• Classic: repeat the pattern exactly
• Mirror: tap the mirror image, left and right swapped
• Reverse: play it backwards, last pad first
• Ghost: flashes are lightning quick
• Surge: everything runs 40% faster

BUILT TO BE SHARED
Your run becomes a grid of green and red squares you can paste into any group chat without spoiling the pattern.

KEEP YOUR STREAK
Track your day streak, best score and the last five weeks at a glance. Turn on a gentle daily reminder if you like. It skips the days you've already played.

PRIVATE BY DESIGN
No account, no ads and no tracking. Your scores stay on your phone, and the game works with no internet connection.

Health warning: PULSE uses flashing lights. Do not play if you or anyone in your family has epilepsy or a history of seizures.

**App Privacy (nutrition label):** choose "Data Not Collected".

**Export compliance:** already answered in the app (it uses no encryption), so App Store Connect won't ask.

**Notes for the reviewer**
PULSE is a daily memory game. No sign-in is needed and every feature is available straight away. The game works fully offline. Tap Stats at the top right to see the stats screen and turn on the optional daily reminder (a local notification, no server). There are no purchases, ads or external payment links in the app.

## Google Play

| Field | Value |
| --- | --- |
| App name [30] | PULSE Daily |
| Short description [80] | A one-minute memory game with a new pattern and twist every day. |
| Category | Game, then Puzzle |
| Tags | Memory, Puzzle, Casual, Offline |
| Contains ads | No |
| In-app purchases | No |
| Target audience | 13 and over (keeps you out of the stricter Families programme; the game itself suits all ages) |
| Content rating (IARC) | Category "Puzzle". Answer No to violence, fear, sexuality, language, drugs, gambling, user interaction and location sharing. Expected result: PEGI 3 / Everyone |
| Data safety | "No data collected" and "No data shared". Data is not encrypted in transit because none is sent. No account creation, so no deletion URL is needed |
| App access | All functionality is available without special access |

**Full description [4000]:** use the Apple description above.

**Graphics:** app icon is `store/screenshots/android/icon-512.png`, feature graphic is `store/screenshots/android/feature-graphic.png`, phone screenshots are `store/screenshots/android/`.

**Closed testing:** new personal developer accounts need at least 12 testers opted in for 14 days in a row before you can apply for production.
