import { apiFetch } from './api';

export type EquipmentCategory = { id: string; name: string };
export type Warehouse = { id: string; name: string; location?: string | null };

export function listEquipmentCategories(token: string) {
  return apiFetch<EquipmentCategory[]>('/meta/equipment-categories', { token });
}

export function listWarehouses(token: string) {
  return apiFetch<Warehouse[]>('/meta/warehouses', { token });
}
