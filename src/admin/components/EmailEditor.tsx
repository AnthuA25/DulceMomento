import { Bold, Heading1, Heading2, Italic, Link as LinkIcon, MousePointerClick, Pilcrow } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { sanitizeHtml } from '@/utils/sanitize'

const VARIABLES = ['{{nombre}}', '{{apellido}}', '{{correo}}']

interface Props {
  value: string
  onChange: (html: string) => void
}

/** Editor de correo: modo visual y modo HTML. Todo lo que entra o sale pasa por el sanitizador. */
export function EmailEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef<string | null>(null)

  // Escribe en el área visual solo cuando el cambio viene de fuera (no al teclear),
  // para no mover el cursor.
  useEffect(() => {
    const el = editorRef.current
    if (mode === 'visual' && el && value !== lastEmitted.current) {
      el.innerHTML = sanitizeHtml(value)
      lastEmitted.current = value
    }
  }, [mode, value])

  const sync = () => {
    const html = sanitizeHtml(editorRef.current?.innerHTML ?? '')
    lastEmitted.current = html
    onChange(html)
  }

  const exec = (command: string, argument?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, argument)
    sync()
  }

  const askUrl = (text: string) => {
    const url = window.prompt(text, 'https://')?.trim()
    if (!url) return null
    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      window.alert('El enlace debe empezar con https:// o mailto:')
      return null
    }
    return url
  }

  const addLink = () => {
    const url = askUrl('Dirección del enlace:')
    if (url) exec('createLink', url)
  }

  const addCta = () => {
    const label = window.prompt('Texto del botón:', 'Ver nuestros kekes')?.trim()
    if (!label) return
    const url = askUrl('Enlace del botón:')
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.dataset.cta = '1'
    a.textContent = label
    exec('insertHTML', `<p>${a.outerHTML}</p><p><br></p>`)
  }

  const tools = [
    { label: 'Título', icon: Heading1, run: () => exec('formatBlock', 'h2') },
    { label: 'Subtítulo', icon: Heading2, run: () => exec('formatBlock', 'h3') },
    { label: 'Texto normal', icon: Pilcrow, run: () => exec('formatBlock', 'p') },
    { label: 'Negrita', icon: Bold, run: () => exec('bold') },
    { label: 'Cursiva', icon: Italic, run: () => exec('italic') },
    { label: 'Enlace', icon: LinkIcon, run: addLink },
    { label: 'Botón CTA', icon: MousePointerClick, run: addCta },
  ]

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Modo del editor" className="inline-flex rounded-full border border-arena bg-crema p-1 text-sm font-semibold">
          {(['visual', 'html'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m}
              onClick={() => { lastEmitted.current = null; setMode(m) }}
              className={`rounded-full px-4 py-1.5 ${mode === m ? 'bg-terracota text-white' : 'text-chocolate-medio'}`}>
              {m === 'visual' ? 'Editor visual' : 'Ver HTML'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span>Variables:</span>
          {VARIABLES.map((v) => (
            <button key={v} type="button" disabled={mode !== 'visual'} onClick={() => exec('insertText', v)}
              className="rounded-full border border-arena bg-crema px-2.5 py-1 font-mono text-chocolate hover:bg-beige disabled:opacity-50">
              {v}
            </button>
          ))}
        </div>
      </div>

      {mode === 'visual' ? (
        <div className="overflow-hidden rounded-2xl border border-arena bg-marfil">
          <div role="toolbar" aria-label="Formato" className="flex flex-wrap gap-1 border-b border-arena bg-beige p-1.5">
            {tools.map(({ label, icon: Icon, run }) => (
              <button key={label} type="button" title={label} aria-label={label}
                onMouseDown={(e) => e.preventDefault()} onClick={run}
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-chocolate hover:bg-arena">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
            aria-label="Contenido del mensaje" onInput={sync} onBlur={sync}
            className="prose-email min-h-56 p-4 text-chocolate-medio focus:outline-none" />
        </div>
      ) : (
        <>
          <label htmlFor="em-html" className="sr-only">HTML del mensaje</label>
          <textarea id="em-html" rows={12} className="field font-mono text-sm" spellCheck={false} value={value}
            onChange={(e) => onChange(e.target.value)} onBlur={(e) => onChange(sanitizeHtml(e.target.value))} />
          <p className="mt-1 text-xs">Al salir del campo se eliminan scripts, estilos y cualquier HTML no permitido.</p>
        </>
      )}
    </div>
  )
}
