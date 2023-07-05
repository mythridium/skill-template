import { ArtisanActionEvent } from './artisan-event';
import { UserInterface } from './user-interface';
import { ArtisanCategory, ArtisanSkillData, ArtisanRecipe, ArtisanSelectionTab } from './artisan.types';

import './artisan.scss';

export class Artisan extends ArtisanSkill<ArtisanRecipe, ArtisanSkillData, Item> {
    public _media = 'assets/logo.png';
    public baseInterval = 3000;
    public renderQueue = new ArtisanRenderQueue();
    public categories = new NamespaceRegistry<ArtisanCategory>(this.game.registeredNamespaces);
    public selectionTabs = new Map<ArtisanCategory, ArtisanSelectionTab>();

    public userInterface: UserInterface;
    public _menu: ArtisanMenu<Item>;
    public _categoryMenu: CategoryMenu<ArtisanCategory>;

    public get name() {
        return 'Artisan';
    }

    public get elements() {
        const fragment = new DocumentFragment();

        fragment.append(getTemplateNode('myth-artisan'));

        return [...fragment.children];
    }

    public get masteryModifiedInterval() {
        return this.actionInterval;
    }

    public get actionInterval() {
        return this.getArtisanInterval(this.activeRecipe);
    }

    public get menu() {
        return this._menu;
    }

    public get noCostsMessage() {
        return `You don't have the required materials to Artisan that.`;
    }

    public get actionItem() {
        return this.activeRecipe.product;
    }

    public get actionItemQuantity() {
        return this.activeRecipe.baseQuantity;
    }

    public get activeRecipe() {
        if (this.selectedRecipe === undefined) {
            throw new Error('Tried to get active artisan recipe, but none is selected.');
        }

        return this.selectedRecipe;
    }

    public get actionRewards() {
        const rewards = new Rewards(this.game);
        const actionEvent = new ArtisanActionEvent(this, this.activeRecipe);

        let qtyToAdd = this.actionItemQuantity;

        if (rollPercentage(this.actionDoublingChance)) {
            qtyToAdd *= 2;
        }

        qtyToAdd *= Math.pow(2, this.game.modifiers.getSkillModifierValue('doubleItemsSkill', this));

        const item = this.actionItem;
        const extraItemChance =
            this.game.modifiers.getSkillModifierValue('increasedChanceAdditionalSkillResource', this) -
            this.game.modifiers.getSkillModifierValue('decreasedChanceAdditionalSkillResource', this);

        if (rollPercentage(extraItemChance)) {
            qtyToAdd++;
        }

        rewards.addItem(item, qtyToAdd);
        rewards.addXP(this, this.activeRecipe.baseExperience);

        this.addCommonRewards(rewards);

        this.game.processEvent(actionEvent, this.currentActionInterval);

        return rewards;
    }

    constructor(namespace: DataNamespace, public game: Game) {
        super(namespace, 'Artisan', game);
    }

    public registerData(namespace: DataNamespace, data: ArtisanSkillData) {
        super.registerData(namespace, data);

        if (data.categories) {
            for (const category of data.categories) {
                this.categories.registerObject(new ArtisanCategory(namespace, category, this));
            }
        }

        if (data.recipes) {
            for (const recipe of data.recipes) {
                this.actions.registerObject(new ArtisanRecipe(namespace, recipe, this.game, this));
            }
        }

        loadedLangJson['MASTERY_CHECKPOINT_Artisan_0'] = 'Tier 0';
        loadedLangJson['MASTERY_CHECKPOINT_Artisan_1'] = 'Tier 1';
        loadedLangJson['MASTERY_CHECKPOINT_Artisan_2'] = 'Tier 2';
        loadedLangJson['MASTERY_CHECKPOINT_Artisan_3'] = 'Tier 3';
        loadedLangJson['SELECT_ARTISAN_CATEGORY'] = 'Select Artisan Category';
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

    public getArtisanInterval(artisanRecipe: ArtisanRecipe) {
        return this.modifyInterval(this.baseInterval, artisanRecipe);
    }

    public getTotalUnlockedMasteryActions() {
        return this.actions.reduce(levelUnlockSum(this), 0);
    }

    public recordCostPreservationStats(costs: Costs): void {
        // Not implementing stats for this skill. Something you could have fun figuring out!
    }

    public recordCostConsumptionStats(costs: Costs) {
        // Not implementing stats for this skill. Something you could have fun figuring out!
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

export class ArtisanRenderQueue extends ArtisanSkillRenderQueue<ArtisanRecipe> {
    grants = false;
    visibleItems = false;
}
