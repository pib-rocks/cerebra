# PR-1519 — Microphone Array (Seeed ReSpeaker) Cerebra UI Tab & Service

Jira Ticket: https://pib-rocks.atlassian.net/browse/PR-1519
Category: Software
Branch: `PR-1519`

## Goals
Implement the "Microphone Array" configuration and real-time telemetry tab under System in Cerebra.

## Components to implement

1. `src/app/system/microphone-array/microphone-array.service.ts`:
   - RxJS HTTP service communicating with `/api/system/microphone-array/telemetry` and `/api/system/microphone-array/tuning`.

2. `src/app/system/microphone-array/microphone-array.component.ts/.html/.scss/.spec.ts`:
   - Real-time 360° DOA Radar Compass displaying current speech direction angle (`doa_angle`).
   - Live VAD (Voice Activity) & Speech Detected status badges.
   - 5-Channel Audio RMS Level Meters.
   - Preset Selector ("Standard", "Noisy Environment / ASR", "Loud Speaker Playback", "Raw", "Custom").
   - DSP Controls: AGC (Max Gain slider 0-60 dB, Target Power Level), Noise Suppression (Stationary, Non-Stationary), AEC Echo Cancellation, High-Pass Filter (Dropdown: Off, 70Hz, 125Hz, 150Hz).
   - LED Ring Controls: Mode (DOA Trace, Pulse, Solid Color, Mute, Off), Brightness (0-100%), Color picker.

3. `src/app/system/system.component.html` & `system.component.ts`:
   - Add `<app-microphone-array>` tab under System component sub-navigation.

4. Tests:
   - Karma specs covering component rendering, telemetry updates, preset application, and tuning updates.

## Important Constraints
- Keep on branch `PR-1519`. DO NOT MERGE INTO DEVELOP.
- Ensure all Angular Karma tests pass (`npm test`).
