import test, { expect } from "@playwright/test";
import {
  clearLocalStorage,
  inputMarysPassword,
  marysDeviceId,
  marysEncryptedDeviceKey,
  provider,
  setupMarysDevice,
  setupMockServer,
} from "./setup";
import { MatchersV3 } from "@pact-foundation/pact";

test.beforeEach("Clear local storage", async ({ page }) => {
  await clearLocalStorage(page);
});

test("new user enters wrong email", async ({ page }) => {
  // Given
  await page.goto("/");

  // When
  const emailInput = page.getByPlaceholder("email@imagey.cloud");
  await expect(emailInput).toBeVisible();
  emailInput.fill("joe(at)imagey.cloud");
  page.getByText("OK").click();

  // Then
  await expect(
    page.getByText("Please enter a valid email address."),
  ).toBeVisible();
});

test("new user visits page", async ({ page }) => {
  // Given
  provider
    .given("default")
    .uponReceiving("a request of joe to verify his email")
    .withRequest({
      method: "POST",
      path: "/users/joe@imagey.cloud/verifications/",
      headers: { "Content-Type": "application/json" },
    })
    .willRespondWith({
      status: 201,
    });
	provider
	  .given("default")
	  .uponReceiving("a request of joe to get public key")
	  .withRequest({
	    method: "GET",
	    path: "/users/joe@imagey.cloud/public-keys/0",
	    headers: { "Content-Type": "application/json" },
	  })
	  .willRespondWith({
	    status: 401,
	  });

  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.goto("/");
    const emailInput = page.getByPlaceholder("email@imagey.cloud");
    await expect(emailInput).toBeVisible();

    emailInput.fill("joe@imagey.cloud");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/verification link/)).toBeVisible();
  });
});

test("existing user visits page with new device", async ({ page }) => {
  // Given
  provider
    .given("default")
    .uponReceiving("a request of mary to get public key")
    .withRequest({
      method: "GET",
      path: "/users/mary@imagey.cloud/public-keys/0",
      headers: { "Content-Type": "application/json" },
    })
    .willRespondWith({
      status: 401,
    });
  provider
    .given("default")
    .uponReceiving("a request of mary to login")
    .withRequest({
      method: "POST",
      path: "/users/mary@imagey.cloud/verifications/",
    })
    .willRespondWith({
      status: 202,
    });

  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.goto("/");
    const emailInput = page.getByPlaceholder("email@imagey.cloud");
    await expect(emailInput).toBeVisible();

    emailInput.fill("mary@imagey.cloud");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/login link/)).toBeVisible();
  });
});

test.skip("existing user visits page with invalid token", async ({ page }) => {
  // Given
  provider
    .given("marys token is invalid")
    .uponReceiving("a request of mary to get symmetric key")
    .withRequest({
      method: "GET",
      path: "/users/mary@imagey.cloud/symmetric-keys/0",
      headers: {
        Accept: "application/json",
      },
    })
    .willRespondWith({
      status: 403,
    });
  provider
    .given("default")
    .uponReceiving("a request of mary to register account")
    .withRequest({
      method: "POST",
      path: "/users/",
      headers: { "Content-Type": "application/json" },
      body: {
        email: "mary@imagey.cloud",
      },
    })
    .willRespondWith({
      status: 409,
    });

  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.evaluate(() =>
      localStorage.setItem("imagey.user", "mary@imagey.cloud"),
    );
    await page.evaluate(
      (deviceId) =>
        localStorage.setItem("imagey.deviceIds[mary@imagey.cloud]", deviceId),
      marysDeviceId,
    );
    await page.goto("/");
    const emailInput = page.getByPlaceholder("email@imagey.cloud");
    await expect(emailInput).toBeVisible();

    emailInput.fill("mary@imagey.cloud");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/login link/)).toBeVisible();
  });
});

test("new user clicks registration link", async ({ page }) => {
  // Given
  provider
    .given("default")
    .uponReceiving("a request of joe to register")
    .withRequest({
      method: "POST",
      path: "/users/joe@imagey.cloud/verifications/",
    })
    .willRespondWith({
      status: 201,
    });
	provider
	  .given("default")
	  .uponReceiving("a request of joe to get symmetric key")
	  .withRequest({
	    method: "GET",
	    path: "/users/joe@imagey.cloud/public-keys/0",
	    headers: {
	      Accept: "application/json",
	    },
	  })
	  .willRespondWith({
	    status: 404,
	  });
  provider
    .given("default")
    .uponReceiving("a request to register joe")
    .withRequest({
      method: "POST",
      path: "/users",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
		email: "joe@imagey.cloud",
      },
    })
    .willRespondWith({
      status: 200,
    });
  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.goto("/?email=joe@imagey.cloud");

    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeVisible();
    passwordInput.fill("marysPassword123");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/Keine Bilder vorhanden/)).toBeVisible();
  });
});

