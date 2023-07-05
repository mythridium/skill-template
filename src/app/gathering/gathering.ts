import { GatheringItem, GatheringData } from './gathering.types';
import { UserInterface } from './user-interface';
import { GatheringActionEvent } from './gathering-event';

import './gathering.scss';

export class Gathering extends GatheringSkill<GatheringItem, GatheringData> {
    public readonly version = 1;
    public readonly _media = 'assets/logo.png';
    public readonly renderQueue = new GatheringRenderQueue();

    public userInterface: UserInterface;
    public activeGatheringItem: GatheringItem;

    private renderedProgressBar?: ProgressBar;

    public get name() {
        return 'Gathering';
    }

    public get elements() {
        const fragment = new DocumentFragment();

        fragment.append(getTemplateNode('myth-gathering'));

        return [...fragment.children];
    }

    public get actionLevel() {
        return this.activeGatheringItem.level;
    }

    public get masteryAction() {
        return this.activeGatheringItem;
    }

    public get masteryModifiedInterval() {
        return this.actionInterval;
    }

    public get actionInterval() {
        return this.getGatheringInterval(this.activeGatheringItem);
    }

    public get actionRewards() {
        const rewards = new Rewards(this.game);
        const actionEvent = new GatheringActionEvent(this, this.activeGatheringItem);

        rewards.addXP(this, this.activeGatheringItem.baseExperience);

        this.addCommonRewards(rewards);

        this.game.processEvent(actionEvent, this.currentActionInterval);

        return rewards;
    }

    constructor(namespace: DataNamespace, public readonly game: Game) {
        super(namespace, 'Gathering', game);
    }

    public registerData(namespace: DataNamespace, data: GatheringData) {
        super.registerData(namespace, data);

        for (const gatheringItem of data.customGatheringData) {
            this.actions.registerObject(new GatheringItem(namespace, gatheringItem));
        }

        loadedLangJson['MASTERY_CHECKPOINT_Gathering_0'] = 'Tier 0';
        loadedLangJson['MASTERY_CHECKPOINT_Gathering_1'] = 'Tier 1';
        loadedLangJson['MASTERY_CHECKPOINT_Gathering_2'] = 'Tier 2';
        loadedLangJson['MASTERY_CHECKPOINT_Gathering_3'] = 'Tier 3';
    }

    public postDataRegistration() {
        super.postDataRegistration();

        this.sortedMasteryActions = this.actions.allObjects.sort((a, b) => a.level - b.level);
        this.milestones.push(...this.actions.allObjects);

        this.sortMilestones();
    }

    public onLoad() {
        super.onLoad();

        for (const gatheringItem of this.actions.registeredObjects.values()) {
            this.renderQueue.actionMastery.add(gatheringItem);
        }

        this.renderQueue.grants = true;
        this.renderQueue.visibleItems = true;

        if (this.isActive) {
            this.renderQueue.progressBar = true;
        }
    }

    public onEquipmentChange() {}

    public preAction() {}

    public postAction() {
        this.renderQueue.grants = true;
    }

    public onLevelUp(oldLevel: number, newLevel: number) {
        super.onLevelUp(oldLevel, newLevel);

        this.renderQueue.visibleItems = true;
    }

    public getTotalUnlockedMasteryActions() {
        return this.actions.reduce(levelUnlockSum(this), 0);
    }

    public getGatheringInterval(gatheringItem: GatheringItem) {
        return this.modifyInterval(gatheringItem.baseInterval, gatheringItem);
    }

    public render() {
        super.render();

        this.renderGrants();
        this.renderProgressBar();
        this.renderVisibleItems();
    }

    public renderGrants() {
        if (!this.renderQueue.grants) {
            return;
        }

        for (const component of this.userInterface.gatheringItems.values()) {
            const masteryXP = this.getMasteryXPToAddForAction(
                component.gatheringItem,
                this.getGatheringInterval(component.gatheringItem)
            );

            const baseMasteryXP = this.getBaseMasteryXPToAddForAction(
                component.gatheringItem,
                this.getGatheringInterval(component.gatheringItem)
            );

            const poolXP = this.getMasteryXPToAddToPool(masteryXP);

            component.updateGrants(
                this.modifyXP(component.gatheringItem.baseExperience, component.gatheringItem),
                component.gatheringItem.baseExperience,
                masteryXP,
                baseMasteryXP,
                poolXP,
                this.getGatheringInterval(component.gatheringItem)
            );
        }

        this.renderQueue.grants = false;
    }

    public renderProgressBar() {
        if (!this.renderQueue.progressBar) {
            return;
        }

        const progressBar = this.userInterface.gatheringItems.get(this.activeGatheringItem)?.progressBar;

        if (progressBar !== this.renderedProgressBar) {
            this.renderedProgressBar?.stopAnimation();
        }

        if (progressBar !== undefined) {
            if (this.isActive) {
                progressBar.animateProgressFromTimer(this.actionTimer);
                this.renderedProgressBar = progressBar;
            } else {
                progressBar.stopAnimation();
                this.renderedProgressBar = undefined;
            }
        }

        this.renderQueue.progressBar = false;
    }

    public renderVisibleItems() {
        if (!this.renderQueue.visibleItems) {
            return;
        }

        for (const instrument of this.actions.registeredObjects.values()) {
            const menu = this.userInterface.gatheringItems.get(instrument);

            if (menu === undefined) {
                return;
            }

            const element = document.querySelector(`#${menu.localId}`) as HTMLElement;

            if (!element) {
                return;
            }

            if (this.level >= instrument.level) {
                showElement(element);
            } else {
                hideElement(element);
            }
        }

        this.renderQueue.visibleItems = false;
    }

    public train(gatheringItem: GatheringItem) {
        const wasActive = this.isActive;

        if (this.isActive && !this.stop()) {
            return;
        }

        if (!wasActive || gatheringItem !== this.activeGatheringItem) {
            this.activeGatheringItem = gatheringItem;
            this.start();
        }
    }

    public encode(writer: SaveWriter): SaveWriter {
        super.encode(writer);

        writer.writeUint32(this.version);
        writer.writeBoolean(this.activeGatheringItem !== undefined);

        if (this.activeGatheringItem) {
            writer.writeNamespacedObject(this.activeGatheringItem);
        }

        return writer;
    }

    public decode(reader: SaveWriter, _version: number): void {
        super.decode(reader, _version);

        const version = reader.getUint32();

        if (version !== 1) {
            throw new Error(`Did not read correct save version number, expected 1: got ${version}`);
        }

        if (reader.getBoolean()) {
            const gatheringItem = reader.getNamespacedObject(this.actions);

            if (typeof gatheringItem === 'string' || gatheringItem.level > this.level) {
                this.shouldResetAction = true;
            } else {
                this.activeGatheringItem = gatheringItem;
            }
        }

        if (this.shouldResetAction) {
            this.resetActionState();
        }
    }

    /** Fix completion log bug which passes through base game namespace even for modded skills. */
    public getMaxTotalMasteryLevels() {
        return super.getMaxTotalMasteryLevels(this.namespace);
    }

    /** Fix completion log bug which passes through base game namespace even for modded skills. */
    public getTotalCurrentMasteryLevels() {
        return super.getTotalCurrentMasteryLevels(this.namespace);
    }

    public getActionIDFromOldID(oldActionID: number, idMap: NumericIDMap) {
        return '';
    }
}

export class GatheringRenderQueue extends GatheringSkillRenderQueue<GatheringItem> {
    grants = false;
    visibleItems = false;
}
