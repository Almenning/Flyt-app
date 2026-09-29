import XCTest
import UIKit
import WebKit
import Security

/// Hosted tests use the real bundled app and synthetic values on a clean simulator.
@MainActor
final class NativeRuntimeTests: XCTestCase {
    private func findWebView(_ view: UIView) -> WKWebView? {
        if let web = view as? WKWebView { return web }
        for child in view.subviews { if let web = findWebView(child) { return web } }
        return nil
    }

    private func currentWebView() -> WKWebView? {
        let windows = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap { $0.windows }
        for window in windows where !window.isHidden {
            if let root = window.rootViewController?.view, let web = findWebView(root) { return web }
        }
        return nil
    }

    private func readyWebView() async throws -> WKWebView {
        let end = Date().addingTimeInterval(30)
        while Date() < end {
            if let web = currentWebView(), !web.isLoading,
               let result = try? await web.evaluateJavaScript("Boolean(window.FlytPlatform && window.FlytSync && document.querySelector('#chooseSignin'))"),
               result as? Bool == true { return web }
            try await Task.sleep(nanoseconds: 200_000_000)
        }
        throw NSError(domain: "NativeQA", code: 1, userInfo: [NSLocalizedDescriptionKey: "The bundled app did not reach its signed-out screen"])
    }

    private func run(_ body: String, in web: WKWebView, arguments: [String: Any] = [:]) async throws -> Any? {
        let bounded = """
            let qaTimer;
            try {
                return await Promise.race([
                    (async () => { \(body) })(),
                    new Promise((_, reject) => { qaTimer = setTimeout(() => reject(new Error('NATIVE_QA_BRIDGE_TIMEOUT')), 10000); })
                ]);
            } finally { clearTimeout(qaTimer); }
            """
        return try await web.callAsyncJavaScript(bounded, arguments: arguments, in: nil, contentWorld: .page)
    }

    private func screenshot(_ name: String) async {
        guard let web = currentWebView() else { return }
        let image: UIImage? = await withCheckedContinuation { continuation in
            web.takeSnapshot(with: nil) { image, _ in continuation.resume(returning: image) }
        }
        if let image = image {
            let attachment = XCTAttachment(image: image)
            attachment.name = name
            attachment.lifetime = .keepAlways
            add(attachment)
        }
    }

    func testRealKeychainBridgeSurvivesReloadAndDeletes() async throws {
        continueAfterFailure = false
        let key = "native-qa-" + UUID().uuidString
        let value = "synthetic-non-secret-test-value"
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
                                    kSecAttrService as String: "no.adspire.hverdagsoss.supabase.auth",
                                    kSecAttrAccount as String: key]
        defer { SecItemDelete(query as CFDictionary) }
        do {
            let web = try await readyWebView()
            let native = try await run("return FlytPlatform.isNative && FlytPlatform.platform === 'ios' && Capacitor.isPluginAvailable('HverdagsOssSecureStorage');", in: web)
            XCTAssertEqual(native as? Bool, true, "The Swift Keychain plugin must be available to the actual WebView")
            let written = try await run("""
                const storage = FlytPlatform.secureAuthStorage;
                await storage.setItem(key, value);
                return (await storage.getItem(key)) === value && localStorage.getItem(key) === null;
                """, in: web, arguments: ["key": key, "value": value])
            XCTAssertEqual(written as? Bool, true)
            var attributesQuery = query
            attributesQuery[kSecReturnAttributes as String] = true
            attributesQuery[kSecMatchLimit as String] = kSecMatchLimitOne
            var item: CFTypeRef?
            XCTAssertEqual(SecItemCopyMatching(attributesQuery as CFDictionary, &item), errSecSuccess)
            let attributes = try XCTUnwrap(item as? [String: Any])
            XCTAssertEqual(attributes[kSecAttrAccessible as String] as? String, kSecAttrAccessibleWhenUnlockedThisDeviceOnly as String)
            web.reload()
            let reloaded = try await readyWebView()
            let persisted = try await run("return (await FlytPlatform.secureAuthStorage.getItem(key)) === value;", in: reloaded, arguments: ["key": key, "value": value])
            XCTAssertEqual(persisted as? Bool, true, "Keychain data must survive a fresh web document")
            let removed = try await run("await FlytPlatform.secureAuthStorage.removeItem(key); return (await FlytPlatform.secureAuthStorage.getItem(key)) === null;", in: reloaded, arguments: ["key": key])
            XCTAssertEqual(removed as? Bool, true)
            XCTAssertEqual(SecItemCopyMatching(query as CFDictionary, nil), errSecItemNotFound)
            await screenshot("native-startup-keychain-passed")
        } catch { await screenshot("native-startup-keychain-failed"); throw error }
    }

    func testRealStorageLockAndExplicitCleanup() async throws {
        continueAfterFailure = false
        let key = "native-qa-lock-" + UUID().uuidString
        do {
            let web = try await readyWebView()
            let result = try await run("""
                const storage = FlytPlatform.secureAuthStorage;
                await storage.setItem(key, 'synthetic-value');
                FlytPlatform.lockAuthStorage();
                try {
                    let refused = false;
                    try { await storage.setItem(key, 'must-not-be-saved'); }
                    catch (error) { refused = error.message === 'AUTH_STORAGE_LOCKED'; }
                    const hiddenWhileLocked = (await storage.getItem(key)) === null;
                    await FlytPlatform.clearSecureAuthStorage();
                    return refused && hiddenWhileLocked;
                } finally { FlytPlatform.unlockAuthStorage(); }
                """, in: web, arguments: ["key": key])
            XCTAssertEqual(result as? Bool, true)
            let absent = try await run("return (await FlytPlatform.secureAuthStorage.getItem(key)) === null;", in: web, arguments: ["key": key])
            XCTAssertEqual(absent as? Bool, true)
        } catch { await screenshot("native-storage-lock-failed"); throw error }
    }

    func testAppPluginAndLocalPagesAreUsable() async throws {
        continueAfterFailure = false
        do {
            let web = try await readyWebView()
            let result = try await run("""
                const state = await FlytPlatform.getAppState();
                for (const path of ['./privacy.html', './reset.html', './invite.html']) {
                    const response = await fetch(path);
                    if (!response.ok || (await response.text()).length < 100) return false;
                }
                return typeof state.isActive === 'boolean' && location.protocol === 'capacitor:';
                """, in: web)
            XCTAssertEqual(result as? Bool, true, "Native APIs and bundled recovery/privacy pages must work without GitHub Pages")
            await screenshot("native-bundled-pages-passed")
        } catch { await screenshot("native-bundled-pages-failed"); throw error }
    }
}
