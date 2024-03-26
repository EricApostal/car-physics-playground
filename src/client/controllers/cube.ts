import { Controller } from "@flamework/core";
import { RunService } from "@rbxts/services";

@Controller()
class CubeController {
    cube: Folder;
    constraints: Folder;
    parts: Folder;

    public constraintMap = new Map<string, boolean>();

    constructor() {
        this.cube = game.Workspace.WaitForChild("cube") as Folder;
        this.constraints = this.cube.WaitForChild("constraints") as Folder;
        this.parts = this.cube.WaitForChild("parts") as Folder;

        this.addAttachments();
        RunService.RenderStepped.Connect(() => {
            for (let part of this.parts.GetChildren()) {
                assert(part.IsA("BasePart"), "part is not a BasePart");
                (part as BasePart).Orientation = new Vector3(0, 0, 0);
            }
        })

    }

    private addAttachments() {
        while (this.parts.GetChildren().size() === 0) wait();
        wait(1);
        for (let part of this.parts.GetChildren()) {
            assert(part.IsA("BasePart"), "part is not a BasePart");

            let attachment = new Instance("Attachment");
            attachment.Parent = part;
            attachment.Name = part.Name;
        }

        // add springs between attachments
        for (let part1 of this.parts.GetChildren()) {
            for (let part2 of this.parts.GetChildren()) {
                assert(part1.IsA("BasePart"), "part1 is not a BasePart");
                assert(part2.IsA("BasePart"), "part2 is not a BasePart");

                if (part1 === part2) continue;
                let spring = new Instance("SpringConstraint");
                spring.Parent = this.constraints;
                spring.Attachment0 = part1.WaitForChild(part1.Name) as Attachment;
                spring.Attachment1 = part2.WaitForChild(part2.Name) as Attachment;

                spring.LimitsEnabled = true;

                // min in max is actually what's important
                spring.MinLength = (part1.Position.sub(part2.Position)).Magnitude - 0.1;
                spring.MaxLength = (part1.Position.sub(part2.Position)).Magnitude + 0.1;
                // FREE LENGTH IS IMPORTANT (maybe)
                spring.FreeLength = (part1.Position.sub(part2.Position)).Magnitude;
                spring.Stiffness = 0;
            }
        }
        wait();

        for (let part of this.parts.GetChildren()) {
            (part as BasePart).Anchored = false;
        }
    }



}