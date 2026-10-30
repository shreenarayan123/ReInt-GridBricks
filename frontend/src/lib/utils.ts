import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn's class-name helper. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
