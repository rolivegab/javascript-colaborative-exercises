export default function ({document: {body: {firstElementChild}}}: Window) {
    return document.body.firstElementChild!.innerHTML
}