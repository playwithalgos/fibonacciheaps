const RADIUS = 32;
const SCREENWIDTH = 1500;
const SCREENHEIGHT = 800;

let mousePressed = false;
let currentNode = undefined;
let parentCandidate = undefined;
let MAXVALUE = 240;
let mouse = { x: 0, y: 0 };

class Node {
    constructor(arg) {
        this.x = arg ? arg.x : Math.random() * SCREENWIDTH;
        this.y = 0;
        this.v = { x: 0, y: 0 };
        this.f = { x: 0, y: 0 };
        this.value = Math.floor(Math.random() * MAXVALUE);
        this.parent = undefined;
        this.children = new Set();
        this.depth = 0;
        this.mark = false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.globalAlpha = (this.y < 2 * RADIUS) ? 0.5 : 1;
        ctx.fillStyle = `hsl(${this.value}, 100%, 50%)`;
        ctx.lineWidth = 10;
        ctx.strokeStyle = "white";

        if (this.mark || this.parent == undefined)
            ctx.arc(this.x, this.y, RADIUS, 0, Math.PI * 2);
        else
            ctx.rect(this.x - RADIUS, this.y - RADIUS, 2 * RADIUS, 2 * RADIUS);

        if (this.mark)
            ctx.stroke();

        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.font = "bold 22px sanserif";
        ctx.fillStyle = "black";
        ctx.fillText(this.value, this.x, this.y + 8);
    }
}

const nodes = new Set();
function isEdge(node, node2) { return node.parent == node2 || node2.parent == node; }


for (let i = 0; i < 3; i++)
    nodes.add(new Node());
/**
 * 
 * @param {*} ctx the graphical context (in the rest of code ctx is always the graphical context) 
 * @param {*} x1 
 * @param {*} y1 
 * @param {*} x2 
 * @param {*} y2 
 * @description draw a line
 */
function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}


/**
 * 
 * @param {*} ctx
 * @description draw the whole circuit 
 */
function draw(ctx) {
    ctx.clearRect(0, 0, 6040, 4080);

    if (!mousePressed) {
        for (const node of nodes)
            node.f = { x: 0, y: 0 };

        const F = 1000;
        const Fattraction = F * 3;

        function addForce(node, node2, F) {
            const d2 = dist2(node, node2);
            const angle = Math.atan2(node.y - node2.y, node.x - node2.x);
            if (d2 > 0.01) {
                node.f.x += F * Math.cos(angle) / d2;
                node.f.y += F * Math.sin(angle) / d2;
            }
        }
        for (const node of nodes)
            for (const node2 of node.children) {
                addForce(node, node2, -Fattraction);
                addForce(node2, node, -Fattraction);
            }

        for (const node of nodes)
            for (const node2 of nodes)
                if (node != node2 && node.depth == node2.depth)
                    addForce(node, node2, F);

        const SLOWDOWN = 0.9;
        for (const node of nodes) {
            node.v.x += node.f.x;
            node.v.y += node.f.y;

            if (node != currentNode) {
                node.x += node.v.x;
                node.y += node.v.y;
            }

            function barycentre(a, b) {
                const lambda = 0.5;
                return a * lambda + b * (1 - lambda);
            }
            node.y = barycentre(node.y, 200 + node.depth * 100);
            node.x = Math.min(SCREENWIDTH, Math.max(2 * RADIUS, node.x));
            node.y = Math.max(RADIUS, node.y);
            node.v.x *= SLOWDOWN;
            node.v.y *= SLOWDOWN;
        }

    }

    if (parentCandidate && currentNode && mousePressed) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        line(ctx, currentNode.x, currentNode.y, parentCandidate.x, parentCandidate.y);
    }
    for (const node of nodes)
        for (const c of node.children) if (c != currentNode || !mousePressed) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            line(ctx, node.x, node.y, c.x, c.y);
        }

    for (const node of nodes)
        node.draw(ctx);
}


