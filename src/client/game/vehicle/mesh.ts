import { BaseComponent, Component } from "@flamework/components";
import { Controller, OnStart } from "@flamework/core";
import { AssetService, HttpService, RunService } from "@rbxts/services";

export class VehicleMesh extends BaseComponent implements OnStart {
    public vertices: Array<number> = [];
    public nodeMap = new Map<number, BasePart>();
    public physicsNodesMap = new Map<number, BasePart>();
    public constraintMap = new Map<string, boolean>();
    public mesh?: EditableMesh;
    public scaling: number = 0.5;
    public damageResistance: number = 1000;
    public physicsNodeInterval: number = 30;
    public nodeSize = 0.5;

    constructor(scaling: number, damageResistance: number) {
        super();
        this.scaling = scaling;
        this.damageResistance = damageResistance;
    }

    private localToGlobalVert(vert: number) {
        return (this.instance as BasePart).CFrame.mul(new CFrame(this.mesh!.GetPosition(vert).mul(this.scaling))).Position;
    }

    private constraintExists(attachment1: Attachment, attachment2: Attachment) {
        let id1 = attachment1.GetAttribute("id") as string;
        let id2 = attachment2.GetAttribute("id") as string;

        let check1 = this.constraintMap.get(id1 + id2) !== undefined;
        let check2 = this.constraintMap.get(id2 + id1) !== undefined;
        return check1 || check2;
    }

    // Make constraint between two vertecies
    private makeConstraint(attachment1: Attachment, attachment2: Attachment) {
        // Create a new constraint
        let spring = new Instance("SpringConstraint");
        spring.LimitsEnabled = true;

        let a1pos = (attachment1.Parent! as BasePart).Position;
        let a2pos = (attachment2.Parent! as BasePart).Position;

        spring.MinLength = a1pos.sub(a2pos).Magnitude - 0.2;
        spring.MaxLength = a1pos.sub(a2pos).Magnitude + 0.2;
        spring.FreeLength = a1pos.sub(a2pos).Magnitude;
        spring.Stiffness = 10000;
        // spring.Damping = 10;

        spring.Parent = game.Workspace.WaitForChild("constraints");
        spring.Attachment0 = attachment1;
        spring.Attachment1 = attachment2;

        // Add the constraint to the map
        let id1 = attachment1.GetAttribute("id") as string;
        let id2 = attachment2.GetAttribute("id") as string;
        this.constraintMap.set(id1 + id2, true);
    }

    // Iteratively constrain all vertecies to their adjacent vertecies
    private constrainVerticies() {
        let verticies = this.physicsNodesMap;

        for (let [id, part] of verticies) {
            let attachment1 = part.WaitForChild("Attachment") as Attachment;

            for (let [id2, part2] of verticies) {
                if (part === part2) continue;

                let attachment2 = part2.WaitForChild("Attachment") as Attachment;
                if (!this.constraintExists(attachment1, attachment2)) {
                    this.makeConstraint(attachment1, attachment2);
                }

            }
            wait();
        }
    }

    // Bind node to vertex by ID
    private makeNode(vertId: number) {
        return;
        // Calculate Position
        let pos = this.mesh!.GetPosition(vertId).mul(this.scaling);
        let node = new Instance("Part");
        let relativeCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(pos));

        node.Position = relativeCFrame.Position;
        node.Size = new Vector3(this.nodeSize, this.nodeSize, this.nodeSize);
        node.Anchored = true;
        node.Transparency = 1;
        node.CanCollide = true
        node.CollisionGroup = "car";
        node.CanTouch = true;
        node.Massless = true;
        node.Parent = game.Workspace;
        node.Name = "node";
        node.CustomPhysicalProperties = new PhysicalProperties(100, 0, 0);
        node.Color = Color3.fromRGB(0, 255, 133);

        let attachment = new Instance("Attachment");
        attachment.Parent = node;
        attachment.SetAttribute("id", HttpService.GenerateGUID(false));

