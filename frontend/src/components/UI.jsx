import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { initials } from "../utils/helpers";
import s from "./UI.module.css";
export function Avatar({ member, size = 40, online }) {
  return (
    <span
      className={s.avatar}
      style={{ width: size, height: size, minWidth: size }}
    >
      {member?.avatar ? (
        <img
          src={member.avatar}
          alt={member.name}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        initials(member?.name)
      )}
      {online !== undefined && <i className={online ? s.online : s.offline} />}
    </span>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${s.modal} ${wide ? s.wide : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={s.modalHeader}>
        <h2>{title}</h2>
        <button className={s.iconButton} onClick={onClose} aria-label="إغلاق">
          <FiX />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({ icon: Icon, title, text }) {
  return (
    <div className={s.empty}>
      {Icon && <Icon />}
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Brand() {
  return (
    <div className={s.brand}>
      <span className={s.brandMark}>
        <i />
        <i />
      </span>
      <span>
        لقاء<small>LIQA</small>
      </span>
    </div>
  );
}
