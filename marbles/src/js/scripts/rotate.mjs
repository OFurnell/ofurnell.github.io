import { Script } from 'playcanvas';

export class Rotator extends Script {
    static scriptName = 'rotator';

    /** @attribute */
    speed = 10;

    initialize() {
        // Called once when the script starts
        console.log('Script initialized!');
    }

    update(dt) {
        // Called every frame
        this.entity.rotate(0, this.speed * dt, 0);
    }
}