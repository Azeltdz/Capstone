import { API_BASE } from "../api/client";

export const imageSrc = (url) => (!url ? null : /^https?:/i.test(url) ? url : `${API_BASE}${url}`);