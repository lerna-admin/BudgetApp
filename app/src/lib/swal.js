"use client";

import Swal from "sweetalert2";

const BASE_OPTIONS = {
  confirmButtonColor: "#0f766e",
  cancelButtonColor: "#374151",
};

export async function confirmDestructiveAction({
  title = "Confirmar eliminacion",
  text = "Esta accion no se puede deshacer.",
  confirmText = "Si, eliminar",
  cancelText = "Cancelar",
} = {}) {
  const result = await Swal.fire({
    ...BASE_OPTIONS,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });

  return Boolean(result.isConfirmed);
}

export function showSuccessMessage({
  title = "Listo",
  text = "",
} = {}) {
  return Swal.fire({
    ...BASE_OPTIONS,
    icon: "success",
    title,
    text,
    confirmButtonText: "Continuar",
  });
}

export function showErrorMessage({
  title = "No se pudo completar",
  text = "",
} = {}) {
  return Swal.fire({
    ...BASE_OPTIONS,
    icon: "error",
    title,
    text,
    confirmButtonText: "Entendido",
  });
}

export function showInfoMessage({
  title = "Atencion",
  text = "",
} = {}) {
  return Swal.fire({
    ...BASE_OPTIONS,
    icon: "info",
    title,
    text,
    confirmButtonText: "Entendido",
  });
}

