/**
 * The open-sign intro only plays when the site is first opened (or refreshed) on the landing
 * page. Coming back to the landing page from anywhere else in the site — the logo, "projects",
 * "start shopping", the back button — cuts straight to it at rest.
 */
const initialPath = typeof window !== "undefined" ? window.location.pathname : null;
let played = false;

/** true when the landing page should skip its intro this time */
export function shouldSkipIntro(): boolean {
  return played || (initialPath !== null && initialPath !== "/");
}

/** the intro has been shown in this page load */
export function markIntroPlayed() {
  played = true;
}
