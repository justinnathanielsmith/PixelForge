## 2024-05-24 - [Unvalidated Project Imports]
**Vulnerability:** The `importProject` function in `data/repository.ts` blindly parsed JSON and saved it to IndexedDB without validation.
**Learning:** Client-side storage (IndexedDB) needs input validation just like server-side DBs, especially when importing files that can be crafted by attackers to cause DoS or injection.
**Prevention:** Always validate and sanitize imported data structures against a strict schema before persisting.

## 2026-02-05 - [Strict Settings Validation]
**Vulnerability:** The `importProject` function allowed the `settings` object to bypass validation, potentially allowing state pollution or injection of invalid data types into the application state.
**Learning:** Even non-executable data like "settings" must be strictly validated against a schema to prevent logic errors and state corruption. Whitelisting valid properties is safer than blacklisting.
**Prevention:** Implemented `validateAnimationSettings` using a strict whitelist approach, ensuring only known, typed properties are accepted.

## 2026-02-06 - [Object URL Resource Management]
**Vulnerability:** The application created blob URLs using `URL.createObjectURL` for file exports but failed to revoke them.
**Learning:** Browser memory leaks (Blob store) can accumulate if Object URLs are not revoked, potentially leading to performance degradation or denial of service in long-running sessions.
**Prevention:** Always pair `URL.createObjectURL` with `URL.revokeObjectURL` (typically after usage or in a cleanup effect). Used `setTimeout` to delay revocation slightly ensuring download initialization.

## 2026-02-07 - [Third-Party Data Leak via QR Code]
**Vulnerability:** The "Crystal Link" feature sent internal artifact IDs and user IP addresses to a third-party service (`api.qrserver.com`) to generate QR codes.
**Learning:** Using external APIs for simple tasks (like QR generation) can inadvertently leak private user data (IPs, IDs, potential metadata) without consent.
**Prevention:** Avoid third-party dependencies for sensitive data handling. If a feature (like mobile preview) is incomplete or broken, it's safer to remove it than to leave it in a vulnerable state. Removed the feature until a secure, local implementation is feasible.

## 2026-02-08 - [Insecure Environment Variable Handling]
**Vulnerability:** The application attempted to access `process.env.API_KEY` in client-side code, which is invalid in Vite/browser environments and encourages hardcoding secrets or incorrect build configuration that could leak keys.
**Learning:** Client-side applications handle environment variables differently than Node.js. Accessing `process.env` directly is a backend pattern that fails or leaks data in frontend code.
**Prevention:** Always use `import.meta.env` (for Vite) and prefix variables with `VITE_` to explicitly opt-in to exposing them.

## 2025-02-12 - [AI Output Validation]
**Vulnerability:** The application blindly parsed and used JSON output from the Gemini AI service (`generateSliceData`, `generateSkeleton`, `generatePalette`). This could allow prompt injection attacks to introduce malicious data structures or logic bombs into the application state.
**Learning:** LLM outputs are "untrusted user input" and must be validated just like any other external API or user form data. The probabilistic nature of LLMs makes them prone to returning unexpected structures.
**Prevention:** Implemented strict schema validation functions (`validateSliceData`, etc.) in `utils/validation.ts` that whitelist allowed properties and types. Applied these validators immediately after parsing AI responses.
