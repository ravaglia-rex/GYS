export enum FlaggedFrameType {
    "PERFECTGUY" = "Perfect behavior",
    "ALWAYSCONNECTED" = "Cell phone or laptop observed",
    "YOUCANTSEEME" = "No one in frame",
    "UNITEDWESTAND" = "Multiple people in frame",
    "THEOSTRICH" = "Person looking away from camera",
    "CHATTERBOX" = "Person speaking"
};

export class FlaggedFrame{
    types: FlaggedFrameType[];
    timestamp: number;
    additionalInfo?: any;

    constructor(types: FlaggedFrameType[], timestamp: number, additionalInfo?: any){
        this.types = types;
        this.timestamp = timestamp;
        this.additionalInfo = additionalInfo;
    }

    addType(type: FlaggedFrameType){
        if(!this.types.includes(type)){
            this.types.push(type);
        }
    }
}