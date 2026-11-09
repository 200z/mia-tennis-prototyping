# Tennis Mini-Game Prototype: Game-Specific Test Cases

Build under test: `index.html` (Ball Machine / Rally vs AI / 2-Player PvP / Doubles)
Default tunables: hit window 110 ms, perfect window 30 ms, full charge 0.7 s, reach 0.95 m, physics step 1/240 s

> Scope: game-specific risks (feel, hit judgement, physics, frame rate, multi-player input, rules, AI fairness)
> plus concurrency/sync, security, error/boundary handling and exploits.
> Plain functional checks ("the page opens", "the button clicks") are out of scope.
> Priority: **P0** = unplayable if it fails, **P1** = clearly hurts the experience, **P2** = polish.

---

## 1. Hit timing window

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| TIM-01 | Boundary: just inside window | Ball Machine, slow-mo on, release ~100 ms after the ball passes the contact point | Hit lands, shows "Late ~100ms", ball goes the opposite way (down the line) | P0 |
| TIM-02 | Boundary: just outside window | Same, release ~120 ms late | Whiff; never "hit but in a strange direction" | P0 |
| TIM-03 | Early swing | Release before the ball arrives (50 ms early / 150 ms early) | 50 ms early hits and pulls cross-court; 150 ms early whiffs, swing animation still plays | P0 |
| TIM-04 | Perfect timing | Hit 10 times with error <= 30 ms | Shows "Perfect!" each time, slightly faster than a non-perfect shot at the same power, perfect counter +1 | P1 |
| TIM-05 | Window tunable takes effect | Set hit window to 60 ms and 200 ms in the tuning panel, 20 shots each | 60 ms clearly harder, 200 ms clearly easier; no page reload needed | P1 |
| TIM-06 | Feedback matches feel | Subjective: 5 people x 3 min, count "felt on time but judged early/late" | Feedback matches feel; if most people are consistently early/late, the visual contact point and the judge point are misaligned (feel bug) | P1 |

## 2. Frame rate and time

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| FPS-01 | Judgement stable at low FPS | Chrome DevTools > Performance > CPU 4x/6x throttle, 30 shots | In-rate and perfect-rate close to normal; ball never tunnels through racket or net | P0 |
| FPS-02 | High refresh rate | Play on a 120 Hz / 144 Hz display | Ball and player speeds identical to 60 Hz (more frames must not mean faster) | P0 |
| FPS-03 | Recovery after a stall | Switch to another app for 3 s mid-rally (or force one long frame) | No teleporting/net tunnelling, score intact; game auto-pauses | P0 |
| FPS-04 | Slow motion | 20 shots with slow-mo on | Ball, players and charge bar all run at 0.5x; window is in game time, so easier hits in slow-mo are expected | P1 |
| FPS-05 | Long run | Leave the auto-demo bot running 30 min | FPS does not drop, memory does not keep growing (bounce marks and trails are cleaned up) | P1 |

## 3. Physics and in/out calls

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| PHY-01 | Flat power vs out | Flat shots at 30/50/70/100% charge, 10 each | More power = more long balls; >~70% mostly out; too little goes into the net | P0 |
| PHY-02 | Topspin vs flat trade-off | 10 full-power topspin, 10 full-power flat | Topspin has a much higher in-rate but is slower and clears the net higher | P0 |
| PHY-03 | Line ball | In slow-mo, keep hitting near the baseline/sideline and watch the bounce ring | Touching the line is IN (tennis rule); IN/OUT label matches the ring. **Code note:** the call uses the ball centre only, so line-touching balls may be called out | P0 |
| PHY-04 | Net cord | Low flat shots to clip the tape | After clipping, a ball that lands on the far side stays in play, one that drops back is a net fault; ball never gets stuck in the net | P1 |
| PHY-05 | Singles vs doubles lines | Doubles: hit into the alley between singles and doubles sideline | IN in doubles; the same spot is OUT in singles/rally | P0 |
| PHY-06 | Double bounce | Don't return an AI shot | Second bounce awards the point to the opponent with "Missed it" | P0 |

## 4. Footwork and reach

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| MOV-01 | Reach boundary | Swing standing ~0.9 m / ~1.0 m from the ball | 0.9 m connects (lower quality); 1.0 m shows "Couldn't reach" | P0 |
| MOV-02 | Moving-hit penalty | 20 shots standing still vs 20 shots at full sprint | Moving shots are more scattered and slower | P1 |
| MOV-03 | Sprint + charge | Hold sprint while charging and moving | Charging reduces speed (~60%); sprint does not cancel the penalty | P1 |
| MOV-04 | Court bounds | Run in each of the four directions | Player cannot cross the net or leave the screen | P1 |
| MOV-05 | Diagonal speed | Hold W+D and time a fixed distance | Diagonal is not faster than straight (vector normalised) | P2 |

