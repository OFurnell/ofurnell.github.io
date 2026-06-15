import * as pc from 'playcanvas';
import { Rotator } from './scripts/rotate.mjs';
import { CameraControls } from 'https://cdn.jsdelivr.net/npm/playcanvas/scripts/esm/camera-controls.mjs'

// load required module
pc.WasmModule.setConfig('Ammo', {
    glueUrl: new URL(`../assets/wasm/ammo/ammo.wasm.js`, import.meta.url).toString(),
    wasmUrl: new URL(`../assets/wasm/ammo/ammo.wasm.wasm`, import.meta.url).toString(),
    fallbackUrl: new URL(`../assets/wasm/ammo/ammo.js`, import.meta.url).toString(),
});
await new Promise((resolve) => {
    pc.WasmModule.getInstance('Ammo', () => resolve());
});

// create an application
const canvas = document.getElementById('application');

const app = new pc.Application(canvas);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.setCanvasFillMode(pc.FILLMODE_NONE);
app.timeScale = 0;
app.start();

app.scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);
app.systems.rigidbody.gravity.set(0, -9.81, 0);

// register scripts
pc.registerScript(Rotator, undefined, app);
pc.registerScript(CameraControls, undefined, app);

// create a camera
const camera = new pc.Entity();
camera.addComponent('camera', {
    clearColor: new pc.Color(0.3, 0.3, 0.7)
});

// move camera back to view whole ramp
camera.translate(0, 30, 30);

// Look at the middle of the ramp
camera.lookAt(0, 10, 0);
app.root.addChild(camera);

// Dynamic camera
camera.addComponent('script');
camera.script.create(CameraControls, {
        properties: {
            enableOrbit: false,
            enableFly: true,
            enablePan: true,
            focusPoint: new pc.Vec3(0, 10, 0)
        }
    });

// create a light
const light = new pc.Entity();
light.addComponent('light');
light.setEulerAngles(45, 45, 0);
app.root.addChild(light);

// create our floor
const floor = new pc.Entity();
floor.addComponent('render', {
    type: 'box'
});

// scale it
floor.setLocalScale(50, 1, 10);

// add a rigidbody component so that other objects collide with it
floor.addComponent('rigidbody', {
    type: 'static',
    restitution: 0.5
});

// add a collision component
floor.addComponent('collision', {
    type: 'box',
    halfExtents: new pc.Vec3(25, 0.5, 5)
});

app.root.addChild(floor);

// create our ramp
const rampWidth = 50;
const rampHeight = 30;
const rampGroup = new pc.Entity();
rampGroup.setPosition(0, 8, -8);
rampGroup.rotate(45, 0, 0);

const ramp = new pc.Entity();
ramp.addComponent('render', {
    type: 'box'
});

// scale it
ramp.setLocalScale(rampWidth, 1, rampHeight);

// add a rigidbody component so that other objects collide with it
ramp.addComponent('rigidbody', {
    type: 'static',
    restitution: 0.5
});

// add a collision component
ramp.addComponent('collision', {
    type: 'box',
    halfExtents: new pc.Vec3(rampWidth / 2, 0.5, rampHeight / 2)
});

rampGroup.addChild(ramp);

// add left bumper
const leftBumper = new pc.Entity();
leftBumper.addComponent('render', {
    type: 'box'
});
leftBumper.setLocalScale(1, 1, rampHeight);
leftBumper.setPosition(-1 * rampWidth / 2, 1, 0)
leftBumper.addComponent('rigidbody', {
    type: 'static',
    restitution: 0.5
});
leftBumper.addComponent('collision', {
    type: 'box',
    halfExtents: new pc.Vec3(0.5, 0.5, rampHeight / 2)
});

rampGroup.addChild(leftBumper)

// add right bumper
const rightBumper = new pc.Entity();
rightBumper.addComponent('render', {
    type: 'box'
});
rightBumper.setLocalScale(1, 1, rampHeight);
rightBumper.setPosition(rampWidth / 2, 1, 0)
rightBumper.addComponent('rigidbody', {
    type: 'static',
    restitution: 0.5
});
rightBumper.addComponent('collision', {
    type: 'box',
    halfExtents: new pc.Vec3(0.5, 0.5, rampHeight / 2)
});

rampGroup.addChild(rightBumper)

// add random obstacles to the ramp
let pinPositions = [];
const getRandomPosition = () => [
    (Math.random() - 0.5) * (rampWidth - 3),
    (Math.random() - 0.5) * (rampHeight - 8)
]
for (var i = 0; i < 500; i++) {
    const pin = new pc.Entity();
    pin.addComponent('render', {
        type: 'cylinder'
    });

    pin.setLocalScale(0.1, 2, 0.1);
    let safePositionFound = false;
    let position;
    const maxAttempts = 50;
    let attempts = 0
    while (!safePositionFound && attempts < maxAttempts) {
        position = getRandomPosition();
        safePositionFound = !pinPositions.some((other) => {
            return Math.abs(position[0] - other[0]) <= 1.1 && Math.abs(position[1] - other[1]) <= 1.1
        })
        if (safePositionFound) {
            pinPositions.push(position);
        }
        else {
            attempts++;
        }
    }

    // If too many positions are filled the break
    if (!safePositionFound) {
        console.log("Too many full slots, can't find any more", i)
        break;
    }

    pin.setPosition(
        position[0],
        1.5,
        position[1]
    );

    // add a rigidbody component so that other objects collide with it
    pin.addComponent('rigidbody', {
        type: 'static',
        restitution: 0.5
    });

    // add a collision component
    pin.addComponent('collision', {
        type: 'cylinder',
        height: 2,
        radius: 0.05,
    });

    rampGroup.addChild(pin);
}

app.root.addChild(rampGroup);

const createMarble = (laneNumber, laneCount) => {
    // create a sphere
    const entityName = `marble-${laneNumber}`
    const marble = new pc.Entity(entityName);
    marble.setPosition((laneNumber/ laneCount - 0.5) * (rampWidth - 15) + (Math.random() * 2 - 1), 25, -16);
    console.log(marble.getPosition())

    marble.addComponent('model', {
        type: 'sphere'
    });

    marble.addComponent('collision', {
        type: 'sphere'
    });

    marble.addComponent('rigidbody', {
        type: 'dynamic',
        mass: 10
    });

    // bind rotator script
    //marble.addComponent('script');

    // attach the script by its registered name
    // marble.script.create('rotator');

    app.root.addChild(marble);
    return entityName;
}


document.getElementById("button-start").addEventListener("click", () => {
    var participantText = document.getElementById("participants").value;
    var participants = participantText.split("\n").map(p => p.trim()).filter(p => p.length > 0);
    var participantMap = new Map();
    for (var i = 0; i < participants.length; i++) {
        var entity = createMarble(i, participants.length - 1);
        participantMap.set(entity, participants[i]);
    }
    console.log("Starting for participants", participants);
    let winnerAnnounced = false;
    floor.collision.on("collisionstart", (event) => {
        if (!winnerAnnounced) {
            const winnerEntity = event.other.name;
            const winnerName = participantMap.get(winnerEntity);
            if (winnerName) {
                winnerAnnounced = true;
                console.log("The winner is", winnerName);
                document.getElementById("winner-name").textContent = winnerName;
                document.getElementById("winner-dialog").showModal();
            }
        }
    });
    app.timeScale = 1;
})