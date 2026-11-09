# Tennis Mini-Game Prototype: Test Strategy

Build under test: `index.html`. It is a single HTML/JS file with no dependencies and four modes: Ball Machine, Rally vs AI, 2-Player PvP and Doubles.
Companion document: `tennis-game-test-cases.md` (90 cases in 14 sections). This strategy explains *why* and *how* those cases are run. It does not repeat them.

---

## 1. Purpose

This prototype exists to answer one question: **does the hit feel good, and is it fair?** The goal of testing is to answer that question fast and to stop bad data from distorting the answer. An example of bad data: a frame-rate bug that looks like "the timing is too hard".

Quality goals, in priority order:

1. **Correct judgement.** The same input gives the same result: hit/whiff, early/late and in/out, whatever the frame rate, device or mode.
2. **Feel.** New players land a hit within 60 s, understand the "early = cross-court, late = down the line" rule, and want another game.
3. **Fairness.** Neither player has an exploit, a dominant strategy or a way to reset the match. The AI can be beaten but is not trivial.
4. **Stability.** No JS errors, no stuck input, no frame drops or memory growth over a long session.
5. **Safety when shared or hosted.** The game makes no network calls, stores no data and has no injectable surfaces.

## 2. Scope

**In scope**
- Hit timing window, hit quality, physics and in/out calls, footwork and reach
- Frame-rate independence (fixed 240 Hz physics step, capped `dt`)
- Input: single keyboard, shared keyboard (PvP/Doubles), touch controls
- Rules and scoring in all 4 modes, plus doubles court coverage
- AI behaviour and difficulty balance
- Concurrency and synchronisation (same-step events, pause/restart/mode switch races, multi-touch)
- Security of a static file, error and boundary handling, gameplay exploits
- Compatibility on desktop browsers and phones
- Playability (subjective playtests)

**Out of scope for now**
- Online multiplayer and netcode, accounts, leaderboards, persistence. These need a new strategy section once they are designed (see §12).
- Audio. None exists yet, so it is noted as a feel risk only.
- Accessibility beyond readable HUD scaling. Revisit before any public release.
- Plain functional checks such as "the page opens" or "the button clicks".

## 3. Risk-based focus

Testing effort follows risk. The rating is likelihood x impact on the prototype's goal.

| # | Risk | Why it matters | Rating | Test focus |
|---|---|---|---|---|
| R1 | Judgement depends on frame rate or device | Feel data becomes meaningless | High | FPS-01..05, EXP-07, CMP-03 |
| R2 | Hit window or visual contact point is misaligned | Players feel "robbed", tuning goes the wrong way | High | TIM-01..06, FUN-03 |
| R3 | Stuck input (charge, movement) after focus loss, touch slide or pause | Unplayable rally, looks like a timing bug | High | INP-03/04, CON-08..12 |
| R4 | Shared-keyboard conflicts in PvP/Doubles | 2-player modes unusable on some keyboards | High | INP-01/02, CON-01/02, EDG-09..11 |
| R5 | Wrong or double point awards | Trust in the game breaks | High | RUL-01/02, PHY-06, CON-03, EDG-05/06 |
| R6 | Physics trade-offs feel wrong (power vs out, topspin vs flat) | Core depth disappears | Medium | PHY-01/02, tuning playtests |
| R7 | Exploits or dominant strategies (score reset key, mashing, safe spot vs AI) | Competitive modes feel unfair | Medium | EXP-01..09, AI section |
| R8 | Line calls use the ball centre, not the ball edge | Line balls called out, against tennis rules | Medium | PHY-03 |
| R9 | Touch controls on real phones (latency, multi-touch, interruptions) | Mobile feel is unknown. Only headless tests so far | Medium | INP-06/07, CON-08..11, CMP-02/03 |
| R10 | Injection or tampering once hosted | Low today (static, offline), higher with a leaderboard | Low now | SEC-01..08 |

Known open items from earlier exploration that this strategy must track to closure:
- **EXP-01:** R resets a live PvP/Doubles score.
- **CON-09 / CON-10:** charge stays stuck after a touch slide or an off-button mouse-up.
- **PHY-03:** line calls.
- **RUL-06:** no tennis scoring yet (design decision needed).

## 4. Test approach by level

