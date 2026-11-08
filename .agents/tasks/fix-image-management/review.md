# Image management overhaul — admin mobile upload, brand assignment, and R2 serving

Two commits (b31f36b, 0755418) address 10 bugs in the image pipeline spanning the Cloudflare Workers backend, the Flutter admin app, and the path that delivers images to the user mobile app.

The core upload flow was broken in two separate ways: `BrandRepository.uploadImage()` sent a `Content-Type: multipart/form-data` header *without* a boundary, corrupting every multipart request, and `BrandMediaRepository.uploadMediaImage()` omitted an explicit MIME type, causing `application/octet-stream` to reach the server's MIME validator. The backend `POST /admin/upload/image` route was also inlined — it now delegates to `StorageService` using the `SITE_URL` constant. Image serving from R2 gains a content-type fallback for objects uploaded without metadata. Flutter-side fixes cover widget state preservation, a compilation error in `mediatheque_screen.dart`, and upload timeouts.

Watch for: **confirmed** — BUG 9's `RadioGroup<String>` wrapper is still present in `mediatheque_screen.dart` with the inner `Radio<String>` widgets still missing `groupValue`/`onChanged`; whether this compiles depends entirely on the Flutter SDK version installed, and the plan's stated fix (replace with plain `Column`) was not applied. **confirmed** — BUG 4's error recovery path (restore prior URL via `onImageSelected` on upload failure) was not implemented; a failed upload silently leaves `_imageUrl` stale in `ProductForm`. **possible** — the in-memory `Map`-based rate limiter for `/admin/upload/image` is per-isolate and provides no real protection across Cloudflare Workers instances.

**Verdict**: NEEDS_CHANGES

---

## High-level view

BUGs 1 and 2 — the two critical upload blockers — are cleanly fixed. Removing the manual `Options(contentType:)` lets Dio generate the correct boundary, and adding `DioMediaType.parse(mime)` to `MultipartFile.fromFile()` gives the server a valid MIME type. Both fixes mirror the correct pattern that already existed in the codebase.

The backend upload route (`POST /admin/upload/image`) is refactored to use `StorageService`, eliminating the hardcoded domain and the duplicate R2 logic. The brand upload route (`POST /admin/media/brand/upload`) is new in this diff and consistently uses `SITE_URL`. The R2 content-type fallback in `GET /media/:key` patches the user app's broken-image problem for pre-metadata objects.

The brand assignment route (`POST /admin/media/brand/assign`) is a full new implementation — all four paths (brand/single × main/gallery) return `{ success: true, message }`, and the Flutter side now checks `data['success'] == true` before treating the response as successful.

`ImagePickerWidget` has been substantially reworked: it now uploads immediately on pick rather than encoding base64 locally, uses `CachedNetworkImage` for preview, and `initState()` seeds `_uploadedUrl` from `widget.currentImageUrl`. The state initialisation fix (BUG 4) is present, but the error-recovery requirement from the plan — re-calling `widget.onImageSelected` with the prior URL if upload fails — is missing.

BUG 9 (`RadioGroup` compile error) is the most ambiguous fix. The `RadioGroup<String>` wrapper is retained with `groupValue` and `onChanged` on the wrapper, and individual `Radio<String>` widgets carry only `value`. This pattern is valid in Flutter 3.32+ where `RadioGroup` propagates group state via `InheritedWidget`. `dart analyze` reported zero errors per the commit message, but the outcome depends on the installed Flutter SDK version.

---

<details>
<summary>Issues (4)</summary>

1. **BUG 4 error-recovery gap** — When `_pickAndUpload()` throws, `_uploadedUrl` stays as the *previously uploaded* URL (correctly preserved), but `widget.onImageSelected` is never called, so `ProductForm._imageUrl` still holds whatever value it had before the failed attempt. If the form is then submitted, the image field may be stale or null. The plan explicitly required calling `widget.onImageSelected(_uploadedUrl!)` (or the prior `currentImageUrl`) on failure. Add that call to the `catch` block when `_uploadedUrl` is non-null.

2. **BUG 9 partial fix — RadioGroup validity is SDK-gated** — The `RadioGroup<String>` wrapper is retained (not replaced with `Column` as the plan specified). This is only valid in Flutter 3.32+. The project's `pubspec.yaml` has `sdk: ^3.11.5` (a Dart SDK constraint) but no explicit Flutter SDK lower-bound. If the build machine runs Flutter < 3.32, `RadioGroup` is undefined and the app won't compile. The plan's fix (replace wrapper with plain `Column`) is safer and SDK-agnostic; the chosen approach creates a fragile dependency on the runtime Flutter version. Confirm the Flutter SDK in CI/CD is ≥ 3.32, or apply the plan's original fix.

