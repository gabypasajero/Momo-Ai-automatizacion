'use client'

import { useEffect, useState } from 'react'

/** true mientras se escribe en un campo de texto: en el teléfono el teclado está abierto. */
export function useTyping() {
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file'].includes(el.type))
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setTyping(true) }
    const onOut = (e: FocusEvent) => { if (isField(e.target)) setTyping(false) }
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => { document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut) }
  }, [])
  return typing
}
