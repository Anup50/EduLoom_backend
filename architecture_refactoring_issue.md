# Issue: Restructure Backend Codebase to Standard MVC Architecture & File Organization

## 📌 Summary
An architectural audit of `EduLoom_backend` revealed several deviations from standard Express/MVC conventions, including stray client-side code in the root directory, naming inconsistencies, global variable pollution, inline controller logic in routes, and misplaced middleware.

This issue tracks the refactoring tasks needed to clean up the codebase, standardize naming conventions, enforce proper separation of concerns, and improve maintainability.

---

## 🎯 Objectives & Scope of Work

### Phase 1: Stray & Dead File Cleanup
- [ ] Remove `getQuizByCourse.js` (frontend API call code misplaced in backend root).
- [ ] Remove empty placeholder files `getQuizByID.js` and `sessionApi.js`.
- [ ] Consolidate or remove `socketStore.js` since `app.js` currently overrides `global.connectedUsers`.

### Phase 2: Naming Convention & Directory Standardisation
- [ ] **Middleware Consolidation:** Move `security/Auth.js` to `middleware/authMiddleware.js` (or `auth.js`) and remove `security/` directory. Update all route imports.
- [ ] **Controller Naming:** Rename camelCase controllers to PascalCase ending in `Controller.js`:
  - `tutorController.js` ➡️ `TutorController.js`
  - `userController.js` ➡️ `UserController.js`
  - `subjectController.js` ➡️ `SubjectController.js`
- [ ] **Route Naming:** Standardize route file names:
  - `tutorRoute.js` ➡️ `TutorRoute.js`
  - `userRoute.js` ➡️ `UserRoute.js`
  - `Cloudinary.js` ➡️ `CloudinaryRoute.js`
- [ ] **Model Naming:** Rename plural `Categories.js` ➡️ `Category.js` (singular PascalCase). Update references across controllers and routes.
- [ ] **Test File Extensions:** Standardize test file extensions in `test/` (e.g. all `.test.js`).

### Phase 3: Route & Controller Decoupling
- [ ] **Cloudinary Route Separation:** Move inline request handling logic from `routes/Cloudinary.js` into a dedicated `controller/CloudinaryController.js`.
- [ ] **Socket.io Modularization:** Move `global.io` initialization and socket event handlers out of `app.js` into a dedicated `services/socketService.js` or `socket/socketHandler.js`. Remove reliance on global scope (`global.io`, `global.connectedUsers`).

---

## ✅ Acceptance Criteria

1. **Clean Root Directory:** No dead placeholder files or client-side fetch modules exist in the root directory.
2. **Consistent Conventions:** All files in `controller/`, `routes/`, and `model/` follow strict PascalCase naming rules (`*Controller.js`, `*Route.js`, `[Singular].js`).
3. **Single Middleware Location:** All HTTP middleware functions reside under `middleware/`.
4. **Decoupled Routes:** Every route file only defines HTTP methods/paths and delegates execution to controller functions.
5. **No `global` State Mutations:** `global.io` and `global.connectedUsers` are refactored into modular imports/services.
6. **Passing Test Suite:** All existing unit/integration tests run and pass without errors.
7. **No Breaking API Changes:** All API routes retain their exact public URL paths and payload structure (`/api/users`, `/api/courses`, `/auth`, etc.).

---

## 🧪 Test Cases & Verification Plan

| Test ID | Test Category | Description / Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Build & Import | Run `npm test` or start the server with `npm start` | Server initializes cleanly with no `MODULE_NOT_FOUND` errors from renamed files. |
| **TC-02** | Auth Middleware | Send request to protected endpoint without JWT token | Returns `401 Unauthorized` via moved `authMiddleware.js`. |
| **TC-03** | Cloudinary Upload Signature | Send `POST` to `/api/cloudinary/sign-upload` with folder payload | Returns `{ signature, timestamp, apiKey, cloudName, folder }` from new `CloudinaryController`. |
| **TC-04** | Socket Connection | Connect a WebSocket client to `http://localhost:5000` and emit `"register"` event with a user ID | Socket joins `user_<userId>` room and returns `"connection_established"` event without using `global.io`. |
| **TC-05** | Category Queries | Send `GET` request to `/api/categories` | Categories are queried successfully from renamed `Category.js` model. |
| **TC-06** | Regression Test | Run full automated test suite (`npm test`) | All route, auth, booking, student, and session tests pass 100%. |

---

## ⚠️ Risk & Migration Considerations

- **Import References:** Modifying file names and paths (`Auth.js`, `Categories.js`, `tutorController.js`) requires updating every `require(...)` path across controllers, routes, and tests.
- **Git Case Sensitivity:** Windows filesystem is case-insensitive. When renaming `tutorController.js` to `TutorController.js`, use `git mv` to ensure Git registers the filename case change.
