import { useEffect } from "react";
import { useAppDispatch } from "@/stores/store";
import { setBreadcrumbTitle } from "@/stores/slices/uiSlice";

/**
 * Sets the dynamic breadcrumb title for the current view/edit page.
 * Automatically clears the breadcrumb title on unmount.
 */
export function useSetBreadcrumb(title?: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (title && title.trim()) {
      dispatch(setBreadcrumbTitle(title.trim()));
    }
    return () => {
      dispatch(setBreadcrumbTitle(null));
    };
  }, [title, dispatch]);
}
