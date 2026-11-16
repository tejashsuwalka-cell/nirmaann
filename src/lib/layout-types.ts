export interface Wall { id: string; x1: number; y1: number; x2: number; y2: number; thickness: number; height?: number | undefined; color?: string }
export interface Door { id: string | undefined; wallId?: string | undefined; x: number; y: number; width: number; swing?: "left" | "right" }
export interface WindowItem { id: string | undefined; wallId?: string | undefined; x: number; y: number; width: number; height?: number | undefined; sillHeight?: number }
export type FurnitureType = "sofa" | "bed" | "plant" | "tv_unit" | undefined;
export interface FurnitureItem { id: string; type: FurnitureType; x: number; y: number; rotation: number; scale: number }
export interface Layout { walls: Wall[]; doors: Door[]; windows: WindowItem[]; furniture: FurnitureItem[] }
export const emptyLayout = (): Layout => ({ walls: [], doors: [], windows: [], furniture: [] });
