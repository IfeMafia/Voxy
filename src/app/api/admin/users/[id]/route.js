import { NextResponse } from 'next/server';
import { isAdmin, adminError } from '@/lib/adminAuth';
import db from '@/lib/db';

/**
 * Update user (Promote to admin, change role, etc.)
 */
export async function PATCH(req, { params }) {
  try {
    const authStatus = await isAdmin();
    if (!authStatus.authorized) {
      return adminError(authStatus.error);
    }

    const { id } = params;
    const { name, email, role } = await req.json();

    const updates = [];
    const values = [];

    if (name) {
      values.push(name);
      updates.push(`name = $${values.length}`);
    }
    if (email) {
      values.push(email);
      updates.push(`email = $${values.length}`);
    }
    if (role) {
      values.push(role);
      updates.push(`role = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, name, email, role`;
    
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Admin User Update Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Delete User
 */
export async function DELETE(req, { params }) {
  try {
    const authStatus = await isAdmin();
    if (!authStatus.authorized) {
      return adminError(authStatus.error);
    }

    const { id } = params;

    // Protection: Don't allow an admin to delete themselves via this endpoint (usually handled in UI but good for safety)
    if (id === authStatus.user.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account via admin panel' }, { status: 400 });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin User Delete Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
