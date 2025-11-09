export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export function inferKind(name: string): "Title"|"NOC"|"Allotment"|"Agreement"|"Other" {
    const n = name.toLowerCase();
    if (n.includes("title")) return "Title";
    if (n.includes("noc")) return "NOC";
    if (n.includes("allot")) return "Allotment";
    if (n.includes("agree")) return "Agreement";
    return "Other";
}

export function looksLikePdf(name: string, mime: string) {
    return /\.pdf$/i.test(name) || /pdf/i.test(mime);
}
export function looksLikeImage(name: string, mime: string) {
    return /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(name) || /^image\//i.test(mime);
}