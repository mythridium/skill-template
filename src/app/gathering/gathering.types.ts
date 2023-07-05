export interface GatheringData extends MasterySkillData {
    customGatheringData: GatheringItemData[];
}

export interface GatheringItemData extends BasicSkillRecipeData {
    name: string;
    media: string;
    baseInterval: number;
}

export class GatheringItem extends BasicSkillRecipe {
    baseInterval: number;

    public get name() {
        return this.data.name;
    }

    public get media() {
        return this.getMediaURL(this.data.media);
    }

    constructor(namespace: DataNamespace, private readonly data: GatheringItemData) {
        super(namespace, data);

        this.baseInterval = data.baseInterval;
    }
}
