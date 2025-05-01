export const authenticationRepository = {
  loadPrivateKey: async (
    email: string,
    deviceId: string,
    key: JsonWebKey,
  ): Promise<void> => {
    const response = await fetch(
      "/users/" + email + "/devices/" + deviceId + "/private-keys/0",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(key),
      },
    );
    return response.status >= 200 && response.status <= 300
      ? Promise.resolve()
      : Promise.reject();
  },
  storePrivateKey: async (
    email: string,
    deviceId: string,
    key: JsonWebKey,
    token?: string,
  ): Promise<void> => {
    const response = await fetch(
      "/users/" + email + "/devices/" + deviceId + "/private-keys/0",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        credentials: "same-origin",
        body: JSON.stringify(key),
      },
    );
    return response.status >= 200 && response.status <= 300
      ? Promise.resolve()
      : Promise.reject();
  },
  loadPublicKey: async (email: string, deviceId: string): Promise<void> => {
    const response = await fetch(
      "/users/" + email + "/public-keys/" + deviceId,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
      },
    );
    return response.status >= 200 && response.status <= 300
      ? Promise.resolve()
      : Promise.reject();
  },
  storePublicKey: async (
    email: string,
    deviceId: string,
    key: JsonWebKey,
  ): Promise<void> => {
    const response = await fetch(
      "/users/" + email + "/public-keys/" + deviceId,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(key),
      },
    );
    return response.status >= 200 && response.status <= 300
      ? Promise.resolve()
      : Promise.reject();
  },
};