## 5. Input (keyboard / shared keyboard / touch)

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| INP-01 | Simultaneous keys (ghosting) | PvP: P1 holds W+D+Shift+F while P2 holds Up+Right+RShift+. | Both players' actions register. Test on 2-3 keyboards (laptop, membrane, mechanical); many cheap keyboards ghost | P0 |
| INP-02 | No cross-talk | P1 presses their hit key | Only P1 swings; vice versa for P2 | P0 |
| INP-03 | Focus lost mid-charge | Hold charge, Alt+Tab away, come back without touching keys | No stuck charge or stuck movement; game is paused | P0 |
| INP-04 | Keys while paused | Pause, press hit/move keys, resume | Keys pressed while paused have no effect; no queued swing on resume | P1 |
| INP-05 | Space after clicking a button | Click Pause > Resume, then press Space | Space swings; it does not re-trigger the button | P1 |
| INP-06 | Touch joystick + button multi-touch | Real phone: one finger on the stick, another holding hit | Both touches work together; lifting the finger releases the charge | P0 |
| INP-07 | Input latency | Real iPhone / low-mid Android: measure press-to-swing with 240 fps slow-mo video | < 100 ms; if much higher than desktop, widen the window per platform | P1 |

## 6. Rules, scoring and modes

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| RUL-01 | Every way to lose a point | Rally vs AI: create net / out / missed / winner | Exactly one correct side gets +1; current rally resets; best rally updates | P0 |
| RUL-02 | No double award | Ball goes out, then rolls into a second bounce | Point awarded once only | P0 |
| RUL-03 | Serve rotation | Play 6 points in rally and doubles | Serve alternates as designed; doubles partners take turns | P1 |
| RUL-04 | Ball Machine has no score | 20 shots in Ball Machine | No win/lose score, only in-rate; out feeds say "No need to return" and cost nothing | P1 |
| RUL-05 | Restart | Reach 5:3, click Restart | Score and stats cleared, players reset, mode unchanged | P1 |
| RUL-06 | Design gap | Play a full match | Currently one ball = one point, unlimited; no 15-30-40, deuce, games, sets or change of ends. Confirm with design | P2 |

## 7. Doubles

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| DBL-01 | Ball down the middle | Hit between the two opponents | Exactly one AI goes for it; neither both nor none | P0 |
| DBL-02 | Partner poaching | You + AI partner, ball lands on your half | AI partner doesn't steal it; you aren't also told "couldn't reach" | P1 |
| DBL-03 | Three team set-ups | Play each of the three doubles line-ups for 2 min | Team colours, scoreboard names and per-player stats map to the right person | P1 |

## 8. AI and difficulty balance

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| AI-01 | AI is beatable | Average player, 5 min | Player wins points; AI error rate matches the "AI error rate" tunable | P1 |
| AI-02 | AI is not a pushover | Auto-demo bot vs AI, 5 min | Both sides score; rally length varies (not always 1 shot) | P1 |
| AI-03 | AI never gets stuck | Extreme angles (wide cross-court, short net ball) | AI chases; if it can't reach, point is called normally; no jitter or freezing at the net | P1 |

## 9. Feel / playability (exploratory, subjective)

Give it to 3-5 first-time players for 10 min without explaining the rules, and record:

| ID | Observation | How to record | Suggested pass bar |
|---|---|---|---|
| FUN-01 | Time to first successful hit | Stopwatch | < 60 s |
| FUN-02 | Do they work out "early = cross-court, late = down the line" on their own? | Ask afterwards | >= half can explain it |
| FUN-03 | Frustration moments | Note sighs/swearing | Each one attributable (judgement, controls, unclear feedback) |
| FUN-04 | "One more game?" | 1-5 rating | Average >= 3.5 |
| FUN-05 | Hit feedback (sparks, sound, text) feels satisfying | 1-5 rating | Average >= 3.5; no audio yet, expect this to score low |

## 10. Compatibility

| ID | Case | Expected | Pri |
|---|---|---|---|
| CMP-01 | Latest Chrome / Safari / Firefox / Edge | Same visuals, no JS errors, same judgements | P1 |
| CMP-02 | Phone portrait/landscape rotation | Panels rescale; rotation pauses or keeps state | P1 |
| CMP-03 | Low-mid range phone | >= 30 fps; when frames drop, judgement still holds (FPS-01) | P1 |

