import { useMediaQuery } from "@astryxdesign/core/hooks";

/**
 * Below this width the three-pane desktop layout does not fit, so the app
 * switches to a single column with a bottom tab bar (phones in portrait and
 * landscape, small tablets). Keep in sync with `.app-shell.is-compact` in
 * app.css, which keys off the class set from this hook.
 */
export const COMPACT_MEDIA_QUERY = "(max-width: 1023px)";

export function useCompactLayout(): boolean {
  return useMediaQuery(COMPACT_MEDIA_QUERY);
}
