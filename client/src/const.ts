export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The server owns OAuth state/nonce generation and validation.
export const getLoginUrl = () => "/api/oauth/start";