| Level | What | How | Owner | When |
|---|---|---|---|---|
| L1 Deterministic checks | Physics function, `launchToward` inverse solve, timing-window maths, scoring transitions | Drive the `__tennis` debug hook in headless Chrome with fixed inputs and assert outputs. Fast and repeatable | QA automation | Every change |
| L2 Scripted gameplay | Bot plays each mode for N seconds. Assert no JS errors, plausible in-rate, score matches events, no NaN | Headless Playwright using the built-in auto-demo bot plus synthetic key events with exact timing | QA automation | Every change |
| L3 Targeted manual | Boundary and race cases that need judgement or real hardware (focus loss, IME, Sticky Keys, multi-monitor, multi-touch) | Manual runs from the case list, slow-mo on, DevTools open | QA | Each build that touches input, rules or tunables |
| L4 Exploratory | Charter-based sessions: "try to break scoring", "try to beat the AI without timing", "play only on a phone" | 30-60 min time-boxed sessions with notes | QA + dev | Each milestone |
| L5 Playtests | Feel and fun (FUN-01..05) with people who have not seen the game | 5 players x 10 min, stopwatch, 1-5 ratings, observer notes | Designer + QA | After each tuning change |
| L6 Non-functional | 30 min soak, CPU throttling, 120/144 Hz, browser and device matrix, security review | DevTools Performance/Memory, real devices or a device cloud, code review | QA | Before each wider share |

**Principle:** fix L1/L2 failures before running L5. A playtest on a build with a judgement bug produces misleading tuning feedback.

## 5. Mapping test cases to approach

| Section (cases) | Primary level | Automate? |
|---|---|---|
| 1 Timing (TIM) | L1 + L2, TIM-06 in L5 | Yes, except TIM-06 |
| 2 Frame rate (FPS) | L2 + L6 | FPS-01/03/04 yes. FPS-02 needs real high-refresh displays |
| 3 Physics (PHY) | L1 | Yes (statistical: N shots per setting, assert rates within bands) |
| 4 Footwork (MOV) | L1 + L2 | Yes |
| 5 Input (INP) | L3 | INP-02/04/05 yes. INP-01/06/07 on real hardware |
| 6 Rules (RUL) | L1 + L2 | Yes. RUL-06 is a design item |
| 7 Doubles (DBL) | L2 + L4 | Partly (DBL-01 assertable) |
| 8 AI balance | L2 + L4 | Win-rate sampling yes. "Feels fair" is manual |
| 9 Feel (FUN) | L5 | No |
| 10 Compatibility (CMP) | L6 | Browser smoke yes. Devices manual or device cloud |
| 11 Concurrency (CON) | L1 for same-step cases, L3 for touch and OS events | CON-01..07, CON-12 yes. CON-08..11 on real devices |
| 12 Security (SEC) | L6 code review + DevTools | SEC-01/02/05 yes |
| 13 Edge cases (EDG) | L2 for tunables and hooks, L3 for OS/IME/DPI | EDG-01..06, EDG-12/13 yes |
| 14 Exploits (EXP) | L4 + L2 | EXP-01/03/07/09 yes |

## 6. Statistical judgement for feel and physics

Gameplay results are probabilistic, so single-shot pass/fail is not used for these cases:
- Run **at least 20-30 shots per setting** and assert a band, not an exact value. Example: flat shots at 100% charge, out-rate >= 70%.
- Use a **fixed random seed** where the hook allows it. Otherwise record the seed or run count with each result.
- A rate that moves **more than 15 percentage points** from the last baseline is a regression to investigate, even when it is still inside its band.
- Keep a small **baseline table** (in-rate, perfect-rate and AI win-rate per mode) and update it only when a tuning change was intentional.

## 7. Environments and devices

| Tier | Environment | Purpose |
|---|---|---|
| Dev loop | Headless Chromium (Playwright), 60 Hz, no throttling | L1/L2 on every change |
| Stress | Chromium with CPU 4x/6x throttle, background tab, forced long frames | Frame-rate independence (R1) |
| Desktop matrix | Latest Chrome, Safari, Firefox, Edge. One 120/144 Hz display. One 2x DPI display. One touchscreen laptop | CMP-01, FPS-02, EDG-08, EDG-14 |
| Keyboards | One cheap membrane keyboard (ghosting), one AZERTY layout, a Chinese IME (Pinyin) | INP-01, EDG-09/10 |
| Mobile | One recent iPhone (Safari), one mid-range and one low-end Android (Chrome), portrait and landscape | INP-06/07, CON-08..11, CMP-02/03 |

Real-device mobile runs are the biggest current gap: everything so far has been headless. They should happen before any feel conclusions are drawn for mobile.

## 8. Test tooling and data

