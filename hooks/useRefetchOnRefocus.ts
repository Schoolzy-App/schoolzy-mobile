import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef } from "react";

/**
 * Refetch when the screen comes back into focus (e.g. back from a pushed
 * screen). The first focus is skipped: the query's own mount fetch covers it.
 */
export function useRefetchOnRefocus(refetch: () => unknown) {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );
}
