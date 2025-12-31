import { useState, useEffect } from "react";

export const useImage = (src: string | null) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!src) {
            setImage(null);
            return;
        }

        const img = new Image();
        img.onload = () => setImage(img);
        img.onerror = () => setImage(null);
        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return image;
};
