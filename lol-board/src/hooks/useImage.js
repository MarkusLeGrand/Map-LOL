import { useEffect, useState } from "react";

const useImage = (src) => {
  const [img, setImg] = useState(null);

  useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setImg(image);
    image.onerror = () => setImg(null);
    image.src = src;
  }, [src]);

  return img;
};

export default useImage;
