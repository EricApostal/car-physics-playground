import { Networking } from "@flamework/networking";

interface ClientToServerEvents { }

interface ServerToClientEvents { }

interface ClientToServerFunctions { }

interface ServerToClientFunctions {
    enterVehicle(model: Model): void;
}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<ClientToServerFunctions, ServerToClientFunctions>();