3. **In-memory rate limiter provides no real protection** — `checkImageUploadRateLimit` uses a module-level `Map`. In Cloudflare Workers, each isolate has its own heap; the map is not shared across concurrent requests hitting different isolates. Sustained upload bursts from a single IP will bypass the limit. This is a known Workers limitation. The rate limiter is not harmful, but it should not be relied upon as a security control. Replace with Cloudflare's built-in rate limiting (via `wrangler.jsonc` rules) or at minimum add a comment noting the per-isolate scope.

4. **BUG 3 resolution not traceable from commits** — The plan identified a risk that `PUT /admin/products/:id` might not persist `imageUrl`/`image_url`. The `ProductRepository.update()` method was not modified in these commits (confirmed by `git diff`). Reading the current code: the method does handle both aliases correctly via the `img` extraction block. The plan described this as a risk to *verify*, and the current implementation handles it. However, no test was added to confirm this path, and the commit messages do not acknowledge the verification. A targeted test for `PUT /admin/products/:id` with an `image_url` body field would close this gap.

</details>

<details>
<summary>Details</summary>

### Multipart Content-Type corruption (BUG 1)

The pre-existing `Options(contentType: 'multipart/form-data')` in `BrandRepository.uploadImage()` overrode Dio's auto-generated `Content-Type: multipart/form-data; boundary=<uuid>`, stripping the boundary. The server received an unparseable body. Removing the `Options(...)` argument entirely is the correct fix — Dio detects `FormData` and sets the header automatically.

### MIME type missing on ImagePicker uploads (BUG 2)

`MultipartFile.fromFile()` without `contentType` derives MIME from the file extension. ImagePicker's temp files often lack extensions (Android) or use `.heic` (iOS), causing `application/octet-stream` on the wire. The server's `rawType.startsWith('image/')` check then falls back to `image/jpeg`, which would mismatch a PNG's magic bytes and fail `validateImageMagicBytes`. The fix derives MIME from the extension via a ternary chain and passes it as `DioMediaType.parse(mime)`. HEIC/HEIF are mapped to `image/jpeg` — consistent with ImagePicker's `imageQuality` re-encoding. The `filename: 'upload.$ext'` change also prevents the server from receiving a bare temp filename.

### Backend upload route consolidation and rate limiter gap (BUG 8)

`POST /admin/upload/image` now calls `StorageService.uploadImage(buffer, fileType, 'mobile-uploads', SITE_URL)` instead of writing directly to R2 with a hardcoded domain. Both upload routes go through the same code path. The route also gained 5 MB size enforcement and `validateImageMagicBytes` validation — neither existed before.

The rate limiter (`checkImageUploadRateLimit`) uses a module-level `Map<string, {count, resetAt}>`. In Cloudflare Workers, this map is **per-isolate**, not global. Two concurrent requests hitting different isolates both see fresh state. The limiter will stop naive sequential abuse from the same IP in the same isolate but is not a reliable DoS defence. (possible — depends on Workers scheduling)

### R2 content-type fallback for legacy objects (BUG 7)

Objects uploaded before `httpMetadata` was set correctly had no `Content-Type` in R2, so `GET /media/:key` returned `application/octet-stream`. Flutter's `Image.network()` and `CachedNetworkImage` delegate to the platform's HTTP stack, which refuses to decode `octet-stream` as an image. The fallback checks `headers.get('content-type')` after `writeHttpMetadata` and, if absent or `octet-stream`, derives MIME from the key's extension. The default falls back to `image/jpeg`, which covers the vast majority of existing objects — SVG and WebP objects are handled explicitly.

### Brand assignment route — new full implementation (BUG 6)

The `POST /admin/media/brand/assign` route is new in this diff. It supports all four combinations of scope (`brand` / `single`) and target (`main` / `gallery`):

- `brand + main`: bulk-updates `imageUrl` and `image_url` for all products matching `brand` (case-insensitive).
- `brand + gallery`: iterates matching products and appends to the JSON `media_urls`/`gallery` arrays, deduplicating by URL.
- `single + main`: updates the single product's `imageUrl`/`image_url`.
- `single + gallery`: same dedup-append pattern for a single product.

