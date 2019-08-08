import { DOMWindow } from "jsdom"

export default function (window: DOMWindow, text: string) {
    const el = window.document.getElementById('paragraph') as HTMLParagraphElement
    el.innerHTML = text
}