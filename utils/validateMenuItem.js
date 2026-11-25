import { MENU_CATEGORIES } from "../constants/menu.js";

export const validateMenuItem = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {
            isValid: false,
            message: "Invalid request body.",
        };
    }

    const { itemName, category, description, price, location, images } = body;

    if (typeof itemName !== "string" || !itemName.trim()) {
        return {
            isValid: false,
            message: "Item name is required.",
        };
    }

    if (!MENU_CATEGORIES.includes(category)) {
        return {
            isValid: false,
            message: "Please select a valid category.",
        };
    }

    if (typeof description !== "string" || !description.trim()) {
        return {
            isValid: false,
            message: "Description is required.",
        };
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
        return {
            isValid: false,
            message: "Price must be a positive number.",
        };
    }

    if (typeof location !== "string" || !location.trim()) {
        return {
            isValid: false,
            message: "Location is required.",
        };
    }

    if (!Array.isArray(images) || images.length === 0) {
        return {
            isValid: false,
            message: "At least one image is required.",
        };
    }

    const validImages = images.every((image) => {
        if (typeof image !== "string") {
            return false;
        }

        try {
            const url = new URL(image);

            return url.protocol === "https:";
        } catch {
            return false;
        }
    });

    if (!validImages) {
        return {
            isValid: false,
            message: "Please provide valid HTTPS image URLs.",
        };
    }

    return {
        isValid: true,
        data: {
            itemName: itemName.trim(),
            category,
            description: description.trim(),
            price,
            location: location.trim(),
            images: images.map((image) => image.trim()),
        },
    };
};