import fs from 'fs'
import path from 'path'
import {promisify} from 'util'
import capcon from 'capture-console'
import { JSDOM } from 'jsdom';
import {deepStrictEqual} from 'assert'

interface JSON {
    args?: any[]
    console?: string
    output?: any
    jsdom?: any
    jsdomArgs?: any[]
    multiple?: JSON[]
}

const parse = async (json: JSON, func: Function, questionDir: string) => {
    const result = []
    if (json.output) {
        if (json.args) {
            try {
                deepStrictEqual(func(...json.args), json.output)
                result.push(true)
            } catch (e) {
                return console.error(e)
            }
        } else {
            try {
                deepStrictEqual(func(), json.output)
                result.push()
            } catch (e) {
                return console.error(e)
            }
        }
    }
    if (json.console) {
        var stdio = capcon.interceptStdout(function scope() {
            if (json.args) {
                func(...json.args)
            } else {
                func()
            }
        });
        result.push(stdio === json.console)
    }
    if (json.jsdom) {
        const htmlPath = path.resolve(questionDir, 'index.html')
        const html = await promisify(fs.readFile)(htmlPath, {
            encoding: 'utf-8'
        })
        const browserPath = path.resolve(questionDir, 'browser')
        const browser = (await import(browserPath)).default
        const jsdom = new JSDOM(html)
        if (json.jsdomArgs) {
            browser(jsdom.window, ...json.jsdomArgs)
        } else {
            browser(jsdom.window)
        }

        result.push(func(jsdom.window, jsdom.window.document) === json.jsdom)
    }
    return result.every(i => i === true)
}

const f = async () => {
    const question = Number(process.argv[2])
    const user = process.argv[3]
    
    if (isNaN(question)) {
        throw new Error(`Argumento "${question}" não é um número`)
    }
    
    const questionDir = path.resolve('src', question.toString())
    
    const questionDirExists = await promisify(fs.exists)(questionDir)
    
    if (!questionDirExists) {
        throw new Error(`A questão de número "${question}" não existe nesse repositório`)
    }

    const filePath = path.resolve(questionDir, user)
    const jsonPath = path.resolve(questionDir, 'output.json')

    const func = (await import(filePath)).default
    const json = (await import(jsonPath)).default as JSON

    let result = [] as any[]
    if (json.multiple) {
        json.multiple.forEach((i) => {
            result.push(parse(i, func, questionDir))
        })
    } else {
        result.push(await parse(json, func, questionDir))
    }

    const awaitResult = await Promise.all(result)

    if (awaitResult.every(i => i === true)) {
        console.log("OK!")
    }
}

f()
