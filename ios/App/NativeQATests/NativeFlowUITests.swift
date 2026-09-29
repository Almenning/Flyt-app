import XCTest

/// Black-box UI tests use a clean simulator and never submit account credentials.
@MainActor
final class NativeFlowUITests: XCTestCase {
    private func attachScreen(_ app: XCUIApplication, _ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testColdStartLoginSignupAndEmptyPasswordRecovery() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "no.adspire.hverdagsoss")
        app.launch()
        let login = app.buttons["Logg inn"].firstMatch
        XCTAssertTrue(login.waitForExistence(timeout: 30), "The app must reach the login screen")
        attachScreen(app, "native-signed-out")
        login.tap()
        XCTAssertTrue(app.textFields["E-post"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.secureTextFields["Passord"].exists)
        app.buttons["Glemt passord?"].tap()
        XCTAssertTrue(app.staticTexts["Skriv inn e-postadressen din først."].waitForExistence(timeout: 5))
        attachScreen(app, "native-password-validation")
        app.buttons["Tilbake"].tap()
        app.buttons["Opprett konto"].firstMatch.tap()
        XCTAssertTrue(app.textFields["Fornavn"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.textFields["E-post"].exists)
        XCTAssertTrue(app.secureTextFields["Passord"].exists)
        app.buttons["Opprett konto"].firstMatch.tap()
        // The existing capture-phase signup guard checks password length first.
        XCTAssertTrue(app.staticTexts["Velg et passord med minst 10 tegn."].waitForExistence(timeout: 5))
        attachScreen(app, "native-signup-password-guard")
        let password = app.secureTextFields["Passord"]
        password.tap()
        password.typeText("synthetic-test-password")
        app.buttons["Opprett konto"].firstMatch.tap()
        // With the password guard satisfied, the still-empty name blocks signup.
        // No email is entered and no account-creation request should be sent.
        attachScreen(app, "native-signup-name-guard")
        XCTAssertTrue(app.staticTexts["Skriv inn fornavnet ditt."].waitForExistence(timeout: 5))
    }

    func testColdAndWarmInviteLinksRequireLoginAndExplicitAcceptance() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "no.adspire.hverdagsoss")
        let invitation = "Invitasjonen er klar. Logg inn eller opprett konto for å fortsette."
        app.terminate()
        app.open(try XCTUnwrap(URL(string: "hverdagsoss://invite/ABCDEF123456")))
        XCTAssertTrue(app.staticTexts[invitation].waitForExistence(timeout: 30), "Cold-start invitation must reach the signed-out app")
        XCTAssertFalse(app.buttons["Bli med i husholdning"].exists, "A URL must never silently enroll a signed-out user")
        attachScreen(app, "native-cold-invite")
        app.open(try XCTUnwrap(URL(string: "hverdagsoss://invite/123456ABCDEF")))
        XCTAssertTrue(app.staticTexts[invitation].waitForExistence(timeout: 10), "An already running app must handle a second invitation")
        XCTAssertFalse(app.buttons["Bli med i husholdning"].exists)
        attachScreen(app, "native-warm-invite")
    }

    func testUnknownURLDoesNotLeaveAppOrExposeHousehold() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "no.adspire.hverdagsoss")
        app.launch()
        XCTAssertTrue(app.buttons["Logg inn"].firstMatch.waitForExistence(timeout: 30))
        app.open(try XCTUnwrap(URL(string: "hverdagsoss://untrusted/ABCDEF123456")))
        XCTAssertTrue(app.buttons["Logg inn"].firstMatch.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Bli med i husholdning"].exists)
        XCTAssertEqual(app.state, .runningForeground)
        attachScreen(app, "native-unknown-url")
    }
}