---

## 11. Concurrency and synchronisation

This is a single-threaded browser game, so "concurrency" here means events that arrive at the same time or in an unexpected order: two players, two touches, input vs. the physics loop, UI vs. gameplay.

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| CON-01 | Both partners swing on the same physics step | Doubles with P1 + P2 on the same team: both stand at the contact point and release on the same frame (use `__tennis` to place them) | Exactly one hit, ball state consistent. Note: the loop always checks P1 first, so P1 always wins ties; confirm that is the intended rule | P1 |
| CON-02 | Both PvP players release at the same moment, ball on P1's side | PvP: P2 mashes their hit key while P1 hits | P2's input has no effect on a ball on P1's side and does not leave a queued swing that fires on the return | P0 |
| CON-03 | Net and bounce on the same sub-step | Very low, slow shot that clips the tape and lands within 1/240 s | One call only (net fault OR bounce), never both; score +1 once | P1 |
| CON-04 | Pause pressed during the point-end delay | Lose a point, press P within the 1.4 s before the next feed, wait, resume | Next feed comes after resume, no double feed, no feed while paused | P1 |
| CON-05 | Mode switch mid-rally while holding keys | Hold W + charge, click another mode button | New mode starts clean: no ghost ball, no stuck charge, stale ball/shot cleared | P0 |
| CON-06 | Restart mid-swing | Release a swing and click Restart within the same 100 ms | No hit is applied to the new rally; score stays 0:0 | P1 |
| CON-07 | Tunable changed mid-charge | Hold charge, drag "Charge time" slider from 0.7 to 0.3 s | Power bar does not jump unexpectedly or exceed 100%; document the intended behaviour | P2 |
| CON-08 | Second touch on the joystick half | Real phone: finger 1 on the stick, finger 2 also lands on the left half, lift finger 1 | Stick releases cleanly; finger 2 does not hijack or freeze the stick | P1 |
| CON-09 | Finger slides from Topspin to Flat button | Touch-start on Topspin, slide, lift on Flat | Charge is released (either as topspin or cancelled). | P0 |
| CON-10 | Mouse-down on hit button, mouse-up elsewhere | Touchscreen laptop (buttons visible): press the on-screen hit button, drag off, release | Charge released. | P1 |
| CON-11 | Tab hidden without window blur | Mobile: pull down notification shade / receive a call mid-rally | Game pauses and no keys/touches stay held. Note: code only listens to `blur`, not `visibilitychange`/`pagehide` | P1 |
| CON-12 | Background throttling | Leave the tab in the background 5 min, return | No catch-up burst (dt is capped at 50 ms), state unchanged | P1 |

## 12. Security

The prototype is a local single HTML file with no server, accounts or saved data, so the attack surface is small today. These cases lock that in, and flag what must change before it goes online.

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| SEC-01 | No outbound network traffic | Open DevTools > Network, play all 4 modes | Zero external requests (no CDN, fonts, analytics). | P1 |
| SEC-02 | No stored data | Check localStorage, sessionStorage, cookies, IndexedDB | All empty. | P2 |
| SEC-03 | `innerHTML` injection | Review every `innerHTML` write (HUD, message banner, slider panel) | Only fixed strings and numbers reach `innerHTML`. If player names / chat / URL params are ever added, they must go through `textContent` or escaping. Test with name `<img src=x onerror=alert(1)>` once names exist | P1 |
| SEC-04 | Debug hook exposed | In the console run `__tennis.game.score.near = 99` | Works today (by design for testing). Before any leaderboard or online play: remove `window.__tennis`, and the server must own the score (client-side scores can always be faked) | P1 |
| SEC-05 | Tunables tampering | Use DevTools to change a slider's `max` to 99999, then drag it | Value is clamped to a safe range in code, not only by the slider. Today it is not clamped in code | P2 |
| SEC-06 | Hosted in an iframe (clickjacking) | If hosted: embed the page in an iframe on another origin | Hosting adds `Content-Security-Policy: frame-ancestors` or `X-Frame-Options` | P2 |
| SEC-07 | Content Security Policy when hosted | If hosted: check response headers | CSP that blocks inline injection (needs moving the inline script to a file or a hash) | P2 |
| SEC-08 | File integrity when shared | File passed around via Slack/IM | Share via a single trusted location; verify checksum if distributed widely | P2 |

