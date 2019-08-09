export default function (n: number) {
    return [...Array(n)].map((_, i) => i + 1)
}