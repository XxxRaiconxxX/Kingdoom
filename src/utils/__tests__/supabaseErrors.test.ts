import { describe, it, expect } from 'vitest';
import { formatAdminPermissionMessage } from '../supabaseErrors';

describe('formatAdminPermissionMessage', () => {
  const fallback = 'Error occurred.';
  const permissionMessage = `${fallback} Vincula este perfil admin con la sesion segura de Supabase para usar esta accion.`;

  it('returns the permission message when the error includes "row-level security"', () => {
    expect(formatAdminPermissionMessage(fallback, 'new row violates row-level security policy')).toBe(permissionMessage);
  });

  it('returns the permission message when the error includes "permission denied"', () => {
    expect(formatAdminPermissionMessage(fallback, 'ERROR: permission denied for table users')).toBe(permissionMessage);
  });

  it('returns the permission message when the error includes "42501"', () => {
    expect(formatAdminPermissionMessage(fallback, 'Error Code: 42501')).toBe(permissionMessage);
  });

  it('returns the permission message when the error includes "not allowed"', () => {
    expect(formatAdminPermissionMessage(fallback, 'Action not allowed for current user')).toBe(permissionMessage);
  });

  it('is case insensitive', () => {
    expect(formatAdminPermissionMessage(fallback, 'ROW-LEVEL SECURITY')).toBe(permissionMessage);
    expect(formatAdminPermissionMessage(fallback, 'Permission Denied')).toBe(permissionMessage);
  });

  it('returns the fallback with the raw message if it is not a permission error', () => {
    expect(formatAdminPermissionMessage(fallback, 'Something went wrong')).toBe(`${fallback} Something went wrong`);
  });

  it('returns only the fallback if rawMessage is not provided', () => {
    expect(formatAdminPermissionMessage(fallback)).toBe(fallback);
  });

  it('handles null rawMessage (converted to empty string in JS, so it should return fallback)', () => {
    expect(formatAdminPermissionMessage(fallback, null as any)).toBe(fallback);
  });
});