        // For O(1) lookup
        this.nodeMap.set(vertId, node);
    }

    private makePhysicsNode(startVertex: number) {

        let verticies = this.mesh!.GetVertices() as Array<number>;
        let halfDiff = ((startVertex + 50) - (startVertex)) / 2
        let mean = verticies[startVertex + halfDiff];
        if (!mean) {
            mean = verticies.size();
        }
        let meanPos = this.mesh!.GetPosition(mean).mul(this.scaling);

        let node = new Instance("Part");
        let relativeCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(meanPos));

        node.Position = relativeCFrame.Position;
        node.Size = new Vector3(this.nodeSize, this.nodeSize, this.nodeSize);
        node.Anchored = true;
        node.Transparency = 0;
        node.CanCollide = true
        node.CollisionGroup = "car";
        node.CanTouch = true;
        node.Massless = true;
        node.Parent = game.Workspace;
        node.Name = "node";
        node.CustomPhysicalProperties = new PhysicalProperties(100, 0, 0);
        node.Color = Color3.fromRGB(51, 64, 194);

        let lastPosition: Vector3 | undefined = undefined;
        RunService.Heartbeat.Connect(() => {
            if (!lastPosition) {
                const p = (this.instance as BasePart).CFrame.Position;
                const newVec = new Vector3(p.X, p.Y, p.Z);
                lastPosition = newVec;
            }
            // calculate angle / position diff
            // let diff = (this.instance as BasePart).CFrame.sub(this.lastInstancePosition.Position);
            // const cf = (this.instance as BasePart).CFrame;
            // node.Position = node.Position.add(diff.Position);
            // this.lastInstancePosition = new CFrame(cf.Position);
            const diff = (this.instance as BasePart).CFrame.Position.sub(lastPosition);
            node.Position = node.Position.add(diff);

            lastPosition = (this.instance as BasePart).CFrame.Position;
        });

        let attachment = new Instance("Attachment");
        attachment.Parent = node;
        attachment.SetAttribute("id", HttpService.GenerateGUID(false));

        for (let i = startVertex; i < startVertex + this.physicsNodeInterval; i++) {
            let part = this.nodeMap.get(i);
            if (part) {
                let weld = new Instance("WeldConstraint");
                weld.Parent = game.Workspace.WaitForChild("constraints");
                weld.Part0 = node;
                weld.Part1 = part;
            }
        }

        // spring to instance

        for (let child of this.instance!.GetChildren()) {
            if (child.IsA("Attachment")) {
                let spring = new Instance("SpringConstraint");
                spring.Parent = game.Workspace.WaitForChild("constraints");

                // let dist = node.Position.sub(child.Position).Magnitude;
                // // spring.LimitsEnabled = true;
                // spring.MinLength = dist - 0.2;
                // spring.MaxLength = dist + 0.2;
                // spring.Stiffness = 10000;

                // spring.Attachment0 = attachment;
                // spring.Attachment1 = child;

                // let alignment = new Instance("AlignOrientation");
                // alignment.Attachment0 = attachment;
                // alignment.Attachment1 = child;
            }
        }

        this.physicsNodesMap.set(startVertex, node);
    }

    private unanchorNodes() {
        for (let [_, node] of this.nodeMap) {
            (node as BasePart).Anchored = false;
        }

        for (let [_, node] of this.physicsNodesMap) {
            (node as BasePart).Anchored = false;
        }
    }

    onStart() {
        // (this.instance as BasePart).Anchored = true;
        this.mesh = AssetService.CreateEditableMeshFromPartAsync(this.instance as MeshPart);
        this.mesh.Parent = this.instance;
        let verticies = this.mesh.GetVertices() as Array<number>;
        let triangles = this.mesh.GetTriangles() as Array<number>;

        let partAttachment = new Instance("Attachment");
        partAttachment.Parent = this.instance as BasePart;

        for (let i = 0; i < verticies.size(); i++) {
            this.vertices.push(i);
            this.makeNode(verticies[i]);
        }

        for (let i = 0; i < verticies.size(); i += this.physicsNodeInterval) {
            this.makePhysicsNode(verticies[i]);
        }

        print(`Generated ${this.vertices.size()} verticies & ${this.physicsNodesMap.size()} physics nodes, generating constraints...`);
        // (this.instance as BasePart).Anchored = false;

        this.constrainVerticies();
        this.unanchorNodes();
        print("Done!");
        print(`Generated ${this.constraintMap.size()} constraints!`)
    }
}