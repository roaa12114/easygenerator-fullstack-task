# AI Usage

## Overall Approach

I used Claude as a development tool across three roles: an architecture sounding board before writing code, a source of scaffolding for boilerplate-heavy, low-judgment code (DTO validation syntax, NestJS module wiring), and a debugging partner for framework-specific errors I hadn't hit before. Across both backend and frontend, my working pattern was consistent: I wrote a first attempt myself, ran or compiled it, and brought back either the file or the actual error for review — I did not ask for finished files to paste in wholesale. Where I disagreed with a suggested fix, I said so and asked for the reasoning, and in a few cases chose a different approach than the one initially proposed (documented below).

## Planning

Before touching code, I asked for a full breakdown of the task spec and worked out the implications together: what "production-ready" concretely requires for an auth system (hashed passwords, generic auth error messages, server-side validation independent of the frontend, environment variables for secrets), what the scoring criteria implied about priorities (delivery speed is explicitly scored, so I deliberately did not build features the spec didn't ask for, like password reset or email verification), and the API contract (exact endpoint paths, request/response shapes) before writing a single file. I decided the build order myself — backend fully built and tested before frontend — specifically so the frontend would have real, working endpoints to integrate against rather than guessing at a contract.

**Requirements analysis prompt used:**

> "Here's the task spec [paste]. Before I write any code: list every explicit requirement, then separately list requirements that are implied but not stated outright (e.g. what 'production-ready' concretely requires for an auth system). Flag anything ambiguous that I should decide on now rather than discover mid-build."

This separates explicit vs. implied requirements instead of asking a vague "what should I do" — task decomposition applied to requirements-reading itself. Asking for ambiguities to be flagged *now* front-loads decisions instead of hitting them as surprises later, reducing total iterations.

**Architecture planning prompt used:**

> "Given these requirements, propose a folder structure and API contract (exact endpoints, request/response shapes) for a NestJS + MongoDB backend and React + TypeScript frontend. Constraint: minimal scope — no features beyond what's explicitly required. Output as a table for the API contract and a tree diagram for folders."

Constraint specification ("minimal scope") prevents over-engineering before it starts — a real risk when a task is scored on delivery speed. Output formatting constraints (table + tree) made the result immediately reusable as a reference doc, not prose to re-parse.

## Architecture Decisions

- **JWT delivered via an httpOnly cookie, not localStorage.** Decided deliberately for XSS resistance (httpOnly cookies aren't readable by JavaScript), accepting the added complexity of CORS with `credentials: true` and `cookie-parser` middleware as a reasonable tradeoff for a system explicitly scored on production-readiness.
- **No global auth guard.** I had picked up an `APP_GUARD` + `@Public()` decorator pattern (applying `JwtAuthGuard` to every route by default) from earlier editor autocomplete, without having deliberately chosen it. When I reviewed the resulting `AuthModule`, I recognized this would block my own sign-up/sign-in routes — which need to be reachable without a token — and removed it in favor of applying the guard directly and only to the one route that needed it (`/auth/me`).
- **Password validation belongs in the DTO, not the schema.** I initially added a `minlength: 8` constraint to the password field in the Mongoose schema, thinking it enforced the task's complexity rule. On review, I recognized the schema stores the bcrypt hash (a fixed-length string regardless of the original password), not the raw password, so the constraint was checking the wrong value entirely. Removed it once I understood the DTO/schema distinction (input validation vs. stored-data structure) rather than just being told to delete it.

  **Prompt used to work through this:**

  > "I need a Mongoose schema for a User with email (unique), name (min 3 chars), password. Before writing it: explain which of these three validation rules belong in the schema vs. a DTO, and why — I want to understand the distinction, not just get code that works."

  Requesting reasoning before implementation preempted an entire class of bugs (validating a hash as if it were a raw password) by surfacing the schema/DTO distinction *before* code was written, rather than debugging it afterward.

- **Generic authentication errors.** Sign-in returns the identical "Invalid email or password" message whether the email doesn't exist or the password is wrong, to avoid leaking which emails are registered (user enumeration).

  **Prompt used before writing `AuthService.signin()`:**

  > "I'm about to write AuthService.signin(). Before I do: what security properties should this specifically have (e.g. around error messages, timing, what gets compared)? List them, then I'll write the method and you review it against that list."

  This is progressive refinement with a checklist established up front — it turned the later review into a structured pass/fail against known criteria rather than an open-ended "is this okay," which was both faster and more thorough. Effectively, this is a self-review rubric requested in advance.

- **`select: false` on the password field** in the schema, so query results exclude the hash by default, with explicit `.select('+password')` only where a comparison is actually needed (sign-in).
- **MongoDB Atlas over a local database**, so the project runs identically for a reviewer cloning the repo as it does on my machine, without a local MongoDB dependency.

## AI-Assisted Development

Boilerplate-heavy, low-judgment pieces were scaffolded with AI assistance and then reviewed/adapted by me — for example, the exact `class-validator` decorator syntax and regex for the password complexity rule (a solved, well-defined problem rather than a design decision). Higher-judgment pieces — the actual `AuthService.signin()` logic, the `UsersService` methods, the auth context's state management — I wrote myself first, in most cases without being shown a reference implementation beforehand, and had reviewed afterward.

**Validation logic (DTO) prompt used:**

> "Write a class-validator DTO enforcing: valid email, name min 3 chars, password min 8 chars with at least one letter/number/special character. Use @Matches with a single regex for the password rule rather than multiple decorators, and add custom error messages for each field."

Explicit constraints on implementation approach (single regex, custom messages) prevented a vague result and got a production-usable output on the first pass, reducing back-and-forth on formatting/message quality.

## Prompt Engineering Strategy

The pattern that worked best across this session was **bringing real, specific evidence rather than abstract descriptions** — actual compiler error text, actual terminal stack traces, actual Network tab screenshots — rather than saying "it's not working." For example, rather than describing a vague symptom, I pasted the exact TypeScript error (`Property 'password' has no initializer...ts(2564)`) and the exact runtime stack trace for the MongoDB DNS failure (`querySrv ECONNREFUSED`). This grounded every fix in something verifiable rather than a guess, and meant fixes were traceable to a specific, real cause rather than a generic explanation.

The second consistent pattern was **writing my own attempt before asking for a solution**, and asking "why" before accepting a correction — for instance, when told to remove a schema constraint, I asked what the actual difference between a DTO and a schema was, rather than just applying the fix. This meant I could explain the reasoning afterward rather than just having working code.

### Core patterns to internalize (across the whole project)

1. **Ground every debugging prompt in real evidence** — actual error text, actual output — never a paraphrase of the symptom.
2. **Ask for reasoning before implementation** when a concept is new, not just the code — it compounds, since the same class of problem often recurs.
3. **Request structured output** (tables, checklists, criteria lists) when the result needs to be *used*, not just read once.
4. **State constraints up front** (scope, format, what to avoid) rather than correcting after the fact — cheaper in both time and iterations.
5. **When something seems broken, ask for a diagnostic plan before a fix** — don't let the first assumption about where the bug lives go unchallenged.

## Iterative Development Process

Both backend and frontend were built file by file, in a fixed order agreed on during planning (schema → DTOs → services → modules → controller → strategy/guard → app config, then API layer → auth context → protected route → router → pages). Each file was written, then checked, before moving to the next — I did not move on to a new file while the previous one had unresolved errors.

## Corrections and Rework

1. **`UsersService.create` silently dropped the `name` field** — accepted as a parameter but never included in the object passed to `create()`, despite `name` being `required: true` in the schema. Caught during review, fixed by including it explicitly.
2. **`findByEmail` contained leftover dead code from an earlier draft**, joined to the real query via a JavaScript comma operator, and the query being used didn't lowercase the email before matching against a schema that stores emails as lowercase — meaning a login attempt with different casing than signup would silently fail to find the user. Rewritten as a single clean, correct query.
3. **Password hashing misunderstood as reversible.** I initially assumed sign-in needed to "decrypt" the stored hash to check a login attempt. Corrected this before writing the sign-in logic: bcrypt hashing is one-directional; the correct approach is `bcrypt.compare(attempt, storedHash)`, which re-hashes the attempt and compares results.
4. **Environment-variable timing bugs**, occurring twice, in two different mechanical forms: `JwtModule.register()` and the Mongo connection both initially read `process.env` values before `ConfigModule` had loaded `.env`, fixed via the async factory pattern (`registerAsync`/`forRootAsync`) for both. The identical timing problem then recurred in `JwtStrategy`, which isn't a module and so couldn't use the same async-factory mechanism — resolved instead by injecting `ConfigService` into the strategy's constructor, since Nest only instantiates providers after their module's imports resolve.

   **Prompt used when first hitting this class of bug:**

   > "I'm registering JwtModule with a secret from process.env. What's the risk of reading process.env directly at module load time in a NestJS app, given ConfigModule also needs to load .env first? Show me the correct pattern, and explain what would break if I did it the naive way, so I recognize this pattern elsewhere."

   Asking "what would break" alongside the fix built a transferable mental model instead of a one-off patch — which is exactly why the same fix could later be self-applied to `JwtStrategy` without needing to ask again. This was deliberately optimizing for *learning*, not just unblocking.

5. **`JwtStrategy` was written correctly but never registered as a provider** in `AuthModule`, so Nest never instantiated it and Passport never learned a `"jwt"` strategy existed — surfacing as a runtime `Unknown authentication strategy "jwt"` error rather than a compile-time one, which took longer to trace to the actual cause.
6. **Frontend: sign-in/sign-up appeared broken** — forms submitted successfully (confirmed via real `201` responses and cookies being set, visible in the Network tab) but the app redirected back to the sign-in page instead of showing the welcome page. Root cause: `SignIn`/`SignUp` called the raw API functions directly but never told the shared auth context that login had succeeded — the context's `user` state was only updated by a `checkAuth()` call that ran once, on initial app load. Fixed by explicitly calling `checkAuth()` after a successful signup/signin, before navigating.

   **Diagnostic prompt used before assuming where the bug was:**

   > "Sign-in redirects back to the sign-in page after what looks like a successful submission. Before assuming where the bug is: what evidence should I gather to determine whether this is a backend or frontend problem? I'll bring that evidence back."

   This explicitly resisted jumping to a fix and instead requested a diagnostic plan first — this is the habit that actually found the real bug (frontend state desync, not a backend failure) rather than wasting time re-debugging a backend that was already working. This is arguably the single most valuable prompt pattern to keep for future projects.

   **Related prompt used earlier, when setting up the axios/cookie integration:**

   > "I'm building an API layer in axios that needs to send credentials for an httpOnly cookie set by my backend. What configuration is required on both the axios instance and individual requests for this to actually work across localhost:5173 and localhost:3000? List every required piece — I'd rather over-specify now than debug a silent CORS failure later."

   This built edge-case anticipation into the prompt itself — asking for the *complete* list of requirements rather than one piece at a time, front-loading a known failure mode (partial CORS/cookie config) instead of discovering it through trial and error.

## Edge Cases

- Duplicate email at sign-up (`409 Conflict`, tested and confirmed).
- Wrong password at sign-in (`401` with a generic message, tested and confirmed) — deliberately identical wording to a nonexistent-email case, to avoid user enumeration.
- Accessing the protected route with no session at all (`401`, not a crash — tested by hitting `/auth/me` with no cookie).
- Case sensitivity in email matching between signup and signin (schema stores lowercase; the original `findByEmail` query didn't account for this and was corrected).
- Session persistence across a page refresh on the frontend (handled via the `loading` state in the auth context, checked before `user`, so a mid-flight auth check isn't mistaken for "logged out").

## Debugging

The debugging sessions were the largest share of total time, and mostly involved framework/tooling-specific errors rather than logic bugs: a `strictPropertyInitialization` compiler error on DTO fields (resolved with definite assignment assertions, a standard NestJS pattern), an `isolatedModules` error requiring `import type` for a type used in a decorated method parameter, a `cookie-parser` import error (namespace import isn't callable; needed a default import), and a Windows-specific MongoDB Atlas connection failure (`querySrv ECONNREFUSED`) caused by Node's internal DNS resolver failing on SRV record lookups despite the OS-level resolver working correctly — resolved by explicitly setting DNS servers in `main.ts`.

**Framework-specific error debugging prompt used:**

> "[paste exact compiler error and the relevant code]. Explain the root cause first, in one or two sentences, before giving me the fix. I want to understand why this happens in NestJS/TypeScript specifically, not just what to paste."

Context grounding (real error + real code, not a paraphrase) plus an explicit "explain before fixing" constraint was the single highest-leverage habit in the whole project, since it's what let the same class of bug (env-variable timing) be recognized and reasoned through independently the second time it appeared.

## Verification and Testing

- **Backend:** tested via curl for every endpoint, covering both success and failure paths — signup success, signup with a duplicate email (expecting `409`), sign-in success, sign-in with a wrong password (expecting a generic `401`), the protected route with a valid cookie (expecting `200` + welcome message), and the protected route with no cookie (expecting `401`, not a crash). Saved cookie files (`-c`/`-b`) were used with curl to simulate a persistent session across requests.
- **Frontend:** tested manually in-browser for the full user flow (sign up → land on welcome page → log out → redirect to sign-in → sign in → welcome page → refresh while authenticated → session persists), cross-referenced against the Network and Console tabs to confirm actual HTTP status codes and response bodies rather than relying on UI appearance alone — this is specifically how the sign-in/sign-up redirect bug was diagnosed as a frontend state issue rather than a backend failure.

**Testing strategy prompt used:**

> "For each of my four auth endpoints, list the success case and at least one realistic failure case I should test before considering the backend done. Format as a checklist I can work through with curl."

A structured output requirement (checklist) turned "test it" into a concrete, exhaustible task list — reducing the chance of shipping with an untested failure path, which matters directly for the "production-readiness" scoring criterion.

**Security review prompt used:**

> "Review this AuthController and AuthService against these production-readiness criteria: password storage, error message specificity, protected route enforcement, secret management. For each, either confirm it's handled correctly or flag the gap — don't just tell me it looks fine."

A structured, criteria-based review request rather than an open "does this look okay" forced specific, checkable feedback per category instead of a vague pass, and explicitly discouraged a rubber-stamp response.

**Final review prompt used before submission:**

> "I'm about to submit. Do a final pass against the original task spec line by line — confirm each requirement is met, and separately list anything I added that wasn't required (in case it's worth trimming for delivery-speed scoring), and anything required that I might have missed."

Critique-and-improve as an explicit final step, structured as three separate lists (met / extra / missing) rather than a vague "does this look done," made gaps and unnecessary scope both equally visible in one pass.

## Engineering Decisions

Summarized under Architecture Decisions above; the throughline across all of them is prioritizing verifiable, explainable behavior (generic error messages, fail-fast environment variable checks, explicit query field inclusion) over convenience shortcuts, given the task's explicit scoring on production-readiness.

## What AI Did Well

Explaining *why* framework-specific errors occurred (not just the fix) let me apply the same reasoning independently the second time an analogous problem appeared (the `.env` timing issue recurring in `JwtStrategy` after being fixed once in `JwtModule`). Scaffolding boilerplate syntax (DTO decorators, module registration patterns) saved time on solved problems so effort could go toward the parts requiring actual judgment.

## What Required Human Judgment

Every architectural decision listed above, all six corrections in "Corrections and Rework," recognizing the global-guard pattern as wrong for this specific route structure, and diagnosing the frontend auth-state bug by checking real network activity rather than accepting either "the backend is broken" or "the frontend is broken" as a starting assumption.

## Lessons Learned

The most valuable pattern across this task was verifying against real evidence (actual errors, actual network responses) before accepting an explanation of what was wrong — several early hypotheses (mine and suggested) turned out to be incomplete or incorrect until checked against an actual stack trace or actual HTTP response. The recurring `.env`-timing bug also reinforced that the same underlying problem can require different mechanical fixes depending on context (a module vs. a plain injectable class), which is a distinction worth remembering for future NestJS work.

## Final Ownership Statement

I wrote and understand every file in this submission. AI was used to accelerate scaffolding of well-defined, low-judgment code and to help diagnose framework-specific errors I hadn't encountered before, but all architectural decisions, the specific corrections listed above, and the final working implementation are my own — I can walk through the reasoning behind every choice in this document.
