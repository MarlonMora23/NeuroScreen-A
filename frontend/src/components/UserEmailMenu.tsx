import { useState, useRef, useEffect } from "react";
import EmailUpdateModal from "./EmailUpdateModal";

interface Props {
  email: string;
  userId: string;
}

const UserEmailMenu = ({ email, userId }: Props) => {
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {email}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-secondary/80 rounded shadow-lg p-2 z-40">
          <button
            onClick={() => {
              setOpen(false);
              setOpenModal(true);
            }}
            className="w-full text-left px-2 py-2 hover:bg-muted/10 rounded"
          >
            Modificar correo
          </button>
        </div>
      )}

      {openModal && (
        <EmailUpdateModal userId={userId} initialEmail={email} onClose={() => setOpenModal(false)} />
      )}
    </div>
  );
};

export default UserEmailMenu;
