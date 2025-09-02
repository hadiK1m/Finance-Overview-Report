// src/app/api/upload/route.ts
import { writeFile, mkdir, unlink } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join, extname } from 'path'; // Impor 'extname' untuk mendapatkan ekstensi file
import { decrypt } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid'; // Impor uuid

// Handler POST untuk mengunggah file baru
export async function POST(request: NextRequest) {
  // 1. Dapatkan token sesi dari cookie
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  // 2. Dekripsi token untuk mendapatkan data pengguna
  const session = await decrypt(token);
  if (!session?.email) {
    return NextResponse.json(
      { success: false, message: 'Invalid token.' },
      { status: 401 }
    );
  }

  // 3. Ambil file dari form data
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json(
      { success: false, message: 'No file found.' },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 4. Buat nama folder yang aman dari email pengguna
  const userEmail = session.email;
  const userFolder = userEmail.replace(/[^a-zA-Z0-9]/g, '_'); // Ganti karakter non-alfanumerik

  // 5. Buat path dinamis: /uploads/email_pengguna/
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

  // 6. === GENERATE NAMA FILE UNIK ===
  const fileExtension = extname(file.name); // Dapatkan ekstensi asli file
  const uniqueFileName = `${uuidv4()}${fileExtension}`; // Gabungkan UUID dengan ekstensi

  // 7. Simpan file dengan nama unik
  const path = join(uploadDir, uniqueFileName);
  await writeFile(path, buffer);

  // 8. Kembalikan URL relatif yang bisa diakses oleh browser dengan nama file unik
  const fileUrl = join(relativeUploadDir, uniqueFileName).replace(/\\/g, '/');

  return NextResponse.json({ success: true, url: fileUrl });
}

// Handler DELETE untuk menghapus file yang sudah ada (tidak berubah)
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('fileUrl');

  if (!fileUrl) {
    return NextResponse.json(
      { success: false, message: 'No file URL provided.' },
      { status: 400 }
    );
  }

  try {
    const filePath = join(process.cwd(), 'public', fileUrl);
    await unlink(filePath);
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully.',
    });
  } catch (error) {
    console.warn(`File not found or could not be deleted: ${fileUrl}`);
    return NextResponse.json({
      success: true,
      message: 'File not found, considered deleted.',
    });
  }
}
