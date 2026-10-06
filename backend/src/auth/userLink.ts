import type { Db } from '../db.ts';
import type { Vendor, VendorConfig } from './config.ts';
import type { VendorUser } from './yandex.ts';
import type { VendorUser as GoogleVendorUser } from './google.ts';

export type AppUser = {
  id: number;
  name: string;
  authVendor: Vendor;
};

type AnyVendorUser = VendorUser | GoogleVendorUser;

/**
 * Find-or-create пользователя по (auth_vendor, auth_code).
 * auth_code = vendorUserId из профиля вендора.
 */
export function upsertUser(db: Db, vendorUser: AnyVendorUser): AppUser {
  const existing = db
    .prepare(`SELECT id, name FROM "user" WHERE auth_vendor = ? AND auth_code = ?`)
    .get(vendorUser.vendor, vendorUser.vendorUserId) as
    | { id: number; name: string }
    | undefined;

  if (existing) {
    // Обновим имя, если поменялось (дёшево, раз в логин).
    if (existing.name !== vendorUser.displayName) {
      db.prepare(`UPDATE "user" SET name = ? WHERE id = ?`)
        .run(vendorUser.displayName, existing.id);
    }
    return { id: existing.id, name: vendorUser.displayName, authVendor: vendorUser.vendor };
  }

  const info = db
    .prepare(`INSERT INTO "user" (name, auth_vendor, auth_code) VALUES (?, ?, ?)`)
    .run(vendorUser.displayName, vendorUser.vendor, vendorUser.vendorUserId);
  const id = Number(info.lastInsertRowid);
  return { id, name: vendorUser.displayName, authVendor: vendorUser.vendor };
}

export function getUserById(db: Db, id: number): AppUser | null {
  const row = db
    .prepare(`SELECT id, name, auth_vendor FROM "user" WHERE id = ?`)
    .get(id) as { id: number; name: string; auth_vendor: Vendor } | undefined;
  if (!row) return null;
  return { id: row.id, name: row.name, authVendor: row.auth_vendor };
}

/** Заглушка для удовлетворения импорта VendorConfig в типах, если понадобится. */
export type { VendorConfig };
