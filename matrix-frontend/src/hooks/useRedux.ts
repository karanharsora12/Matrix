import { useCallback } from "react";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
  shallowEqual,
} from "react-redux";
import type { RootState, AppDispatch } from "@/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useReduxDispatch = useAppDispatch;

export type ReduxSelector<T> = (state: RootState) => T;

export function useRedux<TSelected>(
  selector: ReduxSelector<TSelected>,
  equalityFn?: (left: TSelected, right: TSelected) => boolean,
): TSelected;

export function useRedux<K extends keyof RootState>(
  sliceKey: K,
  equalityFn?: (left: RootState[K], right: RootState[K]) => boolean,
): RootState[K];

export function useRedux<K extends keyof RootState>(
  sliceKeys: K[],
  equalityFn?: (left: Pick<RootState, K>, right: Pick<RootState, K>) => boolean,
): Pick<RootState, K>;

export function useRedux(): RootState;

export function useRedux<TSelected = RootState>(
  selectorOrKeys?:
    | keyof RootState
    | (keyof RootState)[]
    | ReduxSelector<TSelected>,
  equalityFn?: (left: any, right: any) => boolean,
): any {
  return useSelector((state: RootState) => {
    if (typeof selectorOrKeys === "function") {
      return selectorOrKeys(state);
    }
    if (Array.isArray(selectorOrKeys)) {
      return selectorOrKeys.reduce<Record<string, any>>((acc, key) => {
        acc[key] = state[key];
        return acc;
      }, {});
    }
    if (
      typeof selectorOrKeys === "string" ||
      typeof selectorOrKeys === "number" ||
      typeof selectorOrKeys === "symbol"
    ) {
      return state[selectorOrKeys as keyof RootState];
    }
    return state;
  }, equalityFn);
}

export function useSlice<K extends keyof RootState>(
  sliceKey: K,
  equalityFn?: (left: RootState[K], right: RootState[K]) => boolean,
): [RootState[K], AppDispatch] {
  const sliceState = useRedux(sliceKey, equalityFn);
  const dispatch = useAppDispatch();
  return [sliceState, dispatch];
}

export function useReduxAction<TArgs extends any[]>(
  actionCreator: (...args: TArgs) => any,
) {
  const dispatch = useAppDispatch();
  return useCallback(
    (...args: TArgs) => dispatch(actionCreator(...args)),
    [dispatch, actionCreator],
  );
}

export { shallowEqual };
export default useRedux;
