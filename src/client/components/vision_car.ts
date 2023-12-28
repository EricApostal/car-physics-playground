import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";

@Component({ tag: "vision_car" })
export class HyundaiVision extends BaseComponent implements OnStart {
    private motorModMap = new Map<string, number>();
    constructor() {
        super();
        this.motorModMap.set("FL", 1);
        this.motorModMap.set("FR", -1);
        this.motorModMap.set("BL", 1);
        this.motorModMap.set("BR", -1);
    }

    onStart() {
        let hinges = this.instance.WaitForChild("MeshPart").WaitForChild("constraints").WaitForChild("motors")!.GetChildren();
        for (let hinge of hinges) {
            let mod = this.motorModMap.get(hinge.Name)!;
            (hinge as HingeConstraint).AngularVelocity = 1 * mod;
        }
    }
}