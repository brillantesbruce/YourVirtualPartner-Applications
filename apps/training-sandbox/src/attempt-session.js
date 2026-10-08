(() => {
  const browserSessionKey = "yvp-browser-session-id";
  const attemptPrefix = "yvp-attempt-started:";
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function createUuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  function browserSessionId() {
    let id = sessionStorage.getItem(browserSessionKey);
    if (!id || !uuidPattern.test(id)) {
      id = createUuid();
      sessionStorage.setItem(browserSessionKey, id);
    }
    return id;
  }

  window.YVPAttemptSession = {
    hasStarted(appId) {
      return sessionStorage.getItem(`${attemptPrefix}${appId}`) !== null;
    },
    start(appId) {
      const key = `${attemptPrefix}${appId}`;
      if (sessionStorage.getItem(key) !== null) return null;
      const id = browserSessionId();
      sessionStorage.setItem(key, id);
      return id;
    },
    getId(appId) {
      return sessionStorage.getItem(`${attemptPrefix}${appId}`);
    },
  };
})();
