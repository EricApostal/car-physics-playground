import { Networking } from "@flamework/networking";

interface ClientToServerEvents { }

interface ServerToClientEvents { }

interface ClientToServerFunctions {
    requestExitVehicle(): void;
}

interface ServerToClientFunctions {
    exitVehicle(): void;
    enterVehicle(model: Model): void;
}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<ClientToServerFunctions, ServerToClientFunctions>();
