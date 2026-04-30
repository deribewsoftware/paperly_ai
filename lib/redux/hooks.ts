"use client";

import { useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatch, RootState } from "@/lib/redux/store";
import { store } from "@/lib/redux/store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

type AppStore = typeof store;
