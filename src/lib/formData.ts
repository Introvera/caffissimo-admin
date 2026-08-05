/**
 * Converts a plain object into multipart/form-data using ASP.NET Core's
 * model-binding key format (`OpeningHours[0].DayOfWeek`).
 *
 * Endpoints that accept an IFormFile are bound with [FromForm], so a JSON
 * body is not bound at all and every required field comes back empty.
 */

/** Turns a `data:` URI into a File so it can be posted as an IFormFile. */
export function dataUrlToFile(dataUrl: string, fileName = "image"): File | null {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, isBase64, data] = match;
  const binary = isBase64 ? atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const extension = mimeType.split("/")[1]?.split("+")[0] || "bin";
  return new File([bytes], `${fileName}.${extension}`, { type: mimeType });
}

function appendValue(form: FormData, key: string, value: unknown): void {
  // null/undefined are dropped (form data has no null), but "" is kept so that
  // clearing an optional field still reaches the server.
  if (value === undefined || value === null) return;

  if (value instanceof File || value instanceof Blob) {
    form.append(key, value);
    return;
  }

  if (value instanceof Date) {
    form.append(key, value.toISOString());
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      // ASP.NET's FormFileModelBinder matches file fields by exact name equality,
      // so a List<IFormFile> has to arrive as the same key repeated -- an indexed
      // `key[0]` binds to nothing and the property comes back null. Every other
      // collection still needs the indexed form.
      const isFile = item instanceof File || item instanceof Blob;
      appendValue(form, isFile ? key : `${key}[${index}]`, item);
    });
    return;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) =>
      appendValue(form, `${key}.${childKey}`, childValue)
    );
    return;
  }

  form.append(key, String(value));
}

/**
 * Prints the wire representation of a form. The field *names* are what decide
 * whether ASP.NET binds a file, so this is the view that matters when an upload
 * silently arrives as null on the server. Dev builds only.
 */
export function logFormData(label: string, form: FormData): void {
  if (process.env.NODE_ENV === "production") return;

  const rows = Array.from(form.entries()).map(([key, value]) =>
    value instanceof File
      ? { field: key, kind: "file", value: `${value.name} (${value.size} bytes, ${value.type})` }
      : { field: key, kind: "text", value: String(value) }
  );

  console.groupCollapsed(`[formData] ${label} — ${rows.length} fields, ${rows.filter(r => r.kind === "file").length} file(s)`);
  console.table(rows);
  console.groupEnd();
}

export function toFormData(payload: Record<string, unknown>): FormData {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => appendValue(form, key, value));
  return form;
}

/**
 * Same as {@link toFormData}, but any `data:` URI held in `imageUrlField` is
 * uploaded as a real file on `imageFileField` instead of a giant base64 string.
 */
export function toFormDataWithImage(
  payload: Record<string, unknown>,
  imageUrlField: string,
  imageFileField: string
): FormData {
  const imageUrl = payload[imageUrlField];

  if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
    const file = dataUrlToFile(imageUrl, imageUrlField);
    if (file) {
      const { [imageUrlField]: _dropped, ...rest } = payload;
      return toFormData({ ...rest, [imageFileField]: file });
    }
  }

  return toFormData(payload);
}
