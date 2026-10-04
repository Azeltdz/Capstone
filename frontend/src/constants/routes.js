export const CASHIER_LOGIN_PATH = "/";
export const OWNER_LOGIN_PATH = "/owner-login";

export const homeFor = (role) => (role === "owner" ? "/owner" : "/cashier");

export const loginPathFor = (allowedRoles) =>
  allowedRoles?.includes("owner") && !allowedRoles.includes("cashier") ? OWNER_LOGIN_PATH : CASHIER_LOGIN_PATH;