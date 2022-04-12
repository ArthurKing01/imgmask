import { getPoint, getShape, LabelItems } from "./core"

export const mapToCsv = (map: Map<string, Array<string|number>>) => {
    const keys = [...map.keys()]
    const result = [keys.join(',')]
    const fileNames = map.get('file_name')
    fileNames?.forEach((_, index) => {
        const row: Array<string|number> = []
        keys.forEach(key => {
            row.push(map.get(key)![index])
        })
        result.push(row.join(','))
    })
    const blob = new Blob([result.join('\n')], {
        type: 'text/csv;charset=utf-8;'
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob);
    a.setAttribute('download', '标注文件.csv');
    a.click()
}

export const csvToFilesResult = (csvText: string, labels: string[]): {
    [k: string]: LabelItems;
} => {
    const rows = csvText.split('\n')
    const header = rows[0].split(',')
    const body = rows.slice(1).map(item => item.split(','))
    return body.reduce((r, n) => {
        const fileName = n[0]
        for (let i = 1; i < n.length; i+=4) {
            const headerPart = header[i].split('_')
            const label = labels[Number(headerPart[0])]
            if (!r[fileName]) {
                r[fileName] = {
                    [label]: getShape(getPoint(Number(n[i]), Number(n[i+1])), getPoint(Number(n[i+2]), Number(n[i+3])))
                }
            } else {
                r[fileName][label] = getShape(getPoint(Number(n[i]), Number(n[i+1])), getPoint(Number(n[i+2]), Number(n[i+3])))
            }
            
        }
        return r
    }, {} as {
        [k: string]: LabelItems
    })
}