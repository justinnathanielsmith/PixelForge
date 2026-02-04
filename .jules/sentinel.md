## 2024-05-24 - [Unvalidated Project Imports]
**Vulnerability:** The `importProject` function in `data/repository.ts` blindly parsed JSON and saved it to IndexedDB without validation.
**Learning:** Client-side storage (IndexedDB) needs input validation just like server-side DBs, especially when importing files that can be crafted by attackers to cause DoS or injection.
**Prevention:** Always validate and sanitize imported data structures against a strict schema before persisting.
