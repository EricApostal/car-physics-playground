import { Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { VehicleMesh } from "client/game/vehicle/mesh";

@Component({
    tag: "vm_hyundai_vision"
})
export class HyundaiVision extends VehicleMesh implements OnStart {

    constructor() {
        super(0.5, 1000);
    }

    onStart() {
        super.onStart();
    }
}