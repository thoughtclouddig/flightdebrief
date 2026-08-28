# Hero consistency tokens (paste verbatim into every prompt)

## Student — "Mia"
`a woman in her mid-20s, athletic build, light olive skin, dark brown hair in a low ponytail, small stud earrings, wearing a navy quarter-zip fleece pullover with no visible logo, calm and focused expression, aviation headset around her neck when not actively flying`

## CFI — "Dave"
`a man in his mid-50s, fit build, light skin, short salt-and-pepper hair, clean-shaven, wearing a navy polo shirt with a small orange-and-white AfterFlight wordmark on the left chest, plain wristwatch, warm and engaged expression, calm instructor authority`

## Aircraft — Cirrus TRAC, tail number NAV8RX (livery v4, locked)
`the Cirrus TRAC, Cirrus Aircraft's dedicated single-engine piston flight-training aircraft: modern composite low-wing airframe with a NASA-designed cuffed wing leading edge, distinctive wingtip halo lighting pods, fixed tricycle landing gear with wheel fairings, bright orange fuselage body, a black wraparound panel over the nose cone/cowling/lower cabin, a black vertical tail fin with a thin orange accent band, an ORANGE triangular AfterFlight logomark on the black tail fin (orange, matching the fuselage — not white), tail number NAV8RX in white/black lettering on the tail, three-blade propeller, premium eye-catching classic Cirrus-style show livery. Interior: all-black cabin — black leather seats, black side panels and headliner trim, Cirrus Perspective Touch+ by Garmin avionics with large glass PFD/MFD displays, black flat-paddle throttle lever on the LEFT of the center quadrant with a separate red-topped mixture/idle-cutoff knob to its right, side-mounted control sticks (not a center yoke), a red CAPS parachute handle (placard reads exactly "CAPS") on the ceiling between the front seats.`

Canonical reference images (reuse as `image_references`):
- Exterior: `casting/aircraft-exterior-canonical.png` (job b75d7bae-45c2-4fc6-a065-9361ecefb8a6, orange tail logo, precise shape)
- Interior: `casting/aircraft-interior-canonical.png` (job bf90a5e4-5f47-447a-b0bd-f6ec2aa0b436, black cabin)
- Real logo lockup (for shape-accurate reference): media_id `9e003a60-12a2-431f-b27b-8f45dd8efa22` (white-on-dark variant — triangle mark itself is orange in both variants)

## Wardrobe correction
Dave (CFI) wears a **plain navy polo with no logo/wordmark** in cockpit/exterior shots (per user note on A5). Only in the B3 hangar-lounge debrief scene does his polo carry the small AfterFlight lockup — use the real logo reference above for shape/spelling accuracy, not free-hand text rendering.

## Seat convention (always explicit in every cockpit prompt)
Mia (student) always sits in the LEFT seat and is the one flying/on the controls. Dave (CFI) always sits in the RIGHT seat. State this explicitly — "Mia in the left seat, Dave in the right seat" — in every two-person cockpit prompt; never leave seat position to be inferred from camera angle alone.

Hero reference photos (uploaded to Higgsfield): `debrief-lounge-screen.webp` (media_id f93ddb8b-5f07-4b24-a729-73064f66e05b) and `hero-debrief-tablet.webp` (media_id 9f09710b-fa1d-4506-9f9e-fe792bbebc4e) — both Mia + Dave together, locking face/wardrobe continuity.

Aircraft canonical references (generated, reuse as `image_references` in every exterior/interior shot):
- `casting/aircraft-exterior-canonical.png` (job d7a8b991-6e96-4553-809c-f05007e2711b)
- `casting/aircraft-interior-canonical.png` (job e9397b2e-74a3-4a22-a0a1-f4b6954108dc)
