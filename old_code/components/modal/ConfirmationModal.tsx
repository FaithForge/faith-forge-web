import { ColorType } from '@/libs/common-types/constants/theme';
import React from 'react';

export const showConfirmationModal = (id: string) => {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  dialog?.showModal();
};

type ConfirmationModalProps = {
  id: string;
  title: string;
  content: string;
  confirmButtonText: string;
  confirmButtonType: ColorType;
  onConfirm?: () => void;
  cancelButtonText?: string;
  cancelButtonType?: ColorType;
  onCancel?: () => void;
};

const ConfirmationModal = ({
  id,
  title,
  content,
  confirmButtonText,
  confirmButtonType,
  onConfirm,
  cancelButtonText,
  cancelButtonType,
  onCancel,
}: ConfirmationModalProps) => {
  const confirmButtonTheme = `btn-${confirmButtonType}`;
  const cancelButtonTheme = cancelButtonType ? `btn-${cancelButtonType}` : null;

  return (
    <dialog id={id} className="modal modal-center">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="py-4">
          <p className="pb-8">{content}</p>
          <form method="dialog" className="flex justify-end gap-2">
            {cancelButtonText && (
              <button className={`btn ${cancelButtonTheme}`} onClick={onCancel}>
                {cancelButtonText}
              </button>
            )}
            <button className={`btn ${confirmButtonTheme}`} onClick={onConfirm}>
              {confirmButtonText}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmationModal;
