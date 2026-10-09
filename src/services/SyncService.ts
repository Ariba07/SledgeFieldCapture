/**
 * SyncService – simulates an API call.
 * Replace the body of `uploadCapture` with your real endpoint.
 *
 * Randomly fails ~20 % of the time to demonstrate the "error" state.
 */
import {FieldCapture} from '../types';

const SIMULATED_DELAY_MS = 1500;
const FAIL_RATE = 0.2; // 20 % artificial failure

export const SyncService = {
  async uploadCapture(_capture: FieldCapture): Promise<void> {
    // Simulate network latency
    await new Promise(res => setTimeout(() => res(undefined), SIMULATED_DELAY_MS));

    // Simulate occasional failures
    if (Math.random() < FAIL_RATE) {
      throw new Error('Server returned 500 – internal server error');
    }

    // ── Real API call would go here ──────────────────────────────────
    // await fetch('https://api.getsledge.com/captures', {
    //   method: 'POST',
    //   headers: {'Content-Type': 'application/json'},
    //   body: JSON.stringify(capture),
    // });
    // ─────────────────────────────────────────────────────────────────
  },
};
