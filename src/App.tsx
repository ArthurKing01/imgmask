import { Button, Tag } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useState } from 'react'
import { createUseStyles } from 'react-jss'
import { getDefaultLabelItems, getDefaultShape, getPoint, getShape, getShapePositionDelta, getShapeSizeDelta, isValidShape, LabelItems, normalizePoint, Point } from './core'
import { Strock } from './block'
import 'antd/dist/antd.css';
import { csvToFilesResult, mapToCsv } from './utils'
import cx from 'classnames'

const useStyle = createUseStyles({
    canvasWrapper: {
        position: 'relative'
    },
    headerWrapper: {
        display: 'flex',
        '& ul': {
            overflowY: 'auto',
            margin: '5px 10px',
            width: '300px',
            height: '130px',
            background: '#fff',
            padding: 0,
            '& li': {
                listStyle: 'none',
                cursor: 'pointer',
                padding: '0 10px'
            },
            '& li:hover': {
                background: '#ccc'
            }
        }
    },
    activeLi: {
        background: '#ccc'
    }
})

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [filesResult, setFilesResult] = useState<{
        [k: string]: LabelItems
    }>({})
    const [currentFileName, setCurrentFileName] = useState("")
    const [mouseDown, setMouseDown] = useState(false)
    const [activeLabel, setActiveLabel] = useState("")

    const imageSize = useRef({ width: 0, height: 0 })
    const [labels, setLabels] = useState<string[]>([])
    const [files, setFiles] = useState<File[]>([])

    const classes = useStyle()

    const currentFileLabelItems: LabelItems | undefined = useMemo(() => {
        return filesResult[currentFileName]
    }, [currentFileName, filesResult])

    const selectFile = useCallback((file: File) => {
        const fileReader = new FileReader()
        fileReader.readAsDataURL(file)
        fileReader.onload = (e) => {
            const imageSrc = fileReader.result as string
            const image = new Image()
            image.src = imageSrc

            image.onload = () => {
                const ctx = canvasRef.current?.getContext('2d')
                if (ctx) {
                    canvasRef.current!.width = image.width
                    canvasRef.current!.height = image.height
                    ctx.drawImage(image, 0, 0, image.width, image.height)
                    imageSize.current = {
                        width: image.width,
                        height: image.height
                    }
                }
                setCurrentFileName(file.name)
                if (!filesResult[file.name]) {
                    filesResult[file.name] = getDefaultLabelItems(labels)
                    setFilesResult({ ...filesResult })
                }
            }

        }
    }, [filesResult, labels])

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files?.[0]
        if (e.target.name === 'label') {
            if (file) {
                const fileReader = new FileReader()
                fileReader.readAsText(file)
                fileReader.onload = () => {
                    const result = (fileReader.result as string).split('\n').map(item => item.trim())
                    setLabels(result)
                    setActiveLabel(result[0])
                }
            }
        } else if (e.target.name === 'file') {
            if (e.target.files) {
                const filenames = new Set(files.map(f => f.name))
                setFiles([
                    ...files,
                    ...Array.from(e.target.files).filter(f => !filenames.has(f.name))
                ])
            }
        } else if (e.target.name === 'csv') {
            if (file) {
                const fileReader = new FileReader()
                fileReader.readAsText(file)
                fileReader.onload = () => {
                    // const result = (fileReader.result as string).split('\n').map(item => item.trim())
                    // setLabels(result)
                    // setActiveLabel(result[0])
                    const loadedFilesResult = csvToFilesResult(fileReader.result as string, labels)
                    console.log(loadedFilesResult)
                    setFilesResult(loadedFilesResult)
                }
            }
        }

    }

    const handleUpdatePoint = useCallback(({ p1, p3 }: { p1?: Point, p3?: Point }) => {
        const labelItemShape = filesResult[currentFileName][activeLabel]
        const p1_1 = p1 || labelItemShape.p1
        const p3_1 = p3 || labelItemShape.p3

        filesResult[currentFileName][activeLabel] = getShape(
            normalizePoint(p1_1, imageSize.current),
            normalizePoint(p3_1, imageSize.current)
        )

        setFilesResult({
            ...filesResult
        })
    }, [filesResult, currentFileName, activeLabel])

    const handleCanvasMouseDown: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
        if (currentFileLabelItems && !isValidShape(currentFileLabelItems[activeLabel])) {
            setMouseDown(true)
            const x = e.pageX
            const y = e.pageY - e.currentTarget.offsetTop
            const p1 = getPoint(x, y)
            handleUpdatePoint({ p1 })
        }
    }, [handleUpdatePoint, currentFileLabelItems, activeLabel])

    const handleCanvasMouseUp: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
        if (mouseDown) {
            setMouseDown(false)
            const x = e.pageX
            const y = e.pageY - e.currentTarget.offsetTop
            const p3 = getPoint(x, y)
            handleUpdatePoint({ p3 })
        }
    }, [mouseDown, handleUpdatePoint])

    const handleCanvasMouseMove: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
        if (mouseDown) {
            const x = e.pageX
            const y = e.pageY - e.currentTarget.offsetTop
            const p3 = getPoint(x, y)
            handleUpdatePoint({ p3 })
        }
    }, [mouseDown])

    useEffect(() => {
        const handleBodyMouseUp = (e: MouseEvent) => {
            setMouseDown(false)
        }
        document.body.addEventListener('mouseup', handleBodyMouseUp)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'ArrowUp') {
                const currentFileIndex = files.findIndex(f => f.name === currentFileName)
                if (files[currentFileIndex - 1]) {
                    selectFile(files[currentFileIndex - 1])
                }
            } else if (e.code === 'ArrowDown') {
                const currentFileIndex = files.findIndex(f => f.name === currentFileName)
                if (files[currentFileIndex + 1]) {
                    selectFile(files[currentFileIndex + 1])
                }
            } else if (e.code === 'ArrowLeft') {
                const currentLabelIndex = labels.findIndex(l => l === activeLabel)
                if (labels[currentLabelIndex - 1]) {
                    setActiveLabel(labels[currentLabelIndex - 1])
                }
            } else if (e.code === 'ArrowRight') {
                const currentLabelIndex = labels.findIndex(l => l === activeLabel)
                if (labels[currentLabelIndex + 1]) {
                    setActiveLabel(labels[currentLabelIndex + 1])
                }
            }
        }
        document.body.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.removeEventListener('mouseup', handleBodyMouseUp)
            document.body.removeEventListener('keydown', handleKeyDown)
        }
    }, [files, currentFileName, selectFile, activeLabel, labels])

    const handleRemove = useCallback((label: string) => {
        filesResult[currentFileName][label] = getDefaultShape()
        setFilesResult({
            ...filesResult,
        })
    }, [filesResult, currentFileName])

    const handleExport = useCallback(() => {
        const resultMap = new Map<string, Array<string | number>>()
        Object.entries(filesResult).forEach(([fileName, v]) => {
            if (resultMap.get('file_name')) {
                resultMap.get('file_name')?.push(fileName)
            } else {
                resultMap.set('file_name', [fileName])
            }
            Object.entries(v).forEach(([label, shape]) => {
                const labelIndex = labels.findIndex(l => l === label)
                if (resultMap.get(`${labelIndex}_p1_0`)) {
                    resultMap.get(`${labelIndex}_p1_0`)?.push(shape.p1[0])
                } else {
                    resultMap.set(`${labelIndex}_p1_0`, [shape.p1[0]])
                }

                if (resultMap.get(`${labelIndex}_p1_1`)) {
                    resultMap.get(`${labelIndex}_p1_1`)?.push(shape.p1[1])
                } else {
                    resultMap.set(`${labelIndex}_p1_1`, [shape.p1[1]])
                }

                if (resultMap.get(`${labelIndex}_p3_0`)) {
                    resultMap.get(`${labelIndex}_p3_0`)?.push(shape.p3[0])
                } else {
                    resultMap.set(`${labelIndex}_p3_0`, [shape.p3[0]])
                }

                if (resultMap.get(`${labelIndex}_p3_1`)) {
                    resultMap.get(`${labelIndex}_p3_1`)?.push(shape.p3[1])
                } else {
                    resultMap.set(`${labelIndex}_p3_1`, [shape.p3[1]])
                }
            })
        })
        console.log(resultMap)
        if (resultMap.size === 0) {
            return
        }
        mapToCsv(resultMap)
    }, [filesResult, labels])

    return (
        <div className="App">
            <header className="App-header">
                <div className={classes.headerWrapper}>
                    <div>
                        <p>请选择标签文件</p>
                        <p>
                            <input type="file" name="label" disabled={labels.length > 0} onChange={handleChange} />

                            标签数量：{labels.length}
                            <Button style={{
                                marginLeft: 10
                            }} type="primary" onClick={handleExport}>导出</Button>
                        </p>
                        <p>导入已标记的csv文件(optional)</p>
                        <p>
                            <input type="file" name="csv" disabled={labels.length === 0} onChange={handleChange} />
                        </p>
                        {
                            labels.length > 0 && <>
                                <p>选择图片</p>
                                <p>
                                    <input type="file" name="file" multiple onChange={handleChange} />
                                </p>
                            </>
                        }
                    </div>
                    <div>
                        <div>
                            图片列表
                        </div>
                        <ul>
                            {files.map(file => {
                                const statusString = [
                                    <Tag style={{
                                        float: 'right'
                                    }} color={"#f50"}>未标注</Tag>,
                                    <Tag style={{
                                        float: 'right'
                                    }} color={"#2db7f5"}>部分标注</Tag>,
                                    <Tag style={{
                                        float: 'right'
                                    }} color={"#87d068"}>标注完成</Tag>
                                ]
                                const isStatus_0 = filesResult[file.name] && Object.values(filesResult[file.name]).every(shape => !isValidShape(shape))
                                // const isStatus_2 = filesResult[file.name] && Object.values(filesResult[file.name]).every(shape => isValidShape(shape))
                                const isStatus_1 = filesResult[file.name] && Object.values(filesResult[file.name]).some(shape => !isValidShape(shape)) && Object.values(filesResult[file.name]).some(shape => isValidShape(shape))
                                const finishStatus: 0 | 1 | 2 = filesResult[file.name] ? isStatus_0 ? 0 : isStatus_1 ? 1 : 2 : 0
                                return <li key={file.name} className={cx(currentFileName === file.name && classes.activeLi)} onClick={() => selectFile(file)}>
                                    {file.name}  {statusString[finishStatus]}
                                </li>
                            })}
                        </ul>
                    </div>

                </div>



                <p style={{
                    position: 'fixed',
                    top: 0,
                    display: 'flex',
                    justifyContent: 'end',
                    width: '100%',
                    left: 0,
                    zIndex: 2,
                    alignItems: 'center'
                }}>
                    <span style={{
                        color: 'red',
                        fontWeight: 'bolder',
                        marginRight: 10
                    }}>
                        {
                            '当前标签：' + activeLabel
                        }
                    </span>
                    {

                        currentFileLabelItems && Object.entries(currentFileLabelItems).map(([k, v]) => {
                            const isActive = activeLabel === k
                            if (isValidShape(v)) {
                                return <Button
                                    key={k}
                                    type="primary"
                                    style={{
                                        border: isActive ? '1px solid red' : "none"
                                    }}
                                    onClick={() => setActiveLabel(k)}
                                >{k}</Button>
                            }
                            return <Button
                                key={k}
                                type="default"
                                style={{
                                    border: isActive ? '1px solid red' : "none"
                                }}
                                onClick={() => setActiveLabel(k)}
                            >{k}</Button>
                        })
                    }
                </p>
                <div>
                    <div
                        className={classes.canvasWrapper}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseMove={handleCanvasMouseMove}
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={(e) => e.preventDefault()}
                        />
                        {currentFileLabelItems && Object.entries(currentFileLabelItems).map(([k, v]) => {
                            if (isValidShape(v)) {
                                return <Strock
                                    key={k}
                                    shape={v}
                                    label={k}
                                    isActive={activeLabel === k}
                                    onClick={() => setActiveLabel(k)}
                                    onRemove={() => handleRemove(k)}
                                    onResizeStop={(e, d, r, delta) => {
                                        const deltaedShape = getShapeSizeDelta(v, delta)
                                        handleUpdatePoint(deltaedShape)
                                    }}
                                    onMove={(delta) => {
                                        const deltaedShape = getShapePositionDelta(v, delta, imageSize.current)
                                        handleUpdatePoint(deltaedShape)
                                    }}
                                />
                            }
                            return <React.Fragment key={k} />
                        })}
                    </div>

                </div>
            </header>
        </div>
    )
}

export default App