All four paths return `{ success: true, count?, message }`. The Flutter-side `assignMediaImage()` now checks `data['success'] == true` before returning, throwing on `success: false` with a message from `data['error']`. The earlier `'product_id': ?productId` syntax error (null-aware spread in a map literal, which is invalid Dart) is also fixed to `if (productId != null) 'product_id': productId`.

### ImagePickerWidget rework — upload-on-pick (BUG 4)

The error recovery gap: when `_pickAndUpload()` throws, the `catch` block shows a SnackBar and resets `_isLoading` but never calls `widget.onImageSelected`. `ProductForm` initialises `_imageUrl = widget.product!.imageUrl` in its own `initState`, so on a *first* failed upload the form still has the original URL and submitting is safe. The gap is real when a second upload attempt fails after a successful first one: `_uploadedUrl` has the first upload's URL, but `widget.onImageSelected` is not called again, so the parent form's `_imageUrl` is not refreshed to match. The plan required calling `widget.onImageSelected(_uploadedUrl!)` (or `widget.currentImageUrl`) on failure when a URL is available.

### Widget state sync for scrolling lists (BUG 5)

`_ImageUploadFieldState.didUpdateWidget()` synchronises `_uploadedUrl` when `widget.currentUrl` changes and `_isUploading` is false. The guard prevents overwriting an in-progress upload URL with a stale parent-supplied value.

### RadioGroup and compilation risk (BUG 9)

The plan called for replacing `RadioGroup<String>` with a plain `Column` because `RadioGroup` does not exist in Flutter's material library before 3.32. The actual fix *retains* `RadioGroup<String>` but moves `groupValue` and `onChanged` to the wrapper and removes them from the individual `Radio<String>` children. This is the correct usage pattern for Flutter 3.32+ `RadioGroup` (which propagates state to children via `InheritedWidget`). The commit message claims `dart analyze` passed with zero errors. If that's accurate and the Flutter SDK in use is ≥ 3.32, the widget compiles correctly. The risk is build-environment fragility: a CI runner on Flutter 3.31 or earlier will fail at this line, and there is no explicit `flutter` SDK version lower-bound in `pubspec.yaml` to enforce the requirement.

### BUG 3 — product image persistence via PUT

`ProductRepository.update()` was not modified in these commits. The existing implementation handles `image_url`/`imageUrl` correctly: it extracts them separately from the `allowedKeys` loop and writes both columns when either is present in the body. The plan described this as a risk to verify; the current code handles it, but no test was added to confirm the path, and the commit messages do not acknowledge the verification.

### Timeout and user app

The user app (`maasga-mobile`) was not modified in these commits — the benefit it receives is entirely from the backend BUG 7 fix (correct `Content-Type` on `/media/:key` responses).

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/routes/api-mobile/admin.routes.ts` | New `POST /admin/upload/image` using `StorageService`; new `POST /admin/media/brand/upload`; new `POST /admin/media/brand/assign` with all four scope×target paths; new `GET /admin/orders/:id/notes`; imported `SITE_URL`, `validateImageMagicBytes`, `StorageService` |
| `src/routes/web/index.tsx` | Content-type fallback in `GET /media/:key` when R2 metadata is absent or `application/octet-stream` |
| `mobile_admin/lib/features/banners/data/repositories/brand_repository.dart` | Removed `Options(contentType: 'multipart/form-data')` from `uploadImage()`; cosmetic reformatting |
| `mobile_admin/lib/features/products/data/repositories/brand_media_repository.dart` | Explicit MIME type in `uploadMediaImage()`; `success` check and null-safe `product_id` in `assignMediaImage()` |
| `mobile_admin/lib/features/products/presentation/screens/mediatheque_screen.dart` | `RadioGroup` wrapper retained with `groupValue`/`onChanged`; individual `Radio` widgets now carry only `value` (Flutter 3.32+ pattern) |
| `mobile_admin/lib/shared/widgets/image_picker_widget.dart` | Full rework: upload-on-pick via `uploadBrandImageProvider`, `CachedNetworkImage` preview, `initState()` URL seeding, progress indicator |
| `mobile_admin/lib/features/banners/presentation/widgets/image_upload_field.dart` | Added `didUpdateWidget()` for URL sync on widget rebuild; comment updated from ImgBB to R2 |
| `mobile_admin/lib/core/network/dio_provider.dart` | `receiveTimeout` 30s→60s, added `sendTimeout: 120s` |

Full diff: `git -C maasga-code diff HEAD~2...HEAD`

</details>
