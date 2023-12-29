import { BaseComponent, Component } from "@flamework/components";
import { Controller, OnStart } from "@flamework/core";
import { AssetService } from "@rbxts/services";
import { HttpService } from "@rbxts/services";

export class VehicleMesh extends BaseComponent implements OnStart {
    public vertices: Array<number> = [];
    public markerMap = new Map<number, BasePart>();
    public verticesMap = new Map<BasePart, number>();
    public constraintMap = new Map<string, boolean>();
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

    // Check to see if a constraint already exists between two vertecies
    private constraintExists(attachment1: Attachment, attachment2: Attachment) {
        let id1 = attachment1.GetAttribute("id") as string;
        let id2 = attachment2.GetAttribute("id") as string;

        let check1 = this.constraintMap.get(id1 + id2);
        let check2 = this.constraintMap.get(id2 + id1);

        return check1 || check2;
    }

    // Make constraint between two vertecies
    private makeConstraint(attachment1: Attachment, attachment2: Attachment) {
        // Create a new constraint
        let weld = new Instance("RodConstraint");
        weld.LimitsEnabled = true;
        weld.Length = weld.CurrentDistance;

        weld.Parent = game.Workspace.WaitForChild("constraints");
        weld.Attachment0 = attachment1;
        weld.Attachment1 = attachment2;

        // Add the constraint to the map
        let id1 = attachment1.GetAttribute("id") as string;
        let id2 = attachment2.GetAttribute("id") as string;
        this.constraintMap.set(id1 + id2, true);
    }

    // Recursively constraint all vertecies to their adjacent vertecies
    private constrainVerticies(vertexIndex: number) {
        let currentMarker = this.markerMap.get(vertexIndex)!;
        let currentMarkerAttachment = currentMarker.WaitForChild("Attachment")! as Attachment;

        let adjacentVertecies = this.mesh!.GetAdjacentVertices(vertexIndex) as Array<number>;
        for (let vert of adjacentVertecies) {
            if (this.constraintExists(currentMarkerAttachment, this.markerMap.get(vert)!.WaitForChild("Attachment")! as Attachment)) {
                continue;
            }
            this.makeConstraint(currentMarkerAttachment, this.markerMap.get(vert)!.WaitForChild("Attachment")! as Attachment);
            this.constrainVerticies(vert);
        }

    }

    private makeNode(vertId: number) {

        // Calculate Position
        let pos = this.mesh!.GetPosition(vertId).mul(this.scaling);
        let marker = new Instance("Part");
        let relativeCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(pos));

        // Properties
        marker.Position = relativeCFrame.Position;
        marker.Size = new Vector3(0.1, 0.1, 0.1);
        marker.Anchored = false;
        marker.Transparency = 0;
        marker.CanCollide = true
        marker.CollisionGroup = "car";
        marker.CanTouch = true;
        marker.Parent = game.Workspace;
        marker.Name = "marker";
        marker.CustomPhysicalProperties = new PhysicalProperties(100, 0, 0);
        marker.Color = Color3.fromRGB(0, 255, 133);

        // Make attachment with unique ID
        let attachment = new Instance("Attachment");
        attachment.Parent = marker;
        attachment.SetAttribute("id", HttpService.GenerateGUID(false));

        // For O(1) lookup
        this.markerMap.set(vertId, marker);
        this.verticesMap.set(marker, vertId);
    }

    onStart() {
        // (this.instance as BasePart).Anchored = true;
        this.mesh = AssetService.CreateEditableMeshFromPartAsync(this.instance as MeshPart);
        this.mesh.Parent = this.instance;
        this.vertices = this.mesh.GetVertices() as Array<number>;

        let partAttachment = new Instance("Attachment");
        partAttachment.Parent = this.instance as BasePart;

        for (let i = 0; i < this.vertices.size(); i++) {
            this.makeNode(this.vertices[i]);

        }
        print("Generated verticies, generating constraints...");
        // (this.instance as BasePart).Anchored = false;

        this.constrainVerticies((this.mesh.GetVertices() as Array<number>)[0] as number);
        print("Done!");
    }
}