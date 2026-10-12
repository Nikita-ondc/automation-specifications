import { readFileSync } from "fs";
import yaml from "js-yaml";
import path from "path";
import { MockAction, MockOutput, saveType } from "../../classes/mock-action";
import { SessionData } from "../../session-types";
import { confirmDefaultGenerator } from "./generator";

export class MockConfirmClass extends MockAction {
    get saveData(): saveType {
        return yaml.load(
            readFileSync(path.resolve(__dirname, "./save-data.yaml"), "utf8")
        ) as saveType;
    }
    get defaultData(): any {
        return yaml.load(
            readFileSync(path.resolve(__dirname, "./default.yaml"), "utf8")
        );
    }
    get inputs(): any {
        return {};
    }
    name(): string {
        return "confirm";
    }
    get description(): string {
        return "Mock for confirm";
    }
    generator(existingPayload: any, sessionData: SessionData): Promise<any> {
        return confirmDefaultGenerator(existingPayload, sessionData);
    }
    async validate(targetPayload: any): Promise<MockOutput> {
        return { valid: true };
    }
    async meetRequirements(sessionData: SessionData): Promise<MockOutput> {
        // For confirm, require provider, at least one item (either selected_items or item), and transaction_id
        if (!sessionData.selected_provider) {
            return { valid: false, message: "No selected_provider available in session data" };
        }
        const hasItems = (Array.isArray(sessionData.selected_items) && sessionData.selected_items.length > 0) || !!sessionData.item;
        if (!hasItems) {
            return { valid: false, message: "No items available in session data" };
        }
        if (!sessionData.transaction_id) {
            return { valid: false, message: "No transaction_id available in session data" };
        }
        return { valid: true };
    }
}
