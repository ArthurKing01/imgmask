import React, { useCallback, useEffect, useRef, useState } from "react";
import { createUseStyles } from "react-jss";
import { Shape } from './core'
import cx from 'classnames'
import { Resizable, ResizeCallback } from "re-resizable";
import { Tag } from "antd";

const useStyle = createUseStyles({
    strock: {
        position: 'absolute',
        userSelect: 'none',
        border: '1px solid red',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
    },
    active: {
        position: 'relative',
        background: "rgba(255,0,0,0.1)",
        cursor: 'move'
    },
    removeTag: {
        position: 'absolute',
        right: '-25px',
        top: '-25px',
        cursor: 'pointer'
    }
})

type TStrockProps = {
    isActive?: boolean
    shape: Shape
    onClick?: () => void
    onRemove?: () => void
    onResizeStop?: ResizeCallback
    onMove?: (delta: {left: number, top: number}) => void
    label: string
}

export const Strock = ({
    shape,
    label,
    onClick,
    isActive,
    onResizeStop,
    onMove,
    onRemove
}: TStrockProps) => {
    const classes = useStyle()

    const [moveMouseDown, setMoveMouseDown] = useState(false)
    const startPoint = useRef([0,0])

    const handleResizeStart = useCallback(() => {
        setMoveMouseDown(false)
    }, [])

    useEffect(() => {
        const handleBodyMouseUp = () => {
            setMoveMouseDown(false)
        }
        document.body.addEventListener('mouseup', handleBodyMouseUp)
        return () => {
            document.body.removeEventListener('mouseup', handleBodyMouseUp)
        }
    }, [])

    const handleMoveMouseDown: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
        startPoint.current = [e.pageX, e.pageY]
        setMoveMouseDown(true)
    }, [])

    const handleMoveMouseUp: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
        startPoint.current = [0, 0]
        setMoveMouseDown(false)
    }, [])

    const handleMoveMouseMove: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
        if (moveMouseDown) {
            onMove?.({
                left: e.pageX - startPoint.current[0],
                top: e.pageY - startPoint.current[1]
            })
            startPoint.current = [e.pageX, e.pageY]
        }
    }, [moveMouseDown, onMove])

    return <>
        {isActive && <Resizable size={{
            width: shape.p3[0] - shape.p1[0],
            height: shape.p3[1] - shape.p1[1]
        }} onResizeStop={onResizeStop} style={{
            position: 'absolute',
            top: shape.p1[1],
            left: shape.p1[0],
        }} enable={{
            right: true,
            bottom: true,
            bottomRight: true
        }} onResizeStart={handleResizeStart}>
            <div 
            className={cx(classes.strock, isActive && classes.active)} 
            onClick={onClick} 
            onMouseDown={handleMoveMouseDown}
            onMouseMove={handleMoveMouseMove}
            onMouseUp={handleMoveMouseUp}
            >
                {label}
                <Tag onClick={onRemove} className={classes.removeTag} color={"cyan"}>移除</Tag>
            </div>
        </Resizable>}
        {!isActive && <div className={cx(classes.strock, isActive && classes.active)} onClick={onClick} style={{
            top: shape.p1[1],
            left: shape.p1[0],
            width: shape.p3[0] - shape.p1[0],
            height: shape.p3[1] - shape.p1[1]
        }} >
            {label}
        </div>}

    </>

}