- **Tuning panel (13 tunables):** the main test-data lever. Every bug report and playtest result must record the tunable values. Defaults: window 110 ms, perfect 30 ms, charge 0.7 s, reach 0.95 m.
- **Slow-mo (0.5x):** for boundary cases (TIM, PHY-03/04). Results must also be confirmed at 1x.
- **Auto-demo bot:** load and soak generation (L2, FPS-05).
- **`__tennis` debug hook:** state injection for L1/EDG/CON cases. It must stay available in test builds and be **removed or locked before any scored/online release** (SEC-04).
- **DevTools:** Performance (CPU throttle, frame timing), Memory (heap snapshots for soak), Network (SEC-01), Application (SEC-02).
- **240 fps phone video:** input latency (INP-07) and checks that the visual contact point matches the judge point (TIM-06).

## 9. Entry and exit criteria

**Entry (a build is ready for a test cycle)**
- It loads with zero console errors in headless Chromium.
- The L2 bot smoke passes in all 4 modes (120 s each).
- The change notes list the tunable values that changed.

**Exit for "ready for playtest" (internal)**
- All P0 cases pass. No open P0 defects.
- L1/L2 suite green, with physics/in-rate bands inside baseline.
- R1 and R3 risks covered: FPS-01, INP-03 and the CON stuck-input cases pass.

**Exit for "ready to share widely or host"**
- All of the above, plus all P1 cases pass or are waived with a reason.
- Real-device mobile pass done (§7).
- SEC-03..07 and EXP-01/02 closed. The debug hook is locked.
- 30-minute soak with no FPS drop and no memory growth.
- Playtest targets met: FUN-01 < 60 s, FUN-04 average >= 3.5.

## 10. Defect management

| Severity | Definition | Example | Target |
|---|---|---|---|
| S1 / P0 | Unplayable, wrong point, stuck input, score wipe | R resets a live PvP score. Charge stuck after a touch slide | Fix before next playtest |
| S2 / P1 | Clearly hurts feel or fairness | Line ball called out. AI safe spot | Fix or waive before wider share |
| S3 / P2 | Polish, rare edge case | Scoreboard layout at 99999 | Backlog |

Each bug report needs:
- the mode, browser/device, display refresh rate and tunable values
- slow-mo on/off
- reproduction rate (for example 7/10)
- a short screen recording, since timing bugs are hard to describe in text

"Feels wrong" reports from playtests are logged as **feel issues**, separate from defects. They are reviewed in tuning sessions and are not counted as bugs.

## 11. Regression strategy

| Change type | Minimum re-run |
|---|---|
| Any tunable default changed | TIM-01/02, PHY-01/02, FPS-01, AI win-rate sample, then a short L5 playtest |
| Physics or hit-quality code | Full L1 + PHY + EXP-07 |
| Input code (keyboard/touch) | INP, CON-05..11, EDG-09..11, EXP-01..03 |
| Rules/scoring code | RUL, DBL, CON-03/04/06, EDG-05/06 |
| Rendering/visual only | L2 smoke, FPS-05 soak, CMP-01, EDG-07/08 |
| New mode | L2 smoke for all modes, plus the full case set for the new mode |

Automate the L1/L2 set as a single headless script, so that a regression run takes minutes and can follow every edit.

## 12. Phases

1. **Now: feel prototype.** L1/L2 automation for TIM/PHY/FPS/RUL, close the known P0s, run the first 5-person playtest.
2. **Alpha (shareable file).** Real-device mobile pass, desktop browser matrix, soak, P1 closure, a decision on tennis scoring (RUL-06) and on line calls (PHY-03).
3. **Hosted page.** Security cases SEC-06/07 (CSP, frame-ancestors), lock the debug hook, review hosting headers.
4. **Future: online play or leaderboards.** This needs a new strategy section covering:
   - server-authoritative scoring and anti-cheat (replace trust in the client)
   - seeded randomness for lockstep/rollback
   - latency and packet-loss simulation
   - desync detection between clients
   - reconnect and timeout rules
   - input validation and rate limits
   - privacy of any stored player data

## 13. Roles

| Role | Responsibility |
|---|---|
| Designer/owner | Sets feel targets, decides rules (scoring, line calls, PvP pause rights), approves tuning baselines |
| Developer | Fixes defects, keeps the debug hook and determinism, adds seeded random if online is planned |
| QA | Owns this strategy, the case list, the automation and the device runs. Runs exploratory sessions. Reports quality status |
| Playtesters | 5+ people new to the game per round. Rotate them so feedback isn't biased by familiarity |

## 14. Metrics and reporting

Report the following per test cycle:
- P0/P1 pass rate
- open defects by severity
- feel issues raised
- baseline deltas: in-rate, perfect-rate, AI win-rate, FPS on the low-end device
- playtest scores: time to first hit, "one more game?" average

**Status rule:** a cycle is green only if it has no open P0, the baselines are within bands and the playtest targets are met. Report a cycle with untested areas (for example, no real-device run) as **partial**, not green.
