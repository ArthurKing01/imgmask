// export const labels = [
//     '复制',
//     '翻译反馈',
//     '隐藏翻译',
//     '翻译',
//     '转文字',
//     '收起文字',
//     '管理员撤回',
//     '添加表情',
//     '多选',
//     '请求回执',
//     '另存为',
//     '打开文件夹',
//     '转发',
//     '更多',
//     '标记',
//     '已读列表',
//     '撤回',
//     '删除',
//     '回复',
//     '取消标记',
//     '待办',
//     '收藏'
// ]

export type Point = [number, number]

export type Shape = {
    p1: Point
    p3: Point
}

export type LabelItems = {
    [k: string]: Shape
}

export const getPoint = (x: number,y: number): Point => {
    return [x, y]
}

export const normalizePoint = (p: Point, viewPort: {
    width: number,
    height: number
}) => {
    if (p[0] < 0) p[0] = 0
    if (p[1] < 0) p[1] = 0

    if (p[0] > viewPort.width) p[0] = viewPort.width
    if (p[1] > viewPort.height) p[1] = viewPort.height

    return p
}

export const getShape = (p1: Point, p3: Point): Shape => {
    return {
        p1,
        p3,
    }
}

export const getShapeSizeDelta = (shape: Shape, delta: {width: number, height: number}): Shape => {
    shape.p3[0] += delta.width

    shape.p3[1] += delta.height

    return shape
}
export const getShapePositionDelta = (shape: Shape, delta: {left: number, top: number}, viewPort: { width: number, height: number }): Shape => {
    if (shape.p1[0] + delta.left < 0) {
        delta.left = 0
    }
    if (shape.p1[1] + delta.top < 0) {
        delta.top = 0
    }
    if (shape.p3[0] + delta.left > viewPort.width) {
        delta.left = 0
    }
    if (shape.p3[1] + delta.top > viewPort.height) {
        delta.top = 0
    }
    shape.p1[0] += delta.left
    shape.p3[0] += delta.left

    shape.p1[1] += delta.top
    shape.p3[1] += delta.top

    return shape
}

export const getDefaultShape = () => {
    return getShape(getPoint(0, 0), getPoint(0, 0))
}

export const getDefaultLabelItems = (labels: string[]): LabelItems => {
    return labels.reduce((r, n) => {
        r[n] = getDefaultShape()
        return r
    }, {} as LabelItems)
}

export const isValidShape = (shape: Shape): boolean => {
    if (shape.p3[0] <= shape.p1[0]) return false
    if (shape.p3[1] <= shape.p1[1]) return false
    return true

}
