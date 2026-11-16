export interface Wall { id: string; x1: number; y1: number; x2: number; y2: number; thickness: number; height?: number; color?: string }
export interface Door { id: string; wallId?: string; x: number; y: number; width: number; swing?: "left" | "right" }
export interface WindowItem { id: string; wallId?: string; x: number; y: number; width: number; height?: number; sillHeight?: number }
export type FurnitureType = "sofa" | "bed" | "plant" | "tv_unit";
export interface FurnitureItem { id: string; type: FurnitureType; x: number; y: number; rotation: number; scale: number }
export interface Layout { walls: Wall[]; doors: Door[]; windows: WindowItem[]; furniture: FurnitureItem[] }
export const emptyLayout = (): Layout => ({ walls: [], doors: [], windows: [], furniture: [] });
