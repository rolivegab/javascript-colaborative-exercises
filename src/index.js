import fs from 'fs'
import path from 'path'
import {promisify} from 'util'
import capcon from 'capture-console'

const parse = (json, func) => {
    const result = []
    if (json.output) {
        if (json.args) {
            result.push(func(...json.args) === json.output)
        } else {
            result.push(func() === json.output)
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
    const json = (await import(jsonPath)).default

    let result = []
    if (json.multiple) {
        json.multiple.forEach((i) => {
            result.push(parse(i, func))
        })
    } else {
        result.push(parse(json, func))
    }

    if (result.every(i => i === true)) {
        console.log("OK!")
    }
}

f()
