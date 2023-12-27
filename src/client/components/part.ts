import { BaseComponent, Component } from "@flamework/components";
import { Controller, OnStart } from "@flamework/core";
import { AssetService } from "@rbxts/services";
import { RunService, Players, Workspace, ReplicatedStorage } from "@rbxts/services";

@Component({})
export class Marker extends BaseComponent implements OnStart {
    onStart() {
        print("marker")
    }
}

@Component({
    tag: "vehicle_mesh"
})
export class Part extends BaseComponent implements OnStart {
    private vertices: Array<number> = [];
    private markerMap = new Map<number, BasePart>();
    private verticesMap = new Map<BasePart, number>();
    private mesh?: EditableMesh;

    onStart() {
        print("called onstart")
        print(this.instance)
        this.mesh = AssetService.CreateEditableMeshFromPartAsync(this.instance as MeshPart);
        this.mesh.Parent = this.instance;
        this.vertices = this.mesh.GetVertices() as Array<number>;

        for (let i = 0; i < this.vertices.size(); i++) {
            let pos = this.mesh.GetPosition(this.vertices[i]).mul(0.5);
            let marker = new Instance("Part");

            marker.Position = (this.instance as BasePart).Position.add(pos);
            marker.Size = new Vector3(0.1, 0.1, 0.1);
            marker.Anchored = false;
            marker.Transparency = 1;
            marker.CanCollide = true;
            marker.CanTouch = true;
            marker.Parent = game.Workspace;
            marker.Name = "marker";
            marker.AddTag("marker")

            let weld = new Instance("WeldConstraint");
            weld.Parent = marker;
            weld.Part0 = marker;
            weld.Part1 = this.instance as BasePart;

            marker.Touched.Connect((part) => {
                task.wait();


                if (((marker.GetAttribute("isTouched") === false) || (marker.GetAttribute("isTouched") === undefined))) {

                    // print(part.Name)

                    marker.SetAttribute("isTouched", true);

                    let curr = this.verticesMap.get(marker)!;
                    let currPos = this.mesh!.GetPosition(curr)!;

                    let force = math.min(((part.GetVelocityAtPosition(currPos).Magnitude) + (this.instance as BasePart).GetVelocityAtPosition(currPos).Magnitude) / 1000, 0.5);
                    // print(force)
                    let newPos = currPos.sub((part.Position.sub(marker.Position)).mul(force));
                    this.mesh!.SetPosition(curr, newPos);

                    let markerPos = (this.mesh!.GetPosition(this.vertices[i]).mul(0.5)).add((this.instance as BasePart).Position);
                    marker.Position = markerPos
                    task.wait(2);
                    marker.SetAttribute("isTouched", false);
                }
            });

            // silly, but allows for O(1) lookup
            this.markerMap.set(this.vertices[i], marker);
            this.verticesMap.set(marker, this.vertices[i]);
        }
        print("finished vertices")
    }
}