test("existing user clicks login link for new device", async ({ page }) => {
  // Given
  provider
    .given("default")
    .uponReceiving("a request of mary to store public key for device")
    .withRequest({
      method: "PUT",
      path: MatchersV3.regex(
        "/users/mary@imagey\\.cloud/public-keys/.+",
        "/users/mary@imagey.cloud/public-keys/123e4567-e89b-12d3-a456-426655440000",
      ),
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        crv: "P-256",
        ext: true,
        key_ops: [],
        kty: "EC",
        x: MatchersV3.string("I_VS7DvICMehgUF2rA4llF0mjZOSs6vgO_A5PLobUmc"),
        y: MatchersV3.string("Z4astOZHg9NfhoAldwMZhC34UQsRU7CflGn8JpNGtAg"),
      },
    })
    .willRespondWith({
      status: 200,
    });
  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.goto("/?email=mary@imagey.cloud");

    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeVisible();
    passwordInput.fill("marysPassword123");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/Keine Bilder vorhanden/)).toBeVisible();
  });
});

test("existing user clicks login link on existing device", async ({ page }) => {
  // Given
  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.evaluate(() =>
      localStorage.setItem("imagey.user", "bob@imagey.cloud"),
    );
    await page.evaluate(
      (deviceId) =>
        localStorage.setItem("imagey.deviceIds[mary@imagey.cloud]", deviceId),
      marysDeviceId,
    );
    await page.evaluate(
      ({ deviceId, key }) => {
        localStorage.setItem("imagey.devices[" + deviceId + "].key", key);
      },
      { deviceId: marysDeviceId, key: marysEncryptedDeviceKey },
    );
    await page.goto("/?email=mary@imagey.cloud");

    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeVisible();
    passwordInput.fill("MarysPassword123");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/Keine Bilder vorhanden/)).toBeVisible();
  });
});

test("visit page on existing device", async ({ page }) => {
  // Given
  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await setupMarysDevice(page);
    await page.goto("/");

    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeVisible();
    passwordInput.fill("MarysPassword123");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/Keine Bilder vorhanden/)).toBeVisible();
  });
});

test("visit page on existing device with wrong password", async ({ page }) => {
  // Given
  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await setupMarysDevice(page);
    await page.goto("/");

    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeVisible();
    passwordInput.fill("wrongPassword");
    page.getByText("OK").click();

    // Then
    await expect(page.getByText(/Wrong password/)).toBeVisible();
  });
});

test("login with missing email", async ({ page }) => {
  // Given
  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.evaluate(
      (deviceId) =>
        localStorage.setItem("imagey.deviceIds[mary@imagey.cloud]", deviceId),
      marysDeviceId,
    );
    await page.evaluate(
      ({ deviceId, key }) =>
        localStorage.setItem("imagey.devices[" + deviceId + "].key", key),
      { deviceId: marysDeviceId, key: marysEncryptedDeviceKey },
    );
    await page.goto("/");
    const emailInput = page.getByPlaceholder("email@imagey.cloud");
    await expect(emailInput).toBeVisible();

    emailInput.fill("mary@imagey.cloud");
    page.getByText("OK").click();

    await inputMarysPassword(page);

    // Then
    await expect(page.getByText(/Keine Bilder vorhanden/)).toBeVisible();
  });
});

test("login with lost private key", async ({ page }) => {
  // Given
  provider
    .given("default")
    .uponReceiving("a request of mary to store public key for device")
    .withRequest({
      method: "PUT",
      path: MatchersV3.regex(
        "/users/mary@imagey\\.cloud/public-keys/.+",
        "/users/mary@imagey.cloud/public-keys/123e4567-e89b-12d3-a456-426655440000",
      ),
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        crv: "P-256",
        ext: true,
        key_ops: [],
        kty: "EC",
        x: MatchersV3.string("I_VS7DvICMehgUF2rA4llF0mjZOSs6vgO_A5PLobUmc"),
        y: MatchersV3.string("Z4astOZHg9NfhoAldwMZhC34UQsRU7CflGn8JpNGtAg"),
      },
    })
    .willRespondWith({
      status: 200,
    });
  await provider.executeTest(async (mockServer) => {
    // When
    await setupMockServer(page, mockServer);
    await page.evaluate(() =>
      localStorage.setItem("imagey.user", "mary@imagey.cloud"),
    );
    await page.evaluate(
      (deviceId) =>
        localStorage.setItem("imagey.deviceIds[mary@imagey.cloud]", deviceId),
      marysDeviceId,
    );
    await page.goto("/");

    // Then
    const passwordInput = page.getByLabel("password");
    await expect(passwordInput).toBeVisible();
    passwordInput.fill("MarysPassword123");
    page.getByText("OK").click();

    const newPasswordInput = page.getByLabel(/Private key missing/);
    await expect(newPasswordInput).toBeVisible();
    newPasswordInput.fill("MarysPassword123");
    page.getByText("OK").click();
    await expect(page.getByText(/Keine Bilder vorhanden/)).toBeVisible();
  });
});
