/**
 * Utility untuk menjamin foto profil selalu menggunakan file asli dengan resolusi penuh (HD),
 * tanpa thumbnail, tanpa kompresi berlebihan, dan bebas dari blur/pecah.
 */

/**
 * Mengubah URL foto (Google OAuth, Gravatar, Supabase Storage, Unsplash, dll) ke resolusi original/penuh.
 * Menghilangkan pemotongan thumbnail seperti =s96-c pada Google yang sering menyebabkan foto pecah-pecah.
 */
export function getHighResolutionAvatarUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Google User Content (Google OAuth Avatar)
  // Google default URL berakhiran =s96-c (96x96px) yang sangat pecah di layar modern/Retina.
  // Mengubah =s... menjadi =s0 meminta file original beresolusi penuh tanpa resize dari Google.
  if (trimmed.includes("googleusercontent.com")) {
    if (/\/s\d+(-c)?\//i.test(trimmed)) {
      return trimmed.replace(/\/s\d+(-c)?\//i, "/s1200/");
    }
    if (/=s\d+[^?#]*/i.test(trimmed)) {
      return trimmed.replace(/=s\d+[^?#]*/i, "=s0");
    }
    if (/=w\d+-h\d+[^?#]*/i.test(trimmed)) {
      return trimmed.replace(/=w\d+-h\d+[^?#]*/i, "=s0");
    }
    // Jika belum ada parameter resolusi pada googleusercontent, tambahkan =s0
    if (!trimmed.includes("=s") && !trimmed.includes("/s")) {
      const sep = trimmed.includes("?") ? "&" : "=";
      return sep === "=" ? `${trimmed}=s0` : `${trimmed}&s=0`;
    }
  }

  // 2. Supabase Storage Image Transformation
  // Jika URL menggunakan endpoint render/transformasi thumbnail, kembalikan ke file objek asli beresolusi penuh
  if (trimmed.includes("/storage/v1/render/image/public/")) {
    const original = trimmed.replace(
      "/storage/v1/render/image/public/",
      "/storage/v1/object/public/",
    );
    return original.split("?")[0]!;
  }

  // Jika URL objek Supabase memiliki query parameter transformasi (?width=... / ?quality=...), hilangkan agar file asli digunakan
  if (trimmed.includes("/storage/v1/object/public/") && trimmed.includes("?")) {
    return trimmed.split("?")[0]!;
  }

  // 3. Gravatar
  if (trimmed.includes("gravatar.com/avatar/")) {
    if (trimmed.includes("s=")) {
      return trimmed.replace(/s=\d+/i, "s=1024");
    }
    const separator = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${separator}s=1024`;
  }

  // 4. GitHub User Avatar
  if (trimmed.includes("avatars.githubusercontent.com")) {
    if (trimmed.includes("s=")) {
      return trimmed.replace(/s=\d+/i, "s=1024");
    }
    const separator = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${separator}s=1024`;
  }

  // 5. Unsplash
  if (trimmed.includes("images.unsplash.com")) {
    if (/w=\d+/i.test(trimmed)) {
      return trimmed.replace(/w=\d+/i, "w=1200").replace(/q=\d+/i, "q=95");
    }
  }

  return trimmed;
}

/**
 * Menghasilkan atribut srcset untuk responsive image Retina / DPR tinggi
 */
export function getAvatarSrcSet(url: string | null | undefined): string | undefined {
  const highRes = getHighResolutionAvatarUrl(url);
  if (!highRes) return undefined;
  // Gunakan gambar resolusi tinggi untuk 1x dan 2x device pixel ratio agar tajam di Retina
  return `${highRes} 1x, ${highRes} 2x`;
}

/**
 * Mempersiapkan file foto profil agar kualitasnya tetap HD kristal (tajam tanpa pecah),
 * sekaligus dioptimasi agar tidak melebihi batasan Supabase Storage (2MB) atau localStorage quota.
 */
export async function optimizeAvatarImageForUpload(
  file: File,
): Promise<{ file: File; dataUrl: string }> {
  // Jika file sudah di bawah 1.8MB, baca data URL dan kembalikan file asli langsung
  if (file.size <= 1.8 * 1024 * 1024) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return { file, dataUrl };
  }

  // Jika file lebih dari 1.8MB (misalnya foto kamera HP 4K/10MB), optimasi ke 1600px HD tajam
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX_DIM = 1600; // 1600px sangat tajam di Retina 4x untuk avatar berukuran 128px-160px
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            file,
            dataUrl: reader.result as string,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === "image/png" ? "image/jpeg" : file.type;
        const quality = 0.92; // Kualitas tinggi tanpa blur
        const dataUrl = canvas.toDataURL(mime, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const optimizedFile = new File([blob], cleanFileName, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve({ file: optimizedFile, dataUrl });
            } else {
              resolve({ file, dataUrl });
            }
          },
          "image/jpeg",
          quality,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Style container lingkaran foto profil standar HD:
 * border-radius: 50%, overflow: hidden, isolation: isolate
 */
export const AVATAR_CONTAINER_CIRCLE_STYLE: React.CSSProperties = {
  borderRadius: "50%",
  overflow: "hidden",
  isolation: "isolate",
};

/**
 * Style elemen <img> foto profil standar HD:
 * width: 100%, height: 100%, objectFit: cover, anti-aliasing hardware-accelerated
 */
export function getAvatarImgStyle(
  position?: string | null,
  scale?: number | null,
): React.CSSProperties {
  const effectivePosition = position || "center center";
  const effectiveScale = scale && !isNaN(scale) && scale !== 1 ? Number(scale) : 1;

  return {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: effectivePosition,
    transform: effectiveScale !== 1 ? `scale(${effectiveScale})` : undefined,
    transformOrigin: effectivePosition,
    imageRendering: "auto",
    WebkitBackfaceVisibility: "hidden",
    backfaceVisibility: "hidden",
  };
}
