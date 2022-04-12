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