## 13. Error handling and boundary cases

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| EDG-01 | Perfect window wider than hit window | Set hit window = 50 ms and perfect window = 80 ms (both allowed by the sliders) | Perfect window is capped at the hit window, or the UI prevents it. Today every hit becomes "Perfect" | P1 |
| EDG-02 | Divide by zero in charge power | `__tennis.P.chargeTime = 0`, then swing | Power stays 0-1. | P2 |
| EDG-03 | Every slider at its min and max | For each of the 13 tunables, set min, play 1 min; then max, play 1 min | No JS errors, no NaN on the HUD, ball never leaves the world without a call | P1 |
| EDG-04 | Ball exactly on the net plane | Use the hook to put the ball at y = 0 before a step | Net check still runs. Note: code skips the net check when the previous y is exactly 0 | P2 |
| EDG-05 | Ball leaves the world without bouncing | Very high/long shot (y > 22 m or x > 12 m) | Point ends once, awarded correctly | P1 |
| EDG-06 | Ball stops rolling on the hitter's side | Weak shot that rolls instead of bouncing | Point ends once; no infinite rally | P1 |
| EDG-07 | Tiny / huge window | Resize the window to 320x240, then 3840x2160; zoom 50% and 200% | Canvas fits, HUD readable, hit judgement unaffected | P1 |
| EDG-08 | Move window between monitors | Drag between a 1x and a 2x DPI monitor | Canvas stays sharp and correctly scaled | P2 |
| EDG-09 | Chinese IME active | Turn on a Chinese input method (Pinyin) and play | Keys still move/swing (game uses `e.code`; IME can send `Process`/229). If broken, show a hint "switch IME to English" | P0 |
| EDG-10 | Non-QWERTY layouts | AZERTY / Dvorak keyboards | Physical positions work (uses `e.code`), but the help text shows QWERTY letters; check it still makes sense | P2 |
| EDG-11 | Windows Sticky Keys | Press Shift 5 times quickly (sprinting) | Sticky Keys dialog steals focus; game pauses cleanly and no key stays stuck | P1 |
| EDG-12 | Long score values | Use the hook to set scores to 999 / 99999 | Scoreboard layout doesn't break | P2 |
| EDG-13 | Stats with zero shots | Restart and check the HUD before any shot | Shows "-" instead of NaN% / Infinity (code already guards this; regression check) | P2 |
| EDG-14 | Browser without touch on a touchscreen laptop | Touchscreen laptop with mouse and keyboard | Touch controls show (body gets `touch` class) but keyboard still works; buttons don't cover the play area | P2 |
| EDG-15 | File opened from a read-only/zip location | Open directly from the Slack download or inside a zip preview | Game loads (no relative assets needed) | P2 |

## 14. Exploits and gameplay vulnerabilities

| ID | Case | Steps | Expected | Pri |
|---|---|---|---|---|
| EXP-01 | Either player can wipe the score in PvP | PvP at 5:3, press **R** | R should not reset a live 2-player match (or ask for confirmation). | P0 |
| EXP-02 | Opponent can pause/tamper in PvP | PvP: either player presses P/Esc mid-shot, or opens the tuning panel and changes the opponent's settings | Decide the rule (who can pause; lock tunables during a match). Toggling the auto-demo bot mid-match makes BOTH humans auto-hit | P1 |
| EXP-03 | Button mashing beats timing | Ball Machine: tap Space every 80 ms for 40 s | Mashing should be worse than real timing. | P1 |
| EXP-04 | Hold charge forever | Keep the hit key held the whole rally, release at contact | Only cost is slower movement; check this isn't an easy dominant strategy | P2 |
| EXP-05 | "Safe spot" vs AI | Find a court position / shot the AI never returns (e.g. short angled ball) | No repeatable shot wins > 80% of points | P1 |
| EXP-06 | Slow-mo as a cheat in scored modes | Turn on slow-mo in Rally/PvP | Slow-mo either disabled in scored modes or marked as practice | P2 |
| EXP-07 | Throttled CPU as a cheat | Throttle CPU 6x to "slow" the game | Game-time speed is unchanged (dt capped, fixed physics step), so no advantage | P1 |
| EXP-08 | Hitting from outside the court | Stand at the back fence / side wall limit | Can still only hit balls within reach; can't return a ball that's already out | P2 |
| EXP-09 | Hitting an out ball | Swing at a ball that already bounced out | Point is already over; swing has no effect. Code allows hits after an out bounce in Ball Machine only; confirm intended | P2 |

---

### Suggested run order
1. All P0 cases first (~1.5 h). If they fail, feel testing is meaningless.
2. Then the FUN exploratory sessions to tune parameters.
3. After any tuning change, re-run TIM-01/02, PHY-01/02, FPS-01.
4. Before going online/hosted: SEC-03..07 and EXP-01/02 must be closed.
