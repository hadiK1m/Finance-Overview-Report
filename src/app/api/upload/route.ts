// src/app/api/upload/route.ts
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { decrypt } from '@/lib/auth'; // 1. Impor fungsi dekripsi

export async function POST(request: NextRequest) {
  // 2. Dapatkan token dari cookie
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  // 3. Dekripsi token untuk mendapatkan data pengguna
  const session = await decrypt(token);
  if (!session?.email) {
    return NextResponse.json(
      { success: false, message: 'Invalid token.' },
      { status: 401 }
    );
  }

  // 4. Ambil file dari form data
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file found.' });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 5. Buat nama folder yang aman dari email pengguna
  const userEmail = session.email;
  const userFolder = userEmail.replace(/[^a-zA-Z0-9]/g, '_'); // Ganti karakter non-alfanumerik

  // 6. Buat path dinamis: /uploads/email_pengguna/namafile
  const relativeUploadDir = join('/uploads', userFolder);
  const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

  try {
    // Buat direktori pengguna jika belum ada
    await mkdir(uploadDir, { recursive: true });
  } catch (e: any) {
    if (e.code !== 'EEXIST') {
      console.error('Error creating directory', e);
      return NextResponse.json(
        { success: false, message: 'Could not create upload directory.' },
        { status: 500 }
      );
    }
  }

  // Simpan file
  const path = join(uploadDir, file.name);
  await writeFile(path, buffer);

  // Kembalikan URL relatif
  const fileUrl = join(relativeUploadDir, file.name).replace(/\\/g, '/');

  return NextResponse.json({ success: true, url: fileUrl });
}
