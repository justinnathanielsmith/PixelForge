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
