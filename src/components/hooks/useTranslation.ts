"use client";

import { useCallback } from "react";
import { useTranslationContext } from "../providers/TranslationProvider";

function getByPath(obj: any, path: string): string {
    const template = path
        .split(".")
        .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
    if(!template) console.error("No template found for %s", path);
    return template ?? path;
}

function interpolate(template: string, params: Record<string, string | number>) {
    return template.replace(/{{(\w+)}}/g, (_, key) => {
        if(!params[key]) console.error("No param passed for template %s, {{%s}}}", template, key)
        return params[key] !== undefined ? String(params[key]) : `{{${key}}}`
    }
        
    );
}

export function useTranslation(prefix: string = "") {
    const { translations } = useTranslationContext();

    const t = useCallback((path: string, params: Record<string, string | number> = {}) => {
        const template = getByPath(translations, prefix + path);
        return interpolate(template, params)
    }, [prefix, translations])

    return { t };
}