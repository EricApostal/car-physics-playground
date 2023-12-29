import { BaseComponent, Component } from "@flamework/components";
import { Controller, OnStart } from "@flamework/core";
import { AssetService } from "@rbxts/services";
import { RunService, Players, Workspace, ReplicatedStorage } from "@rbxts/services";

export class VehicleMesh extends BaseComponent implements OnStart {
    public vertices: Array<number> = [];
    public markerMap = new Map<number, BasePart>();
    public verticesMap = new Map<BasePart, number>();
    public mesh?: EditableMesh;
    public scaling: number = 0.5;
    public damageResistance: number = 1000;

    constructor(scaling: number, damageResistance: number) {
        /*
        TODO:
        - Add arguments to constructor for settings; scaling, damage resistance, etc.
        */
        super();
        this.scaling = scaling;
        this.damageResistance = damageResistance;
    }

    private localToGlobalVert(vert: number) {
        return (this.instance as BasePart).CFrame.mul(new CFrame(this.mesh!.GetPosition(vert).mul(this.scaling))).Position;
    }

    onStart() {
        // (this.instance as BasePart).Anchored = true;
        this.mesh = AssetService.CreateEditableMeshFromPartAsync(this.instance as MeshPart);
        this.mesh.Parent = this.instance;
        this.vertices = this.mesh.GetVertices() as Array<number>;

        for (let i = 0; i < this.vertices.size(); i++) {
            let pos = this.mesh.GetPosition(this.vertices[i]).mul(this.scaling);
            let marker = new Instance("Part");
            let relativeCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(pos));

            marker.Position = relativeCFrame.Position;
            marker.Size = new Vector3(0.1, 0.1, 0.1);
            marker.Anchored = false;
            marker.Transparency = 0;
            marker.CanCollide = true
            marker.CollisionGroup = "car";
            marker.CanTouch = true;
            marker.Parent = game.Workspace;
            marker.Name = "marker";
            marker.Massless = false;
            marker.CustomPhysicalProperties = new PhysicalProperties(10, 0.3, 0.5);
            marker.Color = Color3.fromRGB(0, 255, 133);

            marker.AddTag("marker")

            let prism = new Instance("PrismaticConstraint");

            prism.Parent = marker;
            let prismaticMarkerAttachment = new Instance("Attachment");
            prismaticMarkerAttachment.Parent = marker;

            let partAttachment = new Instance("Attachment");
            partAttachment.Parent = this.instance as BasePart;
            prism.Attachment0 = prismaticMarkerAttachment;
            prism.Attachment1 = partAttachment;

            let weldAngle = CFrame.lookAt(marker.Position, (this.instance as BasePart).Position);
            prismaticMarkerAttachment.CFrame = weldAngle; // Apply the calculated CFrame to the attachment

            prism.LimitsEnabled = true;
            prism.LowerLimit = -2;
            prism.UpperLimit = 2;
            prism.Restitution = 1;
            prism.Size = prism.Attachment0.WorldPosition.sub(prism.Attachment1.WorldPosition).Magnitude;

            // prism.Size = prism.Attachment0.WorldPosition.sub(prism.Attachment1.WorldPosition).Magnitude;

            // spring.Attachment0 = partAttachment;
            // spring.Attachment1 = prismaticMarkerAttachment;

            // prism.Length = prism.Attachment0.WorldPosition.sub(prism.Attachment1.WorldPosition).Magnitude;

            // print(prism.Length)

            // silly, but allows for O(1) lookup
            this.markerMap.set(this.vertices[i], marker);
            this.verticesMap.set(marker, this.vertices[i]);
        }
        print("Generated verticies, generating constraints...");
        // (this.instance as BasePart).Anchored = false;

        for (let currentVertex of this.mesh!.GetVertices() as Array<number>) {
            let marker = this.markerMap.get(currentVertex)!;
            let springMarkerAttachment = new Instance("Attachment");
            springMarkerAttachment.Parent = marker;

            for (let vertex of this.mesh!.GetAdjacentVertices(currentVertex) as Array<number>) {
                let otherMarker = this.markerMap.get(vertex)!;

                let weld = new Instance("RodConstraint");
                weld.Length = weld.CurrentDistance;

                let otherMarkerAttachment = new Instance("Attachment");
                otherMarkerAttachment.Parent = otherMarker;


                weld.Parent = game.Workspace.WaitForChild("constraints");
                weld.Attachment0 = otherMarkerAttachment;
                weld.Attachment1 = springMarkerAttachment;
                // weld.Name = "rod";
            }
        }
        print("Done!");
    }
}