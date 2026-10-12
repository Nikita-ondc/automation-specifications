import { readFileSync } from "fs";
import yaml from "js-yaml";
import path from "path";
import { MockAction, MockOutput, saveType } from "../../classes/mock-action";
import { SessionData } from "../../session-types";
import { selectDefaultGenerator } from "./generator";

export class MockSelect1Class extends MockAction {
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
        return "select";
    }
    get description(): string {
        return "Mock for select";
    }
    generator(existingPayload: any, sessionData: SessionData): Promise<any> {
        return selectDefaultGenerator(existingPayload, sessionData);
    }
    async validate(targetPayload: any): Promise<MockOutput> {
        return { valid: true };
    }
    async meetRequirements(sessionData: SessionData): Promise<MockOutput> {
        console.log("Select meetRequirements - Session data:", {
            selected_provider: !!sessionData.selected_provider,
            selected_items: !!sessionData.selected_items,
            selected_fulfillments: !!sessionData.selected_fulfillments,
            items: !!sessionData.items,
            fulfillments: !!sessionData.fulfillments,
            provider_id: !!sessionData.provider_id
        });
        
        // Validate required session data for select generator (from on_search)
        if (!sessionData.items || !Array.isArray(sessionData.items) || sessionData.items.length === 0) {
            return { 
                valid: false, 
                message: "No items available in session data from on_search" 
            };
        }
        
        // if (!sessionData.fulfillments || !Array.isArray(sessionData.fulfillments) || sessionData.fulfillments.length === 0) {
        //     return { 
        //         valid: false, 
        //         message: "No fulfillments available in session data from on_search" 
        //     };
        // }
        
        if (!sessionData.selected_provider) {
            return { 
                valid: false, 
                message: "No selected_provider available in session data from on_search" 
            };
        }
        
        return { valid: true };
    }
} 