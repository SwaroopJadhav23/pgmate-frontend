const APK_PATH = "/apk/pgmate.apk";

export const getApkDownloadUrl = () => {
  const rawBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

  if (rawBaseUrl) {
    try {
      return new URL(APK_PATH, rawBaseUrl).toString();
    } catch {
      // fallback below
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${APK_PATH}`;
  }

  return APK_PATH;
};
