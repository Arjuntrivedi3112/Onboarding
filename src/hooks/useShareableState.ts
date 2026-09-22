import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * A `useState`-shaped hook whose value also lives in the URL's query
 * string, so a link to the current page reproduces whatever a simulator's
 * control is set to — "look at this example" becomes a URL, not a
 * screenshot with instructions.
 *
 * Not wired into every interactive control in every lesson: this is the
 * reusable pattern, applied so far to a couple of flagship simulators
 * (e.g. mediabuying/rtb-auction-in-100ms's DSP toggle) as a demonstration.
 * Extending it to more lessons is mechanical from here — swap a `useState`
 * for this hook with a query-param key and, for anything beyond a plain
 * string, a serialize/deserialize pair.
 *
 * Uses `replace` navigation so dragging a slider doesn't flood browser
 * history with one entry per pixel.
 */
export function useShareableState<T>(
  paramKey: string,
  defaultValue: T,
  codec: { serialize: (value: T) => string; deserialize: (raw: string) => T | null }
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(() => {
    const raw = searchParams.get(paramKey);
    if (raw === null) return defaultValue;
    const parsed = codec.deserialize(raw);
    return parsed === null ? defaultValue : parsed;
    // codec is expected to be a stable reference (module-level or useMemo'd
    // by the caller); re-running this on every render would defeat the
    // point of reading from the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, paramKey, defaultValue]);

  const setValue = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const merged = new URLSearchParams(prev);
          if (next === defaultValue) merged.delete(paramKey); // keep the URL clean at the default
          else merged.set(paramKey, codec.serialize(next));
          return merged;
        },
        { replace: true }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramKey, defaultValue, setSearchParams]
  );

  return [value, setValue];
}

/** Codec for plain string enum values (most simulator toggles). */
export const stringCodec = {
  serialize: (value: string) => value,
  deserialize: (raw: string) => raw,
};

/** Codec for a bounded number (sliders), rejecting out-of-range/garbage input from a hand-edited URL. */
export function numberCodec(min: number, max: number) {
  return {
    serialize: (value: number) => String(value),
    deserialize: (raw: string) => {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
      return parsed;
    },
  };
}

/** Codec for a fixed set of allowed string values, rejecting anything else from a hand-edited URL. */
export function enumCodec<T extends string>(allowed: readonly T[]) {
  return {
    serialize: (value: T) => value,
    deserialize: (raw: string) => (allowed.includes(raw as T) ? (raw as T) : null),
  };
}
