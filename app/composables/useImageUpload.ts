const readImageSize = (file: Blob) =>
  new Promise<{ width: number; height: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });

// EXIF除去と回転の焼き込み(JPEG)
const reencodeJpeg = async (file: File) => {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("JPEG re-encode failed");
  return { blob, width: canvas.width, height: canvas.height };
};

export const useImageUpload = () => {
  const upload = async (file: File): Promise<UploadedImage> => {
    let payload: Blob = file;
    let size: { width: number; height: number } | null = null;

    if (file.type === "image/jpeg") {
      const reencoded = await reencodeJpeg(file);
      payload = reencoded.blob;
      size = { width: reencoded.width, height: reencoded.height };
    } else {
      size = await readImageSize(file);
    }

    const form = new FormData();
    form.append("file", payload, file.name);
    if (size) {
      form.append("width", String(size.width));
      form.append("height", String(size.height));
    }

    return await $fetch("/api/admin/images", {
      method: "POST",
      body: form,
    });
  };

  return { upload };
};
