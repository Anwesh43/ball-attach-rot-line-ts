const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const sizeFactor : number = 2.9
const strokeFactor : number = 90
const nodes : number = 5
const lines : number = 4
const foreColor : string = "#4527A0"
const backColor : string = "#bdbdbd"
const rFactor : number = 5

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }

    static scaleFactor(scale : number) : number {
        return Math.floor(scale / scDiv)
    }

    static mirrorValue(scale : number, a : number, b : number) : number {
        const k : number = ScaleUtil.scaleFactor(scale)
        return (1 - k) / a + k / b
    }

    static updateValue(scale : number, dir : number, a : number, b : number) : number {
        return ScaleUtil.mirrorValue(scale, a, b) * dir * scGap
    }

    static sjf(j : number) : number {
        return 1 - 2 * (j % 2)
    }
}

class DrawingUtil {

    static drawMovingBall(context : CanvasRenderingContext2D, r : number, x : number, y : number) {
        context.save()
        context.translate(x, y)
        context.beginPath()
        context.arc(0, 0, r, 0, 2 * Math.PI)
        context.fill()
        context.restore()
    }

    static drawRotatingLine(context : CanvasRenderingContext2D, y : number, size : number, deg : number) {
        context.save()
        context.translate(0, y)
        context.rotate(deg)
        context.beginPath()
        context.moveTo(0, 0)
        context.lineTo(0, size)
        context.stroke()
        context.restore()
    }

    static setStyle(context : CanvasRenderingContext2D) {
        context.strokeStyle = foreColor
        context.fillStyle = foreColor
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.lineCap = 'round'
    }



    static drawBARLNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const gap : number = h / (nodes + 1)
        const size : number = gap / sizeFactor
        const yGap : number = (2 * size) / lines
        const r : number = yGap / rFactor
        const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
        const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
        DrawingUtil.setStyle(context)
        context.save()
        context.translate(w / 2, gap * (i + 1))
        context.rotate(Math.PI * 0.5 * sc2)
        for (var j = 0; j < lines; j++) {
            const sf : number = ScaleUtil.sjf(j)
            const scj : number = ScaleUtil.divideScale(sc1, j, lines)
            const scj1 : number = ScaleUtil.divideScale(scj, 0, 2)
            const scj2 : number = ScaleUtil.divideScale(scj, 1, 2)
            const ballX : number = yGap + (w / 2 - yGap) * (1 - scj2)
            DrawingUtil.drawRotatingLine(context, yGap * j, yGap, -Math.PI/2 * sf * scj1)
            DrawingUtil.drawMovingBall(context, r, ballX * sf, yGap * j)
        }
        context.restore()
    }
}

class BallAttachRotLineStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : BallAttachRotLineStage = new BallAttachRotLineStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += ScaleUtil.updateValue(this.scale, this.dir, lines, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class BARLNode {

    prev : BARLNode
    next : BARLNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new BARLNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawBARLNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : BARLNode {
        var curr : BARLNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}