function loop() {
    draw(canvas.getContext("2d")); //first drawing
    requestAnimationFrame(loop);
}

loop();

/**
 * handle the modification of the input
 */


canvas.oncontextmenu = (evt) => { evt.preventDefault(); }

canvas.onmousedown = (evt) => {
    mousePressed = true;
    if (mouse.y < 2 * RADIUS && currentNode == undefined)
        nodes.add(new Node({x:mouse.x}));
    if (evt.button > 0) {   
        if (currentNode)
            currentNode.mark = !currentNode.mark;
    }
    evt.preventDefault();

    if (currentNode) {
        computeParentCandidate();
        currentNode.initialX = currentNode.x;
        currentNode.initialY = currentNode.y;

    }
}


canvas.ondblclick = (evt) => {
    if (currentNode) {
        const a = parseInt(prompt("Enter the value of the node: ", currentNode.value));
        if (0 <= a && a < MAXVALUE)
            currentNode.value = a;
    }

}
function dist2(a, b) { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2; }

document.body.onkeydown = (evt) => {
    if (evt.key == "Enter")
        nodes.add(new Node());
}

canvas.onmouseup = () => {
    if (currentNode) {
        const other = getNodeUnderCurrentNode();
        if (other) {
            [other.value, currentNode.value] = [currentNode.value, other.value];
            currentNode.x = currentNode.initialX;
            currentNode.y = currentNode.initialY;

        }
        else {

            if (parentCandidate) {
                if (currentNode.parent != undefined) {
                    currentNode.parent.children.delete(currentNode);
                }
                parentCandidate.children.add(currentNode);
                currentNode.parent = parentCandidate;
            }
            else {
                if (currentNode.parent != undefined) {
                    currentNode.parent.children.delete(currentNode);
                }
                currentNode.parent = undefined;

                if (currentNode.y < 2 * RADIUS) {
                    nodes.delete(currentNode);
                    for (const c of currentNode.children)
                        c.parent = undefined;
                }
            }
            parentCandidate = undefined;


        }
        computeDepths();
    }
    mousePressed = false;
}


function computeDepths() {
    function setDepth(n, d) {
        n.depth = d;
        for (const c of n.children)
            setDepth(c, d + 1);
    }
    for (const n of nodes) if (n.parent == undefined)
        setDepth(n, 0);
}

canvas.onmousemove = (evt) => {
    const rect = evt.target.getBoundingClientRect();
    let delta = { x: 0, y: 0 };
    const newmouse = { x: (evt.clientX - rect.left), y: (evt.clientY - rect.top) };
    if (mouse)
        delta = { x: newmouse.x - mouse.x, y: newmouse.y - mouse.y };
    mouse = newmouse;

    if (!mousePressed) {
        currentNode = undefined;
        for (const node of nodes)
            if (dist2(mouse, node) < RADIUS ** 2)
                currentNode = node;
    }

    function move(n, delta) {
        n.x += delta.x;
        n.y += delta.y;
        for (const c of n.children)
            move(c, delta);
    }

    if (mousePressed && currentNode) {
        move(currentNode, delta);
        computeParentCandidate();
    }
}

function getNodeUnderCurrentNode() {
    const A = Array.from(nodes).filter((n) => (n != currentNode))
        .filter((n) => (dist2(n, currentNode) <= RADIUS ** 2))

    if (A.length == 0)
        return undefined;
    else
        return A[0];
}
function computeParentCandidate() {

    parentCandidate = undefined;
    if (getNodeUnderCurrentNode())
        return;

    const candidates = Array.from(nodes).filter((n) => (n != currentNode))
        .filter((n) => dist2(n, currentNode) < 200 ** 2)
        .filter((n) => (n.y < currentNode.y - 2 * RADIUS))
        .sort((a, b) => dist2(a, currentNode) - dist2(b, currentNode));
    if (candidates.length > 0)
        parentCandidate = candidates[0];

}