import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import ModalShell from "../../../components/ModalShell";
import { useCreateMenuItem, useUpdateMenuItem } from "../../../hooks/useMenuItems";
import { imageSrc } from "../../../utils/image";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  item_name: z.string().trim().min(1, "Name is required").max(100, "Keep it under 100 characters"),
  category: z.string().trim().max(50, "Keep it under 50 characters"),
  selling_price: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, "Price must be greater than 0"),
  is_available: z.boolean(),
});

function checkImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return "Use a JPEG, PNG, or WEBP image.";
  if (file.size > MAX_BYTES) return "Image must be 5 MB or smaller.";
  return "";
}

export default function ItemFormModal({ item, categories, onClose }) {
  const create = useCreateMenuItem();
  const update = useUpdateMenuItem();
  const editing = !!item;

  const {
    register, handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      item_name: item?.item_name ?? "",
      category: item?.category ?? "",
      selling_price: item ? String(Number(item.selling_price)) : "",
      is_available: item?.is_available ?? true,
    },
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const dirty = isDirty || !!file;

  function handleFile(e) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    const problem = checkImage(picked);
    if (problem) {
      setFileError(problem);
      e.target.value = "";
      return;
    }
    setFileError("");
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  function requestClose() {
    if (dirty && !isSubmitting && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  }

  async function onSubmit(values) {
    setServerError("");
    const body = new FormData();
    body.append("item_name", values.item_name);
    if (values.category) body.append("category", values.category);
    body.append("selling_price", values.selling_price);
    body.append("is_available", String(values.is_available));
    if (file) body.append("image", file);

    try {
      if (editing) await update.mutateAsync({ id: item.item_id, body });
      else await create.mutateAsync(body);
      toast.success(editing ? "Menu item updated" : "Menu item added");
      onClose();
    } catch (err) {
      setServerError(err.message);
    }
  }

  const shownImage = preview ?? imageSrc(item?.image_url);

  return (
    <ModalShell title={editing ? "Edit Menu Item" : "Add Menu Item"} width={520} onClose={requestClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="menu-field">
          Name
          <input className="menu-input" type="text" autoFocus aria-invalid={!!errors.item_name} {...register("item_name")} />
          {errors.item_name && <span className="error-text" role="alert">{errors.item_name.message}</span>}
        </label>

        <label className="menu-field">
          Category
          <input className="menu-input" type="text" list="menu-categories" placeholder="Pick one or type a new one"
                  aria-invalid={!!errors.category} {...register("category")} />
          <datalist id="menu-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          {errors.category && <span className="error-text" role="alert">{errors.category.message}</span>}
        </label>

        <label className="menu-field">
          Price (₱)
          <input className="menu-input" type="number" min="0.01" step="0.01"
                  aria-invalid={!!errors.selling_price} {...register("selling_price")} />
          {errors.selling_price && <span className="error-text" role="alert">{errors.selling_price.message}</span>}
        </label>

        <div className="menu-field">
          Photo
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {shownImage ? (
              <img src={shownImage} alt="" width={64} height={64}
                    style={{ objectFit: "cover", borderRadius: 8, background: "#f3f4f6" }} />
            ) : (
              <div aria-hidden="true" style={{ width: 64, height: 64, display: "grid", placeItems: "center", borderRadius: 8, background: "#f3f4f6", fontSize: 24 }}>🍽️</div>
            )}
            <input type="file" accept={ALLOWED_TYPES.join(",")} onChange={handleFile} aria-label="Photo" />
          </div>
          <span className="menu-subtle">JPEG, PNG, or WEBP, up to 5 MB.</span>
          {fileError && <span className="error-text" role="alert">{fileError}</span>}
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
          <input type="checkbox" {...register("is_available")} />
          Show on the menu (cashiers can order it)
        </label>

        {serverError && <p className="error-text" role="alert">{serverError}</p>}

        <div className="menu-modal-actions">
          <button type="button" className="menu-btn" onClick={requestClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="menu-btn menu-btn-primary" disabled={!dirty || isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}