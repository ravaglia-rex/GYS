/** While password reset runs, Firebase may strip ?mode=&oobCode= from the URL; avoid showing "Invalid Action" during that gap. */
const PW_RESET_IN_PROGRESS_KEY = "argus_pw_reset_in_progress";

export function setPasswordResetInProgress(): void {
  try {
    sessionStorage.setItem(PW_RESET_IN_PROGRESS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearPasswordResetInProgress(): void {
  try {
    sessionStorage.removeItem(PW_RESET_IN_PROGRESS_KEY);
  } catch {
    /* ignore */
  }
}

export function isPasswordResetInProgress(): boolean {
  try {
    return sessionStorage.getItem(PW_RESET_IN_PROGRESS_KEY) === "1";
  } catch {
    return false;
  }
}
